import { isGitHubUpdatesConfigured, RELEASE_CONFIG, resolveManifestUrl, type GitHubReleaseConfig } from '../config/releaseConfig';

export interface ApkAssetLinks {
  universal?: string;
  arm64?: string;
  armv7?: string;
  x86_64?: string;
}

export interface UpdateManifest {
  version: string;
  versionCode?: number;
  releaseDate?: string;
  notesFa?: string;
  notesEn?: string;
  downloadPageUrl: string;
  apkUrls: ApkAssetLinks;
}

export type UpdateCheckResult =
  | { status: 'not_configured' }
  | { status: 'up_to_date'; currentVersion: string }
  | { status: 'update_available'; currentVersion: string; latest: UpdateManifest }
  | { status: 'error'; reason: string };

/** Ensures only HTTPS URLs can ever be presented or opened from remote manifests. */
export function isSafeHttpsUrl(rawUrl: unknown): rawUrl is string {
  if (typeof rawUrl !== 'string' || !rawUrl.startsWith('https://')) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/** Compares semantic versions like "1.2.0" vs "v1.10.0". Returns >0 if b > a, 0 if equal, <0 if b < a. */
export function compareSemver(current: string, candidate: string): number {
  const parse = (v: string) =>
    v
      .trim()
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((part) => {
        const n = parseInt(part, 10);
        return Number.isFinite(n) && n >= 0 ? n : 0;
      });
  const a = parse(current);
  const b = parse(candidate);
  const len = Math.max(a.length, b.length, 3);
  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (bv !== av) return bv - av;
  }
  return 0;
}

function pickSafeUrl(val: unknown): string | undefined {
  return isSafeHttpsUrl(val) ? val : undefined;
}

/**
 * Parses either a custom `version.json` manifest OR a GitHub Releases `/releases/latest` JSON payload.
 * Rejects unsafe non-HTTPS URLs cleanly.
 */
export function parseVersionManifest(raw: unknown): UpdateManifest | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  // Case 1: GitHub Releases API payload (`tag_name`, `html_url`, `assets`)
  if (typeof obj.tag_name === 'string' && isSafeHttpsUrl(obj.html_url)) {
    const assets = Array.isArray(obj.assets) ? (obj.assets as Record<string, unknown>[]) : [];
    const apkUrls: ApkAssetLinks = {};
    for (const asset of assets) {
      const name = typeof asset.name === 'string' ? asset.name.toLowerCase() : '';
      const url = pickSafeUrl(asset.browser_download_url);
      if (!url || !name.endsWith('.apk')) continue;
      if (name.includes('arm64')) apkUrls.arm64 = url;
      else if (name.includes('armeabi') || name.includes('armv7')) apkUrls.armv7 = url;
      else if (name.includes('x86_64')) apkUrls.x86_64 = url;
      else if (name.includes('universal') || !apkUrls.universal) apkUrls.universal = url;
    }

    const bodyText = typeof obj.body === 'string' ? obj.body.trim().slice(0, 800) : undefined;
    return {
      version: obj.tag_name.replace(/^v/i, ''),
      releaseDate: typeof obj.published_at === 'string' ? obj.published_at.slice(0, 10) : undefined,
      notesFa: bodyText,
      notesEn: bodyText,
      downloadPageUrl: obj.html_url,
      apkUrls,
    };
  }

  // Case 2: Dedicated version.json manifest
  if (typeof obj.version === 'string' && isSafeHttpsUrl(obj.downloadPageUrl)) {
    const rawApks = (obj.apkUrls && typeof obj.apkUrls === 'object' ? obj.apkUrls : {}) as Record<string, unknown>;
    return {
      version: obj.version.replace(/^v/i, ''),
      versionCode: typeof obj.versionCode === 'number' ? obj.versionCode : undefined,
      releaseDate: typeof obj.releaseDate === 'string' ? obj.releaseDate : undefined,
      notesFa: typeof obj.notesFa === 'string' ? obj.notesFa : undefined,
      notesEn: typeof obj.notesEn === 'string' ? obj.notesEn : undefined,
      downloadPageUrl: obj.downloadPageUrl,
      apkUrls: {
        universal: pickSafeUrl(rawApks.universal),
        arm64: pickSafeUrl(rawApks.arm64),
        armv7: pickSafeUrl(rawApks.armv7),
        x86_64: pickSafeUrl(rawApks.x86_64),
      },
    };
  }

  return null;
}

/** Checks GitHub for a newer Fox Planner release with a strict timeout and zero telemetry. */
export async function checkForGitHubUpdate(
  config: GitHubReleaseConfig = RELEASE_CONFIG,
  fetchImpl: typeof fetch = fetch
): Promise<UpdateCheckResult> {
  if (!isGitHubUpdatesConfigured(config)) {
    return { status: 'not_configured' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = resolveManifestUrl(config);
    const resp = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/vnd.github+json, application/json' },
      signal: controller.signal,
    });
    if (!resp.ok) {
      return { status: 'error', reason: `HTTP ${resp.status}` };
    }
    const data: unknown = await resp.json();
    const manifest = parseVersionManifest(data);
    if (!manifest) {
      return { status: 'error', reason: 'Invalid manifest format' };
    }

    const versionHigher = compareSemver(config.appVersion, manifest.version) > 0;
    const codeHigher =
      manifest.versionCode !== undefined && manifest.versionCode > config.versionCode;

    if (versionHigher || codeHigher) {
      return {
        status: 'update_available',
        currentVersion: config.appVersion,
        latest: manifest,
      };
    }

    return { status: 'up_to_date', currentVersion: config.appVersion };
  } catch (err) {
    return { status: 'error', reason: err instanceof Error ? err.message : 'Network error' };
  } finally {
    clearTimeout(timeoutId);
  }
}
