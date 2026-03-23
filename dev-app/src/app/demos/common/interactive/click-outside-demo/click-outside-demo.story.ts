import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'ClickOutside',
  description: 'Emits an event when the user interacts outside the host element. Useful for closing dropdowns, tooltips, and overlays.',
  apiComponents: ['CngxClickOutside'],
  setup: `
  protected open = signal(false);
  protected clickCount = signal(0);
  protected enabled = signal(true);
  `,
  sections: [
    {
      title: 'CngxClickOutside — Dropdown',
      subtitle: '<code>[cngxClickOutside]</code> listens for <code>pointerdown</code> on the document and emits <code>(clickOutside)</code> when the event target is outside the host. Works for both mouse and touch via the Pointer Events API.',
      imports: ['CngxClickOutside'],
      template: `
  <div class="button-row">
    <button class="sort-btn" (click)="open.set(!open())">
      Toggle dropdown ({{ open() ? 'open' : 'closed' }})
    </button>
  </div>

  @if (open()) {
    <div
      cngxClickOutside
      (clickOutside)="open.set(false)"
      style="
        display: inline-block;
        padding: 12px 16px;
        border: 1px solid var(--cngx-border, #ddd);
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
    },
    {
      title: 'CngxClickOutside — enabled toggle',
      subtitle: 'When <code>[enabled]="false"</code> the directive is inactive and no events are emitted.',
      imports: ['CngxClickOutside'],
      template: `
  <div class="button-row">
    <button class="sort-btn" (click)="enabled.set(!enabled())">
      {{ enabled() ? 'Disable' : 'Enable' }} outside detection
    </button>
    <span class="chip" [class.chip--active]="enabled()">{{ enabled() ? 'enabled' : 'disabled' }}</span>
  </div>

  <div
    cngxClickOutside
    [enabled]="enabled()"
    (clickOutside)="clickCount.update(n => n + 1)"
    style="
      padding: 16px;
      border: 2px dashed var(--cngx-border, #aaa);
      border-radius: 6px;
      margin-top: 8px;
      text-align: center;
    "
  >
    Click outside this box
  </div>

  <div class="output-badge" style="margin-top:12px">
    Outside clicks detected: <strong>{{ clickCount() }}</strong>
  </div>`,
    },
  ],
};
