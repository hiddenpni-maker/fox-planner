import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, TextInput } from '../components/FoxText';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { FoxMascot } from '../components/FoxMascot';
import { SectionHelpButton } from '../components/SectionHelpButton';
import { formatMinutesLabel, localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import {
  buildDailySeries,
  buildSubjectBreakdown,
  computeProgressSnapshot,
} from '../utils/analytics';
import { formatDateChip, toDateKey } from '../utils/dateUtils';
import { dateKeyToJalali, JALALI_MONTH_NAMES_FA } from '../utils/jalaliCalendar';

type ProgressPanelTab = 'overview' | 'moods';

export function ProgressScreen() {
  const { state, theme, strings, isRTL, setDailyGoalMinutes } = useFoxStore();
  const lang = state.language;
  const todayKey = toDateKey();

  const [panelTab, setPanelTab] = useState<ProgressPanelTab>('overview');
  const [rangeDays, setRangeDays] = useState<7 | 14>(7);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(String(state.dailyGoalMinutes));

  const snapshot = useMemo(
    () => computeProgressSnapshot(state.sessions, state.tasks, todayKey),
    [state.sessions, state.tasks, todayKey]
  );

  const dailySeries = useMemo(
    () => buildDailySeries(state.sessions, rangeDays, todayKey),
    [state.sessions, rangeDays, todayKey]
  );

  const heatmapSeries = useMemo(
    () => buildDailySeries(state.sessions, 28, todayKey),
    [state.sessions, todayKey]
  );

  const subjectBreakdown = useMemo(
    () => buildSubjectBreakdown(state.sessions, state.subjects),
    [state.sessions, state.subjects]
  );

  const foxRank = useMemo(() => {
    const pts = state.foxPoints;
    if (pts >= 500) return { fa: 'قهرمان جنگل فاکس 🏆', en: 'Fox Legend 🏆', base: 500, nextAt: Math.max(1000, pts) };
    if (pts >= 200) return { fa: 'استاد تمرکز 🔥', en: 'Focus Master 🔥', base: 200, nextAt: 500 };
    if (pts >= 50) return { fa: 'شاگرد کوشا ✨', en: 'Rising Scholar ✨', base: 50, nextAt: 200 };
    return { fa: 'روباه کنجکاو 🌱', en: 'Curious Fox 🌱', base: 0, nextAt: 50 };
  }, [state.foxPoints]);

  const goalRatio = Math.min(1, snapshot.todayFocusMinutes / Math.max(1, state.dailyGoalMinutes));
  const ringR = 40;
  const ringC = 2 * Math.PI * ringR;

  // Smooth spring / easing animation driver for rings, bars, and rank XP fill
  const masterAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const [animatedPct, setAnimatedPct] = useState(0);

  const barAnimsRef = useRef<Animated.Value[]>(
    Array.from({ length: 14 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    masterAnim.setValue(0);
    xpAnim.setValue(0);
    barAnimsRef.forEach((b) => b.setValue(0));

    const listenerId = masterAnim.addListener(({ value }) => {
      setAnimatedPct(value);
    });

    const rankSpan = Math.max(1, foxRank.nextAt - foxRank.base);
    const rankProgress = Math.min(1, Math.max(0.08, (state.foxPoints - foxRank.base) / rankSpan));

    Animated.parallel([
      Animated.timing(masterAnim, {
        toValue: goalRatio,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(xpAnim, {
        toValue: rankProgress,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.stagger(
        55,
        barAnimsRef.slice(0, dailySeries.length).map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: false,
          })
        )
      ),
    ]).start();

    return () => {
      masterAnim.removeListener(listenerId);
    };
  }, [barAnimsRef, dailySeries.length, foxRank.base, foxRank.nextAt, goalRatio, masterAnim, rangeDays, state.foxPoints, xpAnim]);

  const maxMinutes = Math.max(state.dailyGoalMinutes, ...dailySeries.map((d) => d.focusMinutes), 60);
  const peakMinutes = Math.max(...dailySeries.map((d) => d.focusMinutes), 0);
  const selectedDay = selectedDayIdx !== null ? dailySeries[selectedDayIdx] : null;

  const xpBarWidth = xpAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const moodMoodBarColor = (score: number) => {
    if (score >= 5) return theme.success;
    if (score === 4) return theme.primary;
    if (score === 3) return theme.info;
    if (score === 2) return theme.warning;
    return theme.danger;
  };

  return (
    <View style={styles.root}>
      {/* Top Header + Clean 2-Tab Sub-Navigation */}
      <View style={styles.topHeader}>
        <View style={[styles.headerBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            {strings.progress.title}
          </Text>
          <SectionHelpButton
            titleFa="راهنمای نمودارهای زنده و حس روزانه"
            titleEn="Animated Progress Guide"
            tipsFa={[
              'می‌توانی روی هر ستون نمودار ضربه بزنی تا جزئیات مطالعه آن روز با لبخند روباه نمایش داده شود.',
              'برای جلوگیری از شلوغی، گزارش ساعات و نمودارها در بخش «آمار و نمودارها» و روند حال‌وهوا در «دفترچه حس» جدا شده‌اند.',
            ]}
            tipsEn={[
              'Tap any animated bar to inspect that day’s exact focus minutes.',
              'Switch cleanly between Study Charts and your Daily Mood Journal.',
            ]}
            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        </View>

        <View
          style={[
            styles.segmentBar,
            { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {([
            { key: 'overview' as const, fa: 'آمار و نمودارها 📊', en: 'Charts & Stats 📊' },
            { key: 'moods' as const, fa: 'روند حس و انرژی 😊', en: 'Mood Journal 😊' },
          ]).map((tab) => {
            const active = panelTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setPanelTab(tab.key)}
                style={[styles.segmentBtn, { backgroundColor: active ? theme.primarySoft : 'transparent' }]}
              >
                <Text style={{ color: active ? theme.primary : theme.textMuted, fontSize: 12.5, fontWeight: active ? '900' : '700' }}>
                  {lang === 'fa' ? tab.fa : tab.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {panelTab === 'overview' ? (
          <>
            {/* Fox Level & Animated XP Card */}
            <View style={[styles.foxRankCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.foxRankTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <FoxMascot mood={state.foxPoints >= 50 ? 'celebrate' : 'study'} size={58} theme={theme} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.primary, fontSize: 12.5, fontWeight: '900', textAlign: isRTL ? 'right' : 'left' }}>
                    {lang === 'fa' ? foxRank.fa : foxRank.en}
                  </Text>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900', marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                    {localizeDigits(state.foxPoints, lang)} {lang === 'fa' ? 'امتیاز روباه (XP)' : 'Fox XP'}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 11.5, marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                    {state.foxPoints >= 500
                      ? lang === 'fa'
                        ? 'قهرمان افسانه‌ای تمرکز!'
                        : 'Top Fox tier reached!'
                      : lang === 'fa'
                      ? `تا سطح بعدی: ${localizeDigits(foxRank.nextAt - state.foxPoints, lang)} امتیاز`
                      : `${foxRank.nextAt - state.foxPoints} XP to next rank`}
                  </Text>
                </View>
              </View>
              <View style={[styles.xpTrack, { backgroundColor: theme.surfaceMuted }]}>
                <Animated.View style={[styles.xpFill, { backgroundColor: theme.primary, width: xpBarWidth }]} />
              </View>
            </View>

            {/* Daily Goal Animated Ring Card */}
            <View
              style={[
                styles.goalCard,
                { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={96} height={96}>
                  <Circle cx={48} cy={48} r={ringR} stroke={theme.surfaceMuted} strokeWidth={9} fill="none" />
                  <Circle
                    cx={48}
                    cy={48}
                    r={ringR}
                    stroke={animatedPct >= 1 ? theme.success : theme.primary}
                    strokeWidth={9}
                    fill="none"
                    strokeDasharray={`${ringC} ${ringC}`}
                    strokeDashoffset={ringC * (1 - animatedPct)}
                    strokeLinecap="round"
                    transform="rotate(-90 48 48)"
                  />
                </Svg>
                <Text style={[styles.ringPct, { color: theme.text }]}>
                  {localizeDigits(Math.round(animatedPct * 100), lang)}%
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.goalTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                  {strings.progress.dailyGoal}
                </Text>
                <Text style={[styles.goalSub, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {strings.progress.todayMinutes}: {formatMinutesLabel(snapshot.todayFocusMinutes, lang)} /{' '}
                  {formatMinutesLabel(state.dailyGoalMinutes, lang)}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setGoalInput(String(state.dailyGoalMinutes));
                    setGoalModalOpen(true);
                  }}
                  style={[
                    styles.editGoalBtn,
                    { backgroundColor: theme.primarySoft, alignSelf: isRTL ? 'flex-end' : 'flex-start' },
                  ]}
                >
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '800' }}>
                    {strings.progress.editGoal}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Interactive Animated Bar Chart */}
            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.chartHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{strings.progress.weeklyChartTitle}</Text>
                <View style={styles.rangeSwitch}>
                  {([7, 14] as const).map((days) => (
                    <TouchableOpacity
                      key={days}
                      onPress={() => {
                        setSelectedDayIdx(null);
                        setRangeDays(days);
                      }}
                      style={[
                        styles.rangeBtn,
                        { backgroundColor: rangeDays === days ? theme.primary : theme.surfaceMuted },
                      ]}
                    >
                      <Text style={{ color: rangeDays === days ? '#FFFFFF' : theme.textSecondary, fontSize: 11, fontWeight: '800' }}>
                        {days === 7 ? strings.progress.range7 : strings.progress.range14}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tapped Day Floating Fox Callout */}
              {selectedDay ? (
                <View style={[styles.dayTooltip, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
                  <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '900' }}>
                    🦊 {formatDateChip(selectedDay.dateKey, lang).full}: {formatMinutesLabel(selectedDay.focusMinutes, lang)}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.animatedBarsArea, { borderBottomColor: theme.border }]}>
                {dailySeries.map((pt, idx) => {
                  const targetHeight = Math.max(8, Math.round((pt.focusMinutes / maxMinutes) * 114));
                  const barHeight = barAnimsRef[idx].interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, targetHeight],
                  });
                  const isToday = pt.dateKey === todayKey;
                  const isPeak = peakMinutes > 0 && pt.focusMinutes === peakMinutes;
                  const isSelected = selectedDayIdx === idx;
                  const barColor = isSelected
                    ? theme.accent
                    : isToday
                    ? theme.primary
                    : pt.focusMinutes >= state.dailyGoalMinutes
                    ? theme.success
                    : theme.info;
                  const dayInfo = formatDateChip(pt.dateKey, lang);

                  return (
                    <TouchableOpacity
                      key={pt.dateKey}
                      activeOpacity={0.8}
                      onPress={() => setSelectedDayIdx(idx === selectedDayIdx ? null : idx)}
                      style={styles.barCol}
                    >
                      <View style={styles.barEmojiSlot}>
                        {isPeak ? <Text style={{ fontSize: 12 }}>👑</Text> : pt.focusMinutes > 0 ? <Text style={{ fontSize: 10 }}>✨</Text> : null}
                      </View>
                      <View style={styles.barTrack}>
                        <Animated.View
                          style={[
                            styles.barFill,
                            {
                              height: barHeight,
                              backgroundColor: barColor,
                              opacity: pt.focusMinutes === 0 ? 0.25 : 0.95,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 9.5,
                          color: isToday || isSelected ? theme.primary : theme.textMuted,
                          fontWeight: isToday || isSelected ? '900' : '600',
                          marginTop: 5,
                        }}
                      >
                        {rangeDays === 7 ? dayInfo.weekday : dayInfo.dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4 Compact KPI Pills */}
            <View style={styles.kpiGrid}>
              {[
                {
                  icon: 'flame-outline',
                  color: theme.primary,
                  val: `${localizeDigits(snapshot.currentStreakDays, lang)} ${strings.progress.days}`,
                  label: strings.progress.streak,
                },
                {
                  icon: 'time-outline',
                  color: theme.info,
                  val: formatMinutesLabel(snapshot.totalFocusMinutes, lang),
                  label: strings.progress.totalStudy,
                },
                {
                  icon: 'trophy-outline',
                  color: theme.warning,
                  val: `${localizeDigits(snapshot.totalCompletedPomodoros, lang)}`,
                  label: strings.progress.totalPomodoros,
                },
                {
                  icon: 'checkmark-done-outline',
                  color: theme.success,
                  val: `${localizeDigits(snapshot.taskCompletionRate, lang)}%`,
                  label: strings.progress.completionRate,
                },
              ].map((kpi) => (
                <View key={kpi.label} style={[styles.kpiCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name={kpi.icon as never} size={20} color={kpi.color} />
                  <Text style={[styles.kpiValue, { color: theme.text }]}>{kpi.val}</Text>
                  <Text style={[styles.kpiLabel, { color: theme.textMuted }]}>{kpi.label}</Text>
                </View>
              ))}
            </View>

            {/* Subject Breakdown & 28-Day Heatmap */}
            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }]}>
                {strings.progress.subjectBreakdown}
              </Text>
              {subjectBreakdown.length === 0 ? (
                <Text style={{ color: theme.textMuted, fontSize: 12.5, textAlign: isRTL ? 'right' : 'left' }}>
                  {lang === 'fa'
                    ? 'بعد از تکمیل اولین پومودورو، نمودار درصدی درس‌ها اینجا پر می‌شود.'
                    : 'Subject share bars animate here once you log a Pomodoro.'}
                </Text>
              ) : (
                subjectBreakdown.map((item) => {
                  const subFillW = xpAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['4%', `${Math.max(4, item.percentage)}%`],
                  });
                  return (
                    <View key={item.subject.id} style={{ marginBottom: 11 }}>
                      <View style={[styles.subjectMetaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>
                          {lang === 'fa' ? item.subject.nameFa : item.subject.nameEn}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                          {formatMinutesLabel(item.minutes, lang)} ({localizeDigits(item.percentage, lang)}%)
                        </Text>
                      </View>
                      <View style={[styles.subjectTrack, { backgroundColor: theme.surfaceMuted }]}>
                        <Animated.View
                          style={{
                            width: subFillW,
                            height: '100%',
                            backgroundColor: item.subject.color,
                            borderRadius: 6,
                          }}
                        />
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }]}>
                {strings.progress.heatmapTitle}
              </Text>
              <View style={styles.heatmapGrid}>
                {heatmapSeries.map((pt) => {
                  const ratio = pt.focusMinutes / Math.max(1, state.dailyGoalMinutes);
                  const cellColor =
                    pt.focusMinutes === 0
                      ? theme.surfaceMuted
                      : ratio >= 1
                      ? theme.primary
                      : ratio >= 0.5
                      ? `${theme.primary}B0`
                      : `${theme.primary}55`;
                  return (
                    <View
                      key={pt.dateKey}
                      style={[
                        styles.heatCell,
                        {
                          backgroundColor: cellColor,
                          borderColor: pt.dateKey === todayKey ? theme.text : 'transparent',
                          borderWidth: pt.dateKey === todayKey ? 1.5 : 0,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          /* PANEL 2: Fun Animated Emoji Mood Journal */
          <>
            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left', marginBottom: 6 }]}>
                {lang === 'fa' ? 'نمودار احساسات و انرژی هفته 😊🔥' : 'Weekly Mood & Energy Waves 😊🔥'}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 14, textAlign: isRTL ? 'right' : 'left' }}>
                {lang === 'fa'
                  ? 'نمره‌ی حس‌وحال هر روزت با شکلک و ستون رنگی نرم نمایش داده می‌شود.'
                  : 'Your daily mood scores visualized smoothly with playful emoji bars.'}
              </Text>

              {state.moodLogs.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 18, gap: 10 }}>
                  <FoxMascot mood="calm" size={68} theme={theme} />
                  <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center' }}>
                    {lang === 'fa'
                      ? 'هنوز حس امروزت رو ثبت نکردی! از صفحه‌ی پلنر می‌تونی ثبتش کنی.'
                      : 'No mood logged yet—tap today’s mood chip on Planner!'}
                  </Text>
                </View>
              ) : (
                <>
                  <View style={[styles.moodBarsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {state.moodLogs.slice(0, 7).reverse().map((m) => {
                      const j = dateKeyToJalali(m.dateKey);
                      const colColor = moodMoodBarColor(m.score);
                      const heightPct = 20 + m.score * 16;
                      return (
                        <View key={m.dateKey} style={styles.moodBarCol}>
                          <Text style={{ fontSize: 20, marginBottom: 4 }}>{m.emoji}</Text>
                          <View style={styles.moodBarBg}>
                            <View
                              style={[
                                styles.moodBarFill,
                                { height: `${heightPct}%`, backgroundColor: colColor },
                              ]}
                            />
                          </View>
                          <Text style={{ color: theme.textMuted, fontSize: 10, marginTop: 4, fontWeight: '700' }}>
                            {localizeDigits(j.jd, lang)}/{localizeDigits(j.jm, lang)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ gap: 8, marginTop: 14 }}>
                    {state.moodLogs.slice(0, 7).map((m) => {
                      const j = dateKeyToJalali(m.dateKey);
                      return (
                        <View
                          key={m.dateKey}
                          style={[
                            styles.moodRow,
                            { backgroundColor: theme.surfaceElevated, flexDirection: isRTL ? 'row-reverse' : 'row' },
                          ]}
                        >
                          <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.text, fontSize: 13, fontWeight: '800', textAlign: isRTL ? 'right' : 'left' }}>
                              {lang === 'fa' ? m.labelFa : m.labelEn} ({localizeDigits(m.score, lang)}/{localizeDigits(5, lang)})
                            </Text>
                            {m.note ? (
                              <Text style={{ color: theme.textSecondary, fontSize: 11.5, textAlign: isRTL ? 'right' : 'left' }}>
                                {m.note}
                              </Text>
                            ) : null}
                          </View>
                          <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700' }}>
                            {localizeDigits(j.jd, lang)} {JALALI_MONTH_NAMES_FA[j.jm - 1]}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Goal Modal */}
      <Modal visible={goalModalOpen} transparent animationType="fade" onRequestClose={() => setGoalModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 10, textAlign: isRTL ? 'right' : 'left' }]}>
              {strings.progress.editGoal}
            </Text>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="numeric"
              style={[
                styles.goalInput,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border, color: theme.text },
              ]}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setDailyGoalMinutes(parseInt(goalInput, 10) || 120);
                  setGoalModalOpen(false);
                }}
                style={[styles.goalSaveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{strings.planner.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setGoalModalOpen(false)}
                style={[styles.goalCancelBtn, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{strings.planner.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  topHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 10 },
  headerBar: { alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 20, fontWeight: '900' },
  segmentBar: { borderRadius: 18, borderWidth: 1, padding: 5, gap: 4 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 13 },
  scrollContent: { padding: 16, paddingBottom: 110 },
  foxRankCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12, marginBottom: 12 },
  foxRankTop: { alignItems: 'center', gap: 14 },
  xpTrack: { height: 9, borderRadius: 5, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: 5 },
  goalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  ringPct: { position: 'absolute', fontSize: 16, fontWeight: '900' },
  goalTitle: { fontSize: 16, fontWeight: '800' },
  goalSub: { fontSize: 12, marginTop: 4 },
  editGoalBtn: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  kpiCard: { width: '48.4%', borderRadius: 20, borderWidth: 1, padding: 13, gap: 4 },
  kpiValue: { fontSize: 17, fontWeight: '900', marginTop: 4 },
  kpiLabel: { fontSize: 11, fontWeight: '600' },
  chartCard: { borderRadius: 22, borderWidth: 1, padding: 15, marginBottom: 12 },
  chartHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '900' },
  rangeSwitch: { flexDirection: 'row', gap: 6 },
  rangeBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  dayTooltip: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  animatedBarsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barEmojiSlot: { height: 18, justifyContent: 'center', alignItems: 'center' },
  barTrack: { height: 114, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  barFill: { width: '68%', minWidth: 8, maxWidth: 24, borderRadius: 8 },
  subjectMetaRow: { justifyContent: 'space-between', marginBottom: 5 },
  subjectTrack: { height: 9, borderRadius: 6, overflow: 'hidden' },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  heatCell: { width: '12.2%', aspectRatio: 1, borderRadius: 7 },
  moodBarsRow: { height: 150, alignItems: 'flex-end', justifyContent: 'space-around', gap: 6, paddingTop: 10 },
  moodBarCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  moodBarBg: { width: '60%', maxWidth: 26, height: 95, justifyContent: 'flex-end', alignItems: 'center' },
  moodBarFill: { width: '100%', borderRadius: 9 },
  moodRow: { borderRadius: 16, padding: 11, alignItems: 'center', gap: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 22, borderWidth: 1, padding: 18 },
  goalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontWeight: '700' },
  goalSaveBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  goalCancelBtn: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
});
