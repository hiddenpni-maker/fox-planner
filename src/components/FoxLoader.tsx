import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Text } from './FoxText';
import { FoxMascot } from './FoxMascot';
import type { FoxTheme } from '../theme/tokens';
import type { LanguageCode } from '../types/planner';

const LOADER_WHISPERS_FA = [
  'روباه دارد دفتر مطالعه‌ات را آماده می‌کند...',
  'چیدن رنگ‌های آرامش‌بخش برای چشم‌هایت...',
  'دم کردن چای گرم برای تمرکز عمیق...',
];

const LOADER_WHISPERS_EN = [
  'Fox is setting up your calm workspace...',
  'Blending soft eye-friendly palette...',
  'Warming up your focus desk...',
];

/** Playful animated Fox loader with pulsing halo & stepping paw indicators. */
export function FoxLoader({ theme, lang = 'fa' }: { theme: FoxTheme; lang?: LanguageCode }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(0.92)).current;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, { toValue: 1.12, duration: 650, useNativeDriver: true }),
        Animated.timing(ringPulse, { toValue: 0.92, duration: 650, useNativeDriver: true }),
      ])
    );
    floatLoop.start();
    pulseLoop.start();

    const t = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 1100);
    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      clearInterval(t);
    };
  }, [floatAnim, ringPulse]);

  const list = lang === 'fa' ? LOADER_WHISPERS_FA : LOADER_WHISPERS_EN;

  return (
    <View style={[styles.box, { backgroundColor: theme.bg }]}>
      <View style={styles.emblemWrap}>
        <Animated.View
          style={[
            styles.glowRing,
            { backgroundColor: theme.primarySoft, borderColor: theme.primary, transform: [{ scale: ringPulse }] },
          ]}
        />
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <FoxMascot mood="study" size={94} theme={theme} />
        </Animated.View>
      </View>

      <View style={styles.pawsRow}>
        {[0, 1, 2].map((i) => (
          <Text
            key={i}
            style={{
              fontSize: 16,
              opacity: i === step ? 1 : 0.28,
              transform: [{ scale: i === step ? 1.25 : 0.9 }],
            }}
          >
            🐾
          </Text>
        ))}
      </View>
      <Text style={[styles.whisper, { color: theme.textSecondary }]}>{list[step]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emblemWrap: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
  },
  pawsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  whisper: { fontSize: 13.5, fontWeight: '700', marginTop: 12, textAlign: 'center' },
});
