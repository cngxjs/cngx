/** Parsed semantic version. */
export interface Version {
  readonly full: string;
  readonly major: string;
  readonly minor: string;
  readonly patch: string;
}

/** Creates a parsed {@link Version} from a semver string. */
export function makeVersion(full: string): Version {
  const [major = '0', minor = '0', patch = '0'] = full.split('.');
  return { full, major, minor, patch };
}

export const VERSION = makeVersion('0.0.0-PLACEHOLDER');
