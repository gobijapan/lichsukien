

import { CAN, CHI, TIET_KHI, TRUC, GIO_HOANG_DAO_TABLE, NAP_AM } from '../constants';
import { LunarDate } from '../types';

/**
 * SOURCE: Ho Ngoc Duc's Algorithm
 * https://www.informatik.uni-leipzig.de/~duc/amlich/
 */

const PI = Math.PI;

function INT(d: number): number {
  return Math.floor(d);
}

function jdFromDate(dd: number, mm: number, yy: number): number {
  let a, y, m, jd;
  a = INT((14 - mm) / 12);
  y = yy + 4800 - a;
  m = mm + 12 * a - 3;
  jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  return jd;
}

function getNewMoonDay(k: number, timeZone: number): number {
  let T, T2, T3, dr, Jd1, M, Mpr, F, C1, deltat, JdNew;
  T = k / 1236.85;
  T2 = T * T;
  T3 = T2 * T;
  dr = PI / 180;
  Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  JdNew = Jd1 + C1 - deltat;
  return INT(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone: number): number {
  let T, T2, dr, M, L0, DL, L;
  T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  T2 = T * T;
  dr = PI / 180;
  M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  L = L0 + DL;
  L = L * dr;
  L = L - PI * 2 * (INT(L / (PI * 2)));
  return INT(L / PI * 6);
}

function getLunarMonth11(yy: number, timeZone: number): number {
  let k, off, nm, sunLong;
  off = jdFromDate(31, 12, yy) - 2415021;
  k = INT(off / 29.530588853);
  nm = getNewMoonDay(k, timeZone);
  sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  let k, last, arc, i;
  k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  last = 0;
  i = 1;
  arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export function convertSolar2LunarAlgorithm(dd: number, mm: number, yy: number, timeZone: number): number[] {
  let k, dayNumber, monthStart, a11, b11, lunarDay, lunarMonth, lunarYear, lunarLeap, diff, leapMonthDiff;
  dayNumber = jdFromDate(dd, mm, yy);
  k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  
  a11 = getLunarMonth11(yy, timeZone);
  b11 = a11;
  
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  
  lunarDay = dayNumber - monthStart + 1;
  diff = INT((monthStart - a11) / 29);
  lunarLeap = 0;
  lunarMonth = diff + 11;
  
  if (b11 - a11 > 365) {
    leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        lunarLeap = 1;
      }
    }
  }
  
  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  
  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

function getCanChi(canIdx: number, chiIdx: number): string {
  return `${CAN[canIdx % 10]} ${CHI[chiIdx % 12]}`;
}

export const getLunarDate = (date: Date): LunarDate => {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yy = date.getFullYear();
  const timeZone = 7; 

  const [lunarDay, lunarMonth, lunarYear, lunarLeap] = convertSolar2LunarAlgorithm(dd, mm, yy, timeZone);
  const jd = jdFromDate(dd, mm, yy);

  // Can Chi calculations
  const canDay = (jd + 9) % 10;
  const chiDay = (jd + 1) % 12;
  const dayName = getCanChi(canDay, chiDay);

  const canYear = (lunarYear + 6) % 10;
  const chiYear = (lunarYear + 8) % 12;
  const yearName = getCanChi(canYear, chiYear);

  const canMonth = (lunarYear * 12 + lunarMonth + 3) % 10;
  const chiMonth = (lunarMonth + 1) % 12;
  const monthName = getCanChi(canMonth, chiMonth);

  const sunLong = getSunLongitude(jd, timeZone); 
  const tietKhi = TIET_KHI[Math.floor((getSunLongitude(jd, 7) * 2 + (dd > 15 ? 1 : 0)) % 24)] || TIET_KHI[0];

  const zodiacHoursIndices = GIO_HOANG_DAO_TABLE[chiDay];
  const gioHoangDao = zodiacHoursIndices.map(idx => `${CHI[idx]} (${(idx * 2 + 23) % 24}h-${(idx * 2 + 1)})`);

  let n = 0;
  for(let i=0; i<60; i++) {
     if (CAN[(i % 10)] === CAN[canDay] && CHI[(i % 12)] === CHI[chiDay]) {
         n = i;
         break;
     }
  }
  const nguHanh = NAP_AM[n];

  let trucIdx = (chiDay - chiMonth + 12) % 12;
  const truc = TRUC[trucIdx];

  const STARS = [
    'Giác', 'Cang', 'Đê', 'Phòng', 'Tâm', 'Vĩ', 'Cơ', 
    'Đẩu', 'Ngưu', 'Nữ', 'Hư', 'Nguy', 'Thất', 'Bích', 
    'Khuê', 'Lâu', 'Vị', 'Mão', 'Tất', 'Chủy', 'Sâm', 
    'Tỉnh', 'Quỷ', 'Liễu', 'Tinh', 'Trương', 'Dực', 'Chẩn'
  ];
  // Modified offset from 10 to 11 to align correctly
  const sao = STARS[(jd + 11) % 28]; 

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: lunarLeap,
    jd,
    dayName,
    monthName,
    yearName,
    tietKhi,
    gioHoangDao,
    truc,
    sao,
    nguHanh,
    ngayHoangDao: true 
  };
};

/**
 * Searches for a Solar date that corresponds to the given Lunar date.
 * Since an inverse algorithm is complex, we iterate through Solar dates
 * in the estimated range.
 */
export const getSolarDateFromLunar = (lunarDay: number, lunarMonth: number, lunarYear: number): Date | null => {
  // Estimated start: Lunar New Year is usually Jan 20 - Feb 20.
  // Lunar year generally corresponds to Solar Year or Solar Year + 1 (for first months).
  // We can just iterate the whole year to be safe, or just check the estimated JD.
  
  // Start checking from Jan 1st of the requested lunar year (approx solar year)
  const startSolarYear = lunarYear; 
  // Loop through days in that year and next year (max 400 days iteration)
  
  const start = new Date(startSolarYear, 0, 1);
  const end = new Date(startSolarYear + 1, 1, 28); // Until Feb next year
  
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dd = d.getDate();
    const mm = d.getMonth() + 1;
    const yy = d.getFullYear();
    const [lDay, lMonth, lYear, lLeap] = convertSolar2LunarAlgorithm(dd, mm, yy, 7);
    
    // We ignore leap month distinction for simple conversion unless strictly needed.
    // If strict match needed, pass leap param.
    if (lDay === lunarDay && lMonth === lunarMonth && lYear === lunarYear) {
       return new Date(d);
    }
  }
  return null;
};
