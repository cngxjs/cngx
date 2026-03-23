import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'ScrollLock',
  navLabel: 'ScrollLock',
  navCategory: 'layout',
  description: 'Prevents body scrolling when active. Essential for modals, drawers, and overlays.',
  apiComponents: ['CngxScrollLock'],
  moduleImports: ["import { CngxScrollLock } from '@cngx/common';"],
  setup: `
  protected readonly locked = signal(false);
  `,
  sections: [
    {
      title: 'CngxScrollLock — Toggle',
      subtitle:
        '<code>[cngxScrollLock]</code> sets <code>overflow: hidden</code> and <code>scrollbar-gutter: stable</code> on the document ' +
        'to prevent scrolling while avoiding layout shift from the scrollbar disappearing.',
      imports: ['CngxScrollLock'],
      template: `
  <div [cngxScrollLock]="locked()">
    <div class="button-row">
      <button class="sort-btn" (click)="locked.set(!locked())">
        {{ locked() ? 'Unlock scroll' : 'Lock scroll' }}
      </button>
    </div>

    <div class="status-row">
      <span class="status-badge" [class.active]="locked()">
        scroll {{ locked() ? 'locked' : 'unlocked' }}
      </span>
    </div>

    <p style="margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-muted, #888)">
      Toggle the lock and try scrolling this page. The scrollbar stays in place via
      <code>scrollbar-gutter: stable</code>.
    </p>
  </div>`,
    },
  ],
};
