import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxClickOutside — Dropdown',
  subtitle: '<code>[cngxClickOutside]</code> listens for <code>pointerdown</code> on the document and emits <code>(clickOutside)</code> when the event target is outside the host. Works for both mouse and touch via the Pointer Events API.',
  description: 'Emits an event when the user interacts outside the host element. Useful for closing dropdowns, tooltips, and overlays.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxClickOutside',
  ],
  imports: ['CngxClickOutside'],
  setup: `protected open = signal(false);`,
  template: `  @if (open()) {
    <div
      cngxClickOutside
      (clickOutside)="open.set(false)"
      style="
        display: inline-block;
        padding: 12px 16px;
        border: 1px solid var(--cngx-color-border, #ddd);
        border-radius: 6px;
        background: var(--cngx-surface-alt, #f8f9fa);
        margin-top: 8px;
      "
    >
      <p style="margin: 0 0 8px">I close when you click outside me.</p>
      <button class="sort-btn" (click)="$event.stopPropagation()">Inner button (won't close)</button>
    </div>
  }

  <div class="output-badge" style="margin-top:12px">
    Dropdown: <strong>{{ open() ? 'open' : 'closed' }}</strong>
  </div>`,
  templateChrome: `<div class="button-row">
    <button class="sort-btn" (click)="open.set(!open())">
      Toggle dropdown ({{ open() ? 'open' : 'closed' }})
    </button>
  </div>`,
};
