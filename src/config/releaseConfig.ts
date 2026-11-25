export interface GitHubReleaseConfig {
  appVersion: string;
  versionCode: number;
  /** Replace with your GitHub username/org after creating the repository. */
  githubOwner: string;
  /** Repository name on GitHub. */
  githubRepo: string;
  /** Optional custom HTTPS manifest URL; defaults to GitHub Releases API when configured. */
  customManifestUrl?: string;
}

export const RELEASE_CONFIG: GitHubReleaseConfig = {
  appVersion: '1.0.0',
  versionCode: 1,
  githubOwner: 'hiddenpni-maker',
  githubRepo: 'fox-planner',
};

export function isGitHubUpdatesConfigured(config: GitHubReleaseConfig = RELEASE_CONFIG): boolean {
  if (config.customManifestUrl && config.customManifestUrl.startsWith('https://')) {
    return true;
  }
  return (
    Boolean(config.githubOwner) &&
    config.githubOwner !== 'YOUR_GITHUB_USERNAME' &&
    Boolean(config.githubRepo)
  );
}

export function resolveManifestUrl(config: GitHubReleaseConfig = RELEASE_CONFIG): string {
  if (config.customManifestUrl) return config.customManifestUrl;
  return `https://api.github.com/repos/${encodeURIComponent(config.githubOwner)}/${encodeURIComponent(
    config.githubRepo
  )}/releases/latest`;
}
