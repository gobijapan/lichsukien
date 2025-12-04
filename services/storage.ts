
import { CalendarEvent, AppSettings, LunarDate, User } from '../types';
import { HOLIDAYS_LUNAR, HOLIDAYS_SOLAR } from '../constants';
import { getLunarDate, getSolarDateFromLunar, convertSolar2LunarAlgorithm } from '../utils/lunar';
import { addDays, format, differenceInDays, startOfDay, isAfter } from 'date-fns';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore/lite';
import { db, auth } from './firebase';

const STORAGE_KEY_EVENTS = 'vnl_events';
const STORAGE_KEY_SETTINGS = 'vnl_settings';

export const saveEvent = async (event: CalendarEvent): Promise<void> => {
  // Local Save
  const current = getEvents();
  const index = current.findIndex(e => e.id === event.id);
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = event;
  } else {
    updated = [...current, event];
  }
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));

  // Hybrid Sync: Sync to Firestore immediately if logged in
  if (auth.currentUser) {
      try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), { events: updated }, { merge: true });
      } catch (e) {
          console.error("Auto-sync error:", e);
      }
  }

  return new Promise((resolve) => setTimeout(resolve, 100));
};

export const deleteEvent = async (id: string): Promise<void> => {
  // Local Save
  const current = getEvents();
  const updated = current.filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));

  // Hybrid Sync
  if (auth.currentUser) {
      try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), { events: updated }, { merge: true });
      } catch (e) {
          console.error("Auto-sync error:", e);
      }
  }

  return new Promise((resolve) => setTimeout(resolve, 100));
};

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

/**
 * Checks for any active reminders for TODAY.
 * Used for the Bell Icon in Month View and Today View badges.
 */
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

/**
 * Projects ALL upcoming reminders for the next 60 days.
 * Used for the Reminder Manager List.
 */
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

    // Iterate through next 60 days to find Event Occurrences
    for (let i = 0; i < lookAheadDays; i++) {
        const currentDate = addDays(today, i);
        const tDay = currentDate.getDate();
        const tMonth = currentDate.getMonth() + 1;
        const tLunar = getLunarDate(currentDate);

        // --- 1. System Events (Holiday/Lunar) Occurrence ---
        // Identify if 'currentDate' is a special day
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

        // For each System Event found on 'currentDate', calculate when the reminders should trigger
        systemEventsOnDate.forEach(sysEvt => {
            globalConfigs.forEach(conf => {
                let triggerDate = addDays(currentDate, -conf.daysBefore);
                triggerDate = setTime(triggerDate, conf.time); // APPLY CONFIG TIME

                // Only add if trigger date is in future or today (comparing time as well)
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

        // --- 2. User Events Occurrence ---
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
                // Check "At 7am"
                if (evt.reminderConfig.at7am) {
                    let triggerDate = currentDate;
                    triggerDate = setTime(triggerDate, '07:00'); // APPLY 7 AM

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
                
                // Check Custom Reminders
                if (evt.reminderConfig.customReminders) {
                    evt.reminderConfig.customReminders.forEach(cust => {
                         let triggerDate = addDays(currentDate, -cust.daysBefore);
                         triggerDate = setTime(triggerDate, cust.time); // APPLY CONFIG TIME

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

    // Sort by Trigger Date then Time
    remindersList.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());

    return remindersList;
}

// Helper to set time string HH:mm to date
const setTime = (date: Date, timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(h);
    newDate.setMinutes(m);
    return newDate;
}

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
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

// --- FIRESTORE BACKUP & RESTORE ---

export const getBackupInfo = async (userId: string) => {
  try {
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
  try {
    const events = getEvents();
    const settings = getSettings();
    
    const dataToBackup = {
      events,
      settings,
      lastBackup: new Date().toISOString()
    };
    
    // Save to Firestore under users/{userId}
    await setDoc(doc(db, 'users', userId), dataToBackup, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Backup error:", error);
    return false;
  }
}

export const restoreData = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      if (data.events) {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(data.events));
      }
      if (data.settings) {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data.settings));
      }
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Restore error:", error);
    return false;
  }
}

// --- USER PROFILE STORAGE ---

export const saveUserProfile = async (userId: string, data: Partial<User>) => {
  try {
     // Only save profile fields
     const { name, dateOfBirth, phoneNumber, address } = data;
     const payload: any = {};
     if (name !== undefined) payload.name = name;
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
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
       const data = docSnap.data();
       return {
          name: data.name,
          role: data.role || 'user', // Fetch role here
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
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const userCount = usersSnap.size;
        
        let eventCountToday = 0;
        const today = new Date();
        const d = today.getDate();
        const m = today.getMonth() + 1;
        const lunar = getLunarDate(today);

        usersSnap.forEach((doc) => {
            const data = doc.data();
            const events = data.events as CalendarEvent[] || [];
            
            // Count matching events
            events.forEach(e => {
                if (e.type === 'solar') {
                    if (e.day === d && e.month === m) eventCountToday++;
                } else {
                    if (e.day === lunar.day && e.month === lunar.month) eventCountToday++;
                }
            });
        });

        return {
            users: userCount,
            todayEvents: eventCountToday
        };
    } catch (e: any) {
        console.error("Error getting admin stats:", e);
        if (e.code === 'permission-denied') throw new Error('Missing or insufficient permissions.');
        throw e;
    }
}
