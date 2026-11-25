import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './FoxText';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import type { FoxTheme } from '../theme/tokens';
import type { LanguageCode } from '../types/planner';

interface FoxSplashIntroProps {
  theme: FoxTheme;
  lang?: LanguageCode;
  onFinish: () => void;
}

/** Multi-stage Fox motion reveal splash with orbiting light ring, blinking eyes & paw steps. */
export function FoxSplashIntro({ theme, lang = 'fa', onFinish }: FoxSplashIntroProps) {
  const logoScale = useRef(new Animated.Value(0.62)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.85)).current;
  const barProgress = useRef(new Animated.Value(0)).current;
  const paw1 = useRef(new Animated.Value(0)).current;
  const paw2 = useRef(new Animated.Value(0)).current;
  const paw3 = useRef(new Animated.Value(0)).current;
  const containerFade = useRef(new Animated.Value(1)).current;
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    const enterAnim = Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 65, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(orbitSpin, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(barProgress, {
        toValue: 1,
        duration: 1850,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    const haloPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale, { toValue: 1.14, duration: 750, useNativeDriver: true }),
        Animated.timing(haloScale, { toValue: 0.96, duration: 750, useNativeDriver: true }),
      ])
    );

    const pawsSeq = Animated.stagger(240, [
      Animated.spring(paw1, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.spring(paw2, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.spring(paw3, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]);

    enterAnim.start();
    haloPulse.start();
    pawsSeq.start();

    const blink1 = setTimeout(() => setBlinking(true), 780);
    const blink2 = setTimeout(() => setBlinking(false), 960);

    const exitTimer = setTimeout(() => {
      Animated.timing(containerFade, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2050);

    return () => {
      haloPulse.stop();
      clearTimeout(blink1);
      clearTimeout(blink2);
      clearTimeout(exitTimer);
    };
  }, [barProgress, containerFade, haloScale, logoOpacity, logoScale, onFinish, orbitSpin, paw1, paw2, paw3]);

  const spinInterpolated = orbitSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const barWidth = barProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['6%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.bg, opacity: containerFade }]}>
      <TouchableOpacity activeOpacity={1} onPress={onFinish} style={styles.touchArea}>
        {/* Breathing Ambient Halo */}
        <Animated.View
          style={[
            styles.halo,
            { backgroundColor: theme.primarySoft, transform: [{ scale: haloScale }] },
          ]}
        />

        {/* Orbiting Orbital Ring */}
        <Animated.View style={[styles.orbitWrap, { transform: [{ rotate: spinInterpolated }] }]}>
          <Svg width={196} height={196} viewBox="0 0 196 196">
            <Circle
              cx="98"
              cy="98"
              r="84"
              stroke={theme.primary}
              strokeWidth="2"
              strokeDasharray="16 14 4 14"
              fill="none"
              opacity={0.5}
            />
            <Circle cx="98" cy="14" r="5" fill={theme.accent} />
            <Circle cx="182" cy="98" r="3.5" fill={theme.primary} />
          </Svg>
        </Animated.View>

        {/* Expressive Minimal Animated Fox Emblem */}
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Svg width={126} height={126} viewBox="0 0 120 120">
            <Circle cx="60" cy="62" r="52" fill={theme.surfaceElevated} stroke={theme.border} strokeWidth="1.5" />
            {/* Ears */}
            <Path d="M26 48 L19 15 L49 31 Z" fill={theme.foxFur} />
            <Path d="M94 48 L101 15 L71 31 Z" fill={theme.foxFur} />
            <Path d="M29 42 L24 22 L43 32 Z" fill={theme.foxDark} />
            <Path d="M91 42 L96 22 L77 32 Z" fill={theme.foxDark} />
            {/* Face & cheeks */}
            <Path d="M24 56 C24 35, 96 35, 96 56 C96 78, 76 96, 60 96 C44 96, 24 78, 24 56 Z" fill={theme.foxFur} />
            <Path d="M24 60 C26 79, 44 93, 59 95 C50 82, 43 69, 24 60 Z" fill={theme.foxBelly} />
            <Path d="M96 60 C94 79, 76 93, 61 95 C70 82, 77 69, 96 60 Z" fill={theme.foxBelly} />
            <Ellipse cx="60" cy="79" rx="17" ry="14" fill={theme.foxBelly} />
            {/* Eyes (animated natural blink!) */}
            {blinking ? (
              <>
                <Path d="M39 59 Q44 63 49 59" stroke="#1E293B" strokeWidth="3" fill="none" strokeLinecap="round" />
                <Path d="M71 59 Q76 63 81 59" stroke="#1E293B" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            ) : (
              <>
                <Circle cx="44" cy="58" r="4.6" fill="#1E293B" />
                <Circle cx="76" cy="58" r="4.6" fill="#1E293B" />
                <Circle cx="42.4" cy="56.4" r="1.7" fill="#FFFFFF" />
                <Circle cx="74.4" cy="56.4" r="1.7" fill="#FFFFFF" />
              </>
            )}
            {/* Nose & gentle grin */}
            <Ellipse cx="60" cy="76" rx="5" ry="3.7" fill="#1E293B" />
            <Path d="M54 84 Q60 89 66 84" stroke="#1E293B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </Svg>

          <Text style={[styles.brand, { color: theme.text }]}>
            {lang === 'fa' ? 'فاکس پلنر' : 'Fox Planner'}
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {lang === 'fa' ? 'همراه آرام و هوشمند مطالعه 🦊' : 'Calm & Smart Study Companion 🦊'}
          </Text>

          {/* Animated Paw Trail */}
          <View style={styles.pawsTrail}>
            {[paw1, paw2, paw3].map((animVal, idx) => (
              <Animated.Text
                key={idx}
                style={{
                  fontSize: 16,
                  opacity: animVal,
                  transform: [{ scale: animVal }],
                }}
              >
                🐾
              </Animated.Text>
            ))}
          </View>

          {/* Silky Progress Line */}
          <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
            <Animated.View style={[styles.progressFill, { backgroundColor: theme.primary, width: barWidth }]} />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 60,
  },
  touchArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  orbitWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  brand: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 18,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 13,
    marginTop: 6,
    fontWeight: '600',
  },
  pawsTrail: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
  },
  progressTrack: {
    width: 150,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
