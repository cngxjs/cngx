import { Directive, afterNextRender, computed, effect, inject, input, isDevMode, untracked } from '@angular/core';
import {
  CNGX_STATEFUL,
  type CngxAsyncState,
  createTransitionTracker,
} from '@cngx/core/utils';

import { injectCngxAudio } from '../inject-audio';
import { sameStringMap } from '../internal/same-string-map';
import { parseStatusBindings } from './parse-status-bindings';

/**
 * Status-mode audio bridge. Maps `CngxAsyncState` lifecycle transitions to
 * earcons via the `status:earcon` grammar — the audition counterpart of
 * `CngxToastOn`. Fires only on a real status transition, never on the initial
 * `idle`, and at most once per transition.
 *
 * ```html
 * <button [cngxAsyncClick]="upload"
 *   #upload="cngxAsyncClick"
 *   [state]="upload.state"
 *   [cngxAudioStatus]="'pending:tap, succeeded:success, failed:error'">
 *   Upload
 * </button>
 * ```
 *
 * The state source resolves the same way the feedback bridges do: an explicit
 * `[state]` input wins, otherwise it falls back to an ancestor's
 * `CNGX_STATEFUL`. The grammar keys are lifecycle statuses only — DOM-event
 * keys (`click`, `focus`, …) belong to `[cngxAudio]` and are rejected with a
 * dev-error. `succeeded`/`failed` are accepted as aliases for `success`/`error`.
 *
 * @category common/audio
 * @docsKind primary
 * @relatedTo CngxAudio, injectCngxAudio, CngxAsyncClick
 */
@Directive({
  selector: '[cngxAudioStatus]',
  exportAs: 'cngxAudioStatus',
})
export class CngxAudioStatus {
  private readonly audio = injectCngxAudio();
  private readonly statefulFallback = inject(CNGX_STATEFUL, { optional: true });

  /** The `status:earcon` grammar, e.g. `'pending:tap, succeeded:success'`. */
  readonly spec = input<string>('', { alias: 'cngxAudioStatus' });

  /**
   * The async state to watch. Optional — when omitted, the bridge falls back to
   * an ancestor `CNGX_STATEFUL`. A bare `[state]` attribute (empty string) is
   * treated as "no input bound" so the fallback kicks in.
   */
  readonly state = input<
    CngxAsyncState<unknown> | undefined,
    CngxAsyncState<unknown> | '' | undefined
  >(undefined, {
    transform: (v) => (typeof v === 'string' ? undefined : v),
  });

  /** Per-element volume multiplier in `[0, 1]`; unset uses the engine volume. */
  readonly audioVolume = input<number | undefined>(undefined);

  /** Suppress this element's audio without unbinding. */
  readonly audioDisabled = input<boolean>(false);

  /** Effective state — explicit input wins over ancestor `CNGX_STATEFUL`. */
  private readonly effectiveState = computed<CngxAsyncState<unknown> | undefined>(
    () => this.state() ?? this.statefulFallback?.state,
  );

  private readonly bindings = computed(() => parseStatusBindings(this.spec()).bindings, {
    equal: sameStringMap,
  });

  constructor() {
    if (isDevMode()) {
      // One-shot post-binding check, not a reactive node.
      afterNextRender(() => {
        const parsed = parseStatusBindings(this.spec());
        if (parsed.domEventKeys.length > 0) {
          console.error(
            `[cngxAudioStatus] DOM-event keys "${parsed.domEventKeys.join(', ')}" are not lifecycle ` +
              'statuses. Use [cngxAudio] for DOM-event bindings.',
          );
        }
        if (this.state() === undefined && !this.statefulFallback) {
          console.error(
            '[cngxAudioStatus] No state source. Bind [state]="state" explicitly or place inside a ' +
              'component that provides CNGX_STATEFUL.',
          );
        }
      });
    }

    const tracker = createTransitionTracker(() => this.effectiveState()?.status() ?? 'idle');
    effect(() => {
      const status = tracker.current();
      const previous = tracker.previous();
      if (status === previous) {
        return;
      }
      untracked(() => {
        if (this.audioDisabled()) {
          return;
        }
        const earcon = this.bindings().get(status);
        if (earcon) {
          this.audio.play(earcon, this.audioVolume());
        }
      });
    });
  }
}
