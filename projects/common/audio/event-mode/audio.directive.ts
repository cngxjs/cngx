import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  untracked,
} from '@angular/core';

import { injectCngxAudio } from '../inject-audio';
import { sameStringMap } from '../internal/same-string-map';
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
 * The listener set is derived from the grammar, not fixed: `'click:tap'`
 * registers one DOM listener, and rebinding `[cngxAudio]` at runtime adds the
 * newly named events and removes the dropped ones. Listeners are registered
 * outside Angular's event dispatch, so hovering or typing on a bound element
 * plays its earcon without scheduling change detection. The directive renders
 * nothing, so there is no view to keep in sync.
 *
 * @category common/audio
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/event-mode/audio.directive.ts
 * @since 0.1.0
 * @relatedTo injectCngxAudio, provideCngxAudio, CngxAudioStatus
 * <example-url>http://localhost:4200/#/common/audio/event-mode/basic</example-url>
 * <example-url>http://localhost:4200/#/common/audio/event-mode/custom-earcons</example-url>
 * <example-url>http://localhost:4200/#/common/audio/event-mode/earcon-palette</example-url>
 * <example-url>http://localhost:4200/#/common/audio/event-mode/form-feedback</example-url>
 * <example-url>http://localhost:4200/#/common/audio/event-mode/hover-and-focus</example-url>
 */
@Directive({
  selector: '[cngxAudio]',
  exportAs: 'cngxAudio',
})
export class CngxAudio {
  private readonly audio = injectCngxAudio();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** The listeners currently registered on the host, keyed by event type. */
  private readonly bound = new Map<CngxAudioDomEvent, EventListener>();

  /** The `event:earcon` grammar, e.g. `'click:tap, focus:notification'`. */
  readonly spec = input<string>('', { alias: 'cngxAudio' });

  /** Per-element volume multiplier in `[0, 1]`; unset uses the engine volume. */
  readonly audioVolume = input<number | undefined>(undefined);

  /** Suppress this element's audio without unbinding. */
  readonly audioDisabled = input(false, { transform: booleanAttribute });

  protected readonly bindings = computed(() => parseEventBindings(this.spec()).bindings, {
    equal: sameStringMap,
  });

  constructor() {
    effect(() => {
      const wanted = this.bindings();
      untracked(() => this.syncListeners(wanted));
    });

    this.destroyRef.onDestroy(() => this.unbindAll());

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

  /**
   * Diff the bound listener set against the parsed spec: drop event types the
   * grammar no longer names, add the ones it newly names, leave the rest alone.
   * A rebuild would churn a listener that is still wanted.
   */
  private syncListeners(wanted: ReadonlyMap<CngxAudioDomEvent, string>): void {
    const el = this.host.nativeElement;

    for (const [type, listener] of this.bound) {
      if (!wanted.has(type)) {
        el.removeEventListener(type, listener);
        this.bound.delete(type);
      }
    }

    for (const type of wanted.keys()) {
      if (this.bound.has(type)) {
        continue;
      }
      // Captures the type only — the earcon is read fresh at fire time, so
      // renaming it in the grammar needs no rebind.
      const listener: EventListener = () => this.handleEvent(type);
      el.addEventListener(type, listener, { passive: true });
      this.bound.set(type, listener);
    }
  }

  private unbindAll(): void {
    const el = this.host.nativeElement;
    for (const [type, listener] of this.bound) {
      el.removeEventListener(type, listener);
    }
    this.bound.clear();
  }

  private handleEvent(event: CngxAudioDomEvent): void {
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
