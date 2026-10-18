import { untracked, type Signal } from '@angular/core';
import { createAnnouncementPhrase } from '@cngx/core/utils';

import type { CngxTransitionOutcome } from './transition-outcome';

/**
 * Options for {@link createRefusedPhrase}. Every field is a plain
 * reactive read, so the factory stays independent of any host type.
 *
 * @category common/data/commit
 * @since 0.1.0
 */
export interface CngxRefusedPhraseOptions {
  /** The host's last refused or failed outcome, `undefined` once cleared. */
  readonly outcome: () => CngxTransitionOutcome | undefined;
  /** Commit status of the host; any change spends an armed phrase. */
  readonly status: () => unknown;
  /** Active index of the host; any move spends an armed phrase. */
  readonly activeIndex: () => number | undefined;
  /**
   * Copy voiced for a new refusal. Read untracked at arm time only, so a
   * language switch never re-speaks a phrase that was already voiced.
   */
  readonly copy: () => string;
  /**
   * Optional extra expiry trigger: a changed value (compared with
   * `!==`) spends an armed phrase, e.g. a newer close announcement that
   * must not be masked by a stale refusal.
   */
  readonly extraSpend?: () => unknown;
}

/**
 * Live-region phrase for a refused commit-gated transition (a step
 * change or tab switch whose `commitAction` answered `false`).
 *
 * A refusal settles the commit status back to `'idle'`, so no status
 * edge can voice it. This phrase arms on each new refused outcome (a new
 * `sequence`) and is spent by the next commit status change, an
 * active-index move, a cleared outcome or, when given, a changed
 * `extraSpend` value. A failed outcome never arms it. Arm wins over
 * spend in the same flush, so an optimistic rollback that moves the
 * active index still voices the refusal.
 *
 * Built on {@link createAnnouncementPhrase}: fully derived, no `effect`.
 * The same eager-read caveat applies - read the phrase before branching
 * on another arm of the live announcement, otherwise a spend transition
 * can be skipped.
 *
 * ```ts
 * const refusedPhrase = createRefusedPhrase({
 *   outcome: () => presenter.lastOutcome(),
 *   status: () => presenter.commitTransition.current(),
 *   activeIndex: () => presenter.activeIndex(),
 *   copy: () => i18n().commitRefusedGeneric,
 * });
 * ```
 *
 * @category common/data/commit
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/commit/refused-phrase.ts
 * @since 0.1.0
 * @relatedTo CngxTransitionOutcome, createAnnouncementPhrase
 */
export function createRefusedPhrase(options: CngxRefusedPhraseOptions): Signal<string> {
  const { outcome, status, activeIndex, copy, extraSpend } = options;
  return createAnnouncementPhrase({
    source: () => {
      const current = outcome();
      return {
        sequence: current?.sequence,
        kind: current?.kind,
        status: status(),
        activeIndex: activeIndex(),
        extra: extraSpend?.(),
      };
    },
    arm: (curr, prev) =>
      curr.kind === 'refused' && curr.sequence !== prev.sequence ? untracked(copy) : null,
    spend: (curr, prev) =>
      curr.status !== prev.status ||
      curr.activeIndex !== prev.activeIndex ||
      curr.sequence === undefined ||
      curr.extra !== prev.extra,
  });
}
