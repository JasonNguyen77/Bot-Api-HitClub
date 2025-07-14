const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Cấu hình
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7451739544:AAEAog4UiF0M2P-v1sOIbL8IyAAhAeKtIoM';
const ADMIN_ID = process.env.ADMIN_ID || '6254591457';
const API_URL = 'https://apihitclub.up.railway.app/api/taixiumd5';

// Khởi tạo bot Telegram
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Danh sách VIP (tạm thời lưu trong bộ nhớ)
let vipUsers = [];

// Mảng lưu trữ 4 phiên gần nhất
let sessions = [];

// Hàm gửi tin nhắn cho tất cả người dùng VIP
async function sendToVipUsers(message) {
    for (const userId of vipUsers) {
        try {
            await bot.sendMessage(userId, message);
            console.log(`Đã gửi tin nhắn tới ${userId}: ${message}`);
        } catch (error) {
            console.error(`Lỗi gửi tin nhắn tới ${userId}:`, error.message);
        }
    }
}

// Hàm gửi tin nhắn cho admin
async function sendToAdmin(message) {
    try {
        await bot.sendMessage(ADMIN_ID, message);
        console.log(`Đã gửi tin nhắn tới admin ${ADMIN_ID}: ${message}`);
    } catch (error) {
        console.error(`Lỗi gửi tin nhắn tới admin:`, error.message);
    }
}

// Hàm lấy dữ liệu từ API
async function fetchSessionData() {
    try {
        const response = await axios.get(API_URL, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.status !== 200) {
            throw new Error('Lỗi khi gọi API: ' + response.status);
        }
        return response.data;
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu API:', error.message);
        return null;
    }
}

// Hàm tính khoảng cách giữa hai tổng điểm
function calculateDistance(total1, total2) {
    if (total1 === total2) {
        return 5; // Nếu tổng bằng nhau, khoảng cách là 5
    }
    return Math.abs(total1 - total2);
}

// Hàm dự đoán kết quả
async function predictResult() {
    if (sessions.length < 4) {
        const progress = sessions.length * 25;
        const message = `Bot đã chạy được ${progress}% / 100%`;
        await sendToVipUsers(message);
        return;
    }

    // Lấy tổng điểm của 4 phiên
    const totals = sessions.slice(-4).map(session => session.total);

    // Tính khoảng cách
    let distances = [];
    for (let i = 1; i < totals.length; i++) {
        distances.push(calculateDistance(totals[i - 1], totals[i]));
    }

    // Tính tổng khoảng cách
    const totalDistance = distances.reduce((sum, dist) => sum + dist, 0);

    // Dự đoán kết quả
    let prediction;
    if (totalDistance < 3 || totalDistance > 18) {
        prediction = 'Cầu rất xấu, nên nghỉ!';
    } else {
        // Dự đoán ngược lại theo yêu cầu
        prediction = totalDistance <= 10 ? 'Tài' : 'Xỉu';
    }

    // Tạo tin nhắn kết quả
    const latestSession = sessions[sessions.length - 1];
    const message = `
Kết quả phiên gần nhất
#${latestSession.sessionId} : ${latestSession.result}
Tổng điểm ${latestSession.total} (${latestSession.dice1}-${latestSession.dice2}-${latestSession.dice3})
Dự đoán phiên tiếp theo: ${prediction}
    `;

    await sendToVipUsers(message);
}

// Xử lý lệnh Telegram
bot.onText(/\/addvip (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userIdToAdd = match[1];

    if (chatId.toString() !== ADMIN_ID) {
        await sendToAdmin(`Người dùng ${chatId} cố gắng sử dụng lệnh /addvip không được phép!`);
        return;
    }

    if (!vipUsers.includes(userIdToAdd)) {
        vipUsers.push(userIdToAdd);
        await sendToAdmin(`Đã thêm ${userIdToAdd} vào danh sách VIP.`);
    } else {
        await sendToAdmin(`${userIdToAdd} đã có trong danh sách VIP.`);
    }
});

bot.onText(/\/delvip (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userIdToRemove = match[1];

    if (chatId.toString() !== ADMIN_ID) {
        await sendToAdmin(`Người dùng ${chatId} cố gắng sử dụng lệnh /delvip không được phép!`);
        return;
    }

    const index = vipUsers.indexOf(userIdToRemove);
    if (index !== -1) {
        vipUsers.splice(index, 1);
        await sendToAdmin(`Đã xóa ${userIdToRemove} khỏi danh sách VIP.`);
    } else {
        await sendToAdmin(`${userIdToRemove} không có trong danh sách VIP.`);
    }
});

bot.onText(/\/Tongvip/, async (msg) => {
    const chatId = msg.chat.id;

    if (chatId.toString() !== ADMIN_ID) {
        await sendToAdmin(`Người dùng ${chatId} cố gắng sử dụng lệnh /Tongvip không được phép!`);
        return;
    }

    if (vipUsers.length === 0) {
        await sendToAdmin('Danh sách VIP trống.');
    } else {
        await sendToAdmin(`Danh sách VIP:\n${vipUsers.join('\n')}`);
    }
});

// Hàm chính chạy bot
async function runBot() {
    while (true) {
        const data = await fetchSessionData();
        if (data) {
            // Giả sử API trả về JSON với các trường: result, sessionId, total, dice1, dice2, dice3
            const session = {
                result: data.result || 'Không có dữ liệu',
                sessionId: data.sessionId || 'Không có dữ liệu',
                total: data.total || 0,
                dice1: data.dice1 || 0,
                dice2: data.dice2 || 0,
                dice3: data.dice3 || 0
            };

            // Kiểm tra xem phiên mới có khác phiên trước không
            if (sessions.length === 0 || sessions[sessions.length - 1].sessionId !== session.sessionId) {
                sessions.push(session);
                if (sessions.length > 4) {
                    sessions.shift(); // Giữ chỉ 4 phiên gần nhất
                }

                // Dự đoán và gửi tin nhắn cho VIP
                await predictResult();
            }
        }

        // Chờ 30 giây trước khi gọi API lần tiếp theo
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

// Chạy bot
runBot().catch(async error => {
    console.error('Lỗi chạy bot:', error.message);
    await sendToAdmin('Bot gặp lỗi, đang khởi động lại...');
    setTimeout(runBot, 60000); // Thử lại sau 1 phút nếu lỗi
});