import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBackdrop: Overlay with inert',
  subtitle:
    'When visible, <code>[cngxBackdrop]</code> adds <code>inert</code> to all sibling elements - they become unfocusable and non-interactive. Click the backdrop to dismiss.',
  description:
    'Toggles a backdrop overlay and marks sibling elements as inert while visible, so focus and pointer events stop at the scrim instead of leaking into the page behind it.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  references: [
    {
      label: 'HTML: the inert attribute',
      href: 'https://html.spec.whatwg.org/multipage/interaction.html#the-inert-attribute',
    },
    {
      label: 'WAI-ARIA APG: Dialog (Modal) Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
  ],
  apiComponents: ['CngxBackdrop'],
  moduleImports: ["import { CngxBackdrop } from '@cngx/common/layout';"],
  imports: ['CngxBackdrop'],
  setup: `protected readonly showBackdrop = signal(false);
  protected readonly clickCount = signal(0);`,
  template: `  <div class="demo-backdrop-frame" style="margin-top: 0.75rem;">
    <div [cngxBackdrop]="showBackdrop()" (backdropClick)="showBackdrop.set(false); clickCount.update(n => n + 1)"
         class="cngx-backdrop" style="position: absolute;"></div>

    <div class="demo-backdrop-frame__content">
      <p>This content becomes <code>inert</code> when the backdrop is visible.</p>
      <button type="button" class="sort-btn" (click)="clickCount.update(n => n + 1)">
        Try clicking me (won't work when inert)
      </button>
    </div>
  </div>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="sort-btn" (click)="showBackdrop.set(true)">Show backdrop</button>
  </div>
<div class="status-row" style="margin-top: 0.75rem;">
    <span class="status-badge" [class.active]="showBackdrop()">
      {{ showBackdrop() ? 'visible' : 'hidden' }}
    </span>
    <span class="status-badge">clicks: {{ clickCount() }}</span>
  </div>`,
};
