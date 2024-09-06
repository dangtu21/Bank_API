import axios, { AxiosRequestConfig } from 'axios';
import express, { Request, Response } from 'express';
import puppeteer, { Page } from 'puppeteer';
const app = express();
console.log("1");

console.log("2");


const port = 3000;
let request_header: AxiosRequestConfig<any> | undefined;
let request_url: string;
let request_sessionId: string;
let request_refNo: string;
let request_deviceIdCommon: string;
let request_cookie: string;
let postData: any;
request_sessionId = "66e1cf0d-44a6-47be-9a21-f3fe100677a4";
request_refNo = "0799721539-2024090411010830-29297";
request_deviceIdCommon = "5utohm74-mbib-0000-0000-2024090411005560";
request_cookie = 'BIGipServerk8s_online_banking_pool_9712=3424387338.61477.0000; MBAnalyticsaaaaaaaaaaaaaaaa_session_=LFBJLGHOJFJJFKCBCIEDNKGCIEPOAABJABHJMFIFCJIALGNHPLAEIHLGENOKCLEEDPGDGPNPLLPPDGMHDALAJKMBCNNJHMFKLCLIHDNKMFKIMHBLMJAFAMLEJKOMFDAO; _ga=GA1.3.1455413522.1725422454; _gid=GA1.3.227888054.1725422456; _gat_gtag_UA_205372863_2=1; JSESSIONID=22787B4E356588E995BCB59505D97986; BIGipServerk8s_KrakenD_Api_gateway_pool_10781=1696334090.7466.0000; MBAnalytics1727363067aaaaaaaaaaaaaaaa_cspm_=DACDIHHOBFJANGBBJHMAJIGCIELAMFPJKNMFCEJFDJIALGNHKBEEKPLGENILCLEEDPGCGPNPPBIJBKLBDALAJKMBAOAPNBIMPMOKJKLJMFKIMHNJMLFHKCMEJKOMFDAG; _ga_T1003L03HZ=GS1.1.1725422454.1.0.1725422468.0.0.0';
request_url = "https://online.mbbank.com.vn/api/retail-transactionms/transactionms/get-account-transaction-history";  
app.use(express.json());
console.log("3");

app.get('/getTransaction', async (req: Request, res: Response) => {
    try {
        await getInit_API(); // Chờ hàm getInit_API hoàn tất

        
            const response = await axios.post(request_url, postData, request_header);
            const { result, transactionHistoryList } = response.data;
            
            if (!result.ok && result.message === "Session Invalid") {
                console.log('Session Invalid. Retrying...');
                // Cập nhật session_id và các thông tin khác
                const sessionData = await automateWebsite();
                // Cập nhật request_header với sessionData nếu cần
                console.log('Session Data:', sessionData);
                
                let tmp_sessionId=request_sessionId;
                let tmp_deviceIdCommon=request_deviceIdCommon;
                request_sessionId=sessionData.postData.sessionId||tmp_sessionId;
                request_deviceIdCommon=sessionData.postData.deviceIdCommon||tmp_deviceIdCommon;
                await getInit_API();
                console.log('Request URL:', request_url);
                console.log('Request Headers:', request_header);
                console.log('Request Post Data:', postData);
                const response1 = await axios.post(request_url, postData, request_header);
                const { result, transactionHistoryList } = response1.data;
                console.log("response :" ,response1.data);
                console.log('Transaction History List1:', transactionHistoryList);
                res.json(transactionHistoryList);
            }else{
                console.log('Transaction History List:', transactionHistoryList);
                res.json(transactionHistoryList);
            }

        
    } catch (error) {
        console.error('Error calling API:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
console.log("4");

async function automateWebsite() {
    const user_id = "0799721539";
    const password = "Tu211102!";
    let capcha: string | undefined;

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser', // Đường dẫn đến Chromium
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    const page = await browser.newPage();

    // Cài đặt chặn các yêu cầu mạng
    await page.setRequestInterception(true);

    // Tạo promise để đợi việc gọi API
    let resolveRequestData: ((data: { sessionId?: string; refNo?: string; deviceIdCommon?: string }) => void) | undefined;
    const getBalanceLoyaltyPromise = new Promise<{ sessionId?: string; refNo?: string; deviceIdCommon?: string }>((resolve) => {
        resolveRequestData = resolve;
    });

    page.on('request', async (request) => {
        if (request.url() === 'https://online.mbbank.com.vn/api/retail_web/loyalty/getBalanceLoyalty') {
            console.log('Request URL:', request.url());
            console.log('Request Method:', request.method());
            console.log('Request Headers:', request.headers());
            console.log('Request Post Data:', request.postData());
            const requestDetails_postData = request.postData() || "";
            let request_data: { sessionId?: string; refNo?: string; deviceIdCommon?: string } = {};
            if (requestDetails_postData) {
                try {
                    request_data = JSON.parse(requestDetails_postData);
                    // Hoàn thành promise khi API được gọi
                    if (resolveRequestData) {
                        resolveRequestData(request_data);
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            }
            request.continue();
        } else {
            request.continue();
        }
    });

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/retail-web-internetbankingms/getCaptchaImage')) {
            try {
                const responseBody = await response.json();
                capcha = responseBody.imageString;
                await page.waitForSelector('#user-id');
                await page.evaluate(() => {
                    const input = document.querySelector('#user-id') as HTMLInputElement;
                    if (input) {
                        input.value = ''; // Xóa văn bản hiện tại
                    }
                });
                await page.type('#user-id', user_id);
                await page.waitForSelector('#new-password');
                await page.evaluate(() => {
                    const input = document.querySelector('#new-password') as HTMLInputElement;
                    if (input) {
                        input.value = ''; // Xóa văn bản hiện tại
                    }
                });
                await page.type('#new-password', password);

                if (capcha) {
                    try {
                        const captchaResponse = await axios.post('http://danganhtu.id.vn:1235/resolver', {
                            body: `data:image/png;base64,${capcha}`
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
                            }
                        });
                        const result = captchaResponse.data.split('|')[1];
                        console.log('Extracted result:', result);

                        await page.waitForSelector('input[type="text"].w-100.pl-upper');
                        if (result) {
                            await page.type('input[type="text"].w-100.pl-upper', result);
                            await page.waitForSelector('#login-btn');
                            const isVisible = await page.evaluate(() => {
                                const button = document.querySelector('#login-btn');
                                return button && window.getComputedStyle(button).display !== 'none' && !button.hasAttribute('disabled');
                            });
                            if (isVisible) {
                                await page.click('#login-btn');
                                await page.click('#login-btn');
                                console.log('Button clicked successfully.');
                            } else {
                                console.log('Button is not visible or not interactable.');
                            }
                            await delay(5000); // Thay thế waitForTimeout bằng delay
                            
                            // Kiểm tra `user_id` trong sessionStorage
                            const isUserIdPresent = await checkUserIdInSessionStorage(page);
                            if (!isUserIdPresent) {
                                console.log('User not logged in.');
                                const buttonSelector = 'button.btn.btn-primary.btn-lg';
                                const buttonExists = await page.evaluate((selector) => {
                                    const button = document.querySelector(selector);
                                    return button !== null;
                                }, buttonSelector);

                                if (buttonExists) {
                                    console.log('Button exists. Clicking on the button...');
                                    await page.click(buttonSelector);
                                    console.log('Button clicked.');
                                    await page.waitForSelector('#refresh-captcha');
                                    await page.click('#refresh-captcha');
                                } else {
                                    console.log('Button does not exist.');
                                }
                            } else {
                                console.log('User is already logged in.');
                            }
                        }
                    } catch (error) {
                        console.error('Error processing CAPTCHA:', error);
                    }
                } else {
                    console.error('CAPTCHA was not captured.');
                }
                
            } catch (error) {
                console.error('Error parsing CAPTCHA response:', error);
            }
        }
    });

    await page.goto('https://online.mbbank.com.vn');

    // Đợi cho đến khi API được gọi
    const data = await getBalanceLoyaltyPromise;
    console.log('Captured Data from API:', data);

    // Đóng trình duyệt
    await browser.close();

    return {
        request_header: {}, // Cập nhật với header thực tế
        postData: data
    };
}
console.log("5");

// Tạo một hàm để đợi một khoảng thời gian
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


async function checkUserIdInSessionStorage(page: Page): Promise<boolean> {
    try {
        // Kiểm tra sự tồn tại của `user_id` trong `sessionStorage`
        const isUserIdPresent = await page.evaluate(() => {
            const userId1 = localStorage.getItem('MB_DEVICE_ID');
            // Thay đổi `user_id` nếu cần
            return userId1 !== null;
        });

        


        return isUserIdPresent;
    } catch (error) {
        console.error('Error checking user_id in sessionStorage:', error);
        return false;
    }
}
async function getInit_API() {
    request_header = {
        headers: {
            'deviceid': request_deviceIdCommon,
            'sec-ch-ua': '"Not;A=Brand";v="24", "Chromium";v="128"',
            'accept-language': 'en-US,en;q=0.9',
            'sec-ch-ua-mobile': '?0',
            'authorization': 'Basic RU1CUkVUQUlMV0VCOlNEMjM0ZGZnMzQlI0BGR0AzNHNmc2RmNDU4NDNm',
            'elastic-apm-traceparent': '00-2cf3bdb1215ddf75871da9ea10ff66d1-b3ea1da55e5e6673-01',
            'content-type': 'application/json; charset=UTF-8',
            'refno': request_refNo,
            'accept': 'application/json, text/plain, */*',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            'referer': 'https://online.mbbank.com.vn/',
            'app': 'MB_WEB',
            'x-request-id': request_refNo,
            'sec-ch-ua-platform': '"Windows"',
            'cookie': request_cookie,
            'origin': 'https://online.mbbank.com.vn'
        }
    };
    
    
    const { fromDate, toDate } = getDateRange();
    postData = {
        accountNo: '0799721539',
        fromDate: fromDate,
        toDate: toDate,
        sessionId: request_sessionId,
        refNo: request_refNo,
        deviceIdCommon: request_deviceIdCommon
    };
}

function formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getDateRange(): { fromDate: string; toDate: string } {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const fromDate = formatDate(twoDaysAgo);
    const toDate = formatDate(today);

    return { fromDate, toDate };
}
console.log("6");

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
