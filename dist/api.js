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
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3000;
let request_header;
let request_url;
let request_sessionId;
let request_refNo;
let request_deviceIdCommon;
let request_cookie;
let postData;
app.use(express_1.default.json());
// Tạo route đơn giản
app.get('/getTransaction', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield getInit_API(); // Chờ hàm getInit_API hoàn tất
        const response = yield axios_1.default.post(request_url, postData, request_header);
        const { refNo, result, transactionHistoryList } = response.data;
        if (!result.ok === false && result.message === "Session Invalid") {
            console.log('Session Invalid. Retrying...');
        }
        console.log('Response Data:', response.data);
        res.json(response.data); // Trả về dữ liệu response từ API
    }
    catch (error) {
        console.error('Error calling API:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));
function automateWebsite() {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
function getInit_API() {
    return __awaiter(this, void 0, void 0, function* () {
        request_sessionId = "66e1cf0d-44a6-47be-9a21-f3fe100663a4";
        request_refNo = "0799721539-2024090411010830-29297";
        request_deviceIdCommon = "5utohm74-mbib-0000-0000-2024090411005560";
        request_cookie = 'BIGipServerk8s_online_banking_pool_9712=3424387338.61477.0000; MBAnalyticsaaaaaaaaaaaaaaaa_session_=LFBJLGHOJFJJFKCBCIEDNKGCIEPOAABJABHJMFIFCJIALGNHPLAEIHLGENOKCLEEDPGDGPNPLLPPDGMHDALAJKMBCNNJHMFKLCLIHDNKMFKIMHBLMJAFAMLEJKOMFDAO; _ga=GA1.3.1455413522.1725422454; _gid=GA1.3.227888054.1725422456; _gat_gtag_UA_205372863_2=1; JSESSIONID=22787B4E356588E995BCB59505D97986; BIGipServerk8s_KrakenD_Api_gateway_pool_10781=1696334090.7466.0000; MBAnalytics1727363067aaaaaaaaaaaaaaaa_cspm_=DACDIHHOBFJANGBBJHMAJIGCIELAMFPJKNMFCEJFDJIALGNHKBEEKPLGENILCLEEDPGCGPNPPBIJBKLBDALAJKMBAOAPNBIMPMOKJKLJMFKIMHNJMLFHKCMEJKOMFDAG; _ga_T1003L03HZ=GS1.1.1725422454.1.0.1725422468.0.0.0';
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
        request_url = "https://online.mbbank.com.vn/api/retail-transactionms/transactionms/get-account-transaction-history";
        const { fromDate, toDate } = getDateRange();
        postData = {
            accountNo: '0799721539',
            fromDate: fromDate,
            toDate: toDate,
            sessionId: request_sessionId,
            refNo: request_refNo,
            deviceIdCommon: request_deviceIdCommon
        };
    });
}
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
function getDateRange() {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const fromDate = formatDate(twoDaysAgo);
    const toDate = formatDate(today);
    return { fromDate, toDate };
}
// Khởi chạy server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
