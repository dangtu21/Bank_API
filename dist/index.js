"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const puppeteer_1 = __importDefault(require("puppeteer"));
(() => __awaiter(void 0, void 0, void 0, function* () {
    const user_id = "0799721539";
    const password = "Tu211102!";
    let capcha;
    const browser = yield puppeteer_1.default.launch({ headless: false });
    const page = yield browser.newPage();
    // Chặn các yêu cầu mạng để theo dõi và lấy dữ liệu từ API
    yield page.setRequestInterception(true);
    let requestDetails_url;
    let requestDetails_method;
    let requestDetails_headers;
    let requestDetails_postData = "";
    page.on('request', (request) => __awaiter(void 0, void 0, void 0, function* () {
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
            let request_data = {};
            if (requestDetails_postData) {
                try {
                    request_data = JSON.parse(requestDetails_postData);
                }
                catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            }
            else {
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
                headers: Object.assign(Object.assign({}, requestDetails_headers), { 'Content-Type': 'application/json' })
            };
            console.log('1Request URL:', request_url);
            console.log('1Request Headers:', request_config);
            console.log('1Request Post Data:', postData);
            try {
                const response = yield axios_1.default.post(request_url, postData, request_config);
                console.log('Response Data:', response.data);
            }
            catch (error) {
                console.error('Error calling API:', error);
            }
        }
        request.continue();
    }));
    page.on('response', (response) => __awaiter(void 0, void 0, void 0, function* () {
        const url = response.url();
        if (url.includes('/api/retail-web-internetbankingms/getCaptchaImage')) {
            try {
                const responseBody = yield response.json();
                capcha = responseBody.imageString;
                yield page.waitForSelector('#user-id');
                yield page.type('#user-id', user_id);
                yield page.waitForSelector('#new-password');
                yield page.type('#new-password', password);
                let result;
                if (capcha) {
                    try {
                        const response = yield axios_1.default.post('http://localhost:1234/resolver', {
                            body: `data:image/png;base64,${capcha}`
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
                            }
                        });
                        result = response.data.split('|')[1];
                        console.log('Extracted result:', result);
                        yield page.waitForSelector('input[type="text"].w-100.pl-upper');
                        if (result) {
                            yield page.type('input[type="text"].w-100.pl-upper', result);
                            yield new Promise(resolve => setTimeout(resolve, 10000));
                            yield page.waitForSelector('#login-btn');
                            const isVisible = yield page.evaluate(() => {
                                const button = document.querySelector('#login-btn');
                                return button && window.getComputedStyle(button).display !== 'none' && !button.hasAttribute('disabled');
                            });
                            if (isVisible) {
                                yield page.click('#login-btn');
                                console.log('Button clicked successfully.');
                            }
                            else {
                                console.log('Button is not visible or not interactable.');
                            }
                            yield new Promise(resolve => setTimeout(resolve, 5000));
                            // Gọi hàm để kiểm tra `user_id` trong `sessionStorage`
                            const isUserIdPresent = yield checkUserIdInSessionStorage(page);
                            if (!isUserIdPresent) {
                                console.log('user chưa đăng nhập ');
                                const buttonSelector = 'button.btn.btn-primary.btn-lg';
                                const buttonExists = yield page.evaluate((selector) => {
                                    const button = document.querySelector(selector);
                                    return button !== null;
                                }, buttonSelector);
                                if (buttonExists) {
                                    console.log('Button exists. Clicking on the button...');
                                    yield page.click(buttonSelector); // Nhấp vào nút
                                    console.log('Button clicked.');
                                    yield page.waitForSelector('#refresh-captcha');
                                    yield page.click('#refresh-captcha');
                                }
                                else {
                                    console.log('Button does not exist.');
                                }
                            }
                            else {
                                console.log('user đã  đăng nhập ');
                            }
                        }
                    }
                    catch (error) {
                        console.error('Error calling API:', error);
                    }
                }
                else {
                    console.error('Capcha was not captured.');
                }
            }
            catch (error) {
                console.error('Error parsing JSON response:', error);
            }
        }
    }));
    yield page.goto('https://online.mbbank.com.vn');
    function formatDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    function checkUserIdInSessionStorage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Kiểm tra sự tồn tại của `user_id` trong `sessionStorage`
                const isUserIdPresent = yield page.evaluate(() => {
                    const userId1 = sessionStorage.getItem('USER_ID');
                    // Thay đổi `user_id` nếu cần
                    return userId1 !== null;
                });
                return isUserIdPresent;
            }
            catch (error) {
                console.error('Error checking user_id in sessionStorage:', error);
                return false;
            }
        });
    }
    function getDateRange() {
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        const fromDate = formatDate(twoDaysAgo);
        const toDate = formatDate(today);
        return { fromDate, toDate };
    }
}))();
