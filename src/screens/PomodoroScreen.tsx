import React, { useState } from 'react';
import {
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
import { getSmartBreakTip } from '../data/wellnessGuides';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import type { PomodoroPhase } from '../types/planner';

const RING_SIZE = 248;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PomodoroScreen() {
  const {
    state,
    theme,
    strings,
    isRTL,
    pomodoro,
    setPomodoroPhase,
    togglePomodoroRunning,
    resetPomodoro,
    completeCurrentPhase,
    selectPomodoroLink,
    incrementDistraction,
    updatePomodoroSettings,
  } = useFoxStore();

  const lang = state.language;
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const [focusMinsStr, setFocusMinsStr] = useState(String(state.pomodoroSettings.focusMinutes));
  const [shortMinsStr, setShortMinsStr] = useState(String(state.pomodoroSettings.shortBreakMinutes));
  const [longMinsStr, setLongMinsStr] = useState(String(state.pomodoroSettings.longBreakMinutes));
  const [roundsStr, setRoundsStr] = useState(String(state.pomodoroSettings.roundsBeforeLongBreak));

  const mins = Math.floor(pomodoro.secondsLeft / 60);
  const secs = pomodoro.secondsLeft % 60;
  const formattedTime = localizeDigits(
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    lang
  );

  const progress =
    pomodoro.totalPhaseSeconds > 0
      ? Math.max(0, Math.min(1, 1 - pomodoro.secondsLeft / pomodoro.totalPhaseSeconds))
      : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const phaseColor =
    pomodoro.phase === 'focus'
      ? theme.primary
      : pomodoro.phase === 'shortBreak'
      ? theme.success
      : theme.info;

  const linkedTask = state.tasks.find((t) => t.id === pomodoro.linkedTaskId);
  const linkedSubject =
    state.subjects.find((s) => s.id === (linkedTask?.subjectId ?? pomodoro.linkedSubjectId)) ??
    state.subjects[0];

  const applyPreset = (focusMinutes: number, shortBreakMinutes: number, longBreakMinutes: number) => {
    updatePomodoroSettings({
      ...state.pomodoroSettings,
      focusMinutes,
      shortBreakMinutes,
      longBreakMinutes,
    });
  };

  const handleSaveCustom = () => {
    const f = Math.min(120, Math.max(1, parseInt(focusMinsStr, 10) || 25));
    const sb = Math.min(60, Math.max(1, parseInt(shortMinsStr, 10) || 5));
    const lb = Math.min(90, Math.max(1, parseInt(longMinsStr, 10) || 15));
    const r = Math.min(10, Math.max(2, parseInt(roundsStr, 10) || 4));
    updatePomodoroSettings({
      ...state.pomodoroSettings,
      focusMinutes: f,
      shortBreakMinutes: sb,
      longBreakMinutes: lb,
      roundsBeforeLongBreak: r,
    });
    setCustomModalOpen(false);
  };

  const pendingTasks = state.tasks.filter((t) => !t.completed);
  const tipPhase = pomodoro.lastCompletedPhase === 'focus' && pomodoro.phase !== 'focus' ? pomodoro.phase : pomodoro.phase;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Header with Help Guide */}
      <View style={[styles.screenHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>
          {lang === 'fa' ? 'پومودوروی تمرکز ⏱️' : 'Focus Pomodoro ⏱️'}
        </Text>
        <SectionHelpButton
          titleFa="راهنمای تایمر پومودورو و تمرکز عمیق"
          titleEn="Pomodoro Timer Guide"
          tipsFa={[
            'پومودورو یعنی ۲۵ دقیقه تمرکز خالص بدون گوشی + ۵ دقیقه استراحت کوتاه برای بازیابی ذهن.',
            'می‌توانی تایمر را مستقیم به یکی از تسک‌های پلنرت متصل کنی تا پیشرفتش خودکار ذخیره شود.',
            'با پایان هر دوره تمرکز، روباه بهت تشویق و ۲۵ امتیاز + ثبت آمار در نمودار پیشرفت می‌دهد!',
          ]}
          tipsEn={[
            'Work in focused blocks (25/5 or 50/10) with intentional short breaks.',
            'Link any task from Planner to auto-track its Pomodoros.',
            'Every completed focus session earns +25 Fox points & encouragement chimes!',
          ]}
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
      </View>

      {/* Phase Switcher */}
      <View
        style={[
          styles.phaseBar,
          { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        {([
          ['focus', strings.pomodoro.focus],
          ['shortBreak', strings.pomodoro.shortBreak],
          ['longBreak', strings.pomodoro.longBreak],
        ] as [PomodoroPhase, string][]).map(([key, label]) => {
          const active = pomodoro.phase === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setPomodoroPhase(key)}
              style={[
                styles.phaseTab,
                active ? { backgroundColor: phaseColor } : null,
              ]}
            >
              <Text style={[styles.phaseTabText, { color: active ? '#FFFFFF' : theme.textMuted }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Linked Task Card */}
      <TouchableOpacity
        onPress={() => setTaskModalOpen(true)}
        style={[
          styles.linkCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <View style={[styles.linkDot, { backgroundColor: linkedSubject.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.linkLabel, { color: theme.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {strings.pomodoro.linkedTask} ({lang === 'fa' ? linkedSubject.nameFa : linkedSubject.nameEn})
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.linkTaskTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}
          >
            {linkedTask ? linkedTask.title : strings.pomodoro.noTaskLinked}
          </Text>
        </View>
        <Text style={[styles.chooseText, { color: theme.primary }]}>{strings.pomodoro.chooseTask}</Text>
      </TouchableOpacity>

      {/* Main Timer Ring */}
      <View style={styles.ringSection}>
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.svgRing}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={theme.surfaceMuted}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={phaseColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <FoxMascot
              mood={pomodoro.phase === 'focus' ? 'focus' : 'rest'}
              size={66}
              theme={theme}
            />
            <Text style={[styles.timerDigits, { color: theme.text }]}>{formattedTime}</Text>
            <Text style={[styles.roundMeta, { color: theme.textMuted }]}>
              {strings.pomodoro.roundLabel}: {localizeDigits(pomodoro.roundNumber, lang)} /{' '}
              {localizeDigits(state.pomodoroSettings.roundsBeforeLongBreak, lang)}
            </Text>
          </View>
        </View>

        {/* Round Dots */}
        <View style={styles.roundDots}>
          {Array.from({ length: state.pomodoroSettings.roundsBeforeLongBreak }).map((_, idx) => {
            const filled = idx < pomodoro.roundNumber;
            return (
              <View
                key={idx}
                style={[
                  styles.roundDot,
                  { backgroundColor: filled ? phaseColor : theme.surfaceMuted },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Primary Controls */}
      <View style={[styles.controlsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          onPress={resetPomodoro}
          style={[styles.circleControl, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="refresh" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePomodoroRunning}
          style={[styles.playHeroBtn, { backgroundColor: phaseColor }]}
        >
          <Ionicons name={pomodoro.isRunning ? 'pause' : 'play'} size={24} color="#FFFFFF" />
          <Text style={styles.playHeroText}>
            {pomodoro.isRunning ? strings.pomodoro.pause : strings.pomodoro.start}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => completeCurrentPhase(false)}
          style={[styles.circleControl, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="play-skip-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {pomodoro.phase === 'focus' ? (
        <TouchableOpacity
          onPress={() => completeCurrentPhase(true)}
          style={[styles.completeEarlyBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Ionicons name="checkmark-done-circle-outline" size={18} color={theme.success} />
          <Text style={[styles.completeEarlyText, { color: theme.success }]}>
            {strings.pomodoro.completeNow}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Presets */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
        {strings.pomodoro.presets}
      </Text>
      <View style={[styles.presetRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {[
          { label: strings.pomodoro.presetClassic, f: 25, s: 5, l: 15 },
          { label: strings.pomodoro.presetDeep, f: 50, s: 10, l: 25 },
          { label: strings.pomodoro.presetSprint, f: 15, s: 3, l: 10 },
        ].map((p) => {
          const active =
            state.pomodoroSettings.focusMinutes === p.f &&
            state.pomodoroSettings.shortBreakMinutes === p.s;
          return (
            <TouchableOpacity
              key={p.label}
              onPress={() => applyPreset(p.f, p.s, p.l)}
              style={[
                styles.presetChip,
                {
                  backgroundColor: active ? theme.primarySoft : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
            >
              <Text style={{ color: active ? theme.primary : theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => {
            setFocusMinsStr(String(state.pomodoroSettings.focusMinutes));
            setShortMinsStr(String(state.pomodoroSettings.shortBreakMinutes));
            setLongMinsStr(String(state.pomodoroSettings.longBreakMinutes));
            setRoundsStr(String(state.pomodoroSettings.roundsBeforeLongBreak));
            setCustomModalOpen(true);
          }}
          style={[styles.presetChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>
            ⚙️ {strings.pomodoro.customTimer}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Focus Discipline & Audio Cue Tools */}
      <View style={[styles.toolsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          onPress={incrementDistraction}
          style={[styles.toolBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={[styles.toolValue, { color: theme.warning }]}>
            {localizeDigits(pomodoro.distractionsCount, lang)}
          </Text>
          <Text style={[styles.toolLabel, { color: theme.textMuted }]}>
            {strings.pomodoro.distractionCount}
          </Text>
          <Text style={[styles.toolAction, { color: theme.primary }]}>
            {strings.pomodoro.logDistraction}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            updatePomodoroSettings({
              ...state.pomodoroSettings,
              soundCueEnabled: !state.pomodoroSettings.soundCueEnabled,
            })
          }
          style={[styles.toolBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons
            name={state.pomodoroSettings.soundCueEnabled ? 'volume-high' : 'volume-mute'}
            size={24}
            color={state.pomodoroSettings.soundCueEnabled ? theme.success : theme.textMuted}
          />
          <Text style={[styles.toolLabel, { color: theme.textSecondary, marginTop: 6 }]}>
            {strings.pomodoro.soundCue}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 2 }}>
            {state.pomodoroSettings.soundCueEnabled ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Context-aware Smart Break & Study Tip */}
      <View style={[styles.tipCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <View style={[styles.tipHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons name="sparkles" size={17} color={phaseColor} />
          <Text style={[styles.tipTitle, { color: phaseColor }]}>{strings.pomodoro.focusTipTitle}</Text>
        </View>
        <Text style={[styles.tipBody, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
          {getSmartBreakTip(tipPhase, lang)}
        </Text>
      </View>

      {/* Task Picker Modal */}
      <Modal visible={taskModalOpen} transparent animationType="slide" onRequestClose={() => setTaskModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.pomodoro.chooseTask}</Text>
              <TouchableOpacity onPress={() => setTaskModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              <TouchableOpacity
                onPress={() => {
                  selectPomodoroLink(undefined, state.subjects[0]?.id);
                  setTaskModalOpen(false);
                }}
                style={[styles.pickItem, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
              >
                <Text style={{ color: theme.text, fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }}>
                  {strings.pomodoro.noTaskLinked}
                </Text>
              </TouchableOpacity>
              {pendingTasks.map((t) => {
                const sub = state.subjects.find((s) => s.id === t.subjectId);
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => {
                      selectPomodoroLink(t.id, t.subjectId);
                      setTaskModalOpen(false);
                    }}
                    style={[
                      styles.pickItem,
                      {
                        borderColor: pomodoro.linkedTaskId === t.id ? theme.primary : theme.border,
                        backgroundColor: theme.surfaceElevated,
                      },
                    ]}
                  >
                    <Text style={{ color: sub?.color ?? theme.primary, fontSize: 11, fontWeight: '700', textAlign: isRTL ? 'right' : 'left' }}>
                      {lang === 'fa' ? sub?.nameFa : sub?.nameEn}
                    </Text>
                    <Text style={{ color: theme.text, fontWeight: '700', marginTop: 2, textAlign: isRTL ? 'right' : 'left' }}>
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Timer Modal */}
      <Modal visible={customModalOpen} transparent animationType="fade" onRequestClose={() => setCustomModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{strings.pomodoro.customModalTitle}</Text>
              <TouchableOpacity onPress={() => setCustomModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            {[
              [strings.pomodoro.focusMins, focusMinsStr, setFocusMinsStr],
              [strings.pomodoro.shortMins, shortMinsStr, setShortMinsStr],
              [strings.pomodoro.longMins, longMinsStr, setLongMinsStr],
              [strings.pomodoro.rounds, roundsStr, setRoundsStr],
            ].map(([label, val, setter]) => (
              <View key={label as string} style={{ marginBottom: 10 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4, textAlign: isRTL ? 'right' : 'left' }}>
                  {label as string}
                </Text>
                <TextInput
                  value={val as string}
                  onChangeText={setter as (v: string) => void}
                  keyboardType="numeric"
                  style={[
                    styles.numInput,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border, color: theme.text },
                  ]}
                />
              </View>
            ))}
            <TouchableOpacity onPress={handleSaveCustom} style={[styles.saveCustomBtn, { backgroundColor: theme.primary }]}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{strings.planner.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  screenHeader: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  screenTitle: { fontSize: 19, fontWeight: '900' },
  phaseBar: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 5,
    gap: 4,
  },
  phaseTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 15,
    alignItems: 'center',
  },
  phaseTabText: { fontSize: 12, fontWeight: '800' },
  linkCard: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
    alignItems: 'center',
    gap: 10,
  },
  linkDot: { width: 10, height: 10, borderRadius: 5 },
  linkLabel: { fontSize: 11, fontWeight: '600' },
  linkTaskTitle: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  chooseText: { fontSize: 12, fontWeight: '800' },
  ringSection: { alignItems: 'center', marginVertical: 18 },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgRing: { position: 'absolute', top: 0, left: 0 },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  timerDigits: { fontSize: 40, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  roundMeta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  roundDots: { flexDirection: 'row', gap: 8, marginTop: 12 },
  roundDot: { width: 10, height: 10, borderRadius: 5 },
  controlsRow: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  circleControl: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 28,
  },
  playHeroText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  completeEarlyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  completeEarlyText: { fontSize: 12, fontWeight: '800' },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  presetRow: { flexWrap: 'wrap', gap: 8 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  toolsGrid: { gap: 10, marginTop: 16 },
  toolBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolValue: { fontSize: 22, fontWeight: '900' },
  toolLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  toolAction: { fontSize: 12, fontWeight: '800', marginTop: 4 },
  tipCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  tipHeader: { alignItems: 'center', gap: 6, marginBottom: 6 },
  tipTitle: { fontSize: 13, fontWeight: '800' },
  tipBody: { fontSize: 13, lineHeight: 21 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: { borderRadius: 22, borderWidth: 1, padding: 18 },
  modalHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  pickItem: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 8 },
  numInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    fontWeight: '700',
  },
  saveCustomBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
});
