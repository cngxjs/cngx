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
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
      <button class="chip" (click)="locked.set(!locked())"
        [style.background]="locked() ? 'var(--cngx-alert-error-icon,#ef4444)' : ''"
        [style.color]="locked() ? '#fff' : ''">
        {{ locked() ? 'Unlock scroll' : 'Lock scroll' }}
      </button>
      <span class="status-badge" [class.active]="locked()">
        {{ locked() ? 'LOCKED — try scrolling the page' : 'unlocked' }}
      </span>
    </div>

    <p style="font-size:0.875rem;color:var(--text-muted,#888);margin:0 0 16px">
      Toggle the lock and try scrolling this page. The body gets <code>overflow: hidden</code>
      while <code>scrollbar-gutter: stable</code> prevents layout shift from the scrollbar disappearing.
      This is ref-counted — nested locks (e.g. stacked dialogs) work correctly.
    </p>

    <div style="display:flex;flex-direction:column;gap:8px">
      @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]; track i) {
        <div style="padding:12px 16px;background:var(--cngx-card-bg,#f8fafc);border-radius:6px;border:1px solid var(--cngx-border,#eee)">
          Scrollable content row {{ i }}
        </div>
      }
    </div>
  </div>`,
    },
  ],
};
