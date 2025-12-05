
export interface CalendarEvent {
  id: string;
  title: string;
  dateStr: string;
  type: 'solar' | 'lunar';
  day: number;
  month: number;
  isRecurring: boolean;
  category: 'anniversary' | 'birthday' | 'holiday' | 'other';
  // Advanced Fields
  details?: string;
  location?: string;
  originalYear?: number; // For anniversary calculation
  reminderConfig?: {
    at7am: boolean;
    customReminders?: {
      id: string;
      daysBefore: number;
      time: string; // HH:mm
      note?: string; // Limit 300 chars
    }[];
  };
  // UI Helpers (Computed)
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
  time: string; // HH:mm
}

export interface ReminderSettings {
  enabled: boolean;
  lunar15_1: boolean; // Rằm & Mùng 1
  solarHolidays: boolean;
  lunarHolidays: boolean;
  // Replaced single alertTime with multiple configs
  defaultReminders: GlobalReminderConfig[]; 
}

export interface AppSettings {
  bgId: string;
  customBg?: string; // Base64 string for user uploaded image
  font: string; // key from FONTS
  darkMode: boolean;
  primaryColor: string; // Hex code
  weekStart: 'monday' | 'sunday';
  reminderSettings: ReminderSettings;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name: string;
  // Extended Profile
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: string; // Added for Admin view
}

// Old Single Alert (Deprecated but kept for type compatibility if needed)
export interface SystemAlert {
  active: boolean;
  content: string;
  type: 'info' | 'warning' | 'error';
  updatedAt?: string;
}

// New List-based Banner
export interface SystemBanner {
  id: string;
  content: string;
  type: 'info' | 'warning' | 'error';
  isActive: boolean;
  createdAt: string;
}

// Admin Push Configuration
export interface AdminPushConfig {
  id: string;
  title: string;
  body: string;
  time: string; // HH:mm (15-min interval)
  frequency: 'once' | 'daily';
  isActive: boolean;
  createdAt: string;
  lastSent?: string;
}

export interface SystemNotification {
  id?: string;
  title: string;
  body: string;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

export type TabType = 'today' | 'month' | 'events' | 'settings' | 'admin';
