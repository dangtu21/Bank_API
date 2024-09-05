
import axios from 'axios';
import puppeteer, { Page } from 'puppeteer';

(async () => {
    const user_id = "0799721539";
    const password = "Tu211102!";
    let capcha: string | undefined;

    const browser = await puppeteer.launch({ headless: true  });
    const page = await browser.newPage();
    // Chặn các yêu cầu mạng để theo dõi và lấy dữ liệu từ API
    await page.setRequestInterception(true);
    
    let requestDetails_url: string | undefined;
    let requestDetails_method: string | undefined;
    let requestDetails_headers: Record<string, string> | undefined;
    let requestDetails_postData: string = "";

    page.on('request', async (request) => {
        if (request.url() === 'https://online.mbbank.com.vn/api/retail_web/loyalty/getBalanceLoyalty') {
            requestDetails_url = request.url();
            requestDetails_method = request.method();
            requestDetails_headers = request.headers();
            requestDetails_postData = request.postData() || "";
            console.log('Request URL:', request.url());
            console.log('Request Method:', request.method());
            console.log('Request Headers:', request.headers());
            console.log('Request Post Data:', request.postData());

            const { fromDate, toDate } = getDateRange();
    
            let request_data: { sessionId?: string; refNo?: string; deviceIdCommon?: string } = {};
            if (requestDetails_postData) {
                try {
                    request_data = JSON.parse(requestDetails_postData);
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            } else {
                console.warn('requestDetails_postData is empty');
            }

            const postData = {
                accountNo: '0799721539',
                fromDate: fromDate,
                toDate: toDate,
                sessionId: request_data.sessionId || 'defaultSessionId',
                refNo: request_data.refNo || 'defaultRefNo',
                deviceIdCommon: request_data.deviceIdCommon || 'defaultDeviceId'
            };

            const request_url = "https://online.mbbank.com.vn/api/retail-transactionms/transactionms/get-account-transaction-history";
            
            const request_config = {
                headers: {
                    ...requestDetails_headers,
                    'Content-Type': 'application/json'
                }
            };

            console.log('1Request URL:', request_url);
            console.log('1Request Headers:', request_config);
            console.log('1Request Post Data:', postData);
            
            try {
                const response = await axios.post(request_url, postData, request_config);
                console.log('Response Data:', response.data);
            } catch (error) {
                console.error('Error calling API:', error);
            }
        }
        request.continue();
    });

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/retail-web-internetbankingms/getCaptchaImage')) {
            try {
                const responseBody = await response.json();
                capcha = responseBody.imageString;
                await page.waitForSelector('#user-id');
                await page.type('#user-id', user_id);
                await page.waitForSelector('#new-password');
                await page.type('#new-password', password);

                let result: string | undefined;
                if (capcha) {
                    try {
                        const response = await axios.post('http://danganhtu.id.vn:1234/resolver', {
                            body: `data:image/png;base64,${capcha}`
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
                            }
                        });
                        result = response.data.split('|')[1];
                        console.log('Extracted result:', result);
                        await page.waitForSelector('input[type="text"].w-100.pl-upper');
                        if (result) {
                            await page.type('input[type="text"].w-100.pl-upper', result);
                            await new Promise(resolve => setTimeout(resolve, 10000));
                            await page.waitForSelector('#login-btn');
                            const isVisible = await page.evaluate(() => {
                                const button = document.querySelector('#login-btn');
                                return button && window.getComputedStyle(button).display !== 'none' && !button.hasAttribute('disabled');
                            });
                            if (isVisible) {
                                await page.click('#login-btn');
                                console.log('Button clicked successfully.');
                            } else {
                                console.log('Button is not visible or not interactable.');
                            }
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            // Gọi hàm để kiểm tra `user_id` trong `sessionStorage`
                            const isUserIdPresent = await checkUserIdInSessionStorage(page);
                            if(!isUserIdPresent){
                                console.log('user chưa đăng nhập ');

                                const buttonSelector = 'button.btn.btn-primary.btn-lg';
                                const buttonExists = await page.evaluate((selector) => {
                                    const button = document.querySelector(selector);
                                    return button !== null;
                                }, buttonSelector);

                                if (buttonExists) {


                                    console.log('Button exists. Clicking on the button...');
                                    await page.click(buttonSelector); // Nhấp vào nút
                                    console.log('Button clicked.');
                                    await page.waitForSelector('#refresh-captcha');
                                    await page.click('#refresh-captcha');
                                } else {
                                    console.log('Button does not exist.');
                                }
                                

                            }else {
                                console.log('user đã  đăng nhập ');

                            }
                        }
                    } catch (error) {
                        console.error('Error calling API:', error);
                    }
                } else {
                    console.error('Capcha was not captured.');
                }
                
            } catch (error) {
                console.error('Error parsing JSON response:', error);
            }
        }
    });
    await page.goto('https://online.mbbank.com.vn');

    function formatDate(date: Date): string {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    async function checkUserIdInSessionStorage(page: Page): Promise<boolean> {
        try {
            // Kiểm tra sự tồn tại của `user_id` trong `sessionStorage`
            const isUserIdPresent = await page.evaluate(() => {
                const userId1 = sessionStorage.getItem('USER_ID');
                // Thay đổi `user_id` nếu cần
                return userId1 !== null;
            });
    
            
    
    
            return isUserIdPresent;
        } catch (error) {
            console.error('Error checking user_id in sessionStorage:', error);
            return false;
        }
    }
    function getDateRange(): { fromDate: string; toDate: string } {
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);

        const fromDate = formatDate(twoDaysAgo);
        const toDate = formatDate(today);

        return { fromDate, toDate };
    }
})();
