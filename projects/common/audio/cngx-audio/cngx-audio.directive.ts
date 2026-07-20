import { Directive, afterNextRender, computed, input, isDevMode } from '@angular/core';

import { injectCngxAudio } from '../inject-audio';
import { type CngxAudioDomEvent, parseEventBindings } from './parse-bindings';

/**
 * Event-mode audio binder. Maps DOM events on the host to earcons via the
 * `event:earcon` grammar — a pure DOM-event-to-sound directive with no state
 * coupling (that is `[cngxAudioStatus]`'s job).
 *
 * ```html
 * <button [cngxAudio]="'click:tap'">Save</button>
 * <a [cngxAudio]="'pointerenter:notification, click:complete'">Open</a>
 * ```
 *
 * Playback is skipped when the element is disabled (`[audioDisabled]`), when
 * the engine is muted / reduced-motion-gated / autoplay-not-armed, or when the
 * same earcon is still within the debounce window. `[audioVolume]` scales just
 * this element's plays.
 *
 * @category common/audio
 * @docsKind primary
 * @relatedTo injectCngxAudio, provideCngxAudio, CngxAudioStatus
 */
@Directive({
  selector: '[cngxAudio]',
  exportAs: 'cngxAudio',
  host: {
    '(click)': 'handleEvent("click")',
    '(focus)': 'handleEvent("focus")',
    '(blur)': 'handleEvent("blur")',
    '(pointerenter)': 'handleEvent("pointerenter")',
    '(pointerleave)': 'handleEvent("pointerleave")',
    '(submit)': 'handleEvent("submit")',
    '(change)': 'handleEvent("change")',
    '(input)': 'handleEvent("input")',
  },
})
export class CngxAudio {
  private readonly audio = injectCngxAudio();

  /** The `event:earcon` grammar, e.g. `'click:tap, focus:notification'`. */
  readonly spec = input<string>('', { alias: 'cngxAudio' });

  /** Per-element volume multiplier in `[0, 1]`; unset uses the engine volume. */
  readonly audioVolume = input<number | undefined>(undefined);

  /** Suppress this element's audio without unbinding. */
  readonly audioDisabled = input<boolean>(false);

  protected readonly bindings = computed(() => parseEventBindings(this.spec()).bindings);

  constructor() {
    if (isDevMode()) {
      // One-shot post-binding check, not a reactive node.
      afterNextRender(() => {
        const parsed = parseEventBindings(this.spec());
        if (parsed.lifecycleKeys.length > 0) {
          console.error(
            `[cngxAudio] Lifecycle keys "${parsed.lifecycleKeys.join(', ')}" are not DOM events. ` +
              'Use [cngxAudioStatus] for lifecycle bindings.',
          );
        }
        if (parsed.unknownKeys.length > 0) {
          console.warn(
            `[cngxAudio] Unrecognised event keys "${parsed.unknownKeys.join(', ')}". ` +
              'Expected one of: click, focus, blur, pointerenter, pointerleave, submit, change, input.',
          );
        }
      });
    }
  }

  protected handleEvent(event: CngxAudioDomEvent): void {
    if (this.audioDisabled()) {
      return;
    }
    const earcon = this.bindings().get(event);
    if (!earcon) {
      return;
    }
    this.audio.play(earcon, this.audioVolume());
  }
}
