import type { FoxPlannerState, ThemePresetId } from '../types/planner';

export interface CryptoProvider {
  digestSha256Hex: (input: string) => Promise<string>;
  randomHex: (byteCount: number) => string;
}

/** Pure TypeScript SHA-256 fallback used only when Web Crypto subtle is unavailable. */
function sha256FallbackHex(asciiInput: string): string {
  const utf8 = unescape(encodeURIComponent(asciiInput));
  const msgBytes: number[] = [];
  for (let i = 0; i < utf8.length; i += 1) {
    msgBytes.push(utf8.charCodeAt(i));
  }
  const bitLen = msgBytes.length * 8;
  msgBytes.push(0x80);
  while ((msgBytes.length * 8) % 512 !== 448) {
    msgBytes.push(0);
  }
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  for (let i = 3; i >= 0; i -= 1) msgBytes.push((highBits >>> (i * 8)) & 0xff);
  for (let i = 3; i >= 0; i -= 1) msgBytes.push((lowBits >>> (i * 8)) & 0xff);

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < msgBytes.length; offset += 64) {
    const w = new Array<number>(64);
    for (let i = 0; i < 16; i += 1) {
      const idx = offset + i * 4;
      w[i] =
        ((msgBytes[idx] << 24) |
          (msgBytes[idx + 1] << 16) |
          (msgBytes[idx + 2] << 8) |
          msgBytes[idx + 3]) >>>
        0;
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = (rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3)) >>> 0;
      const s1 = (rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10)) >>> 0;
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i += 1) {
      const S1 = (rotr(6, e) ^ rotr(11, e) ^ rotr(25, e)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = (rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return H.map((val) => val.toString(16).padStart(8, '0')).join('');
}

const defaultCryptoProvider: CryptoProvider = {
  async digestSha256Hex(input: string): Promise<string> {
    try {
      const expoCrypto = await import('expo-crypto');
      return await expoCrypto.digestStringAsync(expoCrypto.CryptoDigestAlgorithm.SHA256, input);
    } catch {
      return sha256FallbackHex(input);
    }
  },
  randomHex(byteCount: number): string {
    const buf = new Uint8Array(byteCount);
    const cryptoObj = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
    if (cryptoObj?.getRandomValues) {
      cryptoObj.getRandomValues(buf);
    } else {
      for (let i = 0; i < byteCount; i += 1) {
        buf[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
  },
};

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createPinRecord(
  pin: string,
  provider: CryptoProvider = defaultCryptoProvider
): Promise<{ salt: string; hash: string }> {
  if (!isValidPinFormat(pin)) {
    throw new Error('PIN must contain 4 to 6 digits.');
  }
  const salt = provider.randomHex(16);
  let digest = `fox-planner-v1:${salt}:${pin}`;
  for (let round = 0; round < 250; round += 1) {
    digest = await provider.digestSha256Hex(`${salt}:${digest}`);
  }
  return { salt, hash: digest };
}

export async function verifyPinRecord(
  pin: string,
  salt: string,
  expectedHash: string,
  provider: CryptoProvider = defaultCryptoProvider
): Promise<boolean> {
  if (!isValidPinFormat(pin) || !salt || !expectedHash) return false;
  let digest = `fox-planner-v1:${salt}:${pin}`;
  for (let round = 0; round < 250; round += 1) {
    digest = await provider.digestSha256Hex(`${salt}:${digest}`);
  }
  return constantTimeEqual(digest, expectedHash);
}

export function sanitizeFileName(rawName: string, fallbackExt = 'bin'): string {
  const cleaned = rawName
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\.+/g, '.')
    .trim();
  if (!cleaned) return `attachment_${Date.now()}.${fallbackExt}`;
  return cleaned.slice(0, 96);
}

function normalizeThemePreset(raw: unknown): ThemePresetId {
  if (raw === 'warmPaper' || raw === 'light') return 'warmPaper';
  if (raw === 'forestFox') return 'forestFox';
  if (raw === 'moonlit') return 'moonlit';
  if (raw === 'sakuraBlossom') return 'sakuraBlossom';
  if (raw === 'matchaCalm') return 'matchaCalm';
  if (raw === 'candyPop') return 'candyPop';
  return 'midnightSage';
}

export function parseAndValidateBackup(rawJson: string): FoxPlannerState | null {
  try {
    const parsed = JSON.parse(rawJson) as Partial<FoxPlannerState> & { theme?: unknown };
    if (!parsed || typeof parsed !== 'object') return null;
    if (!Array.isArray(parsed.subjects) || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.notes)) {
      return null;
    }
    if (!Array.isArray(parsed.sessions) || !parsed.pomodoroSettings) {
      return null;
    }
    return {
      version: typeof parsed.version === 'number' ? parsed.version : 2,
      language: parsed.language === 'en' ? 'en' : 'fa',
      theme: normalizeThemePreset(parsed.theme),
      fontFamilyPreset:
        parsed.fontFamilyPreset === 'baloo' ||
        parsed.fontFamilyPreset === 'readex' ||
        parsed.fontFamilyPreset === 'lalezar' ||
        parsed.fontFamilyPreset === 'system'
          ? parsed.fontFamilyPreset
          : 'vazirmatn',
      fontScalePreset:
        parsed.fontScalePreset === 'sm' ||
        parsed.fontScalePreset === 'lg' ||
        parsed.fontScalePreset === 'xl'
          ? parsed.fontScalePreset
          : 'md',
      soundStyle:
        parsed.soundStyle === 'harp_breeze' ||
        parsed.soundStyle === 'marimba_joy' ||
        parsed.soundStyle === 'fox_fanfare' ||
        parsed.soundStyle === 'zen_bell' ||
        parsed.soundStyle === 'magic_sparkle' ||
        parsed.soundStyle === 'cozy_pop'
          ? parsed.soundStyle
          : 'crystal_kalimba',
      dailyGoalMinutes:
        typeof parsed.dailyGoalMinutes === 'number' && parsed.dailyGoalMinutes > 0
          ? Math.min(720, Math.round(parsed.dailyGoalMinutes))
          : 120,
      foxPoints: typeof parsed.foxPoints === 'number' && parsed.foxPoints >= 0 ? Math.round(parsed.foxPoints) : 0,
      hasCompletedOnboarding: Boolean(parsed.hasCompletedOnboarding),
      celebrationSoundsEnabled: parsed.celebrationSoundsEnabled !== false,
      subjects: parsed.subjects,
      tasks: parsed.tasks,
      notes: parsed.notes,
      sessions: parsed.sessions,
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      calendarEvents: Array.isArray(parsed.calendarEvents) ? parsed.calendarEvents : [],
      moodLogs: Array.isArray(parsed.moodLogs) ? parsed.moodLogs : [],
      pomodoroSettings: parsed.pomodoroSettings,
      security: parsed.security ?? {
        pinEnabled: false,
        pinSalt: '',
        pinHash: '',
        failedAttempts: 0,
        lockUntilEpoch: 0,
      },
      bookmarkedGuideIds: Array.isArray(parsed.bookmarkedGuideIds) ? parsed.bookmarkedGuideIds : [],
      wellnessLogs: Array.isArray(parsed.wellnessLogs) ? parsed.wellnessLogs : [],
    };
  } catch {
    return null;
  }
}
