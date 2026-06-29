import { InjectionToken } from '@angular/core';

/**
 * Coarse password-strength label paired with the 0..4 score. The four labels
 * map onto the five scores so a score of 0 and 1 both read as `'weak'`.
 *
 * @category forms/input
 */
export type PasswordStrengthLabel = 'weak' | 'fair' | 'good' | 'strong';

/**
 * Result of estimating a password's strength: a discrete `score` (0 = empty or
 * trivial, 4 = strong) and the matching coarse `label`. The directive announces
 * `label`; the meter renders `score` segments.
 *
 * @category forms/input
 */
export interface PasswordStrengthResult {
  /** Discrete strength on a 0..4 scale. */
  readonly score: 0 | 1 | 2 | 3 | 4;
  /** Coarse label derived from `score`. */
  readonly label: PasswordStrengthLabel;
}

/**
 * Pure estimator signature: maps a raw password to a {@link PasswordStrengthResult}.
 * Swap the default app-wide through {@link CNGX_PASSWORD_STRENGTH_FACTORY} (e.g.
 * a zxcvbn-backed estimator) without touching `CngxPasswordStrength`.
 *
 * @category forms/input
 */
export type CngxPasswordStrengthFactory = (password: string) => PasswordStrengthResult;

// Five scores collapse onto four labels: 0 (empty/trivial) and 1 (short or
// single character class) both read as 'weak'; 2/3/4 escalate from there.
const SCORE_LABELS: Record<PasswordStrengthResult['score'], PasswordStrengthLabel> = {
  0: 'weak',
  1: 'weak',
  2: 'fair',
  3: 'good',
  4: 'strong',
};

/**
 * Builds the dependency-less default password-strength estimator.
 *
 * The heuristic scores length tiers (>= 8 / 12 / 16) plus character-class
 * diversity (lower, upper, digit, symbol) and subtracts a point for a run of
 * three or more identical characters, then clamps to 0..4. It ships no
 * dictionary - enterprises swap in zxcvbn or similar via
 * {@link CNGX_PASSWORD_STRENGTH_FACTORY}.
 *
 * @category forms/input
 */
export function createPasswordStrength(): CngxPasswordStrengthFactory {
  return (password: string): PasswordStrengthResult => {
    if (!password) {
      return { score: 0, label: 'weak' };
    }

    let points = 0;
    const length = password.length;
    if (length >= 8) {
      points += 1;
    }
    if (length >= 12) {
      points += 1;
    }
    if (length >= 16) {
      points += 1;
    }

    const classes =
      (/[a-z]/.test(password) ? 1 : 0) +
      (/[A-Z]/.test(password) ? 1 : 0) +
      (/[0-9]/.test(password) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
    points += Math.max(0, classes - 1);

    // Penalise a run of three or more identical characters (e.g. "aaa", "111").
    if (/(.)\1{2,}/.test(password)) {
      points -= 1;
    }

    const score = Math.max(0, Math.min(4, points)) as PasswordStrengthResult['score'];
    return { score, label: SCORE_LABELS[score] };
  };
}

/**
 * DI token holding the active {@link CngxPasswordStrengthFactory} that
 * `CngxPasswordStrength` reads. `providedIn: 'root'` with the dependency-less
 * {@link createPasswordStrength} default, so the directive works without any
 * provider; override app-wide or per-subtree to swap in a heavier estimator.
 *
 * ```typescript
 * providers: [
 *   { provide: CNGX_PASSWORD_STRENGTH_FACTORY, useValue: zxcvbnEstimator },
 * ]
 * ```
 *
 * @category forms/input
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/password-strength.factory.ts
 * @since 0.2.0
 * @relatedTo CngxPasswordStrength, createPasswordStrength
 */
export const CNGX_PASSWORD_STRENGTH_FACTORY = new InjectionToken<CngxPasswordStrengthFactory>(
  'CNGX_PASSWORD_STRENGTH_FACTORY',
  { providedIn: 'root', factory: () => createPasswordStrength() },
);
