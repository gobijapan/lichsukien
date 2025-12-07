import * as firebaseApp from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// --- CẤU HÌNH FIREBASE ---
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let app;
let auth: any;
let db: any;
let messaging: any = null;

try {
    // Initialize Firebase (Modular)
    // Use namespace import to avoid 'no exported member' issues in certain environments
    app = firebaseApp.initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        try {
            messaging = getMessaging(app);
        } catch (e) {
            console.warn('Firebase Messaging not supported in this browser context');
        }
    }
} catch (e) {
    console.error('Lỗi khởi tạo Firebase. Vui lòng kiểm tra file .env', e);
}

export { auth, db, messaging };
