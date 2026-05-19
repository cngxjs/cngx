import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusTrap — Modal Dialog',
  subtitle: '<code>[cngxFocusTrap]</code> wraps the CDK <code>FocusTrap</code>. When <code>[enabled]="true"</code>, Tab and Shift+Tab cycle only within the host. <code>[autoFocus]="true"</code> (default) moves focus to the first tabbable element automatically.',
  description: 'Traps keyboard focus within the host element using the Angular CDK FocusTrap. Useful for modals, drawers, and other overlay components.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxFocusTrap',
  ],
  imports: ['CngxFocusTrap'],
  setup: `protected modalOpen = signal(false);
  protected autoFocus = signal(true);`,
  template: `  @if (modalOpen()) {
    <div
      style="
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        z-index: 100;
      "
      (click)="modalOpen.set(false)"
    >
      <div
        cngxFocusTrap
        [enabled]="modalOpen()"
        [autoFocus]="autoFocus()"
        (keydown.escape)="modalOpen.set(false)"
        (click)="$event.stopPropagation()"
        style="
          background: var(--cngx-surface, #fff);
          border-radius: 8px;
          padding: 24px;
          width: 380px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          gap: 12px;
        "
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Confirm action"
      >
        <h3 style="margin: 0;">Confirm Action</h3>
        <p style="margin: 0; font-size: 0.875rem; color: var(--cngx-text-secondary, #666);">
          Are you sure you want to proceed? This action cannot be undone.
          Tab cycles only within this dialog. Press Escape or click outside to close.
        </p>
        <input placeholder="Type CONFIRM to proceed" style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--cngx-color-border, #ddd); font-size: 0.875rem;" />
        
      </div>
    </div>
  }

  <div class="output-badge" style="margin-top: 12px">
    Modal: <strong>{{ modalOpen() ? 'open — focus trapped' : 'closed' }}</strong>
  </div>`,
  templateChrome: `<div class="button-row">
    <button class="sort-btn" (click)="modalOpen.set(true)">Open modal</button>
    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.875rem;">
      <input type="checkbox" [checked]="autoFocus()" (change)="autoFocus.set($any($event.target).checked)" />
      autoFocus
    </label>
  </div>
<div class="button-row" style="justify-content: flex-end;">
          <button class="sort-btn" (click)="modalOpen.set(false)">Cancel</button>
          <button class="sort-btn" style="background: var(--cngx-accent, #f5a623); color: #000; font-weight: 500;" (click)="modalOpen.set(false)">Confirm</button>
        </div>`,
};
