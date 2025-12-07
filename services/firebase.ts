
// @ts-ignore
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Switched from lite to full
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
    // Initialize Firebase
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    
    // Initialize Firestore
    db = firebase.firestore();
    
    // Initialize Messaging (Client-side only)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            messaging = firebase.messaging();
        } catch (e) {
            console.warn('Firebase Messaging not supported in this browser context');
        }
    }
} catch (e) {
    console.error('Lỗi khởi tạo Firebase. Vui lòng kiểm tra file .env', e);
}

export { auth, db, messaging };
