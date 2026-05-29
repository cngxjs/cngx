/**
 * Parsed semantic version.
 *
 * @category utils/version
 */
export interface Version {
  readonly full: string;
  readonly major: string;
  readonly minor: string;
  readonly patch: string;
}

/**
 * Creates a parsed {@link Version} from a semver string.
 *
 * @category utils/version
 */
export function makeVersion(full: string): Version {
  const [major = '0', minor = '0', patch = '0'] = full.split('.');
  return { full, major, minor, patch };
}

/** @internal — replaced at publish time, not part of consumer API. */
export const VERSION = makeVersion('0.0.0-PLACEHOLDER');
