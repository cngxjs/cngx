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
 * ### Basic usage
 * ```html
 * <span [cngxSpeak]="text" #tts="cngxSpeak">{{ text }}</span>
 * <cngx-speak-button [speakRef]="tts" />
 * ```
 *
 * ### Material theme integration
 * ```scss
 * @use '@cngx/ui/speak/speak-button-theme' as speak;
 * @include speak.theme($theme);
 * ```
 * <example-url>http://localhost:4200/#/ui/speak/speak-button/material-integration-theme-scss-mat-icon-button</example-url>
 * <example-url>http://localhost:4200/#/ui/speak/speak-button/styled-speaker-icon</example-url>
 * <example-url>http://localhost:4200/#/ui/speak/speak-button/theming-css-custom-properties</example-url>
 */
@Component({
  selector: 'cngx-speak-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-speak-button',
    '[class.cngx-speak-button--speaking]': 'speakRef().speaking()',
  },
  styleUrl: './speak-button.css',
  template: `
    <button
      type="button"
      class="cngx-speak-button__btn"
      [attr.aria-label]="speakRef().speaking() ? 'Stop speaking' : 'Read aloud'"
      (click)="speakRef().toggle()"
    >
      @if (speakRef().speaking()) {
        <svg
          class="cngx-speak-button__icon"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      } @else {
        <svg
          class="cngx-speak-button__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 010 7.07" />
          <path d="M19.07 4.93a10 10 0 010 14.14" />
        </svg>
      }
    </button>
  `,
})
export class CngxSpeakButton {
  /** The `CngxSpeak` directive instance to connect to. */
  readonly speakRef = input.required<CngxSpeak>();
}
