# Bot Dự đoán Tài Xỉu

Bot Telegram dự đoán kết quả Tài Xỉu từ API `https://apihitclub.up.railway.app/api/taixiumd5`.

## Tính năng
- Hiển thị kết quả phiên gần nhất: `#<sessionId> : <result>\nTổng điểm <total> (<dice1>-<dice2>-<dice3>)\nDự đoán phiên tiếp theo: <prediction>`
- Dự đoán dựa trên tổng khoảng cách của 4 phiên trước:
  - Khoảng cách giữa hai tổng điểm bằng nhau = 5.
  - Tổng khoảng cách ≤ 10: Dự đoán Xỉu (hiển thị Tài).
  - Tổng khoảng cách > 10: Dự đoán Tài (hiển thị Xỉu).
  - Tổng khoảng cách < 3 hoặc > 18: "Cầu rất xấu, nên nghỉ!".
- Lệnh admin:
  - `/addvip <id_user>`: Thêm người dùng vào danh sách VIP.
  - `/delvip <id_user>`: Xóa người dùng khỏi danh sách VIP.
  - `/Tongvip`: Hiển thị danh sách VIP.

## Cài đặt cục bộ
1. Cài Node.js từ https://nodejs.org.
2. Clone repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tai-xiu-bot.git
   cd tai-xiu-bot
