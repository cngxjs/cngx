import { DOCUMENT } from '@angular/common';
import { afterNextRender, DestroyRef, Directive, effect, inject, input, signal } from '@angular/core';

/**
 * Headless text-to-speech directive using the browser's SpeechSynthesis API.
 *
 * A read-aloud feature for cognitive accessibility — dyslexia support, reading
 * assistance, or convenience. Not a screen reader replacement (use
 * `CngxLiveRegion` for ARIA live regions).
 *
 * The directive is purely behavioral: it exposes `speaking()` and `supported()`
 * signals plus `speak()` / `cancel()` methods. The consumer renders their own
 * UI (button, icon, link) and calls the methods via the template reference.
 *
 * Pair with `CngxSpeakButton` (`@cngx/ui`) for a ready-made speaker button.
 *
 * @usageNotes
 *
 * ### Headless — consumer-owned button
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
      this.performSpeak(value);
    });

    inject(DestroyRef).onDestroy(() => this.synth?.cancel());
  }

  /** Speak arbitrary text. Always works regardless of `enabled`. */
  speak(text: string): void {
    if (text && this.synth) {
      this.performSpeak(text);
    }
  }

  /** Cancel any ongoing speech. */
  cancel(): void {
    this.synth?.cancel();
    this.speakingState.set(false);
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
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate();
    utterance.pitch = this.pitch();
    utterance.volume = this.volume();
    const lang = this.lang();
    if (lang) {
      utterance.lang = lang;
    }

    utterance.onstart = () => this.speakingState.set(true);
    utterance.onend = () => this.speakingState.set(false);
    utterance.onerror = () => this.speakingState.set(false);

    synth.speak(utterance);
  }
}
