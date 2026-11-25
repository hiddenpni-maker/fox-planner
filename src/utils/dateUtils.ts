import type { LanguageCode } from '../types/planner';
import { localizeDigits } from '../i18n/translations';

/** Converts a Date object into a local YYYY-MM-DD key without UTC timezone drift. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Shifts a YYYY-MM-DD key by deltaDays in local calendar time. */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + deltaDays);
  return toDateKey(dt);
}

/** Returns an array of local YYYY-MM-DD keys ending on `endDateKey`. */
export function getTrailingDateKeys(days: number, endDateKey: string = toDateKey()): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    out.push(shiftDateKey(endDateKey, -i));
  }
  return out;
}

/** Returns a 7-day window centered around selectedDateKey (or week strip). */
export function getWeekStripKeys(anchorDateKey: string = toDateKey()): string[] {
  const out: string[] = [];
  for (let offset = -2; offset <= 4; offset += 1) {
    out.push(shiftDateKey(anchorDateKey, offset));
  }
  return out;
}

const WEEKDAYS_FA = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
const WEEKDAYS_SHORT_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
const WEEKDAYS_SHORT_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Formats weekday & day-of-month badge cleanly across FA/EN without fragile Intl locale gaps. */
export function formatDateChip(dateKey: string, lang: LanguageCode): { weekday: string; dayNum: string; full: string } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const dow = dt.getDay();
  if (lang === 'fa') {
    let dayNum = String(d);
    let full = `${WEEKDAYS_FA[dow]} ${m}/${d}`;
    try {
      const jalaliDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(dt);
      const jalaliFull = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(dt);
      dayNum = jalaliDay;
      full = jalaliFull;
    } catch {
      dayNum = localizeDigits(d, 'fa');
    }
    return {
      weekday: WEEKDAYS_SHORT_FA[dow] ?? '',
      dayNum,
      full,
    };
  }
  return {
    weekday: WEEKDAYS_SHORT_EN[dow] ?? '',
    dayNum: String(d),
    full: dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  };
}
