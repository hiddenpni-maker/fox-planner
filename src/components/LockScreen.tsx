import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './FoxText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FoxMascot } from './FoxMascot';
import { useFoxStore } from '../store/FoxStoreContext';
import { localizeDigits } from '../i18n/translations';

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'back'],
];

/** Local privacy PIN lock screen protecting notes, personal media, and schedules. */
export function LockScreen() {
  const { theme, strings, state, unlockWithPin } = useFoxStore();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [waitSec, setWaitSec] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (waitSec <= 0) return;
    const t = setTimeout(() => setWaitSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [waitSec]);

  const handleDigit = (key: string) => {
    if (busy || waitSec > 0) return;
    setErrorMsg('');
    if (key === 'clear') {
      setPin('');
      return;
    }
    if (key === 'back') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length < 6) {
      setPin((p) => p + key);
    }
  };

  const handleUnlock = async () => {
    if (pin.length < 4 || busy) return;
    setBusy(true);
    const res = await unlockWithPin(pin);
    setBusy(false);
    if (!res.ok) {
      setPin('');
      if (res.remainingWaitSec > 0) {
        setWaitSec(res.remainingWaitSec);
        setErrorMsg(`${strings.security.cooldownMsg} ${localizeDigits(res.remainingWaitSec, state.language)}s`);
      } else {
        setErrorMsg(strings.security.pinMismatch);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.card}>
        <FoxMascot mood="shield" size={88} theme={theme} />
        <Text style={[styles.title, { color: theme.text }]}>{strings.security.lockTitle}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{strings.security.lockSubtitle}</Text>

        <View style={styles.dotsRow}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const filled = idx < pin.length;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    borderColor: filled ? theme.primary : theme.border,
                    backgroundColor: filled ? theme.primary : 'transparent',
                  },
                ]}
              />
            );
          })}
        </View>

        {errorMsg ? <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text> : null}

        <View style={styles.keypad}>
          {KEYPAD.map((row, rIdx) => (
            <View key={rIdx} style={styles.keyRow}>
              {row.map((cell) => (
                <TouchableOpacity
                  key={cell}
                  onPress={() => handleDigit(cell)}
                  style={[styles.keyBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  {cell === 'back' ? (
                    <Ionicons name="backspace-outline" size={22} color={theme.text} />
                  ) : cell === 'clear' ? (
                    <Ionicons name="close-circle-outline" size={22} color={theme.textMuted} />
                  ) : (
                    <Text style={[styles.keyText, { color: theme.text }]}>
                      {localizeDigits(cell, state.language)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => void handleUnlock()}
          disabled={pin.length < 4 || busy || waitSec > 0}
          style={[
            styles.unlockBtn,
            {
              backgroundColor: pin.length >= 4 && waitSec === 0 ? theme.primary : theme.surfaceMuted,
            },
          ]}
        >
          <Ionicons name="lock-open-outline" size={18} color="#FFFFFF" />
          <Text style={styles.unlockBtnText}>{strings.security.unlock}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 22,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  keyBtn: {
    width: 74,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '700',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    maxWidth: 250,
    paddingVertical: 14,
    borderRadius: 16,
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
