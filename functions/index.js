const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { convertSolar2Lunar } = require("./lunar-utils");

admin.initializeApp();

const HOLIDAYS_SOLAR = [
  { day: 1, month: 1, title: 'Tết Dương Lịch' },
  { day: 14, month: 2, title: 'Lễ Tình Nhân' },
  { day: 8, month: 3, title: 'Quốc Tế Phụ Nữ' },
  { day: 30, month: 4, title: 'Giải Phóng Miền Nam' },
  { day: 1, month: 5, title: 'Quốc Tế Lao Động' },
  { day: 1, month: 6, title: 'Quốc Tế Thiếu Nhi' },
  { day: 2, month: 9, title: 'Quốc Khánh' },
  { day: 20, month: 10, title: 'Phụ Nữ Việt Nam' },
  { day: 20, month: 11, title: 'Nhà Giáo Việt Nam' },
  { day: 24, month: 12, title: 'Giáng Sinh' },
];

const HOLIDAYS_LUNAR = [
  { day: 1, month: 1, title: 'Tết Nguyên Đán' },
  { day: 2, month: 1, title: 'Tết Nguyên Đán' },
  { day: 3, month: 1, title: 'Tết Nguyên Đán' },
  { day: 10, month: 3, title: 'Giỗ Tổ Hùng Vương' },
  { day: 15, month: 4, title: 'Lễ Phật Đản' },
  { day: 5, month: 5, title: 'Tết Đoan Ngọ' },
  { day: 15, month: 7, title: 'Lễ Vu Lan' },
  { day: 15, month: 8, title: 'Trung Thu' },
  { day: 23, month: 12, title: 'Ông Công Ông Táo' },
];

// Chạy 15 phút một lần để kiểm tra nhắc nhở
exports.checkRemindersFrequency = functions.pubsub.schedule('every 15 minutes')
  .timeZone('Asia/Ho_Chi_Minh')
  .onRun(async (context) => {
    
    const db = admin.firestore();
    const now = new Date();
    
    // Chuyển về giờ VN
    const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    
    // Cửa sổ thời gian kiểm tra: từ 14 phút trước đến hiện tại (để bắt sự kiện vừa diễn ra)
    // Ví dụ: Cron chạy lúc 7:15, sẽ quét các sự kiện đặt giờ từ 7:00 -> 7:15
    const currentHour = vnTime.getHours();
    const currentMinute = vnTime.getMinutes();
    
    // Quy đổi về mốc chuẩn 15p: 0, 15, 30, 45
    // Nếu hiện tại là 7:16, ta coi như mốc kiểm tra là 7:15
    let checkMinute = 0;
    if (currentMinute >= 45) checkMinute = 45;
    else if (currentMinute >= 30) checkMinute = 30;
    else if (currentMinute >= 15) checkMinute = 15;
    
    // Format thành chuỗi HH:mm để so sánh với Database (Ví dụ: "07:15")
    const timeString = `${currentHour.toString().padStart(2, '0')}:${checkMinute.toString().padStart(2, '0')}`;
    
    console.log(`Scanning reminders for time window: ${timeString}`);

    // Ngày dương lịch hôm nay (để check ngày lễ)
    const tDay = vnTime.getDate();
    const tMonth = vnTime.getMonth() + 1;
    const tYear = vnTime.getFullYear();
    const tLunar = convertSolar2Lunar(tDay, tMonth, tYear, 7);

    // Lấy tất cả user
    const usersSnap = await db.collection('users').get();
    const promises = [];

    usersSnap.forEach((userDoc) => {
      promises.push(processUser(userDoc, tDay, tMonth, tYear, tLunar, timeString));
    });

    await Promise.all(promises);
    return null;
});

async function processUser(userDoc, tDay, tMonth, tYear, tLunar, timeString) {
    const userData = userDoc.data();
    const settings = userData.settings;

    if (!settings || !settings.reminderSettings || !settings.reminderSettings.enabled) return;

    const tokensSnap = await userDoc.ref.collection('fcmTokens').get();
    if (tokensSnap.empty) return;
    const tokens = tokensSnap.docs.map(snap => snap.id);

    const messages = [];

    // 1. KIỂM TRA NHẮC NHỞ HỆ THỐNG (GLOBAL REMINDERS)
    const globalConfigs = settings.reminderSettings.defaultReminders || [];
    globalConfigs.forEach(config => {
        // Chỉ xử lý nếu giờ cài đặt trùng với giờ quét hiện tại
        if (config.time === timeString) {
            
            // Tính ngày mục tiêu (Ví dụ: Nhắc trước 1 ngày -> Check ngày mai)
            const checkDate = new Date(tYear, tMonth - 1, tDay);
            checkDate.setDate(checkDate.getDate() + config.daysBefore);
            
            const cDay = checkDate.getDate();
            const cMonth = checkDate.getMonth() + 1;
            const cYear = checkDate.getFullYear();
            const cLunar = convertSolar2Lunar(cDay, cMonth, cYear, 7);

            // Check Rằm/Mùng 1
            if (settings.reminderSettings.lunar15_1) {
                if (cLunar.day === 1) messages.push(`Mùng 1 Âm lịch (${config.daysBefore === 0 ? 'Hôm nay' : 'Ngày mai'})`);
                if (cLunar.day === 15) messages.push(`Rằm (${config.daysBefore === 0 ? 'Hôm nay' : 'Ngày mai'})`);
            }
            // Check Lễ
            if (settings.reminderSettings.solarHolidays) {
                const h = HOLIDAYS_SOLAR.find(x => x.day === cDay && x.month === cMonth);
                if (h) messages.push(`${h.title} (${config.daysBefore === 0 ? 'Hôm nay' : 'Sắp tới'})`);
            }
            if (settings.reminderSettings.lunarHolidays) {
                const h = HOLIDAYS_LUNAR.find(x => x.day === cLunar.day && x.month === cLunar.month);
                if (h) messages.push(`${h.title} (${config.daysBefore === 0 ? 'Hôm nay' : 'Sắp tới'})`);
            }
        }
    });

    // 2. KIỂM TRA SỰ KIỆN RIÊNG (USER EVENTS)
    const userEvents = userData.events || [];
    userEvents.forEach(evt => {
        if (!evt.reminderConfig) return;

        // Check "7:00 AM on day"
        if (evt.reminderConfig.at7am && timeString === '07:00') {
             let isMatch = false;
             if (evt.type === 'solar') {
                 if (evt.day === tDay && evt.month === tMonth) isMatch = true;
             } else {
                 if (evt.day === tLunar.day && evt.month === tLunar.month) isMatch = true;
             }
             if (isMatch) messages.push(`Hôm nay: ${evt.title}`);
        }

        // Check Custom Reminders
        if (evt.reminderConfig.customReminders) {
            evt.reminderConfig.customReminders.forEach(rem => {
                // Chỉ check nếu giờ trùng
                if (rem.time === timeString) {
                    const checkDate = new Date(tYear, tMonth - 1, tDay);
                    checkDate.setDate(checkDate.getDate() + rem.daysBefore);
                    
                    const cDay = checkDate.getDate();
                    const cMonth = checkDate.getMonth() + 1;
                    const cLunar = convertSolar2Lunar(cDay, cMonth, checkDate.getFullYear(), 7); // Tính lại Lunar năm đó

                    let isMatch = false;
                    if (evt.type === 'solar') {
                        if (evt.day === cDay && evt.month === cMonth) isMatch = true;
                    } else {
                        if (evt.day === cLunar.day && evt.month === cLunar.month) isMatch = true;
                    }

                    if (isMatch) {
                        const prefix = rem.daysBefore === 0 ? 'Diễn ra ngay:' : `Sắp tới (${rem.daysBefore} ngày):`;
                        messages.push(`${prefix} ${evt.title}. ${rem.note || ''}`);
                    }
                }
            });
        }
    });

    // GỬI THÔNG BÁO
    if (messages.length > 0) {
        const uniqueMsgs = [...new Set(messages)];
        const payload = {
            notification: {
                title: '📅 Vạn Niên Lịch',
                body: uniqueMsgs.join('\n'),
            }
        };
        try {
            await admin.messaging().sendToDevice(tokens, payload);
            console.log(`Sent to ${userDoc.id}`);
        } catch (e) {
            console.error(`Error sending to ${userDoc.id}`, e);
        }
    }
}