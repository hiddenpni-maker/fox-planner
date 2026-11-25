import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, TextInput } from '../components/FoxText';
import { Ionicons } from '@expo/vector-icons';
import { CalendarOccasionsModal } from '../components/CalendarOccasionsModal';
import { DailyMoodPrompt } from '../components/DailyMoodPrompt';
import { FoxMascot } from '../components/FoxMascot';
import { RemindersModal } from '../components/RemindersModal';
import { SectionHelpButton } from '../components/SectionHelpButton';
import { SUGGESTED_SUBJECT_PRESETS } from '../data/seedData';
import { useFoxStore } from '../store/FoxStoreContext';
import { getPriorityLabel, localizeDigits } from '../i18n/translations';
import { computeProgressSnapshot } from '../utils/analytics';
import { formatDateChip, getWeekStripKeys, toDateKey } from '../utils/dateUtils';
import { dateKeyToJalali, IRAN_JALALI_OCCASIONS, JALALI_MONTH_NAMES_FA } from '../utils/jalaliCalendar';
import type { SubTask, TaskItem, TaskPriority } from '../types/planner';

type FilterMode = 'all' | 'pending' | 'done' | 'high';

const SUBJECT_SWATCHES = ['#F97316', '#38BDF8', '#10B981', '#A855F7', '#EC4899', '#F59E0B'];

export function PlannerScreen() {
  const {
    state,
    theme,
    strings,
    isRTL,
    plannerSection,
    setPlannerSection,
    upsertTask,
    toggleTaskComplete,
    toggleSubtaskComplete,
    deleteTask,
    startPomodoroForTask,
    addSubject,
    deleteSubject,
  } = useFoxStore();

  const todayKey = toDateKey();
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id ?? 'subj-general');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [timeLabel, setTimeLabel] = useState('');
  const [estPomodoros, setEstPomodoros] = useState(2);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Mood & Subject Manager modal states
  const [moodPromptOpen, setMoodPromptOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_SWATCHES[0]);

  const lang = state.language;
  const weekKeys = useMemo(() => getWeekStripKeys(todayKey), [todayKey]);
  const snapshot = useMemo(
    () => computeProgressSnapshot(state.sessions, state.tasks, todayKey),
    [state.sessions, state.tasks, todayKey]
  );

  const todayMood = useMemo(
    () => state.moodLogs.find((m) => m.dateKey === todayKey),
    [state.moodLogs, todayKey]
  );
  const activeRemindersCount = useMemo(
    () => state.reminders.filter((r) => r.enabled).length,
    [state.reminders]
  );
  const selectedJalali = useMemo(() => dateKeyToJalali(selectedDateKey), [selectedDateKey]);
  const selectedOccasions = useMemo(
    () => IRAN_JALALI_OCCASIONS.filter((o) => o.jm === selectedJalali.jm && o.jd === selectedJalali.jd),
    [selectedJalali]
  );
  const selectedEvents = useMemo(
    () => state.calendarEvents.filter((e) => e.dateKey === selectedDateKey),
    [state.calendarEvents, selectedDateKey]
  );

  const dayTasks = useMemo(
    () => state.tasks.filter((t) => t.dateKey === selectedDateKey),
    [state.tasks, selectedDateKey]
  );

  const filteredTasks = useMemo(() => {
    const rank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return dayTasks
      .filter((t) => {
        if (filterMode === 'pending' && t.completed) return false;
        if (filterMode === 'done' && !t.completed) return false;
        if (filterMode === 'high' && t.priority !== 'high') return false;
        if (selectedSubjectFilter !== 'all' && t.subjectId !== selectedSubjectFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return rank[a.priority] - rank[b.priority];
      });
  }, [dayTasks, filterMode, selectedSubjectFilter]);

  const dayDoneCount = dayTasks.filter((t) => t.completed).length;
  const dayProgressRatio = dayTasks.length > 0 ? dayDoneCount / dayTasks.length : 0;

  const openNewTask = () => {
    setEditingTaskId(undefined);
    setTitle('');
    setDescription('');
    setSubjectId(state.subjects[0]?.id ?? 'subj-general');
    setPriority('medium');
    setTimeLabel('');
    setEstPomodoros(2);
    setSubtasks([]);
    setNewSubtaskText('');
    setModalOpen(true);
  };

  const openEditTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? '');
    setSubjectId(task.subjectId);
    setPriority(task.priority);
    setTimeLabel(task.timeLabel ?? '');
    setEstPomodoros(task.estimatedPomodoros);
    setSubtasks(task.subtasks);
    setNewSubtaskText('');
    setModalOpen(true);
  };

  const handleAddDraftSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, title: trimmed, completed: false },
    ]);
    setNewSubtaskText('');
  };

  const handleSaveTask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const existing = state.tasks.find((t) => t.id === editingTaskId);
    upsertTask({
      id: editingTaskId,
      title: trimmed,
      description: description.trim() || undefined,
      dateKey: existing?.dateKey ?? selectedDateKey,
      timeLabel: timeLabel.trim() || undefined,
      subjectId,
      priority,
      estimatedPomodoros: estPomodoros,
      completedPomodoros: existing?.completedPomodoros ?? 0,
      completed: existing?.completed ?? false,
      completedAt: existing?.completedAt,
      subtasks,
    });
    setModalOpen(false);
  };

  const getSubject = (id: string) =>
    state.subjects.find((s) => s.id === id) ?? state.subjects[0];

  const getPriorityBadgeStyle = (p: TaskPriority) => {
    if (p === 'high') return { bg: theme.dangerSoft, text: theme.danger };
    if (p === 'medium') return { bg: theme.warningSoft, text: theme.warning };
    return { bg: theme.infoSoft, text: theme.info };
  };

  return (
    <View style={[styles.root, { backgroundColor: 'transparent' }]}>
      {/* Clean 3-Part Planner Sub-Navigation */}
      <View style={styles.topSegmentWrap}>
        <View
          style={[
            styles.segmentBar,
            { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {([
            { key: 'tasks' as const, fa: 'برنامه‌ها', en: 'Tasks', icon: 'checkbox-outline' },
            { key: 'calendar' as const, fa: 'تقویم و مناسبت', en: 'Calendar', icon: 'calendar-outline' },
            { key: 'reminders' as const, fa: 'یادآورها', en: 'Reminders', icon: 'alarm-outline' },
          ]).map((seg) => {
            const active = plannerSection === seg.key;
            return (
              <TouchableOpacity
                key={seg.key}
                onPress={() => setPlannerSection(seg.key)}
                style={[
                  styles.segmentBtn,
                  {
                    backgroundColor: active ? theme.primarySoft : 'transparent',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Ionicons name={seg.icon as never} size={15} color={active ? theme.primary : theme.textMuted} />
                <Text style={{ color: active ? theme.primary : theme.textMuted, fontSize: 12, fontWeight: active ? '900' : '700' }}>
                  {lang === 'fa' ? seg.fa : seg.en}
                </Text>
                {seg.key === 'reminders' && activeRemindersCount > 0 ? (
                  <View style={[styles.countBubble, { backgroundColor: theme.warningSoft }]}>
                    <Text style={{ color: theme.warning, fontSize: 10, fontWeight: '900' }}>
                      {localizeDigits(activeRemindersCount, lang)}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {plannerSection === 'calendar' ? (
        <CalendarOccasionsModal
          embedded
          selectedDateKey={selectedDateKey}
          onSelectDateKey={(dk) => {
            setSelectedDateKey(dk);
            setPlannerSection('tasks');
          }}
        />
      ) : plannerSection === 'reminders' ? (
        <RemindersModal embedded defaultDateKey={selectedDateKey} />
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Clean, Uncluttered Hero Greeting Card */}
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.heroTopUtility, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.heroBadgesCluster, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.streakPill, { backgroundColor: theme.primarySoft }]}>
                <Text style={[styles.streakText, { color: theme.primary }]}>
                  🔥 {localizeDigits(snapshot.currentStreakDays, lang)} {strings.progress.days}
                </Text>
              </View>
              <View style={[styles.streakPill, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.streakText, { color: theme.accent }]}>
                  ⭐ {localizeDigits(state.foxPoints, lang)} XP
                </Text>
              </View>
            </View>

            <SectionHelpButton
              titleFa="راهنمای پلنر هوشمند و روزانه"
              titleEn="Daily Planner Guide"
              tipsFa={[
                'بالای همین صفحه ۳ پنل مجزا داری تا چیزی قاطی نشود: برنامه‌ها، تقویم شمسی و یادآورهای ساعتی.',
                'در تب برنامه‌ها فقط با «برنامه جدید» کار خودت را اضافه کن و مستقیم با تایمر پومودورو اجراش کن.',
              ]}
              tipsEn={[
                'Use the 3 clean top tabs to switch between Tasks, Jalali Calendar, and Reminders without clutter.',
                'Add your own tasks cleanly and launch Pomodoro straight from any card.',
              ]}
              theme={theme}
              lang={lang}
              isRTL={isRTL}
            />
          </View>

          <View style={[styles.heroRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {strings.appName}
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {strings.planner.greeting}
              </Text>

              {/* Daily Mood Trigger Chip */}
              <TouchableOpacity
                onPress={() => setMoodPromptOpen(true)}
                style={[
                  styles.moodChip,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: todayMood ? theme.success : theme.primary,
                    alignSelf: isRTL ? 'flex-end' : 'flex-start',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Text style={{ fontSize: 15 }}>{todayMood ? todayMood.emoji : '🙂'}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11.5, fontWeight: '700' }}>
                  {todayMood
                    ? lang === 'fa'
                      ? `حس امروز: ${todayMood.labelFa} (${localizeDigits(todayMood.score, lang)}/۵)`
                      : `Mood today: ${todayMood.labelEn} (${todayMood.score}/5)`
                    : lang === 'fa'
                    ? 'حس امروزت چطوره؟ ثبت کن'
                    : 'Log today’s mood'}
                </Text>
              </TouchableOpacity>
            </View>
            <FoxMascot
              mood={dayTasks.length > 0 && dayDoneCount === dayTasks.length ? 'celebrate' : 'study'}
              size={78}
              theme={theme}
            />
          </View>

          <View style={styles.heroProgressWrap}>
            <View style={[styles.heroProgressMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {strings.planner.todayProgress}
              </Text>
              <Text style={[styles.metaText, { color: theme.primary, fontWeight: '700' }]}>
                {localizeDigits(dayDoneCount, lang)} / {localizeDigits(dayTasks.length, lang)}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: `${Math.round(dayProgressRatio * 100)}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={[styles.heroActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={openNewTask}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>{strings.planner.newTask}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              onPress={() => setSubjectModalOpen(true)}
            >
              <Ionicons name="folder-open-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>
                {strings.planner.manageSubjects}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Date Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.weekStrip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {weekKeys.map((dk) => {
            const info = formatDateChip(dk, lang);
            const active = dk === selectedDateKey;
            const isToday = dk === todayKey;
            const hasTasks = state.tasks.some((t) => t.dateKey === dk);
            return (
              <TouchableOpacity
                key={dk}
                onPress={() => setSelectedDateKey(dk)}
                style={[
                  styles.dayChip,
                  {
                    backgroundColor: active ? theme.primary : theme.surface,
                    borderColor: active ? theme.primary : isToday ? theme.accent : theme.border,
                  },
                ]}
              >
                <Text style={[styles.dayWeekday, { color: active ? '#FFEAD5' : theme.textMuted }]}>
                  {info.weekday}
                </Text>
                <Text style={[styles.dayNum, { color: active ? '#FFFFFF' : theme.text }]}>
                  {info.dayNum}
                </Text>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: hasTasks
                        ? active
                          ? '#FFFFFF'
                          : theme.primary
                        : 'transparent',
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.dateMetaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.selectedDateFull, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {formatDateChip(selectedDateKey, lang).full} • {localizeDigits(selectedJalali.jd, lang)}{' '}
            {JALALI_MONTH_NAMES_FA[selectedJalali.jm - 1]} {localizeDigits(selectedJalali.jy, lang)}
          </Text>
          <TouchableOpacity onPress={() => setPlannerSection('calendar')}>
            <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: '800' }}>
              {lang === 'fa' ? 'نمای ماهانه ←' : 'Month view →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Day Occasions or Custom Calendar Events */}
        {selectedOccasions.length > 0 || selectedEvents.length > 0 ? (
          <View style={{ gap: 6, marginBottom: 10 }}>
            {selectedOccasions.map((occ, idx) => (
              <View
                key={`occ-${idx}`}
                style={[
                  styles.dayBanner,
                  {
                    backgroundColor: theme.warningSoft,
                    borderColor: theme.warning,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Ionicons name="sparkles-outline" size={14} color={theme.warning} />
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === 'fa' ? `مناسبت تقویم: ${occ.titleFa}` : `Occasion: ${occ.titleEn}`}
                </Text>
              </View>
            ))}
            {selectedEvents.map((ev) => (
              <View
                key={ev.id}
                style={[
                  styles.dayBanner,
                  {
                    backgroundColor: theme.infoSoft,
                    borderColor: theme.info,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Ionicons name="bookmark-outline" size={14} color={theme.info} />
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700', flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                  {ev.title} {ev.note ? `— ${ev.note}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {([
            ['all', strings.planner.filterAll],
            ['pending', strings.planner.filterPending],
            ['done', strings.planner.filterDone],
            ['high', strings.planner.filterHigh],
          ] as [FilterMode, string][]).map(([key, label]) => {
            const active = filterMode === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setFilterMode(key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? theme.primarySoft : theme.surface,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={[styles.filterPillText, { color: active ? theme.primary : theme.textSecondary }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {state.subjects.map((sub) => {
            const active = selectedSubjectFilter === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                onPress={() => setSelectedSubjectFilter((cur) => (cur === sub.id ? 'all' : sub.id))}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? `${sub.color}26` : theme.surface,
                    borderColor: active ? sub.color : theme.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    gap: 6,
                  },
                ]}
              >
                <View style={[styles.colorDot, { backgroundColor: sub.color }]} />
                <Text style={[styles.filterPillText, { color: active ? sub.color : theme.textSecondary }]}>
                  {lang === 'fa' ? sub.nameFa : sub.nameEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <FoxMascot mood="calm" size={76} theme={theme} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{strings.planner.emptyTitle}</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>{strings.planner.emptySubtitle}</Text>
            <TouchableOpacity
              onPress={openNewTask}
              style={[styles.emptyCtaBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>
                {lang === 'fa' ? 'ساخت اولین برنامه‌ت' : 'Create First Plan'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const subject = getSubject(task.subjectId);
            const pStyle = getPriorityBadgeStyle(task.priority);
            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: task.completed ? theme.border : `${subject.color}55`,
                    opacity: task.completed ? 0.72 : 1,
                  },
                ]}
              >
                <View style={[styles.taskTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TouchableOpacity
                    onPress={() => toggleTaskComplete(task.id)}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: task.completed ? theme.success : theme.textMuted,
                        backgroundColor: task.completed ? theme.success : 'transparent',
                      },
                    ]}
                  >
                    {task.completed ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
                  </TouchableOpacity>

                  <TouchableOpacity style={{ flex: 1 }} onPress={() => openEditTask(task)} activeOpacity={0.75}>
                    <Text
                      style={[
                        styles.taskTitle,
                        {
                          color: theme.text,
                          textAlign: isRTL ? 'right' : 'left',
                          textDecorationLine: task.completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {task.title}
                    </Text>
                    {task.description ? (
                      <Text
                        numberOfLines={2}
                        style={[styles.taskDesc, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}
                      >
                        {task.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                </View>

                {/* Metadata Badges */}
                <View style={[styles.badgesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.badge, { backgroundColor: `${subject.color}22` }]}>
                    <Text style={[styles.badgeText, { color: subject.color }]}>
                      {lang === 'fa' ? subject.nameFa : subject.nameEn}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: pStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: pStyle.text }]}>
                      {getPriorityLabel(task.priority, lang)}
                    </Text>
                  </View>
                  {task.timeLabel ? (
                    <View style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
                      <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                        ⏰ {localizeDigits(task.timeLabel, lang)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={[styles.badge, { backgroundColor: theme.surfaceMuted }]}>
                    <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                      🍅 {localizeDigits(task.completedPomodoros, lang)}/{localizeDigits(task.estimatedPomodoros, lang)}
                    </Text>
                  </View>
                </View>

                {/* Inline Subtasks */}
                {task.subtasks.length > 0 ? (
                  <View style={[styles.subtaskList, { borderTopColor: theme.border }]}>
                    {task.subtasks.map((st) => (
                      <TouchableOpacity
                        key={st.id}
                        onPress={() => toggleSubtaskComplete(task.id, st.id)}
                        style={[styles.subtaskRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      >
                        <Ionicons
                          name={st.completed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={st.completed ? theme.success : theme.textMuted}
                        />
                        <Text
                          style={[
                            styles.subtaskText,
                            {
                              color: st.completed ? theme.textMuted : theme.textSecondary,
                              textAlign: isRTL ? 'right' : 'left',
                              textDecorationLine: st.completed ? 'line-through' : 'none',
                            },
                          ]}
                        >
                          {st.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Footer Actions */}
                <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TouchableOpacity
                    onPress={() => startPomodoroForTask(task)}
                    style={[styles.focusCta, { backgroundColor: theme.primarySoft }]}
                  >
                    <Ionicons name="timer-outline" size={15} color={theme.primary} />
                    <Text style={[styles.focusCtaText, { color: theme.primary }]}>
                      {strings.planner.startFocus}
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.footerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity onPress={() => openEditTask(task)} style={styles.iconBtn}>
                      <Ionicons name="create-outline" size={17} color={theme.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteTask(task.id)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={17} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      )}

      {/* Add / Edit Task Modal */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingTaskId ? strings.planner.editTaskTitle : strings.planner.addTaskTitle}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={strings.planner.titlePlaceholder}
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    color: theme.text,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
              />

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={strings.planner.descPlaceholder}
                placeholderTextColor={theme.textMuted}
                multiline
                style={[
                  styles.input,
                  styles.multilineInput,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    color: theme.text,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {strings.planner.subjectLabel}
              </Text>
              <View style={[styles.chipsWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {state.subjects.map((sub) => {
                  const selected = sub.id === subjectId;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => setSubjectId(sub.id)}
                      style={[
                        styles.selectChip,
                        {
                          backgroundColor: selected ? `${sub.color}28` : theme.surfaceElevated,
                          borderColor: selected ? sub.color : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? sub.color : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                        {lang === 'fa' ? sub.nameFa : sub.nameEn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {strings.planner.priorityLabel}
              </Text>
              <View style={[styles.chipsWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => {
                  const selected = priority === p;
                  const ps = getPriorityBadgeStyle(p);
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[
                        styles.selectChip,
                        {
                          backgroundColor: selected ? ps.bg : theme.surfaceElevated,
                          borderColor: selected ? ps.text : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ color: selected ? ps.text : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                        {getPriorityLabel(p, lang)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.inlineRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={timeLabel}
                    onChangeText={setTimeLabel}
                    placeholder={strings.planner.timePlaceholder}
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.border,
                        color: theme.text,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  />
                </View>

                <View style={[styles.stepperBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Text style={{ color: theme.textMuted, fontSize: 11 }}>{strings.planner.estPomodoros}</Text>
                  <View style={styles.stepperBtns}>
                    <TouchableOpacity onPress={() => setEstPomodoros((c) => Math.max(1, c - 1))}>
                      <Ionicons name="remove-circle" size={22} color={theme.textMuted} />
                    </TouchableOpacity>
                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>
                      🍅 {localizeDigits(estPomodoros, lang)}
                    </Text>
                    <TouchableOpacity onPress={() => setEstPomodoros((c) => Math.min(12, c + 1))}>
                      <Ionicons name="add-circle" size={22} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Subtasks Builder */}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                {strings.planner.subtasks}
              </Text>
              <View style={[styles.addSubRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TextInput
                  value={newSubtaskText}
                  onChangeText={setNewSubtaskText}
                  onSubmitEditing={handleAddDraftSubtask}
                  placeholder={strings.planner.addSubtaskPlaceholder}
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      marginBottom: 0,
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                      color: theme.text,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                  ]}
                />
                <TouchableOpacity
                  onPress={handleAddDraftSubtask}
                  style={[styles.addMiniBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {subtasks.map((st) => (
                <View
                  key={st.id}
                  style={[styles.draftSubRow, { borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                >
                  <Text style={{ color: theme.textSecondary, flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                    • {st.title}
                  </Text>
                  <TouchableOpacity onPress={() => setSubtasks((prev) => prev.filter((x) => x.id !== st.id))}>
                    <Ionicons name="close-circle" size={18} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.modalFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                onPress={handleSaveTask}
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.saveBtnText}>{strings.planner.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalOpen(false)}
                style={[styles.cancelBtn, { borderColor: theme.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>
                  {strings.planner.cancel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subject Manager Modal */}
      <Modal visible={subjectModalOpen} transparent animationType="fade" onRequestClose={() => setSubjectModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.planner.manageSubjects}</Text>
              <TouchableOpacity onPress={() => setSubjectModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.addSubRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                value={newSubjectName}
                onChangeText={setNewSubjectName}
                placeholder={strings.planner.newSubjectPlaceholder}
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.input,
                  {
                    flex: 1,
                    marginBottom: 0,
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    color: theme.text,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
              />
              <TouchableOpacity
                onPress={() => {
                  addSubject(newSubjectName, newSubjectColor, 'book-outline');
                  setNewSubjectName('');
                }}
                style={[styles.addMiniBtn, { backgroundColor: newSubjectColor }]}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.swatchRow}>
              {SUBJECT_SWATCHES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setNewSubjectColor(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c, borderColor: newSubjectColor === c ? '#FFFFFF' : 'transparent', borderWidth: 3 },
                  ]}
                />
              ))}
            </View>

            <View style={{ gap: 8, marginTop: 12 }}>
              {state.subjects.map((sub) => (
                <View
                  key={sub.id}
                  style={[
                    styles.subjectManageItem,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <View style={[styles.colorDot, { backgroundColor: sub.color, width: 12, height: 12 }]} />
                  <Text style={{ flex: 1, color: theme.text, fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>
                    {lang === 'fa' ? sub.nameFa : sub.nameEn}
                  </Text>
                  {state.subjects.length > 1 ? (
                    <TouchableOpacity onPress={() => deleteSubject(sub.id)}>
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Optional 1-tap Suggested Subject Presets (user chooses what to add) */}
            <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 14, textAlign: isRTL ? 'right' : 'left' }]}>
              {lang === 'fa' ? 'افزودن سریع دسته‌بندی پیشنهادی:' : 'Quick Add Suggested Categories:'}
            </Text>
            <View style={[styles.chipsWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {SUGGESTED_SUBJECT_PRESETS.filter(
                (p) => !state.subjects.some((s) => s.nameFa === p.nameFa)
              ).map((preset) => (
                <TouchableOpacity
                  key={preset.nameFa}
                  onPress={() => addSubject(lang === 'fa' ? preset.nameFa : preset.nameEn, preset.color, preset.icon)}
                  style={[styles.selectChip, { backgroundColor: `${preset.color}1C`, borderColor: preset.color }]}
                >
                  <Text style={{ color: preset.color, fontSize: 11.5, fontWeight: '800' }}>
                    + {lang === 'fa' ? preset.nameFa : preset.nameEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <DailyMoodPrompt
        forceOpen={moodPromptOpen}
        onForceClose={() => setMoodPromptOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  topSegmentWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  segmentBar: { borderRadius: 18, borderWidth: 1, padding: 5, gap: 4 },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 13,
  },
  scrollContent: { padding: 16, paddingBottom: 110 },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  heroTopUtility: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  heroBadgesCluster: { alignItems: 'center', gap: 6 },
  heroRow: { alignItems: 'center', gap: 12 },
  streakPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  streakText: { fontSize: 11.5, fontWeight: '800' },
  heroTitle: { fontSize: 22, fontWeight: '900' },
  heroSubtitle: { fontSize: 13, marginTop: 2, lineHeight: 19 },
  moodChip: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  heroProgressWrap: { marginTop: 14 },
  heroProgressMeta: { justifyContent: 'space-between', marginBottom: 6 },
  metaText: { fontSize: 12 },
  progressTrack: { height: 8, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  heroActions: { gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 15,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 15,
    borderWidth: 1,
  },
  secondaryBtnText: { fontWeight: '700', fontSize: 12 },
  featureShortcutRow: { gap: 8, marginTop: 10 },
  shortcutBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
  },
  countBubble: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  weekStrip: { gap: 8, paddingVertical: 4 },
  dayChip: {
    width: 54,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayWeekday: { fontSize: 11, fontWeight: '700' },
  dayNum: { fontSize: 16, fontWeight: '800' },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  dateMetaRow: { justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 10 },
  selectedDateFull: { fontSize: 12, fontWeight: '600' },
  dayBanner: { alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  filterRow: { gap: 8, paddingBottom: 12 },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterPillText: { fontSize: 12, fontWeight: '700' },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  emptyBox: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  emptySub: { fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 16,
  },
  taskCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 15,
    marginBottom: 12,
  },
  taskTop: { alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskTitle: { fontSize: 15, fontWeight: '800', lineHeight: 22 },
  taskDesc: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  badgesRow: { flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  subtaskList: { borderTopWidth: 1, marginTop: 10, paddingTop: 8, gap: 6 },
  subtaskRow: { alignItems: 'center', gap: 8 },
  subtaskText: { fontSize: 12, flex: 1 },
  cardFooter: { justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  focusCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  focusCtaText: { fontSize: 12, fontWeight: '800' },
  footerRight: { gap: 8 },
  iconBtn: { padding: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    maxHeight: '88%',
  },
  modalHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  multilineInput: { minHeight: 72, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  chipsWrap: { flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  selectChip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  inlineRow: { gap: 10, alignItems: 'stretch', marginBottom: 6 },
  stepperBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepperBtns: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  addSubRow: { gap: 8, alignItems: 'center', marginBottom: 8 },
  addMiniBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  draftSubRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalFooter: { gap: 10, marginTop: 14 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  cancelBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', fontSize: 14 },
  swatchRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  subjectManageItem: {
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
});
