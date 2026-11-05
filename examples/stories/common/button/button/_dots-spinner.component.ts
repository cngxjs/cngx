import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Fixture for `custom-spinner.story.ts`: three pulsing dots used as the busy
 * glyph through `provideButtonSpinner`. The button keeps its busy layer
 * (`aria-hidden`, over the label, show delay and min-dwell applied), so the
 * component renders the glyph only.
 */
@Component({
  selector: 'demo-dots-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="demo-dots-spinner__dot"></span><span class="demo-dots-spinner__dot"></span><span class="demo-dots-spinner__dot"></span>`,
  host: { class: 'demo-dots-spinner' },
  styles: `
    .demo-dots-spinner {
      display: inline-flex;
      gap: var(--demo-dots-gap, 0.2em);
      align-items: center;
    }
    .demo-dots-spinner__dot {
      inline-size: var(--demo-dots-size, 0.35em);
      block-size: var(--demo-dots-size, 0.35em);
      border-radius: 50%;
      background: currentColor;
      animation: demo-dots-pulse var(--demo-dots-duration, 0.9s) ease-in-out infinite;
    }
    .demo-dots-spinner__dot:nth-child(2) {
      animation-delay: calc(var(--demo-dots-duration, 0.9s) / 6);
    }
    .demo-dots-spinner__dot:nth-child(3) {
      animation-delay: calc(var(--demo-dots-duration, 0.9s) / 3);
    }
    @media (prefers-reduced-motion: reduce) {
      .demo-dots-spinner__dot {
        animation: none;
      }
    }
    @keyframes demo-dots-pulse {
      0%,
      100% {
        opacity: 0.3;
      }
      50% {
        opacity: 1;
      }
    }
  `,
})
export class DotsSpinner {}
