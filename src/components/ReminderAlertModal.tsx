import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoxMascot } from './FoxMascot';
import { Text } from './FoxText';
import { localizeDigits } from '../i18n/translations';
import { useFoxStore } from '../store/FoxStoreContext';
import type { ReminderItem } from '../types/planner';
import { buildPlayfulReminderCopy } from '../utils/notifications';
import { playCelebrationSound, triggerHaptic } from '../utils/soundEffects';

interface ReminderAlertModalProps {
  reminderOverride?: ReminderItem | null;
  onCloseOverride?: () => void;
}

/** Playful, heartwarming in-app Fox reminder popup with sound, Done celebration, and 10m Snooze. */
export function ReminderAlertModal({ reminderOverride, onCloseOverride }: ReminderAlertModalProps = {}) {
  const {
    state,
    theme,
    isRTL,
    activeReminderAlert,
    dismissReminderAlert,
    snoozeReminder,
  } = useFoxStore();

  const reminder = reminderOverride ?? activeReminderAlert;
  const lang = state.language;

  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!reminder) return;
    void playCelebrationSound('reminder', state.celebrationSoundsEnabled, state.soundStyle);
    void triggerHaptic('success');

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: -5, duration: 180, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 5, duration: 180, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.delay(900),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reminder, state.celebrationSoundsEnabled, wobble]);

  if (!reminder) return null;

  const copy = buildPlayfulReminderCopy(reminder, lang);
  const subject = state.subjects.find((s) => s.id === reminder.subjectId);
  const timeText = localizeDigits(
    `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`,
    lang
  );

  const handleAccept = () => {
    void playCelebrationSound('task', state.celebrationSoundsEnabled);
    if (onCloseOverride) {
      onCloseOverride();
    } else {
      dismissReminderAlert();
    }
  };

  const handleSnooze = () => {
    if (onCloseOverride) {
      onCloseOverride();
    } else {
      snoozeReminder(reminder.id, 10);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleAccept}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
          <Animated.View style={{ transform: [{ translateX: wobble }] }}>
            <FoxMascot mood="celebrate" size={94} theme={theme} />
          </Animated.View>

          <View style={[styles.timePill, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="alarm" size={14} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '900' }}>
              {timeText}
            </Text>
            {subject ? (
              <Text style={{ color: subject.color, fontSize: 12, fontWeight: '800' }}>
                • {lang === 'fa' ? subject.nameFa : subject.nameEn}
              </Text>
            ) : null}
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{copy.title}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{copy.body}</Text>

          <View style={[styles.btnCol, { flexDirection: isRTL ? 'column' : 'column' }]}>
            <TouchableOpacity onPress={handleAccept} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.primaryBtnText}>
                {lang === 'fa' ? 'باشه روباه، همین الان انجامش میدم! 🎉' : "Got it Fox, I'm on it! 🎉"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSnooze}
              style={[styles.snoozeBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            >
              <Ionicons name="hourglass-outline" size={15} color={theme.textSecondary} />
              <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '800' }}>
                {lang === 'fa' ? '۱۰ دقیقه دیگه یادم بنداز' : 'Snooze 10 minutes'}
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
    backgroundColor: 'rgba(6, 10, 18, 0.78)',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 26,
  },
  body: {
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  btnCol: {
    width: '100%',
    gap: 10,
    marginTop: 18,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  snoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
});
