import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { FoxTheme } from '../theme/tokens';

export type FoxMood = 'focus' | 'rest' | 'celebrate' | 'study' | 'calm' | 'shield';

interface FoxMascotProps {
  mood: FoxMood;
  size?: number;
  theme: FoxTheme;
}

/** Custom expressive SVG Fox mascot reflecting study, rest, focus, or security states. */
export function FoxMascot({ mood, size = 76, theme }: FoxMascotProps) {
  const isResting = mood === 'rest' || mood === 'calm';
  const isHappy = mood === 'celebrate';
  const isFocus = mood === 'focus' || mood === 'study';

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Ambient aura */}
      <Circle
        cx="60"
        cy="62"
        r="52"
        fill={mood === 'shield' ? theme.infoSoft : isResting ? theme.successSoft : theme.primarySoft}
      />

      {/* Left & Right Outer Ears */}
      <Path d="M26 48 L18 14 L49 30 Z" fill={theme.foxFur} />
      <Path d="M94 48 L102 14 L71 30 Z" fill={theme.foxFur} />
      {/* Inner Ears */}
      <Path d="M28 42 L23 21 L43 32 Z" fill={theme.foxDark} />
      <Path d="M92 42 L97 21 L77 32 Z" fill={theme.foxDark} />

      {/* Head shape */}
      <Path
        d="M22 56 C22 34, 98 34, 98 56 C98 78, 76 96, 60 96 C44 96, 22 78, 22 56 Z"
        fill={theme.foxFur}
      />

      {/* White Cheek Fur */}
      <Path d="M22 60 C24 80, 42 94, 58 95 C49 82, 42 68, 22 60 Z" fill={theme.foxBelly} />
      <Path d="M98 60 C96 80, 78 94, 62 95 C71 82, 78 68, 98 60 Z" fill={theme.foxBelly} />
      {/* Muzzle center */}
      <Ellipse cx="60" cy="79" rx="18" ry="15" fill={theme.foxBelly} />

      {/* Nose */}
      <Ellipse cx="60" cy="76" rx="5.5" ry="4" fill="#1E293B" />
      <Circle cx="58.5" cy="75" r="1.4" fill="#FFFFFF" opacity={0.7} />

      {/* Eyes based on mood */}
      {isResting ? (
        <>
          <Path d="M38 60 Q44 65 50 60" stroke="#1E293B" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <Path d="M70 60 Q76 65 82 60" stroke="#1E293B" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </>
      ) : isHappy ? (
        <>
          <Path d="M38 61 Q44 53 50 61" stroke="#1E293B" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <Path d="M70 61 Q76 53 82 61" stroke="#1E293B" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Circle cx="44" cy="58" r="5" fill="#1E293B" />
          <Circle cx="76" cy="58" r="5" fill="#1E293B" />
          <Circle cx="42.5" cy="56.2" r="1.8" fill="#FFFFFF" />
          <Circle cx="74.5" cy="56.2" r="1.8" fill="#FFFFFF" />
        </>
      )}

      {/* Study Glasses when focusing or studying */}
      {isFocus && (
        <>
          <Circle cx="44" cy="58" r="9.5" stroke="#F8FAFC" strokeWidth="2.4" fill="rgba(255,255,255,0.10)" />
          <Circle cx="76" cy="58" r="9.5" stroke="#F8FAFC" strokeWidth="2.4" fill="rgba(255,255,255,0.10)" />
          <Path d="M53.5 58 L66.5 58" stroke="#F8FAFC" strokeWidth="2.4" />
        </>
      )}

      {/* Smile */}
      {isHappy ? (
        <Path d="M53 84 Q60 91 67 84" stroke="#1E293B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      ) : (
        <Path d="M55 84 Q60 87 65 84" stroke="#1E293B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}

      {/* Security Shield Badge */}
      {mood === 'shield' && (
        <>
          <Path
            d="M86 78 L98 83 L98 94 C98 102 86 107 86 107 C86 107 74 102 74 94 L74 83 Z"
            fill={theme.info}
            stroke="#FFFFFF"
            strokeWidth="2"
          />
          <Path d="M81 93 L85 97 L92 89" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Warm tea cup icon hint for rest */}
      {mood === 'rest' && (
        <>
          <Rect x="78" y="88" width="18" height="14" rx="4" fill={theme.success} stroke="#FFFFFF" strokeWidth="1.5" />
          <Path d="M84 82 Q83 78 86 75" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <Path d="M90 82 Q89 78 92 75" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
