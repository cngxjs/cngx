import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Fixture for `provided-icon.story.ts`: a circled X used as the close glyph
 * through `provideButtonCloseIcon`. The close button wraps it in its
 * `aria-hidden` glyph span, so it renders the glyph only.
 */
@Component({
  selector: 'demo-circle-close',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  `,
  host: { style: 'display: contents' },
})
export class CircleClose {}
