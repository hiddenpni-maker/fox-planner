export type LanguageCode = 'fa' | 'en';
export type ThemePresetId =
  | 'midnightSage'
  | 'warmPaper'
  | 'forestFox'
  | 'moonlit'
  | 'sakuraBlossom'
  | 'matchaCalm'
  | 'candyPop';
export type ThemeMode = 'dark' | 'light';
export type TabKey = 'planner' | 'pomodoro' | 'notes' | 'progress' | 'wellness';
export type TaskPriority = 'high' | 'medium' | 'low';
export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';
export type NoteBlockType = 'text' | 'heading' | 'highlight' | 'checklist' | 'image' | 'video' | 'file';
export type ReminderTone = 'playful' | 'motivating' | 'calm';
export type ReminderRepeat = 'once' | 'daily' | 'weekly';

export type SoundStyleId =
  | 'crystal_kalimba'
  | 'harp_breeze'
  | 'marimba_joy'
  | 'fox_fanfare'
  | 'zen_bell'
  | 'magic_sparkle'
  | 'cozy_pop';

export type FontFamilyPreset = 'vazirmatn' | 'baloo' | 'readex' | 'lalezar' | 'system';
export type FontScalePreset = 'sm' | 'md' | 'lg' | 'xl';

export interface Subject {
  id: string;
  nameFa: string;
  nameEn: string;
  color: string;
  icon: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dateKey: string; // YYYY-MM-DD local date
  timeLabel?: string; // e.g. "16:30"
  subjectId: string;
  priority: TaskPriority;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  subtasks: SubTask[];
  createdAt: number;
  completedAt?: number;
}

export interface NoteBlock {
  id: string;
  type: NoteBlockType;
  content: string;
  caption?: string;
  uri?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  checked?: boolean;
}

export interface NoteItem {
  id: string;
  title: string;
  subjectId: string;
  linkedTaskId?: string;
  tags: string[];
  pinned: boolean;
  blocks: NoteBlock[];
  createdAt: number;
  updatedAt: number;
}

export interface StudySession {
  id: string;
  dateKey: string; // YYYY-MM-DD
  subjectId: string;
  taskId?: string;
  phase: PomodoroPhase;
  durationMinutes: number;
  completedAt: number;
}

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  roundsBeforeLongBreak: number;
  hapticsEnabled: boolean;
  soundCueEnabled: boolean;
}

export interface SecurityConfig {
  pinEnabled: boolean;
  pinSalt: string;
  pinHash: string;
  failedAttempts: number;
  lockUntilEpoch: number;
}

export interface DailyWellnessLog {
  dateKey: string;
  completedHabitIds: string[];
}

export interface MoodEntry {
  dateKey: string;
  score: 1 | 2 | 3 | 4 | 5;
  emoji: string;
  labelFa: string;
  labelEn: string;
  note?: string;
  createdAt: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  details?: string;
  subjectId?: string;
  dateKey: string; // YYYY-MM-DD
  hour: number;
  minute: number;
  repeat: ReminderRepeat;
  tone: ReminderTone;
  enabled: boolean;
  notificationId?: string;
  snoozedUntil?: number;
  lastTriggeredKey?: string; // YYYY-MM-DD_HH:MM
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  dateKey: string;
  title: string;
  category: 'exam' | 'deadline' | 'personal';
  note?: string;
}

export interface FoxPlannerState {
  version: number;
  language: LanguageCode;
  theme: ThemePresetId;
  fontFamilyPreset: FontFamilyPreset;
  fontScalePreset: FontScalePreset;
  soundStyle: SoundStyleId;
  dailyGoalMinutes: number;
  foxPoints: number;
  hasCompletedOnboarding: boolean;
  celebrationSoundsEnabled: boolean;
  subjects: Subject[];
  tasks: TaskItem[];
  notes: NoteItem[];
  sessions: StudySession[];
  reminders: ReminderItem[];
  calendarEvents: CalendarEvent[];
  moodLogs: MoodEntry[];
  pomodoroSettings: PomodoroSettings;
  security: SecurityConfig;
  bookmarkedGuideIds: string[];
  wellnessLogs: DailyWellnessLog[];
}

export type WellnessCategory = 'focus' | 'study' | 'rest' | 'health';

export interface WellnessGuide {
  id: string;
  category: WellnessCategory;
  readTimeMin: number;
  icon: string;
  accent: string;
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  summaryEn: string;
  stepsFa: string[];
  stepsEn: string[];
  scienceNoteFa: string;
  scienceNoteEn: string;
}
