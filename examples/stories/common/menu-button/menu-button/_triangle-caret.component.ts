import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Fixture for `custom-caret.story.ts`: a filled triangle used as the app-wide
 * caret through `CNGX_BUTTON_CARET_ICON`. The menu button wraps it in an
 * `aria-hidden` `<cngx-icon>`, so it renders the glyph only.
 */
@Component({
  selector: 'demo-triangle-caret',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
  `,
  host: { style: 'display: contents' },
})
export class TriangleCaret {}
