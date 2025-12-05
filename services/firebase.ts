// @ts-ignore
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore/lite';
import { getMessaging } from 'firebase/messaging';

// --- CẤU HÌNH FIREBASE ---
// Kiểm tra biến môi trường trước khi sử dụng để tránh sập app
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let app: any;
let auth: any;
let db: any;
let messaging: any = null;

try {
    // Chỉ khởi tạo khi có config hợp lệ
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        // Messaging support
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            try {
                messaging = getMessaging(app);
            } catch (e) {
                console.warn('Firebase Messaging not supported');
            }
        }
    } else {
        console.warn('Thiếu cấu hình Firebase trong .env. Ứng dụng sẽ chạy ở chế độ offline giới hạn.');
        // Mock objects để không crash UI
        auth = { currentUser: null, signOut: async () => {} };
        db = {};
    }
} catch (e) {
    console.error('Firebase Init Error:', e);
}

export { auth, db, messaging };