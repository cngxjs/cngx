import { Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';

import { injectCngxAudio } from '../inject-audio';

/** Earcon names played as the pointer or focus enters and leaves a zone. */
export interface CngxAudioZoneBinding {
  /** Played on `pointerenter`. */
  readonly enter?: string | null;
  /** Played on `pointerleave`. */
  readonly leave?: string | null;
  /** Played on `focusin`. */
  readonly focus?: string | null;
  /** Played on `focusout`. */
  readonly blur?: string | null;
}

/**
 * Zone-mode audio binder. Plays earcons as the pointer or keyboard focus enters
 * and leaves the host — a spatial complement to `[cngxAudio]`. The record input
 * makes the four zone transitions explicit rather than encoding them in the
 * `event:earcon` string grammar, because the listener set (pointer/focus zone)
 * and the shape (record vs string) are semantically distinct from event-mode.
 *
 * ```html
 * <div [cngxAudioZone]="{ enter: 'notification', leave: 'tap' }">Hover me</div>
 * <button [cngxAudioZone]="{ focus: 'tap', blur: 'tap' }">Focus me</button>
 * ```
 *
 * Playback obeys the same gates as the rest of the family: skipped when
 * `[audioDisabled]`, muted, reduced-motion-gated, autoplay-not-armed, or still
 * within the debounce window. `[audioVolume]` scales just this element's plays.
 *
 * @category common/audio
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/zone-mode/audio-zone.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAudio, injectCngxAudio
 * <example-url>http://localhost:4200/#/common/audio/zone/enter-leave</example-url>
 */
@Directive({
  selector: '[cngxAudioZone]',
  exportAs: 'cngxAudioZone',
  host: {
    '(pointerenter)': 'handleZone("enter")',
    '(pointerleave)': 'handleZone("leave")',
    '(focusin)': 'handleFocusCross("focus", $event)',
    '(focusout)': 'handleFocusCross("blur", $event)',
  },
})
export class CngxAudioZone {
  private readonly audio = injectCngxAudio();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Earcon per zone transition. Any omitted key plays nothing. */
  readonly zone = input<CngxAudioZoneBinding>({}, { alias: 'cngxAudioZone' });

  /** Per-element volume multiplier in `[0, 1]`; unset uses the engine volume. */
  readonly audioVolume = input<number | undefined>(undefined);

  /** Suppress this element's audio without unbinding. */
  readonly audioDisabled = input(false, { transform: booleanAttribute });

  /**
   * `focusin`/`focusout` bubble, so a zone wrapping focusable children would
   * otherwise fire on every internal tab move. Only a crossing of the zone
   * boundary counts — the focus counterpart of pointerenter/pointerleave.
   */
  protected handleFocusCross(kind: 'focus' | 'blur', event: FocusEvent): void {
    if (this.host.nativeElement.contains(event.relatedTarget as Node | null)) {
      return;
    }
    this.handleZone(kind);
  }

  protected handleZone(kind: keyof CngxAudioZoneBinding): void {
    if (this.audioDisabled()) {
      return;
    }
    const earcon = this.zone()[kind];
    if (earcon) {
      this.audio.play(earcon, this.audioVolume());
    }
  }
}
