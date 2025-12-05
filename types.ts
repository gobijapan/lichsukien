
export interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string;
  type: 'solar' | 'lunar';
  day: number;
  month: number;
  isRecurring: boolean;
  category: 'anniversary' | 'birthday' | 'holiday' | 'other';
  details?: string;
  location?: string;
  originalYear?: number; 
  reminderConfig?: {
    at7am: boolean;
    customReminders?: {
      id: string;
      daysBefore: number;
      time: string; 
      note?: string; 
    }[];
  };
  isSystem?: boolean; 
  displayDate?: string; 
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: number;
  jd: number;
  dayName: string;
  monthName: string;
  yearName: string;
  tietKhi: string;
  gioHoangDao: string[];
  truc: string;
  sao: string;
  nguHanh: string;
  ngayHoangDao: boolean;
}

export interface GlobalReminderConfig {
  daysBefore: number;
  time: string;
}

export interface ReminderSettings {
  enabled: boolean;
  lunar15_1: boolean;
  solarHolidays: boolean;
  lunarHolidays: boolean;
  defaultReminders: GlobalReminderConfig[]; 
}

export interface AppSettings {
  bgId: string;
  customBg?: string; 
  font: string; 
  darkMode: boolean;
  primaryColor: string; 
  weekStart: 'monday' | 'sunday';
  reminderSettings: ReminderSettings;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: string;
}

// NEW: System Banner (Loa Phường) as List Item
export interface SystemBanner {
  id: string;
  content: string;
  type: 'info' | 'warning' | 'error';
  isActive: boolean;
  createdAt: string;
}

// NEW: Admin Push Configuration
export interface AdminPushConfig {
  id: string;
  title: string;
  body: string;
  time: string; // HH:mm (15 min interval)
  frequency: 'once' | 'daily';
  isActive: boolean; // Checkbox to enable/disable
  lastSent?: string;
  createdAt: string;
}

export type TabType = 'today' | 'month' | 'events' | 'settings' | 'admin';
