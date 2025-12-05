
import { getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { messaging, db } from './firebase';

export const requestNotificationPermission = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  if (!messaging) {
    return { success: false, error: "Trình duyệt này không hỗ trợ Firebase Messaging hoặc chưa được khởi tạo." };
  }

  try {
    // 1. Kiểm tra VAPID Key từ biến môi trường
    const vapidKey = (import.meta as any).env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error("Missing VAPID Key");
      return { success: false, error: "Thiếu VAPID Key trong cấu hình (VITE_FIREBASE_VAPID_KEY). Hãy thêm vào Vercel Environment." };
    }

    // 2. Xin quyền từ trình duyệt
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log("Notification permission granted.");
      
      // 3. Lấy Token
      try {
        const token = await getToken(messaging, { vapidKey });
        
        if (token) {
          console.log('FCM Token:', token);
          
          // 4. Lưu Token vào Firestore
          await setDoc(doc(db, 'users', userId, 'fcmTokens', token), {
            createdAt: new Date().toISOString(),
            device: navigator.userAgent,
            lastSeen: new Date().toISOString()
          });
          
          return { success: true };
        } else {
          return { success: false, error: "Không lấy được FCM Token. Có thể do lỗi mạng hoặc cấu hình Service Worker." };
        }
      } catch (tokenError: any) {
        console.error("Get Token Error:", tokenError);
        return { success: false, error: `Lỗi lấy Token: ${tokenError.message}` };
      }
    } else {
      return { success: false, error: "Quyền thông báo bị từ chối. Vui lòng bật lại trong cài đặt trình duyệt." };
    }
  } catch (error: any) {
    console.error('Lỗi khi xin quyền thông báo:', error);
    return { success: false, error: `Lỗi không xác định: ${error.message}` };
  }
};
