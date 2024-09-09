import axios, { AxiosRequestConfig } from 'axios';
import express, { Request, Response } from 'express';


import puppeteer, { Page } from 'puppeteer';
const cors = require('cors');
const app = express();
// Cấu hình CORS cho phép tất cả các nguồn
app.use(cors({
    origin: '*' // Cho phép tất cả các nguồn
}));
console.log("1");

console.log("2");
const timezone = 'Asia/Ho_Chi_Minh'; 

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
let automateWebsitePromise: Promise<{ request_header: AxiosRequestConfig<any>, postData: any }> | undefined;
let getCapcha: Promise<{ request_header: AxiosRequestConfig<any>, postData: any }> | undefined;

app.get('/getTransaction', async (req: Request, res: Response) => {
    
    // Chờ hàm getInit_API hoàn tất
    await getInit_API();
    console.log("1");
    try {
        // Thực hiện gọi API chính

        let response = await axios.post(request_url, postData, request_header);
        let { result, transactionHistoryList } = response.data;
        console.log("2");
    
        // Kiểm tra nếu kết quả không hợp lệ và thông báo lỗi là "Session Invalid"
        if (!result.ok && result.message === "Session Invalid") {
            console.log('Session Invalid. Retrying...');
            console.log("33");
            let transactionHistoryList= await gettransactionHistoryList();
            console.log(transactionHistoryList);
            if(transactionHistoryList===null){
                console.log("transactionHistoryList");
                res.json({status:"lỗi"});
                return; 
            }
            console.log("xxxxx",transactionHistoryList);

            res.json(transactionHistoryList);
 
            return; // Ngăn không cho gửi phản hồi thêm lần nữa
            
        }
    
       
        res.json(transactionHistoryList);
        return;
            
    } catch (error) {
        // Xử lý lỗi khi gọi API và cố gắng khôi phục
        console.error('Error calling API:', error);
    
        try {
          
                console.log('2Session Invalid. Retrying...');
                let transactionHistoryList= await gettransactionHistoryList();
                // Nếu không có lỗi, trả về danh sách lịch sử giao dịch
                if(transactionHistoryList===null){
                    console.log("transactionHistoryList");
                    res.json({status:"lỗi"});
                    return; 
                }
                
                    console.log(" chưa trả về  ",transactionHistoryList);
    
                    res.json(transactionHistoryList);
                    return; // Ngăn không cho gửi phản hồi thêm lần nữa
              
                    
                
                
            
    
        } catch (error) {
            console.error('Error calling API during retry:', error);
           
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            
        }
    }

});
async function gettransactionHistoryList(){
    if (!automateWebsitePromise) {
        automateWebsitePromise = automateWebsite();
    }
    console.log('automateWebsitePromise:');
    const sessionData = await automateWebsitePromise;
    console.log('Session Data:', sessionData);
    request_header=sessionData.request_header;
    // Cập nhật các biến sessionId và deviceIdCommon nếu có giá trị mới
    request_sessionId = sessionData.postData.sessionId || null;
    request_deviceIdCommon = sessionData.postData.deviceIdCommon || null;
    console.log('request_sessionId:', request_sessionId);
    console.log('request_deviceIdCommon:', request_deviceIdCommon);

    await getInit_API();
    try{
        const response = await axios.post(request_url, postData, request_header);
        const { result, transactionHistoryList } = response.data;
        return transactionHistoryList;
    }catch(err){
        console.error("Lỗi :",err);
        return null;
    }
    
}


async function automateWebsite() {
    let login=false;
    const user_id = "0799721539";
    const password = "Tu211102!";
    let capcha: string | undefined;
    console.log("4");

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

    console.log("66");
    let capturedRequestHeaders: AxiosRequestConfig<any>;
    page.on('request', async (request) => {
        if (request.url() === 'https://online.mbbank.com.vn/api/retail_web/loyalty/getBalanceLoyalty') {
            login=true;
            console.log('Request URL:', request.url());
            console.log('Request Method:', request.method());
            console.log('Request Headers:', request.headers());
            console.log('Request Post Data:', request.postData());
            const requestDetails_postData = request.postData() || "";
            // Lưu header của request
            capturedRequestHeaders = request.headers();
            let request_data: { sessionId?: string; refNo?: string; deviceIdCommon?: string } = {};
            if (requestDetails_postData) {
                try {
                    request_data = JSON.parse(requestDetails_postData);
                    console.log("request_data",request_data);
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
                capcha = responseBody.imageString || undefined;
                if (capcha) {
                    await LogIn(page, capcha, user_id, password,login);
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
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCapCha(capcha:string): Promise<any>{
    try {
        console.log("5");
        
        const captchaResponse = await axios.post('http://danganhtu.id.vn:1235/resolver', {
            body: `data:image/png;base64,${capcha}`
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
            }
        });
        console.log(`data:image/png;base64,${capcha}`);
        return captchaResponse;
        
    } catch (error) {
        console.error('Error processing CAPTCHA:', error);
        return null;
    }
}
async function LogIn(page: Page, capcha: string, user_id: string, password: string,login:boolean): Promise<boolean> {
    try {
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
        console.log("ádfa");
        const captchaResponse = await getCapCha(capcha);
        if (captchaResponse === null) {
            return false;
        }
        console.log("ádfa");

        console.log("6");
        if (captchaResponse != null) {
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
                    delay(5000); // Thay thế delay bằng waitForTimeout
                    console.log('Button clicked successfully.');
                } else {
                    console.log('Button is not visible or not interactable.');
                    return false;
                }
                delay(20000);
                // Kiểm tra `user_id` trong sessionStorage
                console.log("77");
                if(login==false){
                    
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
                        }
                        await page.waitForSelector('#refresh-captcha');
                        await page.click('#refresh-captcha');
                        console.log('Refreshing CAPTCHA.');
                        return false;
                    
                
                } else {
                    console.log('User is already logged in.');
                    return true;
                }
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error during login:', error);
        return false;
    }
}



async function checkUserIdInLocalStorage(page: Page): Promise<boolean> {
    try {
        const localStorageContents = await page.evaluate(() => {
            const storage: { [key: string]: string } = {};
            Object.keys(localStorage).forEach(key => {
                storage[key] = localStorage.getItem(key) || '';
            });
            return storage;
        });
        console.log('LocalStorage contents:', localStorageContents);
        return true;
    } catch (error) {
        console.error('Error checking localStorage contents:', error);
        return true;

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
        },
        timeout: 10000
    };
    
    
    const { fromDate, toDate } = getDateRange();
    postData = {
        accountNo: '0799721539',
        fromDate: fromDate,
        toDate: toDate,
        sessionId: request_sessionId,
        refNo: generateRefNo('0799721539'),
        deviceIdCommon: request_deviceIdCommon
    };
}
function generateRefNo(accountNo: string): string {
    // Tạo timestamp theo định dạng YYYYMMDDHHmmssSSS
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 17); // Cắt để có độ dài 17 ký tự

    // Tạo số ngẫu nhiên từ 10000 đến 99999
    const randomNumber = Math.floor(Math.random() * 90000) + 10000;

    // Kết hợp các phần lại với nhau
    return `${accountNo}-${timestamp}-${randomNumber}`;
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

    // Sử dụng toLocaleString để điều chỉnh theo múi giờ 'Asia/Ho_Chi_Minh'
    const localToday = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const localTwoDaysAgo = new Date(twoDaysAgo.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));

    const fromDate = formatDate(localTwoDaysAgo);
    const toDate = formatDate(localToday);

    return { fromDate, toDate };
}
console.log("6");

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
