import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import type { FoxTheme } from '../theme/tokens';

/**
 * Renders subtle, low-contrast decorative background artwork matched to each theme
 * (from minimal dot grids to forest fox paws, moon constellations, sakura blossoms, waves, or playful shapes).
 */
export function ThemeBackdrop({ theme }: { theme: FoxTheme }) {
  if (theme.pattern === 'none') return null;

  const strokeColor = theme.mode === 'dark' ? theme.accent : theme.primary;
  const secondColor = theme.mode === 'dark' ? theme.primary : theme.accent;

  return (
    <View style={styles.layer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 360 720" preserveAspectRatio="xMidYMid slice">
        {theme.pattern === 'dots' ? (
          <>
            {[60, 140, 220, 300].map((x) =>
              [80, 180, 280, 380, 480, 580, 660].map((y) => (
                <Circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="1.8"
                  fill={theme.textMuted}
                  opacity={0.14}
                />
              ))
            )}
          </>
        ) : null}

        {theme.pattern === 'forest' ? (
          <>
            {/* Pine silhouettes at bottom */}
            <Path d="M-10 720 L40 580 L90 720 Z" fill={theme.accent} opacity={0.07} />
            <Path d="M40 720 L95 540 L150 720 Z" fill={theme.accent} opacity={0.06} />
            <Path d="M235 720 L295 555 L355 720 Z" fill={theme.accent} opacity={0.07} />
            <Path d="M295 720 L345 605 L385 720 Z" fill={theme.primary} opacity={0.05} />
            {/* Cute diagonal Fox Paw prints */}
            {[
              { x: 64, y: 140 },
              { x: 295, y: 260 },
              { x: 82, y: 430 },
              { x: 270, y: 520 },
            ].map((p, idx) => (
              <React.Fragment key={idx}>
                <Ellipse cx={p.x} cy={p.y} rx="11" ry="9" fill={theme.primary} opacity={0.08} />
                <Circle cx={p.x - 10} cy={p.y - 12} r="3.5" fill={theme.primary} opacity={0.08} />
                <Circle cx={p.x - 3} cy={p.y - 16} r="3.5" fill={theme.primary} opacity={0.08} />
                <Circle cx={p.x + 5} cy={p.y - 15} r="3.5" fill={theme.primary} opacity={0.08} />
                <Circle cx={p.x + 11} cy={p.y - 10} r="3.5" fill={theme.primary} opacity={0.08} />
              </React.Fragment>
            ))}
          </>
        ) : null}

        {theme.pattern === 'cosmos' ? (
          <>
            {/* Crescent moon & rings */}
            <Circle cx="290" cy="115" r="34" fill={theme.accent} opacity={0.08} />
            <Circle cx="304" cy="107" r="30" fill={theme.bg} opacity={0.96} />
            <Circle cx="82" cy="520" r="68" stroke={theme.accent} strokeWidth="1" fill="none" opacity={0.08} />
            <Circle cx="82" cy="520" r="95" stroke={theme.primary} strokeWidth="1" strokeDasharray="4 6" fill="none" opacity={0.07} />
            {/* Stars */}
            {[
              { x: 58, y: 120, r: 2.5 },
              { x: 145, y: 88, r: 2 },
              { x: 220, y: 185, r: 3 },
              { x: 310, y: 330, r: 2.2 },
              { x: 64, y: 310, r: 2.6 },
              { x: 195, y: 455, r: 2.4 },
              { x: 292, y: 580, r: 3 },
            ].map((st, idx) => (
              <Circle key={idx} cx={st.x} cy={st.y} r={st.r} fill={idx % 2 === 0 ? theme.accent : theme.primary} opacity={0.22} />
            ))}
          </>
        ) : null}

        {theme.pattern === 'sakura' ? (
          <>
            {/* Soft floating petals & 5-petal blossoms */}
            {[
              { x: 54, y: 135, s: 1 },
              { x: 298, y: 205, s: 1.2 },
              { x: 74, y: 445, s: 0.9 },
              { x: 280, y: 575, s: 1.1 },
            ].map((b, idx) => (
              <React.Fragment key={idx}>
                <Circle cx={b.x} cy={b.y - 11 * b.s} r={7 * b.s} fill={theme.primary} opacity={0.08} />
                <Circle cx={b.x + 10 * b.s} cy={b.y - 3 * b.s} r={7 * b.s} fill={theme.primary} opacity={0.08} />
                <Circle cx={b.x + 6 * b.s} cy={b.y + 9 * b.s} r={7 * b.s} fill={theme.primary} opacity={0.08} />
                <Circle cx={b.x - 6 * b.s} cy={b.y + 9 * b.s} r={7 * b.s} fill={theme.primary} opacity={0.08} />
                <Circle cx={b.x - 10 * b.s} cy={b.y - 3 * b.s} r={7 * b.s} fill={theme.primary} opacity={0.08} />
                <Circle cx={b.x} cy={b.y} r={4 * b.s} fill={theme.warning} opacity={0.14} />
              </React.Fragment>
            ))}
            <Path d="M190 95 Q205 85 202 104 Q188 106 190 95 Z" fill={theme.primary} opacity={0.12} />
            <Path d="M135 315 Q150 305 147 324 Q133 326 135 315 Z" fill={theme.accent} opacity={0.11} />
          </>
        ) : null}

        {theme.pattern === 'waves' ? (
          <>
            {[110, 260, 420, 580].map((y, idx) => (
              <Path
                key={idx}
                d={`M-20 ${y} Q70 ${y - 28} 160 ${y} T380 ${y}`}
                stroke={idx % 2 === 0 ? theme.primary : theme.accent}
                strokeWidth="2"
                fill="none"
                opacity={0.11}
              />
            ))}
          </>
        ) : null}

        {theme.pattern === 'playful' ? (
          <>
            <Circle cx="48" cy="145" r="24" stroke={strokeColor} strokeWidth="3" fill="none" opacity={0.1} />
            <Circle cx="305" cy="165" r="16" fill={secondColor} opacity={0.08} />
            {/* 4-point sparkles & lightning shapes */}
            <Path d="M292 315 L298 330 L313 336 L298 342 L292 357 L286 342 L271 336 L286 330 Z" fill={theme.warning} opacity={0.14} />
            <Path d="M62 470 L68 483 L81 489 L68 495 L62 508 L56 495 L43 489 L56 483 Z" fill={theme.accent} opacity={0.14} />
            <Path d="M180 615 Q195 590 225 605 T275 595" stroke={theme.primary} strokeWidth="3" fill="none" opacity={0.11} />
            <Circle cx="285" cy="510" r="28" stroke={secondColor} strokeWidth="2.5" strokeDasharray="6 6" fill="none" opacity={0.12} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
