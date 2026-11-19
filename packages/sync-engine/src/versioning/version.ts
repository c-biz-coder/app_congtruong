export type Version = number;

export const INITIAL_VERSION: Version = 1;

export function bumpVersion(version: Version): Version {
  return version + 1;
}

export function isNewerOrEqual(candidate: Version, other: Version): boolean {
  return candidate >= other;
}
