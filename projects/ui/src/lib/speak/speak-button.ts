import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { type CngxSpeak } from '@cngx/common';

/**
 * Ready-made speaker button that connects to a {@link CngxSpeak} directive
 * via an explicit `[speakRef]` input — no ancestor injection.
 *
 * Ships with a speaker/stop SVG icon and CSS custom properties for full
 * theming control. Include `speak-button-theme.scss` for automatic Material
 * theme integration.
 *
 * @usageNotes
 *
 * ### Basic usage
 * ```html
 * <span [cngxSpeak]="text" #tts="cngxSpeak">{{ text }}</span>
 * <cngx-speak-button [speakRef]="tts" />
 * ```
 *
 * ### Material theme integration
 * ```scss
 * @use '@cngx/ui/src/lib/speak/speak-button-theme' as speak;
 * @include speak.theme($theme);
 * ```
 */
@Component({
  selector: 'cngx-speak-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.cngx-speak-button--speaking]': 'speakRef().speaking()',
  },
  styles: `
    cngx-speak-button {
      display: inline-flex;
    }

    .cngx-speak-button__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--cngx-speak-btn-size, 36px);
      height: var(--cngx-speak-btn-size, 36px);
      padding: 0;
      border: var(--cngx-speak-btn-border-width, 1px) solid var(--cngx-border, #ddd);
      border-radius: var(--cngx-speak-btn-radius, 8px);
      background: var(--cngx-speak-btn-bg, var(--cngx-surface, #fff));
      color: var(--cngx-speak-btn-color, var(--cngx-text-secondary, #666));
      cursor: pointer;
      transition:
        color var(--cngx-speak-btn-transition, 0.15s),
        background var(--cngx-speak-btn-transition, 0.15s),
        border-color var(--cngx-speak-btn-transition, 0.15s);
      flex-shrink: 0;
    }

    .cngx-speak-button__btn:hover {
      color: var(--cngx-speak-btn-active-color, var(--cngx-accent, #f5a623));
      border-color: var(--cngx-speak-btn-active-color, var(--cngx-accent, #f5a623));
      background: var(--cngx-speak-btn-hover-bg, var(--cngx-speak-btn-bg, var(--cngx-surface, #fff)));
    }

    .cngx-speak-button--speaking .cngx-speak-button__btn {
      color: var(--cngx-speak-btn-speaking-color, #fff);
      background: var(--cngx-speak-btn-speaking-bg, var(--cngx-speak-btn-active-color, var(--cngx-accent, #f5a623)));
      border-color: var(--cngx-speak-btn-speaking-bg, var(--cngx-speak-btn-active-color, var(--cngx-accent, #f5a623)));
    }

    .cngx-speak-button__icon {
      width: var(--cngx-speak-btn-icon-size, 18px);
      height: var(--cngx-speak-btn-icon-size, 18px);
      transform: translateX(1px);
    }
  `,
  template: `
    <button
      type="button"
      class="cngx-speak-button__btn"
      [attr.aria-label]="speakRef().speaking() ? 'Stop speaking' : 'Read aloud'"
      (click)="speakRef().toggle()">
      @if (speakRef().speaking()) {
        <svg class="cngx-speak-button__icon" viewBox="0 0 24 24"
             fill="currentColor" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
      } @else {
        <svg class="cngx-speak-button__icon" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M15.54 8.46a5 5 0 010 7.07"/>
          <path d="M19.07 4.93a10 10 0 010 14.14"/>
        </svg>
      }
    </button>
  `,
})
export class CngxSpeakButton {
  /** The `CngxSpeak` directive instance to connect to. */
  readonly speakRef = input.required<CngxSpeak>();
}
