import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from './FoxText';
import { FoxMascot } from './FoxMascot';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import { toDateKey } from '../utils/dateUtils';

export const MOOD_OPTIONS = [
  { score: 1 as const, emoji: '😩', labelFa: 'خسته و کم‌انرژی', labelEn: 'Drained', tipFa: 'امروز با قدم‌های خیلی کوچک و تایمر ۱۵ دقیقه‌ای شروع کن.' },
  { score: 2 as const, emoji: '😕', labelFa: 'کمی کلافه / بی‌حوصله', labelEn: 'Low', tipFa: 'یک نفس ۴-۴-۴-۴ بکش و فقط ۵ دقیقه اول یک تسک سبک را بزن.' },
  { score: 3 as const, emoji: '🙂', labelFa: 'معمولی و آرام', labelEn: 'Calm', tipFa: 'ریتم ۲۵/۵ امروز برایت عالی جواب می‌دهد!' },
  { score: 4 as const, emoji: '😊', labelFa: 'سرحال و باانگیزه', labelEn: 'Good', tipFa: 'زمان طلایی برای حل تسک‌های مهم‌تر پلنرت!' },
  { score: 5 as const, emoji: '🤩', labelFa: 'پرانرژی و آماده‌ی فتح!', labelEn: 'Supercharged', tipFa: 'حالت مطالعه‌ی عمیق ۵۰/۱۰ منتظرته قهرمان 🔥' },
];

interface DailyMoodPromptProps {
  forceOpen?: boolean;
  onForceClose?: () => void;
}

/** Asks the user how they feel on each new calendar day using expressive emoji ratings (1–5). */
export function DailyMoodPrompt({ forceOpen = false, onForceClose }: DailyMoodPromptProps) {
  const { hydrated, locked, state, theme, isRTL, submitDailyMood } = useFoxStore();
  const todayKey = toDateKey();
  const alreadyLoggedToday = state.moodLogs.some((m) => m.dateKey === todayKey);

  const [dismissedToday, setDismissedToday] = useState(false);
  const [selectedScore, setSelectedScore] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [note, setNote] = useState('');

  const shouldShowAuto =
    hydrated && !locked && state.hasCompletedOnboarding && !alreadyLoggedToday && !dismissedToday;
  const visible = forceOpen || shouldShowAuto;

  if (!visible) return null;

  const lang = state.language;
  const selectedOpt = MOOD_OPTIONS.find((m) => m.score === selectedScore) ?? MOOD_OPTIONS[3];

  const close = () => {
    setDismissedToday(true);
    onForceClose?.();
  };

  const handleSave = () => {
    submitDailyMood(selectedOpt.score, selectedOpt.emoji, selectedOpt.labelFa, selectedOpt.labelEn, note);
    setNote('');
    close();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <FoxMascot mood={selectedScore >= 4 ? 'celebrate' : selectedScore <= 2 ? 'rest' : 'calm'} size={78} theme={theme} />
            <Text style={[styles.title, { color: theme.text }]}>
              {lang === 'fa' ? 'سلام! حال امروزت چطوره؟' : 'Hey there! How do you feel today?'}
            </Text>
            <Text style={[styles.sub, { color: theme.textMuted }]}>
              {lang === 'fa'
                ? 'به حس الانت نمره بده تا روباه برنامه رو با انرژیت هماهنگ کنه'
                : 'Rate your current mood & energy so Fox adapts your pace'}
            </Text>
          </View>

          <View style={[styles.emojiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {MOOD_OPTIONS.map((opt) => {
              const active = selectedScore === opt.score;
              return (
                <TouchableOpacity
                  key={opt.score}
                  onPress={() => setSelectedScore(opt.score)}
                  style={[
                    styles.emojiBtn,
                    {
                      backgroundColor: active ? theme.primarySoft : theme.surfaceElevated,
                      borderColor: active ? theme.primary : theme.border,
                      transform: [{ scale: active ? 1.07 : 1 }],
                    },
                  ]}
                >
                  <Text style={styles.emojiChar}>{opt.emoji}</Text>
                  <Text style={{ color: active ? theme.primary : theme.textMuted, fontSize: 11, fontWeight: '800' }}>
                    {localizeDigits(opt.score, lang)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.feedbackBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
              {selectedOpt.emoji} {lang === 'fa' ? selectedOpt.labelFa : selectedOpt.labelEn}
            </Text>
            {lang === 'fa' ? (
              <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                {selectedOpt.tipFa}
              </Text>
            ) : null}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={
              lang === 'fa' ? 'یک جمله درباره حال امروزت (اختیاری)...' : 'One short note about today (optional)...'
            }
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

          <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.saveText}>
                {lang === 'fa' ? 'ثبت حال امروز (+۱۰ امتیاز 🦊)' : 'Save Mood (+10 XP 🦊)'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={close} style={[styles.skipBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.textMuted, fontWeight: '700', fontSize: 13 }}>
                {lang === 'fa' ? 'بعداً' : 'Later'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 10, 18, 0.72)',
    justifyContent: 'center',
    padding: 18,
  },
  card: { borderRadius: 26, borderWidth: 1, padding: 20 },
  header: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  sub: { fontSize: 12.5, marginTop: 4, textAlign: 'center', lineHeight: 19 },
  emojiRow: { justifyContent: 'space-between', gap: 6, marginTop: 18 },
  emojiBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  emojiChar: { fontSize: 24 },
  feedbackBox: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  footer: { gap: 10, marginTop: 14 },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13.5 },
  skipBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
});
