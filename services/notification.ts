
import { getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore/lite';
import { messaging, db } from './firebase';

export const requestNotificationPermission = async (userId: string) => {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get VAPID Key from environment variables (Required for web push)
      const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;

      const token = await getToken(messaging, { vapidKey });

      if (token) {
        console.log('FCM Token:', token);
        // Save token to Firestore
        await setDoc(doc(db, 'users', userId, 'fcmTokens', token), {
          createdAt: new Date(),
          device: navigator.userAgent
        });
      } else {
        console.warn('Không lấy được FCM Token. Kiểm tra lại VAPID Key hoặc quyền thông báo.');
      }
    }
  } catch (error) {
    console.error('Lỗi khi xin quyền thông báo:', error);
  }
};
