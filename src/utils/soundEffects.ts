import { Platform } from 'react-native';
import { createAudioPlayer, preload, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import type { SoundStyleId } from '../types/planner';

export type SoundCueKind = 'task' | 'pomodoro' | 'mood' | 'reminder' | 'levelUp';

export interface SoundStyleMeta {
  id: SoundStyleId;
  emoji: string;
  nameFa: string;
  nameEn: string;
  descFa: string;
  descEn: string;
}

export const SOUND_STYLES: SoundStyleMeta[] = [
  {
    id: 'crystal_kalimba',
    emoji: '✨',
    nameFa: 'بلور و کالیمبا',
    nameEn: 'Crystal Kalimba',
    descFa: 'آکورد ملایم و کریستالی (پیشنهادی)',
    descEn: 'Warm dreamy Cmaj9 kalimba chime',
  },
  {
    id: 'harp_breeze',
    emoji: '🌿',
    nameFa: 'چنگ بهاری آرام',
    nameEn: 'Harp Breeze',
    descFa: 'آرپژ نرم چنگ با پژواک طبیعت',
    descEn: 'Ascending silky harp shimmer',
  },
  {
    id: 'marimba_joy',
    emoji: '🎵',
    nameFa: 'ماریمبای شاد',
    nameEn: 'Marimba Joy',
    descFa: 'ریتم چوبی پرانرژی و خوش‌صدا',
    descEn: 'Bright upbeat wooden marimba pop',
  },
  {
    id: 'fox_fanfare',
    emoji: '🦊',
    nameFa: 'تشویق پیروزی روباه',
    nameEn: 'Fox Fanfare',
    descFa: 'فنفار گرم پایان موفقیت‌ها',
    descEn: 'Uplifting victory chord progression',
  },
  {
    id: 'zen_bell',
    emoji: '🧘',
    nameFa: 'زنگ ذن و مدیتیشن',
    nameEn: 'Zen Singing Bell',
    descFa: 'زنگ عمیق و آرامش‌بخش ذهن',
    descEn: 'Deep resonant mindfulness bowl',
  },
  {
    id: 'magic_sparkle',
    emoji: '🌟',
    nameFa: 'جرقه جادویی',
    nameEn: 'Magic Sparkle',
    descFa: 'نُت‌های درخشان و فانتزی سریع',
    descEn: 'Glittering ascending fairy notes',
  },
  {
    id: 'cozy_pop',
    emoji: '🫧',
    nameFa: 'حباب بامزه',
    nameEn: 'Cozy Bubble Pop',
    descFa: 'صدای کوتاه و شیرین دوحبابی',
    descEn: 'Cute gentle two-note bubble pop',
  },
];

const SOUND_ASSETS: Record<SoundStyleId, number> = {
  crystal_kalimba: require('../../assets/sounds/crystal_kalimba.wav'),
  harp_breeze: require('../../assets/sounds/harp_breeze.wav'),
  marimba_joy: require('../../assets/sounds/marimba_joy.wav'),
  fox_fanfare: require('../../assets/sounds/fox_fanfare.wav'),
  zen_bell: require('../../assets/sounds/zen_bell.wav'),
  magic_sparkle: require('../../assets/sounds/magic_sparkle.wav'),
  cozy_pop: require('../../assets/sounds/cozy_pop.wav'),
};

interface WebSynthNote {
  t: number;
  f: number;
  dur: number;
  vol?: number;
  type?: OscillatorType;
}

const WEB_SYNTH_PATTERNS: Record<SoundStyleId, { notes: WebSynthNote[]; reverbDelay?: number }> = {
  crystal_kalimba: {
    reverbDelay: 0.09,
    notes: [
      { t: 0.0, f: 523.25, dur: 0.6, type: 'sine' },
      { t: 0.075, f: 659.25, dur: 0.6, type: 'sine' },
      { t: 0.15, f: 783.99, dur: 0.65, type: 'triangle' },
      { t: 0.225, f: 987.77, dur: 0.72, type: 'sine' },
      { t: 0.3, f: 1174.66, dur: 0.85, vol: 0.1, type: 'sine' },
    ],
  },
  harp_breeze: {
    reverbDelay: 0.08,
    notes: [
      { t: 0.0, f: 392.0, dur: 0.65, type: 'triangle' },
      { t: 0.055, f: 493.88, dur: 0.65, type: 'sine' },
      { t: 0.11, f: 587.33, dur: 0.65, type: 'triangle' },
      { t: 0.165, f: 783.99, dur: 0.75, type: 'sine' },
      { t: 0.23, f: 987.77, dur: 0.82, type: 'sine' },
      { t: 0.31, f: 1174.66, dur: 0.9, type: 'sine' },
    ],
  },
  marimba_joy: {
    reverbDelay: 0.05,
    notes: [
      { t: 0.0, f: 587.33, dur: 0.24, type: 'sine' },
      { t: 0.085, f: 739.99, dur: 0.26, type: 'sine' },
      { t: 0.17, f: 880.0, dur: 0.34, type: 'sine' },
      { t: 0.26, f: 1174.66, dur: 0.45, type: 'triangle' },
    ],
  },
  fox_fanfare: {
    reverbDelay: 0.07,
    notes: [
      { t: 0.0, f: 523.25, dur: 0.25, type: 'triangle' },
      { t: 0.095, f: 659.25, dur: 0.25, type: 'triangle' },
      { t: 0.19, f: 783.99, dur: 0.28, type: 'triangle' },
      { t: 0.3, f: 1046.5, dur: 0.75, vol: 0.12, type: 'sine' },
      { t: 0.3, f: 523.25, dur: 0.75, vol: 0.08, type: 'sine' },
      { t: 0.3, f: 783.99, dur: 0.75, vol: 0.08, type: 'triangle' },
    ],
  },
  zen_bell: {
    reverbDelay: 0.12,
    notes: [
      { t: 0.0, f: 432.0, dur: 1.45, vol: 0.13, type: 'sine' },
      { t: 0.0, f: 864.0, dur: 1.15, vol: 0.05, type: 'sine' },
      { t: 0.02, f: 648.0, dur: 1.1, vol: 0.04, type: 'sine' },
    ],
  },
  magic_sparkle: {
    reverbDelay: 0.06,
    notes: [
      { t: 0.0, f: 783.99, dur: 0.35, type: 'sine' },
      { t: 0.045, f: 987.77, dur: 0.35, type: 'sine' },
      { t: 0.09, f: 1174.66, dur: 0.4, type: 'triangle' },
      { t: 0.14, f: 1567.98, dur: 0.55, type: 'sine' },
      { t: 0.2, f: 1975.53, dur: 0.65, vol: 0.08, type: 'sine' },
    ],
  },
  cozy_pop: {
    reverbDelay: 0.04,
    notes: [
      { t: 0.0, f: 480.0, dur: 0.16, vol: 0.13, type: 'sine' },
      { t: 0.075, f: 720.0, dur: 0.22, vol: 0.12, type: 'sine' },
    ],
  },
};

const playerCache: Partial<Record<SoundStyleId, AudioPlayer>> = {};
let audioModeConfigured = false;

if (Platform.OS !== 'web') {
  try {
    (Object.keys(SOUND_ASSETS) as SoundStyleId[]).forEach((k) => {
      void preload(SOUND_ASSETS[k]);
    });
  } catch {
    // Ignore preloading errors in headless runtimes.
  }
}

async function ensureNativeAudioMode(): Promise<void> {
  if (audioModeConfigured || Platform.OS === 'web') return;
  audioModeConfigured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    });
  } catch {
    // Safe fallback if audio mode configuration is unsupported.
  }
}

async function playNativeWavStyle(styleId: SoundStyleId): Promise<void> {
  try {
    await ensureNativeAudioMode();
    let player = playerCache[styleId];
    if (!player) {
      player = createAudioPlayer(SOUND_ASSETS[styleId]);
      player.volume = 0.88;
      playerCache[styleId] = player;
    } else {
      await player.seekTo(0).catch(() => {});
    }
    player.play();
  } catch {
    // Ignore native playback errors gracefully.
  }
}

/** Triggers gentle haptic vibration on supported Android/iOS phones. */
export async function triggerHaptic(kind: 'light' | 'medium' | 'success' | 'warning'): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (kind === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (kind === 'medium') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Ignore when device lacks haptics.
  }
}

function playWebRichPattern(styleId: SoundStyleId): void {
  try {
    const AudioCtx =
      (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const pattern = WEB_SYNTH_PATTERNS[styleId] ?? WEB_SYNTH_PATTERNS.crystal_kalimba;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.85, now);

    // Warm low-pass + soft echo tail for studio-like warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, now);

    const delay = ctx.createDelay(0.5);
    delay.delayTime.setValueAtTime(pattern.reverbDelay ?? 0.08, now);
    const delayGain = ctx.createGain();
    delayGain.gain.setValueAtTime(0.24, now);

    filter.connect(masterGain);
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    pattern.notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = n.type ?? 'sine';
      const startAt = now + n.t;
      const peak = n.vol ?? 0.11;
      osc.frequency.setValueAtTime(n.f, startAt);
      g.gain.setValueAtTime(0.0005, startAt);
      g.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0004, startAt + n.dur);
      osc.connect(g);
      g.connect(filter);
      osc.start(startAt);
      osc.stop(startAt + n.dur + 0.03);
    });
  } catch {
    // Ignore autoplay blocks gracefully.
  }
}

/** Directly plays any specific studio sound effect by style ID (used both in tests & cues). */
export function playSoundByStyle(styleId: SoundStyleId, enabled: boolean): void {
  if (!enabled) return;
  if (Platform.OS !== 'web') {
    void triggerHaptic(styleId === 'fox_fanfare' || styleId === 'magic_sparkle' ? 'success' : 'light');
    void playNativeWavStyle(styleId);
    return;
  }
  playWebRichPattern(styleId);
}

/** Maps planner events (task, pomodoro, mood, reminder, levelUp) to rich sound effects. */
export function playCelebrationSound(
  kind: SoundCueKind,
  enabled: boolean,
  preferredStyle: SoundStyleId = 'crystal_kalimba'
): void {
  if (!enabled) return;
  if (kind === 'pomodoro') {
    playSoundByStyle(preferredStyle === 'zen_bell' ? 'zen_bell' : 'fox_fanfare', true);
    return;
  }
  if (kind === 'levelUp') {
    playSoundByStyle('magic_sparkle', true);
    return;
  }
  if (kind === 'reminder') {
    playSoundByStyle(preferredStyle === 'zen_bell' ? 'zen_bell' : 'harp_breeze', true);
    return;
  }
  if (kind === 'mood') {
    playSoundByStyle('cozy_pop', true);
    return;
  }
  playSoundByStyle(preferredStyle, true);
}

export function playCompletionChime(enabled: boolean, preferredStyle: SoundStyleId = 'crystal_kalimba'): void {
  playCelebrationSound('pomodoro', enabled, preferredStyle);
}
