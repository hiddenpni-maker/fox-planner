import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../components/FoxText';
import { Ionicons } from '@expo/vector-icons';
import { FoxMascot } from '../components/FoxMascot';
import { SectionHelpButton } from '../components/SectionHelpButton';
import { DAILY_HEALTH_HABITS, WELLNESS_GUIDES } from '../data/wellnessGuides';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore, type WellnessSectionKey } from '../store/FoxStoreContext';
import type { WellnessCategory } from '../types/planner';
import { toDateKey } from '../utils/dateUtils';

type GuideFilter = 'all' | WellnessCategory;

export function WellnessScreen() {
  const {
    state,
    theme,
    strings,
    isRTL,
    wellnessSection,
    setWellnessSection,
    toggleGuideBookmark,
    toggleDailyHabit,
  } = useFoxStore();

  const lang = state.language;
  const todayKey = toDateKey();

  const [categoryFilter, setCategoryFilter] = useState<GuideFilter>('all');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [expandedIds, setExpandedIds] = useState<string[]>(['deep-focus-protocol']);

  // Interactive 4-4-4-4 Box Breathing state + animated circle
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingTick, setBreathingTick] = useState(0);
  const breathScale = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    if (!breathingActive) {
      Animated.timing(breathScale, { toValue: 0.82, duration: 300, useNativeDriver: true }).start();
      return;
    }
    const t = setInterval(() => {
      setBreathingTick((prev) => {
        if (prev >= 63) {
          setBreathingActive(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [breathingActive, breathScale]);

  const cyclePos = breathingTick % 16;
  const breathPhaseLabel =
    cyclePos < 4
      ? strings.wellness.breathingInhale
      : cyclePos < 8
      ? strings.wellness.breathingHold
      : cyclePos < 12
      ? strings.wellness.breathingExhale
      : strings.wellness.breathingHold;
  const breathCountInPhase = 4 - (cyclePos % 4);

  useEffect(() => {
    if (!breathingActive) return;
    const target = cyclePos < 4 ? 1.18 : cyclePos < 8 ? 1.18 : cyclePos < 12 ? 0.78 : 0.78;
    Animated.timing(breathScale, {
      toValue: target,
      duration: 950,
      useNativeDriver: true,
    }).start();
  }, [breathingActive, breathScale, cyclePos]);

  const todayHabits =
    state.wellnessLogs.find((l) => l.dateKey === todayKey)?.completedHabitIds ?? [];

  const filteredGuides = useMemo(() => {
    return WELLNESS_GUIDES.filter((g) => {
      if (bookmarksOnly && !state.bookmarkedGuideIds.includes(g.id)) return false;
      if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter, bookmarksOnly, state.bookmarkedGuideIds]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const sectionTabs: Array<{ key: WellnessSectionKey; fa: string; en: string; icon: string }> = [
    { key: 'guides', fa: 'تکنیک‌های مطالعه', en: 'Guides', icon: 'book-outline' },
    { key: 'habits', fa: 'عادت‌های سلامت', en: 'Habits', icon: 'heart-outline' },
    { key: 'breathing', fa: 'تنفس آرام', en: 'Breathe', icon: 'leaf-outline' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* Clean Header + 3-Part Sub-Navigation */}
      <View style={styles.topSectionWrap}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            {strings.wellness.title}
          </Text>
          <SectionHelpButton
            titleFa="راهنمای بخش آکادمی و آرامش"
            titleEn="Academy & Wellness Guide"
            tipsFa={[
              'این صفحه برای تمرکز و آرامش ذهن به ۳ پنل مجزا تقسیم شده: تکنیک‌های علمی مطالعه، عادت‌های روزانه و تنفس ۴-۴-۴-۴.',
              'برای تنظیم تم‌های جدید، صدا، قفل PIN و کانال تلگرام سازنده از چرخ‌دنده گوشه بالا سمت راست استفاده کن.',
            ]}
            tipsEn={[
              'Calmly organized into 3 clean panels: Study Guides, Daily Habits, and 4-4-4-4 Breathing.',
              'Themes, audio settings, security PIN, and Telegram creator links now live cleanly in the top-right gear menu.',
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
          {sectionTabs.map((tab) => {
            const active = wellnessSection === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setWellnessSection(tab.key)}
                style={[
                  styles.segmentBtn,
                  {
                    backgroundColor: active ? theme.primarySoft : 'transparent',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Ionicons
                  name={tab.icon as never}
                  size={15}
                  color={active ? theme.primary : theme.textMuted}
                />
                <Text style={{ color: active ? theme.primary : theme.textMuted, fontSize: 12, fontWeight: active ? '900' : '700' }}>
                  {lang === 'fa' ? tab.fa : tab.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* PANEL 1: Guides */}
        {wellnessSection === 'guides' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              {([
                ['all', strings.wellness.catAll],
                ['focus', strings.wellness.catFocus],
                ['study', strings.wellness.catStudy],
                ['rest', strings.wellness.catRest],
                ['health', strings.wellness.catHealth],
              ] as [GuideFilter, string][]).map(([key, label]) => {
                const active = categoryFilter === key && !bookmarksOnly;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      setBookmarksOnly(false);
                      setCategoryFilter(key);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? theme.primarySoft : theme.surface,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={{ color: active ? theme.primary : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => setBookmarksOnly((v) => !v)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: bookmarksOnly ? theme.warningSoft : theme.surface,
                    borderColor: bookmarksOnly ? theme.warning : theme.border,
                  },
                ]}
              >
                <Text style={{ color: bookmarksOnly ? theme.warning : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                  ★ {strings.wellness.bookmarksOnly}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {filteredGuides.map((guide) => {
              const expanded = expandedIds.includes(guide.id);
              const bookmarked = state.bookmarkedGuideIds.includes(guide.id);
              const steps = lang === 'fa' ? guide.stepsFa : guide.stepsEn;

              return (
                <View
                  key={guide.id}
                  style={[
                    styles.guideCard,
                    { backgroundColor: theme.surface, borderColor: expanded ? guide.accent : theme.border },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleExpand(guide.id)}
                    style={[styles.guideHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  >
                    <View style={[styles.guideIconBox, { backgroundColor: `${guide.accent}24` }]}>
                      <Ionicons name={guide.icon as never} size={20} color={guide.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.guideTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                        {lang === 'fa' ? guide.titleFa : guide.titleEn}
                      </Text>
                      <Text style={[styles.guideSummary, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {lang === 'fa' ? guide.summaryFa : guide.summaryEn}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleGuideBookmark(guide.id)} style={{ padding: 4 }}>
                      <Ionicons
                        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={bookmarked ? theme.warning : theme.textMuted}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {expanded ? (
                    <View style={[styles.guideBody, { borderTopColor: theme.border }]}>
                      {steps.map((step, i) => (
                        <View key={i} style={[styles.stepRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <View style={[styles.stepNum, { backgroundColor: `${guide.accent}25` }]}>
                            <Text style={{ color: guide.accent, fontSize: 11, fontWeight: '900' }}>
                              {localizeDigits(i + 1, lang)}
                            </Text>
                          </View>
                          <Text style={[styles.stepText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                            {step}
                          </Text>
                        </View>
                      ))}

                      <View style={[styles.scienceBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                        <Text style={[styles.scienceLabel, { color: guide.accent, textAlign: isRTL ? 'right' : 'left' }]}>
                          🧬 {strings.wellness.scienceLabel}
                        </Text>
                        <Text style={[styles.scienceText, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                          {lang === 'fa' ? guide.scienceNoteFa : guide.scienceNoteEn}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : null}

        {/* PANEL 2: Daily Health Habits */}
        {wellnessSection === 'habits' ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.checkHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.cardHeading, { color: theme.text }]}>{strings.wellness.dailyChecklistTitle}</Text>
              <Text style={{ color: theme.success, fontWeight: '900', fontSize: 13 }}>
                {localizeDigits(todayHabits.length, lang)} / {localizeDigits(DAILY_HEALTH_HABITS.length, lang)}
              </Text>
            </View>

            {DAILY_HEALTH_HABITS.map((habit) => {
              const done = todayHabits.includes(habit.id);
              return (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => toggleDailyHabit(habit.id, todayKey)}
                  style={[
                    styles.habitRow,
                    {
                      backgroundColor: done ? theme.successSoft : theme.surfaceElevated,
                      borderColor: done ? theme.success : theme.border,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <Ionicons
                    name={done ? 'checkmark-circle' : (habit.icon as never)}
                    size={22}
                    color={done ? theme.success : theme.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.habitTitle,
                        {
                          color: theme.text,
                          textAlign: isRTL ? 'right' : 'left',
                          textDecorationLine: done ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {lang === 'fa' ? habit.titleFa : habit.titleEn}
                    </Text>
                    <Text style={[styles.habitDetail, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {lang === 'fa' ? habit.detailFa : habit.detailEn}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* PANEL 3: Guided Animated Box Breathing */}
        {wellnessSection === 'breathing' ? (
          <View style={[styles.breathHeroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.cardHeading, { color: theme.text, textAlign: 'center' }]}>
              {strings.wellness.breathingTitle}
            </Text>
            <Text style={[styles.breathSub, { color: theme.textMuted, textAlign: 'center', marginTop: 6 }]}>
              {lang === 'fa'
                ? 'کاهش فوری استرس امتحان و آرام‌سازی ذهن پیش از شروع تمرکز'
                : 'Reduce pre-study anxiety and calm focus in 60 gentle seconds'}
            </Text>

            <View style={styles.breathCircleStage}>
              <Animated.View
                style={[
                  styles.breathHalo,
                  {
                    backgroundColor: breathingActive ? theme.successSoft : theme.primarySoft,
                    borderColor: breathingActive ? theme.success : theme.primary,
                    transform: [{ scale: breathScale }],
                  },
                ]}
              >
                <FoxMascot mood={breathingActive ? 'calm' : 'rest'} size={86} theme={theme} />
              </Animated.View>
            </View>

            {breathingActive ? (
              <Text style={[styles.breathCue, { color: theme.success, textAlign: 'center' }]}>
                {breathPhaseLabel} ({localizeDigits(breathCountInPhase, lang)})
              </Text>
            ) : (
              <Text style={{ color: theme.textSecondary, fontSize: 12.5, textAlign: 'center', fontWeight: '700' }}>
                {lang === 'fa' ? '۴ ثانیه دم • ۴ ثانیه حبس • ۴ ثانیه بازدم • ۴ ثانیه سکوت' : '4s Inhale • 4s Hold • 4s Exhale • 4s Hold'}
              </Text>
            )}

            <TouchableOpacity
              onPress={() => {
                if (breathingActive) {
                  setBreathingActive(false);
                  setBreathingTick(0);
                } else {
                  setBreathingTick(0);
                  setBreathingActive(true);
                }
              }}
              style={[
                styles.breathBigBtn,
                { backgroundColor: breathingActive ? theme.dangerSoft : theme.success },
              ]}
            >
              <Text style={{ color: breathingActive ? theme.danger : '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                {breathingActive ? strings.wellness.breathingStop : strings.wellness.breathingStart}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topSectionWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 10 },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontSize: 20, fontWeight: '900' },
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
  filterRow: { gap: 8, paddingVertical: 6, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  guideCard: { borderRadius: 22, borderWidth: 1, padding: 15, marginBottom: 12 },
  guideHeader: { alignItems: 'flex-start', gap: 10 },
  guideIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  guideTitle: { fontSize: 15, fontWeight: '800', lineHeight: 22 },
  guideSummary: { fontSize: 12, marginTop: 4, lineHeight: 19 },
  guideBody: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 10 },
  stepRow: { alignItems: 'flex-start', gap: 8 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepText: { flex: 1, fontSize: 13, lineHeight: 20 },
  scienceBox: { borderRadius: 14, borderWidth: 1, padding: 11, marginTop: 4 },
  scienceLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  scienceText: { fontSize: 12, lineHeight: 18 },
  card: { borderRadius: 24, borderWidth: 1, padding: 16, marginBottom: 12 },
  checkHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeading: { fontSize: 16, fontWeight: '900' },
  habitRow: { borderWidth: 1, borderRadius: 16, padding: 12, alignItems: 'center', gap: 10, marginBottom: 9 },
  habitTitle: { fontSize: 13.5, fontWeight: '800' },
  habitDetail: { fontSize: 11.5, marginTop: 3, lineHeight: 17 },
  breathHeroCard: { borderRadius: 26, borderWidth: 1, padding: 22, alignItems: 'center' },
  breathSub: { fontSize: 12.5, lineHeight: 19 },
  breathCircleStage: { height: 190, justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
  breathHalo: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathCue: { fontSize: 20, fontWeight: '900', marginBottom: 8 },
  breathBigBtn: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 16 },
});
