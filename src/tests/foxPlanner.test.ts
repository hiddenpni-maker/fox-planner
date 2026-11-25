import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import test from 'node:test';
import {
  buildDailySeries,
  buildSubjectBreakdown,
  computeProgressSnapshot,
  computeStudyStreak,
} from '../utils/analytics';
import { getTrailingDateKeys, shiftDateKey, toDateKey } from '../utils/dateUtils';
import {
  constantTimeEqual,
  createPinRecord,
  isValidPinFormat,
  parseAndValidateBackup,
  sanitizeFileName,
  verifyPinRecord,
} from '../utils/security';
import { buildSeedState } from '../data/seedData';
import { getTheme, THEME_PRESETS } from '../theme/tokens';
import { buildScaledTextStyle, FONT_PRESETS, FONT_SCALE_PRESETS } from '../theme/typography';
import type { StudySession, Subject, TaskItem } from '../types/planner';
import {
  buildJalaliMonthGrid,
  dateKeyToJalali,
  gregorianToJalali,
  jalaliToDateKey,
  jalaliToGregorian,
} from '../utils/jalaliCalendar';
import { buildPlayfulReminderCopy } from '../utils/reminderCopy';
import {
  checkForGitHubUpdate,
  compareSemver,
  isSafeHttpsUrl,
  parseVersionManifest,
} from '../utils/updater';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { injectAbiSplitsGradle } = require('../../plugins/withAbiSplits') as {
  injectAbiSplitsGradle: (s: string) => string;
};

const nodeCryptoProvider = {
  async digestSha256Hex(input: string): Promise<string> {
    return createHash('sha256').update(input, 'utf8').digest('hex');
  },
  randomHex(byteCount: number): string {
    return randomBytes(byteCount).toString('hex');
  },
};

test('dateUtils shifts calendar days without UTC drift', () => {
  assert.equal(shiftDateKey('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDateKey('2024-03-01', -1), '2024-02-29');
  assert.deepEqual(getTrailingDateKeys(3, '2026-11-25'), ['2026-11-23', '2026-11-24', '2026-11-25']);
  assert.equal(toDateKey(new Date(2026, 10, 25, 23, 59)), '2026-11-25');
});

test('analytics computes streak, subject breakdown, and completion rate accurately', () => {
  const subjects: Subject[] = [
    { id: 'math', nameFa: 'ریاضی', nameEn: 'Math', color: '#F97316', icon: 'book' },
    { id: 'code', nameFa: 'کد', nameEn: 'Code', color: '#38BDF8', icon: 'code' },
  ];
  const sessions: StudySession[] = [
    { id: '1', dateKey: '2026-11-25', subjectId: 'math', phase: 'focus', durationMinutes: 50, completedAt: 3 },
    { id: '2', dateKey: '2026-11-24', subjectId: 'code', phase: 'focus', durationMinutes: 25, completedAt: 2 },
    { id: '3', dateKey: '2026-11-23', subjectId: 'math', phase: 'focus', durationMinutes: 25, completedAt: 1 },
    { id: '4', dateKey: '2026-11-21', subjectId: 'math', phase: 'focus', durationMinutes: 60, completedAt: 0 },
    { id: '5', dateKey: '2026-11-25', subjectId: 'math', phase: 'shortBreak', durationMinutes: 5, completedAt: 4 },
  ];
  const tasks: TaskItem[] = [
    {
      id: 't1',
      title: 'A',
      dateKey: '2026-11-25',
      subjectId: 'math',
      priority: 'high',
      estimatedPomodoros: 2,
      completedPomodoros: 2,
      completed: true,
      subtasks: [],
      createdAt: 1,
    },
    {
      id: 't2',
      title: 'B',
      dateKey: '2026-11-25',
      subjectId: 'code',
      priority: 'medium',
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      completed: false,
      subtasks: [],
      createdAt: 2,
    },
  ];

  assert.equal(computeStudyStreak(sessions, '2026-11-25'), 3);
  assert.equal(computeStudyStreak(sessions, '2026-11-26'), 3);
  assert.equal(computeStudyStreak(sessions, '2026-11-27'), 0);

  const snap = computeProgressSnapshot(sessions, tasks, '2026-11-25');
  assert.equal(snap.totalFocusMinutes, 160);
  assert.equal(snap.todayFocusMinutes, 50);
  assert.equal(snap.totalCompletedPomodoros, 4);
  assert.equal(snap.taskCompletionRate, 50);

  const series = buildDailySeries(sessions, 3, '2026-11-25');
  assert.deepEqual(
    series.map((d) => d.focusMinutes),
    [25, 25, 50]
  );

  const breakdown = buildSubjectBreakdown(sessions, subjects);
  assert.equal(breakdown[0].subject.id, 'math');
  assert.equal(breakdown[0].minutes, 135);
  assert.equal(breakdown[0].percentage, 84);
});

test('security validates PIN hashes, constant-time equality, filenames, and backups', async () => {
  assert.equal(isValidPinFormat('1234'), true);
  assert.equal(isValidPinFormat('123456'), true);
  assert.equal(isValidPinFormat('123'), false);
  assert.equal(isValidPinFormat('12ab'), false);

  assert.equal(constantTimeEqual('abc', 'abc'), true);
  assert.equal(constantTimeEqual('abc', 'abd'), false);
  assert.equal(constantTimeEqual('abc', 'ab'), false);

  const rec = await createPinRecord('2580', nodeCryptoProvider);
  assert.equal(rec.salt.length, 32);
  assert.equal(rec.hash.length, 64);
  assert.equal(await verifyPinRecord('2580', rec.salt, rec.hash, nodeCryptoProvider), true);
  assert.equal(await verifyPinRecord('2581', rec.salt, rec.hash, nodeCryptoProvider), false);

  assert.equal(sanitizeFileName('../../evil\\name?.jpg'), '._._evil_name_.jpg');
  assert.equal(parseAndValidateBackup('{"invalid":true}'), null);

  const seed = buildSeedState();
  const restored = parseAndValidateBackup(JSON.stringify(seed));
  if (!restored) {
    assert.fail('Expected valid seed backup to parse cleanly');
  }
  assert.equal(restored.subjects.length, seed.subjects.length);
  assert.equal(restored.dailyGoalMinutes, 120);
  assert.equal(restored.tasks.length, 0);
  assert.equal(restored.notes.length, 0);
  assert.equal(restored.sessions.length, 0);
  assert.equal(getTheme('light').id, 'warmPaper');
  assert.equal(getTheme('dark').id, 'midnightSage');
  assert.equal(Object.keys(THEME_PRESETS).length, 7);
  assert.equal(THEME_PRESETS.forestFox.pattern, 'forest');
  assert.equal(THEME_PRESETS.sakuraBlossom.category, 'patterned');
  assert.equal(THEME_PRESETS.midnightSage.category, 'minimal');
});

test('clean seed workspace starts without sample tasks, notes, or sessions', () => {
  const seed = buildSeedState();
  assert.equal(seed.tasks.length, 0);
  assert.equal(seed.notes.length, 0);
  assert.equal(seed.sessions.length, 0);
  assert.equal(seed.reminders.length, 0);
  assert.equal(seed.calendarEvents.length, 0);
  assert.equal(seed.moodLogs.length, 0);
  assert.equal(seed.subjects.length, 1);
  assert.equal(seed.subjects[0].id, 'subj-general');
  assert.equal(seed.hasCompletedOnboarding, false);
});

test('jalaliCalendar converts dates accurately and includes student & cultural occasions', () => {
  const j = gregorianToJalali(2026, 11, 25);
  assert.deepEqual(j, { jy: 1405, jm: 9, jd: 4 });
  assert.deepEqual(jalaliToGregorian(1405, 9, 4), { gy: 2026, gm: 11, gd: 25 });
  assert.equal(jalaliToDateKey(1405, 9, 4), '2026-11-25');
  assert.deepEqual(dateKeyToJalali('2026-11-25'), { jy: 1405, jm: 9, jd: 4 });

  const azarGrid = buildJalaliMonthGrid(1405, 9);
  assert.equal(azarGrid.cells.length, 30);
  const studentDay = azarGrid.cells.find((c) => c.jd === 16);
  const yalda = azarGrid.cells.find((c) => c.jd === 30);
  assert.equal(studentDay?.occasions.some((o) => o.tag === 'student'), true);
  assert.equal(yalda?.occasions.some((o) => o.titleFa.includes('یلدا')), true);
});

test('reminderCopy formats playful, motivating, and calm reminder alerts cleanly', () => {
  const playfulFa = buildPlayfulReminderCopy(
    { title: 'مرور لغات', details: '۲۰ لغت جدید', tone: 'playful' },
    'fa'
  );
  assert.equal(playfulFa.title.includes('مرور لغات'), true);
  assert.equal(playfulFa.body.includes('۲۰ لغت جدید'), true);

  const motivatingEn = buildPlayfulReminderCopy(
    { title: 'Calculus Drill', details: '', tone: 'motivating' },
    'en'
  );
  assert.equal(motivatingEn.title.includes('Calculus Drill'), true);
  assert.ok(motivatingEn.body.length > 10);

  const calmFa = buildPlayfulReminderCopy(
    { title: 'نفس عمیق', details: undefined, tone: 'calm' },
    'fa'
  );
  assert.equal(calmFa.title.includes('نفس عمیق'), true);
});

test('typography scales font sizes and binds Persian custom fonts without weight conflict', () => {
  assert.equal(Object.keys(FONT_PRESETS).length, 5);
  assert.equal(Object.keys(FONT_SCALE_PRESETS).length, 4);

  const styled = buildScaledTextStyle({ fontSize: 16, fontWeight: '800', lineHeight: 24 }, 'baloo', 'xl', true);
  assert.equal(styled.fontSize, 20);
  assert.equal(styled.lineHeight, 30);
  assert.equal(styled.fontFamily, 'BalooBhaijaan2_800ExtraBold');
  assert.equal(styled.fontWeight, undefined);

  const compactSys = buildScaledTextStyle({ fontSize: 16, fontWeight: '700' }, 'system', 'sm', true);
  assert.equal(compactSys.fontSize, 14.1);
  assert.equal(compactSys.fontFamily, undefined);
  assert.equal(compactSys.fontWeight, '700');
});

test('updater compares semver, rejects unsafe URLs, and parses GitHub releases', async () => {
  assert.equal(compareSemver('1.0.0', 'v1.2.0') > 0, true);
  assert.equal(compareSemver('1.10.0', '1.2.0') < 0, true);
  assert.equal(compareSemver('1.0.0', '1.0.0'), 0);

  assert.equal(isSafeHttpsUrl('https://github.com/user/fox-planner/releases/latest'), true);
  assert.equal(isSafeHttpsUrl('http://github.com/user/fox-planner'), false);
  assert.equal(isSafeHttpsUrl('javascript:alert(1)'), false);

  const parsedGh = parseVersionManifest({
    tag_name: 'v1.2.0',
    html_url: 'https://github.com/foxdev/fox-planner/releases/tag/v1.2.0',
    body: 'Added dark charts',
    published_at: '2026-12-01T10:00:00Z',
    assets: [
      {
        name: 'fox-planner-arm64-v8a.apk',
        browser_download_url: 'https://github.com/foxdev/fox-planner/releases/download/v1.2.0/fox-planner-arm64-v8a.apk',
      },
      {
        name: 'fox-planner-universal.apk',
        browser_download_url: 'http://insecure.example.com/app.apk',
      },
    ],
  });
  assert.ok(parsedGh);
  assert.equal(parsedGh.version, '1.2.0');
  assert.ok(parsedGh.apkUrls.arm64?.startsWith('https://'));
  assert.equal(parsedGh.apkUrls.universal, undefined);

  const mockFetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      version: '1.1.0',
      downloadPageUrl: 'https://github.com/foxdev/fox-planner/releases/latest',
      apkUrls: { universal: 'https://github.com/foxdev/fox-planner/releases/download/v1.1.0/fox-planner-universal.apk' },
    }),
  })) as unknown as typeof fetch;

  const res = await checkForGitHubUpdate(
    { appVersion: '1.0.0', versionCode: 1, githubOwner: 'foxdev', githubRepo: 'fox-planner' },
    mockFetch
  );
  assert.equal(res.status, 'update_available');
  if (res.status === 'update_available') {
    assert.equal(res.latest.version, '1.1.0');
  }
});

test('withAbiSplits plugin injects conditional ABI split block idempotently', () => {
  const sampleGradle = 'android {\n    namespace "com.foxplanner.app"\n}\n';
  const once = injectAbiSplitsGradle(sampleGradle);
  const twice = injectAbiSplitsGradle(once);
  assert.equal(once.includes('FOX_PLANNER_ABI_SPLITS'), true);
  assert.equal(once.includes('include "armeabi-v7a", "arm64-v8a", "x86_64"'), true);
  assert.equal(once.includes('enable project.hasProperty("splitApks")'), true);
  assert.equal(twice, once);
});
