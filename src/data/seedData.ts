import type { FoxPlannerState, Subject } from '../types/planner';

/**
 * Neutral general category only — no pre-populated homework, courses, fake study hours,
 * or sample notes so the user starts with a clean personal workspace.
 */
export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'subj-general', nameFa: 'عمومی و شخصی', nameEn: 'Personal & General', color: '#E8915E', icon: 'sparkles-outline' },
];

export const SUGGESTED_SUBJECT_PRESETS: Omit<Subject, 'id'>[] = [
  { nameFa: 'درس و دانشگاه', nameEn: 'University / Study', color: '#6AB8EA', icon: 'school-outline' },
  { nameFa: 'زبان انگلیسی', nameEn: 'Languages', color: '#52C49A', icon: 'language-outline' },
  { nameFa: 'پروژه و مهارت', nameEn: 'Projects & Skills', color: '#C4B5FD', icon: 'code-slash-outline' },
  { nameFa: 'ورزش و سلامت', nameEn: 'Health & Sport', color: '#EAB366', icon: 'fitness-outline' },
];

export function buildSeedState(): FoxPlannerState {
  return {
    version: 2,
    language: 'fa',
    theme: 'midnightSage',
    fontFamilyPreset: 'vazirmatn',
    fontScalePreset: 'md',
    soundStyle: 'crystal_kalimba',
    dailyGoalMinutes: 120,
    foxPoints: 0,
    hasCompletedOnboarding: false,
    celebrationSoundsEnabled: true,
    subjects: DEFAULT_SUBJECTS,
    tasks: [],
    notes: [],
    sessions: [],
    reminders: [],
    calendarEvents: [],
    moodLogs: [],
    pomodoroSettings: {
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      roundsBeforeLongBreak: 4,
      hapticsEnabled: true,
      soundCueEnabled: true,
    },
    security: {
      pinEnabled: false,
      pinSalt: '',
      pinHash: '',
      failedAttempts: 0,
      lockUntilEpoch: 0,
    },
    bookmarkedGuideIds: [],
    wellnessLogs: [],
  };
}
