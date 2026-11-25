import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from './FoxText';
import { Ionicons } from '@expo/vector-icons';
import type { FoxTheme } from '../theme/tokens';
import type { LanguageCode } from '../types/planner';
import { localizeDigits } from '../i18n/translations';

export interface CelebrationBannerData {
  id: string;
  title: string;
  subtitle: string;
  pointsEarned: number;
}

interface FoxCelebrationToastProps {
  data: CelebrationBannerData | null;
  theme: FoxTheme;
  lang: LanguageCode;
  isRTL: boolean;
  onDismiss: () => void;
}

/** Floating encouraging reward banner triggered after completing study/wellness milestones. */
export function FoxCelebrationToast({ data, theme, lang, isRTL, onDismiss }: FoxCelebrationToastProps) {
  const slideY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;
    slideY.setValue(-80);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        onDismiss()
      );
    }, 3200);
    return () => clearTimeout(timer);
  }, [data, onDismiss, opacity, slideY]);

  if (!data) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [{ translateY: slideY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onDismiss}
        style={[
          styles.card,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.success,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.successSoft }]}>
          <Text style={{ fontSize: 20 }}>🦊</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {data.title}
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {data.subtitle}
          </Text>
        </View>
        {data.pointsEarned > 0 ? (
          <View style={[styles.xpBadge, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="sparkles" size={12} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '900' }}>
              +{localizeDigits(data.pointsEarned, lang)}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 56,
    left: 14,
    right: 14,
    zIndex: 40,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 13.5, fontWeight: '900' },
  sub: { fontSize: 11.5, marginTop: 2 },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
});
