import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxScrollLock: Toggle',
  subtitle:
    '<code>[cngxScrollLock]</code> sets <code>overflow: hidden</code> and <code>scrollbar-gutter: stable</code> on the document to prevent scrolling while avoiding the layout shift from the scrollbar disappearing.',
  description:
    'Toggles [cngxScrollLock] on a wrapper around a 20-row scroll list. While locked, the document gets overflow:hidden plus a stable scrollbar gutter; the chip flips into the danger-red state so the lock is visible alongside the actual scroll behaviour.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxScrollLock'],
  moduleImports: ["import { CngxScrollLock } from '@cngx/common/layout';"],
  imports: ['CngxScrollLock'],
  setup: `protected readonly locked = signal(false);`,
  template: `
  <div [cngxScrollLock]="locked()">
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
      <button type="button" class="chip demo-scroll-lock-chip"
              [attr.aria-pressed]="locked()"
              (click)="locked.set(!locked())">
        {{ locked() ? 'Unlock scroll' : 'Lock scroll' }}
      </button>
      <span class="status-badge" [class.active]="locked()">
        {{ locked() ? 'LOCKED - try scrolling the page' : 'unlocked' }}
      </span>
    </div>

    <p class="demo-scroll-lock-hint" style="margin:0 0 16px">
      Toggle the lock and try scrolling this page. The document gets <code>overflow: hidden</code>
      while <code>scrollbar-gutter: stable</code> prevents layout shift from the scrollbar disappearing.
      The lock is ref-counted, so nested locks (for example stacked dialogs) compose without losing the original styles.
    </p>

    <div style="display:flex;flex-direction:column;gap:8px">
      @for (i of [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]; track i) {
        <div class="demo-scroll-lock-row">
          Scrollable content row {{ i }}
        </div>
      }
    </div>
  </div>`,
};
