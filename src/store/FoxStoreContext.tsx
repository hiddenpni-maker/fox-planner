import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import {
  Vazirmatn_400Regular,
  Vazirmatn_500Medium,
  Vazirmatn_700Bold,
  Vazirmatn_800ExtraBold,
} from '@expo-google-fonts/vazirmatn';
import {
  BalooBhaijaan2_400Regular,
  BalooBhaijaan2_500Medium,
  BalooBhaijaan2_700Bold,
  BalooBhaijaan2_800ExtraBold,
} from '@expo-google-fonts/baloo-bhaijaan-2';
import { Lalezar_400Regular } from '@expo-google-fonts/lalezar';
import {
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_700Bold,
} from '@expo-google-fonts/readex-pro';
import type { CelebrationBannerData } from '../components/FoxCelebrationToast';
import { buildSeedState } from '../data/seedData';
import { STRINGS } from '../i18n/translations';
import { getTheme, type FoxTheme } from '../theme/tokens';
import type {
  CalendarEvent,
  FontFamilyPreset,
  FontScalePreset,
  FoxPlannerState,
  LanguageCode,
  MoodEntry,
  NoteItem,
  PomodoroPhase,
  PomodoroSettings,
  ReminderItem,
  SoundStyleId,
  StudySession,
  Subject,
  TabKey,
  TaskItem,
  ThemePresetId,
} from '../types/planner';
import { toDateKey } from '../utils/dateUtils';
import { cancelDeviceReminder, scheduleDeviceReminder } from '../utils/notifications';
import { createPinRecord, parseAndValidateBackup, verifyPinRecord } from '../utils/security';
import { playCelebrationSound, type SoundCueKind, triggerHaptic } from '../utils/soundEffects';

const STORAGE_KEY = '@fox_planner_state_v2';
const LEGACY_STORAGE_KEY = '@fox_planner_state_v1';

export interface PomodoroRuntime {
  phase: PomodoroPhase;
  isRunning: boolean;
  secondsLeft: number;
  totalPhaseSeconds: number;
  roundNumber: number;
  linkedTaskId?: string;
  linkedSubjectId: string;
  distractionsCount: number;
  lastCompletedPhase: PomodoroPhase | null;
}

export type PlannerSectionKey = 'tasks' | 'calendar' | 'reminders';
export type WellnessSectionKey = 'guides' | 'habits' | 'breathing';

interface FoxStoreContextValue {
  hydrated: boolean;
  locked: boolean;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  plannerSection: PlannerSectionKey;
  setPlannerSection: (section: PlannerSectionKey) => void;
  wellnessSection: WellnessSectionKey;
  setWellnessSection: (section: WellnessSectionKey) => void;
  settingsMenuOpen: boolean;
  setSettingsMenuOpen: (open: boolean) => void;
  state: FoxPlannerState;
  theme: FoxTheme;
  strings: (typeof STRINGS)[LanguageCode];
  isRTL: boolean;
  pomodoro: PomodoroRuntime;
  celebration: CelebrationBannerData | null;
  dismissCelebration: () => void;
  activeReminderAlert: ReminderItem | null;
  dismissReminderAlert: () => void;

  // Preferences & Onboarding
  fontsReady: boolean;
  setLanguage: (lang: LanguageCode) => void;
  setThemePreset: (preset: ThemePresetId) => void;
  setFontFamilyPreset: (preset: FontFamilyPreset) => void;
  setFontScalePreset: (scale: FontScalePreset) => void;
  setSoundStyle: (style: SoundStyleId) => void;
  toggleTheme: () => void;
  toggleCelebrationSounds: () => void;
  setDailyGoalMinutes: (minutes: number) => void;
  completeOnboarding: () => void;
  reopenOnboarding: () => void;

  // Tasks & Subjects
  upsertTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'completedPomodoros'> & { id?: string; completedPomodoros?: number }) => void;
  toggleTaskComplete: (taskId: string) => void;
  toggleSubtaskComplete: (taskId: string, subtaskId: string) => void;
  deleteTask: (taskId: string) => void;
  addSubject: (name: string, color: string, icon: string) => void;
  deleteSubject: (subjectId: string) => void;

  // Notes
  upsertNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  togglePinNote: (noteId: string) => void;
  deleteNote: (noteId: string) => void;

  // Reminders & Calendar Events & Daily Mood
  upsertReminder: (input: Omit<ReminderItem, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  toggleReminderEnabled: (reminderId: string) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  snoozeReminder: (reminderId: string, minutes: number) => void;
  addCalendarEvent: (dateKey: string, title: string, category: CalendarEvent['category'], note?: string) => void;
  deleteCalendarEvent: (eventId: string) => void;
  submitDailyMood: (score: 1 | 2 | 3 | 4 | 5, emoji: string, labelFa: string, labelEn: string, note?: string) => void;

  // Pomodoro controls
  startPomodoroForTask: (task: TaskItem) => void;
  selectPomodoroLink: (taskId?: string, subjectId?: string) => void;
  setPomodoroPhase: (phase: PomodoroPhase) => void;
  togglePomodoroRunning: () => void;
  resetPomodoro: () => void;
  completeCurrentPhase: (logSession?: boolean) => void;
  incrementDistraction: () => void;
  updatePomodoroSettings: (next: PomodoroSettings) => void;

  // Wellness & Security
  toggleGuideBookmark: (guideId: string) => void;
  toggleDailyHabit: (habitId: string, dateKey?: string) => void;
  configurePin: (pin: string) => Promise<void>;
  disablePin: () => void;
  unlockWithPin: (pin: string) => Promise<{ ok: boolean; remainingWaitSec: number }>;
  lockNow: () => void;
  exportBackupJson: () => string;
  importBackupJson: (rawJson: string) => boolean;
  resetAllData: () => void;
}

export const FoxStoreContext = createContext<FoxStoreContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function getPhaseDurationSec(phase: PomodoroPhase, settings: PomodoroSettings): number {
  if (phase === 'shortBreak') return Math.max(1, settings.shortBreakMinutes) * 60;
  if (phase === 'longBreak') return Math.max(1, settings.longBreakMinutes) * 60;
  return Math.max(1, settings.focusMinutes) * 60;
}

export function FoxStoreProvider({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_500Medium,
    Vazirmatn_700Bold,
    Vazirmatn_800ExtraBold,
    BalooBhaijaan2_400Regular,
    BalooBhaijaan2_500Medium,
    BalooBhaijaan2_700Bold,
    BalooBhaijaan2_800ExtraBold,
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_700Bold,
    Lalezar_400Regular,
  });
  const fontsReady = Boolean(fontsLoaded);

  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<FoxPlannerState>(() => buildSeedState());
  const [locked, setLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('planner');
  const [plannerSection, setPlannerSection] = useState<PlannerSectionKey>('tasks');
  const [wellnessSection, setWellnessSection] = useState<WellnessSectionKey>('guides');
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationBannerData | null>(null);
  const [activeReminderAlert, setActiveReminderAlert] = useState<ReminderItem | null>(null);

  const [pomodoro, setPomodoro] = useState<PomodoroRuntime>(() => {
    const initial = buildSeedState();
    const sec = getPhaseDurationSec('focus', initial.pomodoroSettings);
    return {
      phase: 'focus',
      isRunning: false,
      secondsLeft: sec,
      totalPhaseSeconds: sec,
      roundNumber: 1,
      linkedSubjectId: initial.subjects[0].id,
      distractionsCount: 0,
      lastCompletedPhase: null,
    };
  });

  const targetEndRef = useRef<number | null>(null);
  const completingRef = useRef(false);

  const triggerReward = useCallback(
    (titleFa: string, titleEn: string, subFa: string, subEn: string, points: number, soundKind: SoundCueKind) => {
      setState((s) => {
        const nextPts = s.foxPoints + points;
        const lang = s.language;
        playCelebrationSound(soundKind, s.celebrationSoundsEnabled, s.soundStyle);
        setCelebration({
          id: makeId('cel'),
          title: lang === 'fa' ? titleFa : titleEn,
          subtitle: lang === 'fa' ? subFa : subEn,
          pointsEarned: points,
        });
        return { ...s, foxPoints: nextPts };
      });
    },
    []
  );

  // Hydrate persisted workspace (v2 or migrate v1 cleanly)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = (await AsyncStorage.getItem(STORAGE_KEY)) ?? (await AsyncStorage.getItem(LEGACY_STORAGE_KEY));
        if (raw && mounted) {
          const validated = parseAndValidateBackup(raw);
          if (validated) {
            setState(validated);
            if (validated.security.pinEnabled) {
              setLocked(true);
            }
            const sec = getPhaseDurationSec('focus', validated.pomodoroSettings);
            setPomodoro((prev) => ({
              ...prev,
              secondsLeft: sec,
              totalPhaseSeconds: sec,
              linkedSubjectId: validated.subjects[0]?.id ?? prev.linkedSubjectId,
            }));
          }
        }
      } catch {
        // Fallback to clean seed workspace.
      } finally {
        if (mounted) setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist changes locally
  useEffect(() => {
    if (!hydrated) return;
    const handle = setTimeout(() => {
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 150);
    return () => clearTimeout(handle);
  }, [state, hydrated]);

  // Foreground smart reminder watcher (delivers playful Fox banner & audio even on Web/Expo Go)
  useEffect(() => {
    if (!hydrated || locked) return;
    const checkReminders = () => {
      const now = new Date();
      const today = toDateKey(now);
      const curHour = now.getHours();
      const curMin = now.getMinutes();
      const slotKey = `${today}_${String(curHour).padStart(2, '0')}:${String(curMin).padStart(2, '0')}`;

      setState((prev) => {
        let matched: ReminderItem | null = null;
        let changed = false;
        const updated = prev.reminders.map((rem) => {
          if (!rem.enabled) return rem;
          const snoozedDue = rem.snoozedUntil && Date.now() >= rem.snoozedUntil;
          const scheduledMatch =
            rem.hour === curHour &&
            rem.minute === curMin &&
            rem.lastTriggeredKey !== slotKey &&
            (rem.repeat === 'daily' ||
              rem.dateKey === today ||
              (rem.repeat === 'weekly' && new Date(rem.dateKey).getDay() === now.getDay()));

          if (!matched && (snoozedDue || scheduledMatch)) {
            matched = rem;
            changed = true;
            return {
              ...rem,
              lastTriggeredKey: slotKey,
              snoozedUntil: undefined,
              enabled: rem.repeat === 'once' ? false : rem.enabled,
            };
          }
          return rem;
        });

        if (matched) {
          setActiveReminderAlert(matched);
          playCelebrationSound('reminder', prev.celebrationSoundsEnabled, prev.soundStyle);
        }
        return changed ? { ...prev, reminders: updated } : prev;
      });
    };

    checkReminders();
    const timer = setInterval(checkReminders, 12000);
    return () => clearInterval(timer);
  }, [hydrated, locked]);

  const finishPhaseInternal = useCallback(
    (logSession: boolean) => {
      if (completingRef.current) return;
      completingRef.current = true;
      targetEndRef.current = null;

      setPomodoro((prev) => {
        const finishedPhase = prev.phase;
        if (logSession && finishedPhase === 'focus') {
          const minutes = Math.max(1, Math.round(prev.totalPhaseSeconds / 60));
          const now = Date.now();
          const newSession: StudySession = {
            id: makeId('ses'),
            dateKey: toDateKey(new Date(now)),
            subjectId: prev.linkedSubjectId,
            taskId: prev.linkedTaskId,
            phase: 'focus',
            durationMinutes: minutes,
            completedAt: now,
          };
          setState((s) => ({
            ...s,
            sessions: [newSession, ...s.sessions],
            tasks: s.tasks.map((t) =>
              t.id === prev.linkedTaskId
                ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
                : t
            ),
          }));
          triggerReward(
            'آفرین قهرمان! یک پومودورو کامل شد 🍅',
            'Awesome Focus! Pomodoro Completed 🍅',
            'حالا با خیال راحت یک استراحت کوتاه و واقعی بردار.',
            'Now take a calm, screen-free breather!',
            25,
            'pomodoro'
          );
        } else if (logSession) {
          playCelebrationSound('mood', state.celebrationSoundsEnabled && state.pomodoroSettings.soundCueEnabled);
        }

        const roundsCap = Math.max(1, state.pomodoroSettings.roundsBeforeLongBreak);
        let nextPhase: PomodoroPhase = 'focus';
        let nextRound = prev.roundNumber;

        if (finishedPhase === 'focus') {
          nextPhase = prev.roundNumber >= roundsCap ? 'longBreak' : 'shortBreak';
        } else {
          nextPhase = 'focus';
          nextRound = finishedPhase === 'longBreak' ? 1 : prev.roundNumber + 1;
        }

        const nextSec = getPhaseDurationSec(nextPhase, state.pomodoroSettings);
        return {
          ...prev,
          phase: nextPhase,
          isRunning: false,
          secondsLeft: nextSec,
          totalPhaseSeconds: nextSec,
          roundNumber: nextRound,
          lastCompletedPhase: logSession ? finishedPhase : prev.lastCompletedPhase,
        };
      });

      setTimeout(() => {
        completingRef.current = false;
      }, 50);
    },
    [state.pomodoroSettings, state.celebrationSoundsEnabled, triggerReward]
  );

  useEffect(() => {
    if (!pomodoro.isRunning) {
      targetEndRef.current = null;
      return;
    }
    if (!targetEndRef.current) {
      targetEndRef.current = Date.now() + pomodoro.secondsLeft * 1000;
    }
    const timer = setInterval(() => {
      const target = targetEndRef.current;
      if (!target) return;
      const remaining = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      if (remaining <= 0) {
        clearInterval(timer);
        finishPhaseInternal(true);
      } else {
        setPomodoro((prev) => (prev.secondsLeft === remaining ? prev : { ...prev, secondsLeft: remaining }));
      }
    }, 400);
    return () => clearInterval(timer);
  }, [pomodoro.isRunning, pomodoro.secondsLeft, finishPhaseInternal]);

  const setLanguage = useCallback((language: LanguageCode) => {
    setState((s) => ({ ...s, language }));
  }, []);

  const setThemePreset = useCallback((themePreset: ThemePresetId) => {
    void triggerHaptic('light');
    setState((s) => ({ ...s, theme: themePreset }));
  }, []);

  const setFontFamilyPreset = useCallback((fontFamilyPreset: FontFamilyPreset) => {
    void triggerHaptic('light');
    setState((s) => ({ ...s, fontFamilyPreset }));
  }, []);

  const setFontScalePreset = useCallback((fontScalePreset: FontScalePreset) => {
    void triggerHaptic('light');
    setState((s) => ({ ...s, fontScalePreset }));
  }, []);

  const setSoundStyle = useCallback((soundStyle: SoundStyleId) => {
    void triggerHaptic('light');
    setState((s) => ({ ...s, soundStyle }));
  }, []);

  const toggleTheme = useCallback(() => {
    const order: ThemePresetId[] = [
      'midnightSage',
      'warmPaper',
      'forestFox',
      'moonlit',
      'sakuraBlossom',
      'matchaCalm',
      'candyPop',
    ];
    setState((s) => {
      const curIdx = order.indexOf(s.theme);
      const next = order[(curIdx + 1) % order.length];
      return { ...s, theme: next };
    });
  }, []);

  const toggleCelebrationSounds = useCallback(() => {
    setState((s) => ({ ...s, celebrationSoundsEnabled: !s.celebrationSoundsEnabled }));
  }, []);

  const setDailyGoalMinutes = useCallback((dailyGoalMinutes: number) => {
    const clamped = Math.min(720, Math.max(15, Math.round(dailyGoalMinutes)));
    setState((s) => ({ ...s, dailyGoalMinutes: clamped }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((s) => ({ ...s, hasCompletedOnboarding: true }));
  }, []);

  const reopenOnboarding = useCallback(() => {
    setState((s) => ({ ...s, hasCompletedOnboarding: false }));
  }, []);

  const upsertTask = useCallback(
    (input: Omit<TaskItem, 'id' | 'createdAt' | 'completedPomodoros'> & { id?: string; completedPomodoros?: number }) => {
      void triggerHaptic('light');
      const isNew = !input.id;
      setState((s) => {
        if (input.id) {
          return { ...s, tasks: s.tasks.map((t) => (t.id === input.id ? { ...t, ...input } : t)) };
        }
        const created: TaskItem = {
          ...input,
          id: makeId('task'),
          createdAt: Date.now(),
          completedPomodoros: input.completedPomodoros ?? 0,
        };
        return { ...s, tasks: [created, ...s.tasks] };
      });
      if (isNew) {
        triggerReward(
          'برنامه‌ی جدید با موفقیت ثبت شد ✨',
          'New Study Plan Added ✨',
          'قدم به قدم، منظم‌تر از همیشه پیش می‌ریم!',
          'Step by step, your study flow is taking shape!',
          5,
          'mood'
        );
      }
    },
    [triggerReward]
  );

  const toggleTaskComplete = useCallback(
    (taskId: string) => {
      let becomingDone = false;
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId) return t;
          becomingDone = !t.completed;
          return {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? Date.now() : undefined,
          };
        }),
      }));
      if (becomingDone) {
        triggerReward(
          'ایول! یک تسک را کامل کردی 🎉',
          'Way to go! Task Completed 🎉',
          'روباه به اراده‌ات افتخار می‌کنه 🦊✨',
          'Your Fox buddy is cheering for your consistency!',
          15,
          'task'
        );
      }
    },
    [triggerReward]
  );

  const toggleSubtaskComplete = useCallback(
    (taskId: string, subtaskId: string) => {
      let becomingDone = false;
      setState((s) => ({
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: t.subtasks.map((st) => {
                  if (st.id !== subtaskId) return st;
                  becomingDone = !st.completed;
                  return { ...st, completed: !st.completed };
                }),
              }
            : t
        ),
      }));
      if (becomingDone) {
        triggerReward(
          'عالی! یک مرحله جلو رفتی 🌱',
          'Step Checked Off 🌱',
          'پیشرفت‌های کوچک، نتیجه‌های بزرگ می‌سازن!',
          'Small steps compound into mastery!',
          5,
          'mood'
        );
      }
    },
    [triggerReward]
  );

  const deleteTask = useCallback((taskId: string) => {
    void triggerHaptic('warning');
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== taskId) }));
    setPomodoro((p) => (p.linkedTaskId === taskId ? { ...p, linkedTaskId: undefined } : p));
  }, []);

  const addSubject = useCallback((name: string, color: string, icon: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const subj: Subject = {
      id: makeId('subj'),
      nameFa: trimmed,
      nameEn: trimmed,
      color,
      icon,
    };
    setState((s) => ({ ...s, subjects: [...s.subjects, subj] }));
  }, []);

  const deleteSubject = useCallback((subjectId: string) => {
    setState((s) => {
      if (s.subjects.length <= 1) return s;
      const remaining = s.subjects.filter((sub) => sub.id !== subjectId);
      const fallbackId = remaining[0].id;
      return {
        ...s,
        subjects: remaining,
        tasks: s.tasks.map((t) => (t.subjectId === subjectId ? { ...t, subjectId: fallbackId } : t)),
        notes: s.notes.map((n) => (n.subjectId === subjectId ? { ...n, subjectId: fallbackId } : n)),
      };
    });
  }, []);

  const upsertNote = useCallback(
    (input: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const isNew = !input.id;
      const now = Date.now();
      setState((s) => {
        if (input.id) {
          return { ...s, notes: s.notes.map((n) => (n.id === input.id ? { ...n, ...input, updatedAt: now } : n)) };
        }
        const created: NoteItem = { ...input, id: makeId('note'), createdAt: now, updatedAt: now };
        return { ...s, notes: [created, ...s.notes] };
      });
      if (isNew) {
        triggerReward(
          'جزوه جدید با موفقیت ذخیره شد 📓',
          'Study Note Saved 📓',
          'ثبت نکات، حافظه بلندمدت را تقویت می‌کنه!',
          'Capturing key notes sharpens long-term recall!',
          10,
          'task'
        );
      }
    },
    [triggerReward]
  );

  const togglePinNote = useCallback((noteId: string) => {
    void triggerHaptic('light');
    setState((s) => ({ ...s, notes: s.notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n)) }));
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    void triggerHaptic('warning');
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== noteId) }));
  }, []);

  const upsertReminder = useCallback(
    async (input: Omit<ReminderItem, 'id' | 'createdAt'> & { id?: string }) => {
      const draft: ReminderItem = {
        ...input,
        id: input.id ?? makeId('rem'),
        createdAt: Date.now(),
      };
      const notifId = await scheduleDeviceReminder(draft, state.language);
      const saved: ReminderItem = { ...draft, notificationId: notifId };

      setState((s) => {
        const exists = s.reminders.some((r) => r.id === saved.id);
        return {
          ...s,
          reminders: exists
            ? s.reminders.map((r) => (r.id === saved.id ? saved : r))
            : [saved, ...s.reminders],
        };
      });

      triggerReward(
        'اعلان هوشمند تنظیم شد ⏰🦊',
        'Smart Reminder Set ⏰🦊',
        'سر ساعت با پیام بامزه‌ی روباه بهت یادآوری می‌کنم!',
        'Your Fox buddy will cheerfully nudge you on time!',
        5,
        'mood'
      );
    },
    [state.language, triggerReward]
  );

  const toggleReminderEnabled = useCallback(
    async (reminderId: string) => {
      const target = state.reminders.find((r) => r.id === reminderId);
      if (!target) return;
      const nextEnabled = !target.enabled;
      let notifId: string | undefined;
      if (nextEnabled) {
        notifId = await scheduleDeviceReminder({ ...target, enabled: true }, state.language);
      } else {
        await cancelDeviceReminder(target.notificationId);
      }
      setState((s) => ({
        ...s,
        reminders: s.reminders.map((r) =>
          r.id === reminderId ? { ...r, enabled: nextEnabled, notificationId: notifId } : r
        ),
      }));
    },
    [state.reminders, state.language]
  );

  const deleteReminder = useCallback(
    async (reminderId: string) => {
      const target = state.reminders.find((r) => r.id === reminderId);
      if (target?.notificationId) {
        await cancelDeviceReminder(target.notificationId);
      }
      setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== reminderId) }));
    },
    [state.reminders]
  );

  const snoozeReminder = useCallback((reminderId: string, minutes: number) => {
    const snoozedUntil = Date.now() + minutes * 60_000;
    setState((s) => ({
      ...s,
      reminders: s.reminders.map((r) =>
        r.id === reminderId ? { ...r, enabled: true, snoozedUntil } : r
      ),
    }));
    setActiveReminderAlert(null);
  }, []);

  const addCalendarEvent = useCallback(
    (dateKey: string, title: string, category: CalendarEvent['category'], note?: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const ev: CalendarEvent = { id: makeId('ev'), dateKey, title: trimmed, category, note };
      setState((s) => ({ ...s, calendarEvents: [ev, ...s.calendarEvents] }));
      triggerReward(
        'رویداد تقویم ثبت شد 📅',
        'Calendar Event Added 📅',
        'دیگه هیچ مناسبت یا امتحانی از قلم نمی‌افته!',
        'Pinned cleanly on your Fox calendar!',
        5,
        'mood'
      );
    },
    [triggerReward]
  );

  const deleteCalendarEvent = useCallback((eventId: string) => {
    setState((s) => ({ ...s, calendarEvents: s.calendarEvents.filter((e) => e.id !== eventId) }));
  }, []);

  const submitDailyMood = useCallback(
    (score: 1 | 2 | 3 | 4 | 5, emoji: string, labelFa: string, labelEn: string, note?: string) => {
      const todayKey = toDateKey();
      const entry: MoodEntry = {
        dateKey: todayKey,
        score,
        emoji,
        labelFa,
        labelEn,
        note: note?.trim() || undefined,
        createdAt: Date.now(),
      };
      setState((s) => ({
        ...s,
        moodLogs: [entry, ...s.moodLogs.filter((m) => m.dateKey !== todayKey)],
      }));
      triggerReward(
        `حال امروزت ثبت شد (${emoji})`,
        `Today's Mood Logged (${emoji})`,
        'ممنون که با خودت مهربانی؛ روباه همراهته 🦊',
        'Great self-awareness—let’s pace today smoothly!',
        10,
        'mood'
      );
    },
    [triggerReward]
  );

  const startPomodoroForTask = useCallback(
    (task: TaskItem) => {
      targetEndRef.current = null;
      const sec = getPhaseDurationSec('focus', state.pomodoroSettings);
      setPomodoro((prev) => ({
        ...prev,
        phase: 'focus',
        isRunning: true,
        secondsLeft: sec,
        totalPhaseSeconds: sec,
        linkedTaskId: task.id,
        linkedSubjectId: task.subjectId,
        lastCompletedPhase: null,
      }));
      setActiveTab('pomodoro');
      void triggerHaptic('medium');
    },
    [state.pomodoroSettings]
  );

  const selectPomodoroLink = useCallback(
    (taskId?: string, subjectId?: string) => {
      const task = state.tasks.find((t) => t.id === taskId);
      setPomodoro((prev) => ({
        ...prev,
        linkedTaskId: taskId,
        linkedSubjectId: task?.subjectId ?? subjectId ?? prev.linkedSubjectId,
      }));
    },
    [state.tasks]
  );

  const setPomodoroPhase = useCallback(
    (phase: PomodoroPhase) => {
      targetEndRef.current = null;
      const sec = getPhaseDurationSec(phase, state.pomodoroSettings);
      setPomodoro((prev) => ({
        ...prev,
        phase,
        isRunning: false,
        secondsLeft: sec,
        totalPhaseSeconds: sec,
      }));
    },
    [state.pomodoroSettings]
  );

  const togglePomodoroRunning = useCallback(() => {
    void triggerHaptic('light');
    setPomodoro((prev) => {
      if (prev.isRunning) {
        targetEndRef.current = null;
        return { ...prev, isRunning: false };
      }
      targetEndRef.current = Date.now() + prev.secondsLeft * 1000;
      return { ...prev, isRunning: true, lastCompletedPhase: null };
    });
  }, []);

  const resetPomodoro = useCallback(() => {
    targetEndRef.current = null;
    setPomodoro((prev) => {
      const sec = getPhaseDurationSec(prev.phase, state.pomodoroSettings);
      return { ...prev, isRunning: false, secondsLeft: sec, totalPhaseSeconds: sec };
    });
  }, [state.pomodoroSettings]);

  const completeCurrentPhase = useCallback(
    (logSession = true) => {
      finishPhaseInternal(logSession);
    },
    [finishPhaseInternal]
  );

  const incrementDistraction = useCallback(() => {
    void triggerHaptic('light');
    setPomodoro((prev) => ({ ...prev, distractionsCount: prev.distractionsCount + 1 }));
  }, []);

  const updatePomodoroSettings = useCallback((next: PomodoroSettings) => {
    setState((s) => ({ ...s, pomodoroSettings: next }));
    targetEndRef.current = null;
    setPomodoro((prev) => {
      const sec = getPhaseDurationSec(prev.phase, next);
      return { ...prev, isRunning: false, secondsLeft: sec, totalPhaseSeconds: sec };
    });
  }, []);

  const toggleGuideBookmark = useCallback((guideId: string) => {
    void triggerHaptic('light');
    setState((s) => {
      const exists = s.bookmarkedGuideIds.includes(guideId);
      return {
        ...s,
        bookmarkedGuideIds: exists
          ? s.bookmarkedGuideIds.filter((id) => id !== guideId)
          : [...s.bookmarkedGuideIds, guideId],
      };
    });
  }, []);

  const toggleDailyHabit = useCallback(
    (habitId: string, dateKey: string = toDateKey()) => {
      let checkedNow = false;
      setState((s) => {
        const existing = s.wellnessLogs.find((l) => l.dateKey === dateKey);
        const currentIds = existing?.completedHabitIds ?? [];
        checkedNow = !currentIds.includes(habitId);
        const nextIds = checkedNow
          ? [...currentIds, habitId]
          : currentIds.filter((id) => id !== habitId);
        const others = s.wellnessLogs.filter((l) => l.dateKey !== dateKey);
        return { ...s, wellnessLogs: [{ dateKey, completedHabitIds: nextIds }, ...others] };
      });
      if (checkedNow) {
        triggerReward(
          'عادت سلامتی تیک خورد 💚',
          'Healthy Study Habit Checked 💚',
          'مراقبت از جسمت یعنی تمرکز پایدارتر!',
          'A healthy body multiplies sharp focus!',
          10,
          'mood'
        );
      }
    },
    [triggerReward]
  );

  const configurePin = useCallback(async (pin: string) => {
    const { salt, hash } = await createPinRecord(pin);
    setState((s) => ({
      ...s,
      security: {
        pinEnabled: true,
        pinSalt: salt,
        pinHash: hash,
        failedAttempts: 0,
        lockUntilEpoch: 0,
      },
    }));
  }, []);

  const disablePin = useCallback(() => {
    setState((s) => ({
      ...s,
      security: {
        pinEnabled: false,
        pinSalt: '',
        pinHash: '',
        failedAttempts: 0,
        lockUntilEpoch: 0,
      },
    }));
    setLocked(false);
  }, []);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<{ ok: boolean; remainingWaitSec: number }> => {
      const now = Date.now();
      if (state.security.lockUntilEpoch > now) {
        return { ok: false, remainingWaitSec: Math.ceil((state.security.lockUntilEpoch - now) / 1000) };
      }
      const valid = await verifyPinRecord(pin, state.security.pinSalt, state.security.pinHash);
      if (valid) {
        setState((s) => ({ ...s, security: { ...s.security, failedAttempts: 0, lockUntilEpoch: 0 } }));
        setLocked(false);
        return { ok: true, remainingWaitSec: 0 };
      }

      const nextAttempts = state.security.failedAttempts + 1;
      const cooldownSec = nextAttempts >= 5 ? 30 : 0;
      setState((s) => ({
        ...s,
        security: {
          ...s.security,
          failedAttempts: nextAttempts,
          lockUntilEpoch: cooldownSec > 0 ? now + cooldownSec * 1000 : 0,
        },
      }));
      return { ok: false, remainingWaitSec: cooldownSec };
    },
    [state.security]
  );

  const lockNow = useCallback(() => {
    if (state.security.pinEnabled) setLocked(true);
  }, [state.security.pinEnabled]);

  const exportBackupJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importBackupJson = useCallback((rawJson: string): boolean => {
    const parsed = parseAndValidateBackup(rawJson);
    if (!parsed) return false;
    setState(parsed);
    const sec = getPhaseDurationSec('focus', parsed.pomodoroSettings);
    setPomodoro((prev) => ({
      ...prev,
      isRunning: false,
      secondsLeft: sec,
      totalPhaseSeconds: sec,
      linkedSubjectId: parsed.subjects[0]?.id ?? prev.linkedSubjectId,
    }));
    return true;
  }, []);

  const resetAllData = useCallback(() => {
    const fresh = buildSeedState();
    setState(fresh);
    setLocked(false);
    targetEndRef.current = null;
    const sec = getPhaseDurationSec('focus', fresh.pomodoroSettings);
    setPomodoro({
      phase: 'focus',
      isRunning: false,
      secondsLeft: sec,
      totalPhaseSeconds: sec,
      roundNumber: 1,
      linkedSubjectId: fresh.subjects[0].id,
      distractionsCount: 0,
      lastCompletedPhase: null,
    });
  }, []);

  const theme = useMemo(() => getTheme(state.theme), [state.theme]);
  const strings = useMemo(() => STRINGS[state.language], [state.language]);
  const isRTL = state.language === 'fa';

  const value = useMemo<FoxStoreContextValue>(
    () => ({
      hydrated,
      locked,
      activeTab,
      setActiveTab,
      plannerSection,
      setPlannerSection,
      wellnessSection,
      setWellnessSection,
      settingsMenuOpen,
      setSettingsMenuOpen,
      fontsReady,
      state,
      theme,
      strings,
      isRTL,
      pomodoro,
      celebration,
      dismissCelebration: () => setCelebration(null),
      activeReminderAlert,
      dismissReminderAlert: () => setActiveReminderAlert(null),
      setLanguage,
      setThemePreset,
      setFontFamilyPreset,
      setFontScalePreset,
      setSoundStyle,
      toggleTheme,
      toggleCelebrationSounds,
      setDailyGoalMinutes,
      completeOnboarding,
      reopenOnboarding,
      upsertTask,
      toggleTaskComplete,
      toggleSubtaskComplete,
      deleteTask,
      addSubject,
      deleteSubject,
      upsertNote,
      togglePinNote,
      deleteNote,
      upsertReminder,
      toggleReminderEnabled,
      deleteReminder,
      snoozeReminder,
      addCalendarEvent,
      deleteCalendarEvent,
      submitDailyMood,
      startPomodoroForTask,
      selectPomodoroLink,
      setPomodoroPhase,
      togglePomodoroRunning,
      resetPomodoro,
      completeCurrentPhase,
      incrementDistraction,
      updatePomodoroSettings,
      toggleGuideBookmark,
      toggleDailyHabit,
      configurePin,
      disablePin,
      unlockWithPin,
      lockNow,
      exportBackupJson,
      importBackupJson,
      resetAllData,
    }),
    [
      hydrated,
      locked,
      activeTab,
      plannerSection,
      wellnessSection,
      settingsMenuOpen,
      fontsReady,
      state,
      theme,
      strings,
      isRTL,
      pomodoro,
      celebration,
      activeReminderAlert,
      setLanguage,
      setThemePreset,
      setFontFamilyPreset,
      setFontScalePreset,
      setSoundStyle,
      toggleTheme,
      toggleCelebrationSounds,
      setDailyGoalMinutes,
      completeOnboarding,
      reopenOnboarding,
      upsertTask,
      toggleTaskComplete,
      toggleSubtaskComplete,
      deleteTask,
      addSubject,
      deleteSubject,
      upsertNote,
      togglePinNote,
      deleteNote,
      upsertReminder,
      toggleReminderEnabled,
      deleteReminder,
      snoozeReminder,
      addCalendarEvent,
      deleteCalendarEvent,
      submitDailyMood,
      startPomodoroForTask,
      selectPomodoroLink,
      setPomodoroPhase,
      togglePomodoroRunning,
      resetPomodoro,
      completeCurrentPhase,
      incrementDistraction,
      updatePomodoroSettings,
      toggleGuideBookmark,
      toggleDailyHabit,
      configurePin,
      disablePin,
      unlockWithPin,
      lockNow,
      exportBackupJson,
      importBackupJson,
      resetAllData,
    ]
  );

  return <FoxStoreContext.Provider value={value}>{children}</FoxStoreContext.Provider>;
}

export function useFoxStore(): FoxStoreContextValue {
  const ctx = useContext(FoxStoreContext);
  if (!ctx) throw new Error('useFoxStore must be used inside FoxStoreProvider');
  return ctx;
}
