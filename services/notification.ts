import { getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore'; // Changed from /lite to full
import { messaging, db } from './firebase';

export const requestNotificationPermission = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!messaging) {
    return { success: false, error: "Trình duyệt này không hỗ trợ Firebase Messaging hoặc chưa được khởi tạo." };
  }

  try {
    const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("Missing VAPID Key");
      return { success: false, error: "Thiếu VAPID Key trong cấu hình." };
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      try {
        const token = await getToken(messaging, { vapidKey });
        
        if (token) {
          await setDoc(doc(db, 'users', userId, 'fcmTokens', token), {
            createdAt: new Date().toISOString(),
            device: navigator.userAgent,
            lastSeen: new Date().toISOString()
          });
          return { success: true };
        } else {
          return { success: false, error: "Không lấy được FCM Token." };
        }
      } catch (tokenError: any) {
        return { success: false, error: `Lỗi lấy Token: ${tokenError.message}` };
      }
    } else {
      return { success: false, error: "Quyền thông báo bị từ chối." };
    }
  } catch (error: any) {
    return { success: false, error: `Lỗi không xác định: ${error.message}` };
  }
};
