import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './FoxText';
import { Ionicons } from '@expo/vector-icons';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import { THEME_PRESETS } from '../theme/tokens';
import type { ThemePresetId } from '../types/planner';
import { FoxMascot, type FoxMood } from './FoxMascot';

interface LiveTourStep {
  tab: 'planner' | 'pomodoro' | 'notes' | 'progress' | 'wellness';
  plannerSection?: 'tasks' | 'calendar' | 'reminders';
  wellnessSection?: 'guides' | 'habits' | 'breathing';
  highlightCornerMenu?: boolean;
  mood: FoxMood;
  badgeFa: string;
  badgeEn: string;
  speechFa: string;
  speechEn: string;
}

const TOUR_STEPS: LiveTourStep[] = [
  {
    tab: 'planner',
    plannerSection: 'tasks',
    mood: 'celebrate',
    badgeFa: 'خوش‌آمدگویی • فاکس پلنر چیه؟ (۱ از ۸)',
    badgeEn: 'Welcome • What is Fox Planner? (1/8)',
    speechFa:
      'سلام! به فاکس پلنر خوش اومدی 🦊✨ اینجا یک دستیار همه‌کاره‌ست برای اینکه کارها و درس‌هات رو برنامه‌ریزی کنی، با تمرکز درس بخونی، جزوه برداری و رشدت رو ببینی! الان تو بخش «برنامه‌ها» هستیم؛ با دکمه‌ی + برنامه جدید می‌تونی کارهای هر روزت رو بنویسی.',
    speechEn:
      'Welcome to Fox Planner 🦊✨ Your all-in-one study & daily organization companion to plan tasks, focus deeply, take rich notes, and track growth! Right now we are in Tasks—tap + New Task to add your daily goals.',
  },
  {
    tab: 'planner',
    plannerSection: 'calendar',
    mood: 'study',
    badgeFa: 'تقویم شمسی و مناسبت‌ها 📅 (۲ از ۸)',
    badgeEn: 'Jalali Calendar & Occasions 📅 (2/8)',
    speechFa:
      'از بالای پلنر اومدیم تو تب «تقویم و مناسبت» 📅 اینجا یک تقویم شمسی کامله که مناسبت‌های دانشجویی و ملی رو نشون می‌ده و می‌تونی روزهای امتحان، تحویل پروژه یا کارهای مهمت رو روش علامت بزنی.',
    speechEn:
      'Now we switched to Calendar 📅 It gives you a full Persian calendar with key occasions, plus a way to pin your own exams, deadlines, and events.',
  },
  {
    tab: 'planner',
    plannerSection: 'reminders',
    mood: 'focus',
    badgeFa: 'بخش یادآورهای هوشمند ⏰ (۳ از ۸)',
    badgeEn: 'Smart Reminders ⏰ (3/8)',
    speechFa:
      'اینجا بخش «یادآورها» هست ⏰ اگر می‌خوای کاری رو سر یک ساعت مشخص انجام بدی، ساعت و جزئیاتش رو اینجا بنویس. می‌تونی لحن پیام رو هم انتخاب کنی (شوخ و روباهی، انگیزشی یا آرام) تا سر وقت با زنگ صدات بزنم!',
    speechEn:
      'This is Reminders ⏰ Set exact hours, custom task details, and repeat schedules, and pick how I nudge you (playful, energizing, or gentle)!',
  },
  {
    tab: 'pomodoro',
    mood: 'focus',
    badgeFa: 'پومودورو چیه؟ 🍅 (۴ از ۸)',
    badgeEn: 'What is Pomodoro? 🍅 (4/8)',
    speechFa:
      'حالا اومدیم توی «پومودورو» 🍅 شاید اسمش برات جدید باشه، اما خیلی ساده‌ست: مغز انسان بعد از ۲۵ دقیقه تمرکز پیوسته خسته می‌شه! پومودورو یعنی ۲۵ دقیقه درس خوندن واقعی بدون گوشی + ۵ دقیقه استراحت کوتاه. این تایمر زمان‌ها رو می‌شماره و بهت امتیاز می‌ده!',
    speechEn:
      'Welcome to Pomodoro 🍅 It is a famous focus technique: study deeply for 25 minutes with zero distractions, then take a 5-minute rest so your brain stays fresh! This timer guides your cycles and awards points.',
  },
  {
    tab: 'notes',
    mood: 'study',
    badgeFa: 'دفتر جزوه و نوت‌های چندرسانه‌ای 📓 (۵ از ۸)',
    badgeEn: 'Multimedia Study Notes 📓 (5/8)',
    speechFa:
      'اینجا بخش «نوت‌ها» یا دفتر جزوه‌ی حرفه‌ای توئه 📓 کنار نوشتن متن و تیتر، می‌تونی نکات مهم رو هایلایت کنی، چک‌لیست مرور بسازی، و مستقیم عکس از کتاب یا تخته، ویدیو و فایل PDF رو یک‌جا نگه داری.',
    speechEn:
      'Here is Notes 📓 Combine headings, highlighted takeaways, and checklists with photos from your whiteboard/book, videos, and PDFs—all stored neatly offline.',
  },
  {
    tab: 'progress',
    mood: 'celebrate',
    badgeFa: 'نمودار پیشرفت و امتیاز XP یعنی چی؟ 📊 (۶ از ۸)',
    badgeEn: 'Animated Progress & XP 📊 (6/8)',
    speechFa:
      'تو بخش «پیشرفت» 📊 ساعت‌های مطالعه‌ت خودکار تبدیل به نمودارهای متحرک می‌شه! «XP» هم یعنی امتیاز تجربه و تلاش؛ با هر کار یا پومودورو امتیاز می‌گیری و سطحت پیش روباه بالا می‌ره. وضعیت حال‌وهوای هر روزت هم اینجاست!',
    speechEn:
      'In Progress 📊 your study hours become smooth animated charts! XP stands for Experience Points—you earn XP for completing tasks and sessions while tracking your daily mood trends.',
  },
  {
    tab: 'wellness',
    wellnessSection: 'guides',
    mood: 'rest',
    badgeFa: 'آکادمی مطالعه و تنفس ۴-۴-۴-۴ چیه؟ 🌿 (۷ از ۸)',
    badgeEn: 'Wellness Academy & 4-4-4-4 Breathing 🌿 (7/8)',
    speechFa:
      'اینجا «آکادمی» هست 🌿 پر از روش‌های علمی بهتر درس خوندن، چک‌لیست عادت‌های سالم (مثل نوشیدن آب و استراحت چشم) و «تنفس جعبه‌ای ۴-۴-۴-۴» (۴ ثانیه نفس کشیدن، ۴ ثانیه نگه داشتن و ۴ ثانیه بیرون دادن) برای وقتی که استرس داری!',
    speechEn:
      'Welcome to Academy 🌿 Learn science-backed study methods, check daily health habits, and use 4-4-4-4 Box Breathing (inhale 4s, hold 4s, exhale 4s) to melt away exam stress.',
  },
  {
    tab: 'planner',
    plannerSection: 'tasks',
    highlightCornerMenu: true,
    mood: 'celebrate',
    badgeFa: 'تنظیمات، تم‌ها و رمز PIN ⚙️ (۸ از ۸)',
    badgeEn: 'Themes, Audio & PIN Menu ⚙️ (8/8)',
    speechFa:
      'و آخر از همه، دکمه‌ی چرخ‌دنده گوشه بالا سمت راست ⚙️ اینجا می‌تونی تم‌های ساده یا طرح‌دار و فانتزی رو عوض کنی، صدای زنگ‌ها رو تست کنی، رمز «PIN» (قفل ۴ تا ۶ رقمی برای حفظ حریم شخصی) بذاری و وارد کانال تلگرام سازنده بشی!',
    speechEn:
      'Finally, tap the top-right gear menu ⚙️ to switch between minimal & patterned themes, test audio chimes, set a private PIN passcode, or open the creator Telegram channel!',
  },
];

/**
 * Live Interactive Guided Tour: navigates the user into each real app section
 * with an animated Fox mascot + comic speech bubble pointing beside it.
 */
export function OnboardingModal() {
  const {
    state,
    theme,
    isRTL,
    setActiveTab,
    setPlannerSection,
    setWellnessSection,
    completeOnboarding,
    setThemePreset,
    setLanguage,
  } = useFoxStore();

  const [stepIdx, setStepIdx] = useState(0);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const cornerPulse = useRef(new Animated.Value(0)).current;

  const isActive = !state.hasCompletedOnboarding;
  const step = TOUR_STEPS[stepIdx] ?? TOUR_STEPS[0];

  useEffect(() => {
    if (!isActive) return;
    setActiveTab(step.tab);
    if (step.plannerSection) setPlannerSection(step.plannerSection);
    if (step.wellnessSection) setWellnessSection(step.wellnessSection);
  }, [isActive, setActiveTab, setPlannerSection, setWellnessSection, step.plannerSection, step.tab, step.wellnessSection]);

  useEffect(() => {
    if (!isActive) return;
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 700, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerPulse, { toValue: -6, duration: 480, useNativeDriver: true }),
        Animated.timing(cornerPulse, { toValue: 0, duration: 480, useNativeDriver: true }),
      ])
    );
    bobLoop.start();
    arrowLoop.start();
    return () => {
      bobLoop.stop();
      arrowLoop.stop();
    };
  }, [cornerPulse, floatAnim, isActive]);

  if (!isActive) return null;

  const lang = state.language;
  const isLast = stepIdx === TOUR_STEPS.length - 1;
  const quickThemeIds: ThemePresetId[] = ['midnightSage', 'warmPaper', 'forestFox', 'sakuraBlossom'];

  const handleFinish = () => {
    setStepIdx(0);
    completeOnboarding();
  };

  return (
    <View style={styles.overlayLayer} pointerEvents="box-none">
      {/* Subtle top scrim / corner pointer highlight */}
      {step.highlightCornerMenu ? (
        <Animated.View
          style={[
            styles.cornerBeacon,
            {
              backgroundColor: theme.primary,
              transform: [{ translateY: cornerPulse }],
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="arrow-up" size={16} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>
            {lang === 'fa' ? 'اینجا ⚙️' : 'Tap here ⚙️'}
          </Text>
        </Animated.View>
      ) : null}

      {/* Floating Fox + Speech Bubble Coach Bar near bottom */}
      <View
        style={[
          styles.coachDock,
          {
            backgroundColor: theme.surface,
            borderColor: theme.primary,
          },
        ]}
      >
        {/* Top pill bar inside coach card */}
        <View style={[styles.coachMetaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.stepBadge, { backgroundColor: theme.primarySoft }]}>
            <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '900' }}>
              {lang === 'fa' ? step.badgeFa : step.badgeEn}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => setLanguage(lang === 'fa' ? 'en' : 'fa')}>
              <Text style={{ color: theme.info, fontSize: 11.5, fontWeight: '800' }}>
                {lang === 'fa' ? 'EN' : 'FA'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleFinish}>
              <Text style={{ color: theme.textMuted, fontSize: 11.5, fontWeight: '800' }}>
                {lang === 'fa' ? 'بستن تور' : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fox Mascot + Comic Speech Bubble side by side */}
        <View style={[styles.bubbleStage, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
            <FoxMascot mood={step.mood} size={68} theme={theme} />
          </Animated.View>

          {/* Speech Bubble with pointer triangle */}
          <View style={styles.bubbleOuter}>
            <View
              style={[
                styles.speechPointer,
                isRTL
                  ? { right: -7, borderLeftColor: theme.border, backgroundColor: theme.surfaceElevated }
                  : { left: -7, borderRightColor: theme.border, backgroundColor: theme.surfaceElevated },
              ]}
            />
            <View
              style={[
                styles.speechBubble,
                { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.speechText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {lang === 'fa' ? step.speechFa : step.speechEn}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick theme sampler only on last step */}
        {isLast ? (
          <View style={[styles.quickThemesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {quickThemeIds.map((tid) => {
              const pr = THEME_PRESETS[tid];
              const act = state.theme === tid;
              return (
                <TouchableOpacity
                  key={tid}
                  onPress={() => setThemePreset(tid)}
                  style={[
                    styles.miniThemeChip,
                    {
                      backgroundColor: pr.surfaceElevated,
                      borderColor: act ? theme.primary : pr.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12 }}>{pr.emoji}</Text>
                </TouchableOpacity>
              );
            })}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: '700', alignSelf: 'center' }}>
              {lang === 'fa' ? 'تست سریع تم' : 'Quick Theme'}
            </Text>
          </View>
        ) : null}

        {/* Navigation Dots + Prev / Next */}
        <View style={[styles.footerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {stepIdx > 0 ? (
            <TouchableOpacity
              onPress={() => setStepIdx((i) => Math.max(0, i - 1))}
              style={[styles.prevBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 12.5, fontWeight: '800' }}>
                {lang === 'fa' ? 'قبلی' : 'Back'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 54 }} />
          )}

          <View style={styles.dots}>
            {TOUR_STEPS.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === stepIdx ? theme.primary : theme.surfaceMuted,
                    width: idx === stepIdx ? 16 : 6,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={() => {
              if (isLast) handleFinish();
              else setStepIdx((i) => i + 1);
            }}
            style={[styles.nextBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={{ color: '#FFF', fontSize: 12.5, fontWeight: '900' }}>
              {isLast
                ? lang === 'fa'
                  ? 'شروع کنیم! 🦊'
                  : 'Let’s Go! 🦊'
                : lang === 'fa'
                ? `بخش بعدی (${localizeDigits(stepIdx + 2, lang)})`
                : `Next (${stepIdx + 2})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 66,
    left: 0,
    justifyContent: 'flex-end',
    padding: 12,
    zIndex: 55,
  },
  cornerBeacon: {
    position: 'absolute',
    top: 56,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  coachDock: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 14,
  },
  coachMetaRow: { justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  stepBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  bubbleStage: { alignItems: 'center', gap: 10 },
  bubbleOuter: { flex: 1, position: 'relative' },
  speechPointer: {
    position: 'absolute',
    top: 20,
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  speechBubble: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    zIndex: 2,
  },
  speechText: { fontSize: 12.5, lineHeight: 20, fontWeight: '600' },
  quickThemesRow: { gap: 8, alignItems: 'center' },
  miniThemeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  footerRow: { alignItems: 'center', justifyContent: 'space-between' },
  prevBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 13, borderWidth: 1 },
  dots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3 },
  nextBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
});
