/**
 * Parsed semantic version.
 *
 * The fields are display-only string segments (badge rendering, log lines,
 * about panels) - they are not comparable numerically or lexically across
 * versions. Use a real semver library when you need ordering or range
 * checks.
 *
 * @category utils/version
 */
export interface Version {
  readonly full: string;
  readonly major: string;
  readonly minor: string;
  readonly patch: string;
  /** Pre-release tag after the first `-` (e.g. `'rc.2'`), or `''` when none. */
  readonly prerelease: string;
}

/**
 * Creates a parsed {@link Version} from a semver string.
 *
 * The pre-release tag and build metadata are split off before the dot
 * parsing, so `'0.2.0-rc.2'` yields patch `'0'` and prerelease `'rc.2'`
 * instead of a mangled patch segment. Display-only - see {@link Version}.
 *
 * @category utils/version
 */
export function makeVersion(full: string): Version {
  // Build metadata (+...) is dropped from the segments; the pre-release tag
  // starts at the first '-' after it.
  const [noBuild = ''] = full.split('+');
  const dash = noBuild.indexOf('-');
  const core = dash === -1 ? noBuild : noBuild.slice(0, dash);
  const prerelease = dash === -1 ? '' : noBuild.slice(dash + 1);
  const [major = '0', minor = '0', patch = '0'] = core.split('.');
  return { full, major, minor, patch, prerelease };
}

/** @internal - replaced at publish time, not part of consumer API. */
export const VERSION = makeVersion('0.0.0-PLACEHOLDER');
