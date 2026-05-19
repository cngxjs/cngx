import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAriaExpanded — Disclosure Pattern',
  subtitle: '<code>[cngxAriaExpanded]</code> sets <code>aria-expanded</code> on the host element. Combine with <code>[controls]</code> to add <code>aria-controls</code>, linking the trigger to its controlled panel by ID.',
  description: 'Manages aria-expanded and aria-controls attributes for disclosure patterns (accordions, dropdowns, details panels).',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern'],
  apiComponents: [
    'CngxAriaExpanded',
  ],
  imports: ['CngxAriaExpanded'],
  setup: `protected open = signal(false);`,
  template: `  <div>
    <button
      [cngxAriaExpanded]="open()"
      controls="details-panel"
      class="sort-btn"
      (click)="open.set(!open())"
      style="display: flex; align-items: center; gap: 6px;"
    >
      <span>Toggle details</span>
      <span [style.transform]="open() ? 'rotate(180deg)' : 'rotate(0)'" style="transition: transform 0.2s">&#x25BC;</span>
    </button>

    <div
      id="details-panel"
      role="region"
      style="
        margin-top: 8px;
        padding: 12px 16px;
        border: 1px solid var(--cngx-color-border, #ddd);
        border-radius: 6px;
        background: var(--cngx-surface-alt, #f8f9fa);
      "
      [style.display]="open() ? 'block' : 'none'"
    >
      Panel content — only shown when open. A screen reader announces
      <code>aria-expanded="true"</code> on the button and can navigate
      to the controlled region via <code>aria-controls</code>.
    </div>

  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top: 12px">
      <div class="event-row">
        <span class="event-label">aria-expanded</span>
        <span class="event-value">{{ open() }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">aria-controls</span>
        <span class="event-value">details-panel</span>
      </div>
    </div>`,
};
