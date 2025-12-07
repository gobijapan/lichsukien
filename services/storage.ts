import { CalendarEvent, AppSettings, LunarDate, User, SystemBanner, AdminPushConfig } from '../types';
import { HOLIDAYS_LUNAR, HOLIDAYS_SOLAR } from '../constants';
import { getLunarDate, getSolarDateFromLunar, convertSolar2LunarAlgorithm } from '../utils/lunar';
import { addDays } from 'date-fns';
import { 
  doc, setDoc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, orderBy, Firestore, Unsubscribe, deleteField
} from 'firebase/firestore';
import { db, auth } from './firebase';

const STORAGE_KEY_EVENTS = 'vnl_events';
const STORAGE_KEY_SETTINGS = 'vnl_settings';

// Hàm tạo ID tạm thời cho Local Storage (nếu chưa đăng nhập)
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Hàm lắng nghe (subscribe) sự kiện Realtime từ Firestore.
 * Đây là CHÌA KHÓA để đồng bộ ngay lập tức.
 * @param userId - ID người dùng hiện tại (nếu đã đăng nhập).
 * @param db - Instance Firestore.
 * @param callback - Hàm callback để cập nhật State trong Component React.
 * @returns Hàm Unsubscribe để dọn dẹp Listener.
 */
export const subscribeToEvents = (userId: string | null, db: Firestore | null, callback: (events: CalendarEvent[]) => void): Unsubscribe | (() => void) => {
    // 1. Fallback nếu không có DB hoặc user chưa đăng nhập
    if (!db || !userId) {
        console.log("Không có User ID/DB. Dùng dữ liệu localStorage (Offline/Fallback).");
        callback(getEvents());
        return () => {}; // Trả về hàm dọn dẹp trống
    }

    // 2. Thiết lập LẮNG NGHE REALTIME
    try {
        // Collection con chứa events của User hiện tại
        const eventsCollectionRef = collection(db, 'users', userId, 'user_events');
        // Sắp xếp theo ngày tạo (nếu có)
        const q = query(eventsCollectionRef, orderBy('dateCreated', 'desc'));

        console.log('[REALTIME] Đang thiết lập lắng nghe sự kiện từ Firestore...');

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const events: CalendarEvent[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                } as CalendarEvent;
            });
            
            console.log(`[REALTIME] Nhận được ${events.length} sự kiện mới từ Cloud. Sẽ cập nhật UI ngay.`);
            
            // Cập nhật State trong component React
            callback(events);

            // BẮT BUỘC: Ghi đè events mới nhất vào localStorage để đồng bộ bản offline
            localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
            
        }, (error) => {
            console.error("Lỗi khi lắng nghe Events Realtime, chuyển sang Fallback Local Storage:", error);
            callback(getEvents());
        });

        // Hàm dọn dẹp (quan trọng!)
        return unsubscribe;

    } catch (e) {
        console.error("Setup Realtime listener failed, falling back to local storage:", e);
        callback(getEvents());
        return () => {};
    }
}


export const saveEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
  const isNew = !event.id;
  const eventId = event.id || generateId();
  const finalEvent: CalendarEvent = {
    ...event, 
    id: eventId,
    // Thêm trường dateCreated nếu là event mới
    dateCreated: event.dateCreated || new Date().toISOString() 
};

  // 1. Hybrid Sync: Sync to Firestore
  if (auth.currentUser && db) {
      console.log(`[SYNC] Đang đồng bộ Event ${isNew ? 'mới' : eventId} lên Firestore...`);
      try {
        // Ghi vào collection con user_events, Firestore sẽ tự động đồng bộ ngược lại app qua onSnapshot
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'user_events', eventId), finalEvent);
        console.log('[SYNC] Ghi lên Cloud thành công!');
      } catch (e) {
          console.error("Auto-sync error:", e);
      }
  }

  // 2. Local Save (Nếu user chưa đăng nhập thì chỉ lưu Local)
  const current = getEvents();
  const index = current.findIndex(e => e.id === eventId);
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = finalEvent;
  } else {
    updated = [...current, finalEvent];
  }
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));

  return finalEvent;
};

export const deleteEvent = async (id: string): Promise<void> => {
  // 1. Hybrid Sync: Xóa trên Firestore
  if (auth.currentUser && db) {
      console.log(`[SYNC] Đang đồng bộ xóa event ${id} lên Firestore...`);
      try {
        // Xóa document trong collection con
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'user_events', id));
        console.log('[SYNC] Xóa trên Cloud thành công!');
      } catch (e) {
          console.error("Auto-sync error:", e);
      }
  }

  // 2. Local Save (Xóa Local)
  const current = getEvents();
  const updated = current.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));

  return new Promise((resolve) => setTimeout(resolve, 100));
};

// Hàm này giữ nguyên, chỉ dùng để đọc localStorage (chủ yếu là cho fallback)
export const getEvents = (): CalendarEvent[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_EVENTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Get all events (user + system) for a specific Date
 */
export const getEventsForDate = (date: Date): CalendarEvent[] => {
  const lunar = getLunarDate(date);
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const userEvents = getEvents();

  const events: CalendarEvent[] = [];

  // Check Solar Holidays
  HOLIDAYS_SOLAR.forEach(h => {
    if (h.day === d && h.month === m) {
      events.push({
        id: `sys-sol-${h.day}-${h.month}`,
        title: h.title,
        dateStr: `${h.day}/${h.month}`,
        type: 'solar',
        day: h.day,
        month: h.month,
        isRecurring: true,
        category: 'holiday',
        isSystem: true
      });
    }
  });

  // Check Lunar Holidays
  HOLIDAYS_LUNAR.forEach(h => {
    if (h.day === lunar.day && h.month === lunar.month) {
      events.push({
        id: `sys-lun-${h.day}-${h.month}`,
        title: h.title,
        dateStr: `${h.day}/${h.month} (AL)`,
        type: 'lunar',
        day: h.day,
        month: h.month,
        isRecurring: true,
        category: 'holiday',
        isSystem: true
      });
    }
  });

  // Check User Events
  userEvents.forEach(e => {
    if (e.type === 'solar') {
      if (e.day === d && e.month === m) events.push(e);
    } else {
      if (e.day === lunar.day && e.month === lunar.month) events.push(e);
    }
  });

  return events;
};

export const getRemindersForDate = (date: Date): { title: string, note?: string, type: 'system' | 'event', eventId?: string }[] => {
    const settings = getSettings();
    if (!settings.reminderSettings.enabled) return [];

    const userEvents = getEvents();
    const reminders: { title: string, note?: string, type: 'system' | 'event', eventId?: string }[] = [];
    const globalConfigs = settings.reminderSettings.defaultReminders || [];

    // --- SYSTEM EVENTS & GLOBAL REMINDERS ---
    globalConfigs.forEach(config => {
        const targetDate = addDays(date, config.daysBefore);
        const tLunar = getLunarDate(targetDate);
        const tDay = targetDate.getDate();
        const tMonth = targetDate.getMonth() + 1;

        // 1. Check Rằm & Mùng 1
        if (settings.reminderSettings.lunar15_1) {
            if (tLunar.day === 1) {
                 reminders.push({ 
                     title: config.daysBefore === 0 ? 'Hôm nay là Mùng 1 Âm lịch' : `Sắp tới: Mùng 1 Âm lịch`,
                     note: config.daysBefore === 0 ? undefined : `Còn ${config.daysBefore} ngày`,
                     type: 'system' 
                 });
            }
            if (tLunar.day === 15) {
                 reminders.push({ 
                     title: config.daysBefore === 0 ? 'Hôm nay là Rằm (15 Âm lịch)' : `Sắp tới: Rằm (15 Âm lịch)`,
                     note: config.daysBefore === 0 ? undefined : `Còn ${config.daysBefore} ngày`,
                     type: 'system' 
                 });
            }
        }

        // 2. Check Solar Holidays
        if (settings.reminderSettings.solarHolidays) {
            HOLIDAYS_SOLAR.forEach(h => {
                if(h.day === tDay && h.month === tMonth) {
                    reminders.push({ 
                        title: config.daysBefore === 0 ? `Hôm nay lễ: ${h.title}` : `Sắp lễ: ${h.title}`,
                        note: config.daysBefore === 0 ? undefined : `Còn ${config.daysBefore} ngày`,
                        type: 'system' 
                    });
                }
            });
        }

        // 3. Check Lunar Holidays
        if (settings.reminderSettings.lunarHolidays) {
            HOLIDAYS_LUNAR.forEach(h => {
                if(h.day === tLunar.day && h.month === tLunar.month) {
                    reminders.push({ 
                        title: config.daysBefore === 0 ? `Hôm nay lễ: ${h.title}` : `Sắp lễ: ${h.title}`,
                        note: config.daysBefore === 0 ? undefined : `Còn ${config.daysBefore} ngày`,
                        type: 'system' 
                    });
                }
            });
        }
    });

    // --- USER EVENT CUSTOM REMINDERS ---
    for(let offset = 0; offset <= 30; offset++) {
        const targetDate = addDays(date, offset);
        const tLunar = getLunarDate(targetDate);

        userEvents.forEach(evt => {
            if(!evt.reminderConfig) return;

            let isEventDay = false;
            if (evt.type === 'solar') {
                if (evt.day === targetDate.getDate() && evt.month === targetDate.getMonth() + 1) isEventDay = true;
            } else {
                if (evt.day === tLunar.day && evt.month === tLunar.month) isEventDay = true;
            }

            if (isEventDay) {
                const remindersForOffset = evt.reminderConfig.customReminders?.filter(r => r.daysBefore === offset);
                
                if (offset === 0 && evt.reminderConfig.at7am) {
                    reminders.push({
                        title: `Hôm nay: ${evt.title}`,
                        note: 'Sự kiện diễn ra hôm nay',
                        type: 'event',
                        eventId: evt.id
                    });
                }

                if (remindersForOffset && remindersForOffset.length > 0) {
                    remindersForOffset.forEach(r => {
                        reminders.push({
                            title: `Sắp tới: ${evt.title}`,
                            note: r.note ? `${r.note} (Còn ${offset} ngày)` : `Sự kiện diễn ra sau ${offset} ngày`,
                            type: 'event',
                            eventId: evt.id
                        });
                    });
                }
            }
        });
    }

    const uniqueReminders = reminders.filter((v, i, a) => a.findIndex(t => (t.title === v.title && t.note === v.note)) === i);

    return uniqueReminders;
}

export const getAllUpcomingReminders = (): { 
    triggerDate: Date; 
    timeStr: string; 
    eventTitle: string; 
    eventDateDisplay: string;
    note: string; 
    type: 'system' | 'event' 
}[] => {
    const settings = getSettings();
    if (!settings.reminderSettings.enabled) return [];
    
    const userEvents = getEvents();
    const today = new Date();
    const lookAheadDays = 60;
    const remindersList: any[] = [];
    const globalConfigs = settings.reminderSettings.defaultReminders || [];

    for (let i = 0; i < lookAheadDays; i++) {
        const currentDate = addDays(today, i);
        const tDay = currentDate.getDate();
        const tMonth = currentDate.getMonth() + 1;
        const tLunar = getLunarDate(currentDate);

        const systemEventsOnDate: {title: string, dateDisplay: string}[] = [];

        if (settings.reminderSettings.lunar15_1) {
            if (tLunar.day === 1) systemEventsOnDate.push({title: 'Mùng 1 Âm lịch', dateDisplay: `${tDay}/${tMonth} (1/1 AL)`});
            if (tLunar.day === 15) systemEventsOnDate.push({title: 'Rằm (15 Âm lịch)', dateDisplay: `${tDay}/${tMonth} (15/${tLunar.month} AL)`});
        }
        if (settings.reminderSettings.solarHolidays) {
            HOLIDAYS_SOLAR.forEach(h => {
                if(h.day === tDay && h.month === tMonth) systemEventsOnDate.push({title: h.title, dateDisplay: `${h.day}/${h.month} (DL)`});
            });
        }
        if (settings.reminderSettings.lunarHolidays) {
            HOLIDAYS_LUNAR.forEach(h => {
                if(h.day === tLunar.day && h.month === tLunar.month) systemEventsOnDate.push({title: h.title, dateDisplay: `${tDay}/${tMonth} (${h.day}/${h.month} AL)`});
            });
        }

        systemEventsOnDate.forEach(sysEvt => {
            globalConfigs.forEach(conf => {
                let triggerDate = addDays(currentDate, -conf.daysBefore);
                triggerDate = setTime(triggerDate, conf.time);

                if (triggerDate.getTime() >= new Date().setSeconds(0,0)) {
                    remindersList.push({
                        triggerDate,
                        timeStr: conf.time,
                        eventTitle: sysEvt.title,
                        eventDateDisplay: sysEvt.dateDisplay,
                        note: conf.daysBefore === 0 ? 'Nhắc nhở ngày diễn ra' : `Nhắc trước ${conf.daysBefore} ngày`,
                        type: 'system'
                    });
                }
            });
        });

        userEvents.forEach(evt => {
            let isOccurrence = false;
            let dateDisplay = '';
            
            if (evt.type === 'solar') {
                if (evt.day === tDay && evt.month === tMonth) {
                    isOccurrence = true;
                    dateDisplay = `${tDay}/${tMonth} (DL)`;
                }
            } else {
                if (evt.day === tLunar.day && evt.month === tLunar.month) {
                    isOccurrence = true;
                    dateDisplay = `${tDay}/${tMonth} (${tLunar.day}/${tLunar.month} AL)`;
                }
            }

            if (isOccurrence && evt.reminderConfig) {
                if (evt.reminderConfig.at7am) {
                    let triggerDate = currentDate;
                    triggerDate = setTime(triggerDate, '07:00');

                    if (triggerDate.getTime() >= new Date().setSeconds(0,0)) {
                         remindersList.push({
                            triggerDate,
                            timeStr: '07:00',
                            eventTitle: evt.title,
                            eventDateDisplay: dateDisplay,
                            note: 'Nhắc nhở sáng ngày diễn ra',
                            type: 'event'
                        });
                    }
                }
                
                if (evt.reminderConfig.customReminders) {
                    evt.reminderConfig.customReminders.forEach(cust => {
                         let triggerDate = addDays(currentDate, -cust.daysBefore);
                         triggerDate = setTime(triggerDate, cust.time);

                         if (triggerDate.getTime() >= new Date().setSeconds(0,0)) {
                             remindersList.push({
                                triggerDate,
                                timeStr: cust.time,
                                eventTitle: evt.title,
                                eventDateDisplay: dateDisplay,
                                note: cust.note || `Nhắc trước ${cust.daysBefore} ngày`,
                                type: 'event'
                            });
                         }
                    });
                }
            }
        });
    }

    remindersList.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
    return remindersList;
}

const setTime = (date: Date, timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(h);
    newDate.setMinutes(m);
    return newDate;
}

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
};

export const getSettings = (): AppSettings => {
  const defaults: AppSettings = { 
      bgId: 'bg-1', 
      font: 'inter', 
      darkMode: false, 
      primaryColor: '#D91E18',
      weekStart: 'monday',
      reminderSettings: {
          enabled: true,
          lunar15_1: true,
          solarHolidays: true,
          lunarHolidays: true,
          defaultReminders: [
             { daysBefore: 0, time: '07:00' },
             { daysBefore: 1, time: '19:00' }
          ]
      }
  };

  try {
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!data) return defaults;
    
    const parsed = JSON.parse(data);
    let defReminders = parsed.reminderSettings?.defaultReminders;
    if (!defReminders) {
        defReminders = defaults.reminderSettings.defaultReminders;
    }

    return {
        ...defaults,
        ...parsed,
        reminderSettings: {
            ...defaults.reminderSettings,
            ...(parsed.reminderSettings || {}),
            defaultReminders: defReminders
        }
    };
  } catch (e) {
    return defaults;
  }
};

export const getBackupInfo = async (userId: string) => {
  if (!db) return { exists: false, lastBackup: null };
  try {
    // Kiểm tra document chính của user (không phải subcollection)
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().lastBackup) {
      return { 
        exists: true, 
        lastBackup: new Date(docSnap.data().lastBackup)
      };
    }
    return { exists: false, lastBackup: null };
  } catch (error) {
    console.error("Check backup error:", error);
    return { exists: false, lastBackup: null };
  }
}

export const backupData = async (userId: string) => {
  if (!db) return false;
  try {
    // Lấy tất cả events từ subcollection (chứ không phải local nữa)
    const eventsSnap = await getDocs(collection(db, 'users', userId, 'user_events'));
    const events = eventsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    const settings = getSettings();
    
    // Lưu backup info vào doc chính
    const dataToBackup = { settings, lastBackup: new Date().toISOString() };
    await setDoc(doc(db, 'users', userId), dataToBackup, { merge: true });

    // Lưu events vào doc riêng (hoặc giữ nguyên subcollection)
    // Vì events đã được lưu trong subcollection, ta chỉ cần đảm bảo doc settings/backup info được cập nhật.
    return true;
  } catch (error) {
    console.error("Backup error:", error);
    return false;
  }
}

export const restoreData = async (userId: string) => {
  if (!db) return false;
  try {
    // 1. Lấy settings từ doc chính
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.settings) localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data.settings));
    }
    
    // 2. Lấy events từ subcollection và ghi đè Local Storage
    const eventsSnap = await getDocs(collection(db, 'users', userId, 'user_events'));
    const events = eventsSnap.docs.map(doc => ({id: doc.id, ...doc.data()}));
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));

    return true;

  } catch (error) {
    console.error("Restore error:", error);
    return false;
  }
}

export const saveUserProfile = async (userId: string, data: Partial<User>) => {
  if (!db) return false;
  try {
     const { name, dateOfBirth, phoneNumber, address, email } = data;
     const payload: any = {};
     if (name !== undefined) payload.name = name;
     if (email !== undefined) payload.email = email;
     if (dateOfBirth !== undefined) payload.dateOfBirth = dateOfBirth;
     if (phoneNumber !== undefined) payload.phoneNumber = phoneNumber;
     if (address !== undefined) payload.address = address;

     await setDoc(doc(db, 'users', userId), payload, { merge: true });
     return true;
  } catch (e) {
     console.error("Error saving profile:", e);
     return false;
  }
};

export const getUserProfile = async (userId: string): Promise<Partial<User>> => {
  if (!db) return { role: 'user' };
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
       const data = docSnap.data();
       return {
          name: data.name,
          role: data.role || 'user',
          dateOfBirth: data.dateOfBirth,
          phoneNumber: data.phoneNumber,
          address: data.address
       } as Partial<User>;
    }
    return { role: 'user' };
  } catch (e) {
    console.error("Error fetching profile:", e);
    return { role: 'user' };
  }
};

// --- ADMIN STATS ---
export const getAdminStats = async () => {
    if (!db) return { users: 0, todayEvents: 0 };
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const userCount = usersSnap.size;
        
        let eventCountToday = 0;
        const today = new Date();
        const d = today.getDate();
        const m = today.getMonth() + 1;
        const lunar = getLunarDate(today);

        // Lặp qua tất cả users để kiểm tra events
        // CHÚ Ý: Cách này rất tốn chi phí đọc Firestore, chỉ nên dùng cho Admin
        for (const userDoc of usersSnap.docs) {
            const userId = userDoc.id;
            const eventsSnap = await getDocs(collection(db, 'users', userId, 'user_events'));
            
            eventsSnap.forEach((eventDoc) => {
                const e = eventDoc.data() as CalendarEvent;
                if (e.type === 'solar') {
                    if (e.day === d && e.month === m) eventCountToday++;
                } else {
                    if (e.day === lunar.day && e.month === lunar.month) eventCountToday++;
                }
            });
        }
        return { users: userCount, todayEvents: eventCountToday };
    } catch (e: any) {
        console.error("Error getting admin stats:", e);
        if (e.code === 'permission-denied') throw new Error('Missing or insufficient permissions.');
        throw e;
    }
}

export const getAllUsers = async (): Promise<User[]> => {
    if (!db) return [];
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users: User[] = [];
        usersSnap.forEach(doc => {
            const data = doc.data();
            users.push({
                id: doc.id,
                email: data.email || 'N/A',
                name: data.name || 'Người dùng',
                role: data.role || 'user',
                dateOfBirth: data.dateOfBirth,
                phoneNumber: data.phoneNumber,
                createdAt: data.createdAt 
            });
        });
        return users;
    } catch (e) {
        console.error("Error getting all users:", e);
        return [];
    }
}

// --- ADMIN: SYSTEM BANNER (LIST) ---
export const subscribeToBanners = (callback: (banners: SystemBanner[]) => void) => {
    if (!db) return () => {};
    try {
        const q = query(collection(db, 'system_banners'), where('active', '==', true), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const banners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemBanner));
            callback(banners);
        }, (error) => {
            console.error("Banner subscription error:", error);
        });
    } catch (e) {
        console.error("Setup banner listener failed:", e);
        return () => {};
    }
}

export const getAllBanners = async (): Promise<SystemBanner[]> => {
    if (!db) return [];
    try {
        const snap = await getDocs(query(collection(db, 'system_banners'), orderBy('createdAt', 'desc')));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemBanner));
    } catch (e) { return []; }
}

export const addSystemBanner = async (banner: Partial<SystemBanner>): Promise<boolean> => {
    if (!db) return false;
    try {
        await addDoc(collection(db, 'system_banners'), {
            ...banner,
            active: true,
            createdAt: new Date().toISOString()
        });
        return true;
    } catch (e) { return false; }
}

export const deleteSystemBanner = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'system_banners', id));
        return true;
    } catch (e) { return false; }
}

export const toggleSystemBanner = async (id: string, currentState: boolean): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'system_banners', id), { active: !currentState });
        return true;
    } catch (e) { return false; }
}

// --- ADMIN: PUSH CONFIGS (LIST) ---
export const getAllPushConfigs = async (): Promise<AdminPushConfig[]> => {
    if (!db) return [];
    try {
        const snap = await getDocs(query(collection(db, 'admin_push_configs'), orderBy('createdAt', 'desc')));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminPushConfig));
    } catch (e) { return []; }
}

export const addPushConfig = async (config: Partial<AdminPushConfig>): Promise<boolean> => {
    if (!db) return false;
    try {
        await addDoc(collection(db, 'admin_push_configs'), {
            ...config,
            isActive: true,
            createdAt: new Date().toISOString()
        });
        return true;
    } catch (e) { return false; }
}

export const deletePushConfig = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
        await deleteDoc(doc(db, 'admin_push_configs', id));
        return true;
    } catch (e) { return false; }
}

export const togglePushConfig = async (id: string, currentState: boolean): Promise<boolean> => {
    if (!db) return false;
    try {
        await updateDoc(doc(db, 'admin_push_configs', id), { isActive: !currentState });
        return true;
    } catch (e) { return false; }
}
