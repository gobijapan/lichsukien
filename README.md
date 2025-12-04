
# Lịch Sự Kiện - Ứng Dụng Vạn Niên Lịch

Ứng dụng xem Lịch Âm Dương, Quản lý sự kiện, Nhắc nhở ngày Rằm/Mùng 1/Lễ Tết, được xây dựng bằng React (Vite) và Firebase.

## Tính Năng Chính
- **Xem Lịch:** Lịch ngày, Lịch tháng, xem ngày Hoàng đạo, Giờ tốt, Sao, Trực, Tiết khí.
- **Sự Kiện:** Thêm sự kiện cá nhân (Sinh nhật, Giỗ chạp - hỗ trợ Âm lịch).
- **Nhắc Nhở:** Hệ thống nhắc nhở tự động (Rằm, Lễ, Sự kiện riêng) qua thông báo đẩy (FCM).
- **Đồng Bộ:** Đăng nhập Google/Email để đồng bộ dữ liệu giữa các thiết bị.
- **Sao Lưu:** Sao lưu và phục hồi dữ liệu từ đám mây.
- **Cá Nhân Hóa:** Đổi hình nền, Font chữ, Màu chủ đạo, Dark mode.

## Cài Đặt & Chạy Dự Án

### 1. Yêu cầu
- Node.js (v16 trở lên)
- Tài khoản Firebase (Google)

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường (.env)
Tạo file `.env` tại thư mục gốc và điền thông tin Firebase của bạn vào:

```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

> **Lưu ý:** Bạn cũng cần cập nhật API Key trực tiếp vào file `public/firebase-messaging-sw.js` vì Service Worker không đọc được file .env.

### 4. Chạy Local
```bash
npm run dev
```

### 5. Build (Deploy)
```bash
npm run build
```

## Hướng dẫn Deploy lên Vercel

1. Đẩy code lên GitHub (không bao gồm file `.env`).
2. Vào [Vercel](https://vercel.com), chọn **Add New Project**.
3. Import repo GitHub vừa đẩy.
4. Trong mục **Environment Variables**, copy toàn bộ nội dung file `.env` vào.
5. Bấm **Deploy**.

## Hướng dẫn Setup Backend (Thông báo tự động)

Để tính năng nhắc nhở hoạt động tự động mỗi ngày (Cron Job), bạn cần deploy Firebase Cloud Functions.

1. Cài đặt Firebase Tools: `npm install -g firebase-tools`
2. Đăng nhập: `firebase login`
3. Vào thư mục `functions`: `cd functions`
4. Deploy: `firebase deploy --only functions`

*(Lưu ý: Cần nâng cấp Firebase Project lên gói Blaze để sử dụng tính năng Schedule)*.
