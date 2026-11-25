export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface JalaliOccasion {
  jm: number;
  jd: number;
  titleFa: string;
  titleEn: string;
  tag: 'holiday' | 'student' | 'culture' | 'wellness';
}

export interface JalaliMonthCell {
  jy: number;
  jm: number;
  jd: number;
  dateKey: string; // Gregorian YYYY-MM-DD for matching tasks/reminders/events
  occasions: JalaliOccasion[];
}

export const JALALI_MONTH_NAMES_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const JALALI_WEEKDAYS_SHORT_FA = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/** Curated national, student, study, and cultural occasions on the Iranian Jalali calendar. */
export const IRAN_JALALI_OCCASIONS: JalaliOccasion[] = [
  { jm: 1, jd: 1, titleFa: 'عید نوروز و آغاز سال نو', titleEn: 'Nowruz (Persian New Year)', tag: 'holiday' },
  { jm: 1, jd: 12, titleFa: 'روز جمهوری اسلامی', titleEn: 'Islamic Republic Day', tag: 'holiday' },
  { jm: 1, jd: 13, titleFa: 'روز طبیعت (سیزده‌بدر)', titleEn: 'Nature Day (Sizdah Bedar)', tag: 'culture' },
  { jm: 2, jd: 1, titleFa: 'روز بزرگداشت سعدی', titleEn: 'Saadi Day', tag: 'culture' },
  { jm: 2, jd: 12, titleFa: 'روز معلم و استاد', titleEn: "Teachers' Day", tag: 'student' },
  { jm: 2, jd: 25, titleFa: 'روز پاسداشت زبان فارسی و فردوسی', titleEn: 'Ferdowsi & Persian Language Day', tag: 'culture' },
  { jm: 2, jd: 28, titleFa: 'روز بزرگداشت حکیم عمر خیام', titleEn: 'Omar Khayyam Day', tag: 'culture' },
  { jm: 3, jd: 14, titleFa: 'رحلت امام خمینی', titleEn: 'National Mourning Holiday', tag: 'holiday' },
  { jm: 3, jd: 15, titleFa: 'قیام ۱۵ خرداد', titleEn: '15 Khordad', tag: 'holiday' },
  { jm: 4, jd: 1, titleFa: 'آغاز تابستان (تیرگان)', titleEn: 'Start of Summer (Tirgan)', tag: 'culture' },
  { jm: 5, jd: 10, titleFa: 'جشن چله تابستان', titleEn: 'Mid-Summer Tradition', tag: 'culture' },
  { jm: 6, jd: 1, titleFa: 'روز پزشک و بزرگداشت ابوعلی سینا', titleEn: 'Avicenna & Doctors Day', tag: 'wellness' },
  { jm: 6, jd: 22, titleFa: 'روز برنامه‌نویس', titleEn: "Programmers' Day", tag: 'student' },
  { jm: 7, jd: 1, titleFa: 'آغاز پاییز و سال تحصیلی', titleEn: 'Start of Academic Year', tag: 'student' },
  { jm: 7, jd: 8, titleFa: 'روز بزرگداشت مولانا', titleEn: 'Rumi Commemoration Day', tag: 'culture' },
  { jm: 7, jd: 20, titleFa: 'روز بزرگداشت حافظ', titleEn: 'Hafez Commemoration Day', tag: 'culture' },
  { jm: 8, jd: 13, titleFa: 'روز دانش‌آموز', titleEn: "High School Students' Day", tag: 'student' },
  { jm: 8, jd: 24, titleFa: 'روز کتاب، کتاب‌خوانی و کتابدار', titleEn: 'Book & Reading Day', tag: 'student' },
  { jm: 9, jd: 16, titleFa: 'روز دانشجو', titleEn: "University Students' Day", tag: 'student' },
  { jm: 9, jd: 25, titleFa: 'روز پژوهش و فناوری', titleEn: 'Research & Technology Day', tag: 'student' },
  { jm: 9, jd: 30, titleFa: 'شب یلدا (طولانی‌ترین شب سال)', titleEn: 'Yalda Night', tag: 'culture' },
  { jm: 11, jd: 22, titleFa: 'پیروزی انقلاب اسلامی', titleEn: '22 Bahman', tag: 'holiday' },
  { jm: 12, jd: 5, titleFa: 'روز مهندس و خواجه نصیرالدین طوسی', titleEn: "Engineers' Day", tag: 'student' },
  { jm: 12, jd: 29, titleFa: 'روز ملی شدن صنعت نفت', titleEn: 'Oil Nationalization Day', tag: 'holiday' },
];

/** Exact algorithmic conversion from Gregorian to Iranian Jalali calendar. */
export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gdm[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

/** Exact algorithmic conversion from Iranian Jalali to Gregorian calendar. */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  let jy1 = jy + 1595;
  let days =
    -355668 +
    365 * jy1 +
    Math.floor(jy1 / 33) * 8 +
    Math.floor(((jy1 % 33) + 3) / 4) +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const salA = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (; gm < 13 && gd > salA[gm]; gm += 1) {
    gd -= salA[gm];
  }
  return { gy, gm, gd };
}

export function isJalaliLeapYear(jy: number): boolean {
  const mod = (((jy - 474) % 2820) + 2820) % 2820 + 474;
  return (((mod + 38) * 682) % 2816) < 682;
}

export function getJalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function jalaliToDateKey(jy: number, jm: number, jd: number): string {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

export function dateKeyToJalali(dateKey: string): JalaliDate {
  const [gy, gm, gd] = dateKey.split('-').map(Number);
  return gregorianToJalali(gy || 2026, gm || 11, gd || 25);
}

/** Builds a Jalali month grid with Saturday=0 offset so Persian calendar weeks align properly. */
export function buildJalaliMonthGrid(jy: number, jm: number): {
  leadingEmpty: number;
  cells: JalaliMonthCell[];
} {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, 1);
  const firstDate = new Date(gy, gm - 1, gd);
  // JS getDay(): Sun=0..Sat=6 -> Iranian week starts Sat=0..Fri=6
  const leadingEmpty = (firstDate.getDay() + 1) % 7;
  const daysCount = getJalaliMonthLength(jy, jm);

  const cells: JalaliMonthCell[] = [];
  for (let jd = 1; jd <= daysCount; jd += 1) {
    const occasions = IRAN_JALALI_OCCASIONS.filter((o) => o.jm === jm && o.jd === jd);
    cells.push({
      jy,
      jm,
      jd,
      dateKey: jalaliToDateKey(jy, jm, jd),
      occasions,
    });
  }
  return { leadingEmpty, cells };
}
