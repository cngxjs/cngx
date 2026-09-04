import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

/**
 * Headless text-to-speech directive using the browser's SpeechSynthesis API.
 *
 * @category common/interactive
 *
 * A read-aloud feature for cognitive accessibility - dyslexia support, reading
 * assistance, or convenience. Not a screen reader replacement (use
 * `CngxLiveRegion` for ARIA live regions).
 *
 * The directive is purely behavioral: it exposes `speaking()` and `supported()`
 * signals plus `speak()` / `cancel()` methods. The consumer renders their own
 * UI (button, icon, link) and calls the methods via the template reference.
 *
 * Pair with `CngxSpeakButton` (`@cngx/ui`) for a ready-made speaker button.
 *
 * ### Headless - consumer-owned button
 * ```html
 * <p [cngxSpeak]="text" #tts="cngxSpeak">
 *   {{ text }}
 *   <button (click)="tts.toggle()">{{ tts.speaking() ? 'Stop' : 'Listen' }}</button>
 * </p>
 * ```
 *
 * ### Auto-speak on dynamic value change
 * ```html
 * <div [cngxSpeak]="notification()">{{ notification() }}</div>
 * ```
 *
 * ### With CngxSpeakButton (from @cngx/ui)
 * ```html
 * <span [cngxSpeak]="text" #tts="cngxSpeak">{{ text }}</span>
 * <cngx-speak-button [speakRef]="tts" />
 * ```
 *
 * ### Suppress auto-speak for dynamic values
 * ```html
 * <div [cngxSpeak]="liveCounter()" [enabled]="false" #tts="cngxSpeak">
 *   {{ liveCounter() }}
 *   <button (click)="tts.speak(liveCounter().toString())">Read current value</button>
 * </div>
 * ```
 * @docsKind primary
 * @wcag AAA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/speak/speak.directive.ts
 * @since 0.1.0
 * @relatedTo CngxSpeakButton, CngxLiveRegion
 * <example-url>http://localhost:4200/#/common/interactive/speak/form-error-read-aloud-on-demand</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/speak/headless-read-aloud</example-url>
 * <example-url>http://localhost:4200/#/ui/speak/speak-button/material-integration-theme-scss-mat-icon-button</example-url>
 * <example-url>http://localhost:4200/#/ui/speak/speak-button/styled-speaker-icon</example-url>
 * <example-url>http://localhost:4200/#/ui/speak/speak-button/theming-css-custom-properties</example-url>
 */
@Directive({
  selector: '[cngxSpeak]',
  exportAs: 'cngxSpeak',
  standalone: true,
})
export class CngxSpeak {
  /** Text to speak. When `enabled` is `true`, speech triggers on every change to a non-empty value. */
  readonly text = input.required<string>({ alias: 'cngxSpeak' });

  /** Speech rate (0.1–10, default 1). */
  readonly rate = input(1);
  /** Speech pitch (0–2, default 1). */
  readonly pitch = input(1);
  /** Speech volume (0–1, default 1). */
  readonly volume = input(1);
  /** BCP 47 language tag (e.g. `'de-DE'`). Empty string uses the browser default. */
  readonly lang = input('');
  /** Controls auto-speak on text changes. Does NOT affect `speak()` or `cancel()`. */
  readonly enabled = input(true);

  private readonly speakingState = signal(false);
  private readonly supportedState: boolean;
  private readonly synth: SpeechSynthesis | null;
  private readonly initialized = signal(false);

  // Retains the in-flight utterance: Chrome garbage-collects unreferenced
  // utterances mid-speech and then never fires their onend/onerror, which
  // would leave `speaking` stuck at true. Also the ownership marker for
  // cancel - synth.cancel() clears the GLOBAL queue, so it may only fire
  // while an utterance of THIS directive is live.
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  /** Whether the browser supports the SpeechSynthesis API. */
  readonly supported: boolean;

  /** `true` while an utterance is being spoken. */
  readonly speaking = this.speakingState.asReadonly();

  constructor() {
    const win = inject(DOCUMENT).defaultView;
    this.synth = win?.speechSynthesis ?? null;
    this.supportedState = !!this.synth;
    this.supported = this.supportedState;

    afterNextRender(() => this.initialized.set(true));

    effect(() => {
      const value = this.text();
      if (!this.initialized() || !value || !this.enabled() || !this.synth) {
        return;
      }
      // untracked: rate/pitch/volume/lang are per-utterance parameters read
      // inside performSpeak - a parameter change must not re-speak the text.
      untracked(() => this.performSpeak(value));
    });

    inject(DestroyRef).onDestroy(() => this.cancelOwn());
  }

  /** Speak arbitrary text. Always works regardless of `enabled`. */
  speak(text: string): void {
    if (text && this.synth) {
      this.performSpeak(text);
    }
  }

  /**
   * Cancel this directive's ongoing speech. A no-op while no own utterance
   * is live, so an idle instance never clears the shared synthesis queue.
   * (Starting a new utterance still interrupts whatever is playing -
   * `SpeechSynthesis` is a single audio channel.)
   */
  cancel(): void {
    this.cancelOwn();
  }

  /** Toggle speech: speak text if idle, cancel if speaking. */
  toggle(): void {
    if (this.speakingState()) {
      this.cancel();
    } else {
      const text = this.text();
      if (text) {
        this.speak(text);
      }
    }
  }

  private performSpeak(text: string): void {
    const synth = this.synth!;
    // Chrome silently drops the next speak() when cancel() runs on an
    // idle synth; only cancel when there's actually a queued or in-flight
    // utterance. Firefox tolerates the unconditional cancel either way.
    if (synth.speaking || synth.pending) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate();
    utterance.pitch = this.pitch();
    utterance.volume = this.volume();
    const lang = this.lang();
    if (lang) {
      utterance.lang = lang;
    }

    utterance.onstart = () => {
      if (this.activeUtterance === utterance) {
        this.speakingState.set(true);
      }
    };
    utterance.onend = () => this.finishUtterance(utterance);
    utterance.onerror = () => this.finishUtterance(utterance);

    this.activeUtterance = utterance;
    synth.speak(utterance);
  }

  private cancelOwn(): void {
    if (this.activeUtterance) {
      this.activeUtterance = null;
      this.synth?.cancel();
    }
    this.speakingState.set(false);
  }

  /** Ignores stale callbacks of a replaced utterance so a new one keeps `speaking` intact. */
  private finishUtterance(utterance: SpeechSynthesisUtterance): void {
    if (this.activeUtterance !== utterance) {
      return;
    }
    this.activeUtterance = null;
    this.speakingState.set(false);
  }
}
