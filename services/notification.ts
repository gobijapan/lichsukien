
import { getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore/lite';
import { messaging, db } from './firebase';

export const requestNotificationPermission = async (userId: string) => {
  if (!messaging) return;

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM Token
      // Removed explicit vapidKey to use default project settings or 'service worker' flow
      const token = await getToken(messaging);

      if (token) {
        console.log('FCM Token:', token);
        // Save token to Firestore
        await setDoc(doc(db, 'users', userId, 'fcmTokens', token), {
          createdAt: new Date(),
          device: navigator.userAgent
        });
      }
    }
  } catch (error) {
    console.error('Lỗi khi xin quyền thông báo:', error);
  }
};
