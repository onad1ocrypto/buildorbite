/** Devvit playtest builds use a prerelease app version with a fourth numeric segment. */
export function isDevvitPlaytestVersion(version: unknown): boolean {
  return typeof version === 'string' && /^\d+\.\d+\.\d+\.\d+$/.test(version);
}
