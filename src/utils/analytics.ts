import type { StudySession, Subject, TaskItem } from '../types/planner';
import { getTrailingDateKeys, shiftDateKey, toDateKey } from './dateUtils';

export interface DailyStudyPoint {
  dateKey: string;
  focusMinutes: number;
  sessionsCount: number;
}

export interface SubjectBreakdownItem {
  subject: Subject;
  minutes: number;
  percentage: number;
}

export interface ProgressSnapshot {
  totalFocusMinutes: number;
  totalCompletedPomodoros: number;
  todayFocusMinutes: number;
  currentStreakDays: number;
  taskCompletionRate: number;
  completedTasksCount: number;
  totalTasksCount: number;
}

/** Computes study streak: counts consecutive days with focus sessions ending today or yesterday. */
export function computeStudyStreak(sessions: StudySession[], referenceDateKey: string = toDateKey()): number {
  const activeDates = new Set(
    sessions.filter((s) => s.phase === 'focus' && s.durationMinutes > 0).map((s) => s.dateKey)
  );
  if (activeDates.size === 0) return 0;

  let cursor = activeDates.has(referenceDateKey)
    ? referenceDateKey
    : shiftDateKey(referenceDateKey, -1);

  if (!activeDates.has(cursor)) return 0;

  let streak = 0;
  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

/** Builds daily study totals for the trailing `days` window. */
export function buildDailySeries(
  sessions: StudySession[],
  days: number,
  endDateKey: string = toDateKey()
): DailyStudyPoint[] {
  const dateKeys = getTrailingDateKeys(days, endDateKey);
  const byDate = new Map<string, { minutes: number; count: number }>();

  for (const s of sessions) {
    if (s.phase !== 'focus') continue;
    const prev = byDate.get(s.dateKey) ?? { minutes: 0, count: 0 };
    byDate.set(s.dateKey, {
      minutes: prev.minutes + Math.max(0, s.durationMinutes),
      count: prev.count + 1,
    });
  }

  return dateKeys.map((dateKey) => {
    const entry = byDate.get(dateKey);
    return {
      dateKey,
      focusMinutes: entry?.minutes ?? 0,
      sessionsCount: entry?.count ?? 0,
    };
  });
}

/** Aggregates completed focus time per subject, sorted descending. */
export function buildSubjectBreakdown(
  sessions: StudySession[],
  subjects: Subject[]
): SubjectBreakdownItem[] {
  const focusSessions = sessions.filter((s) => s.phase === 'focus' && s.durationMinutes > 0);
  const totalMinutes = focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalsBySubject = new Map<string, number>();

  for (const s of focusSessions) {
    totalsBySubject.set(s.subjectId, (totalsBySubject.get(s.subjectId) ?? 0) + s.durationMinutes);
  }

  return subjects
    .map((subject) => {
      const minutes = totalsBySubject.get(subject.id) ?? 0;
      const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
      return { subject, minutes, percentage };
    })
    .filter((item) => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

/** Computes top-level KPI metrics for Progress and Planner dashboards. */
export function computeProgressSnapshot(
  sessions: StudySession[],
  tasks: TaskItem[],
  todayKey: string = toDateKey()
): ProgressSnapshot {
  const focusSessions = sessions.filter((s) => s.phase === 'focus');
  const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + Math.max(0, s.durationMinutes), 0);
  const todayFocusMinutes = focusSessions
    .filter((s) => s.dateKey === todayKey)
    .reduce((sum, s) => sum + Math.max(0, s.durationMinutes), 0);

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const totalTasksCount = tasks.length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return {
    totalFocusMinutes,
    totalCompletedPomodoros: focusSessions.length,
    todayFocusMinutes,
    currentStreakDays: computeStudyStreak(sessions, todayKey),
    taskCompletionRate,
    completedTasksCount,
    totalTasksCount,
  };
}
