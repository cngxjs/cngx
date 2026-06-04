import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAriaExpanded: Accordion multiple panels',
  subtitle:
    'Multiple <code>[cngxAriaExpanded]</code> triggers with independent state; each button drives its own panel via <code>[controls]</code>.',
  description:
    "Each trigger keeps its own boolean in a single <code>signal&lt;Record&gt;</code>; the directive paints <code>aria-expanded</code> and <code>aria-controls</code> per row. Panels stay in the DOM (toggled with <code>[hidden]</code>) so the trigger's <code>aria-controls</code> always resolves to a live element.",
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern'],
  apiComponents: ['CngxAriaExpanded'],
  imports: ['CngxAriaExpanded'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
    {
      label: 'WCAG 2.1 SC 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  setup: `protected readonly items = [
    { key: 'specs', label: 'Specifications', content: 'Display: 6.1" OLED, 120 Hz. A17 Pro, 256 GB, 4,422 mAh.' },
    { key: 'reviews', label: 'Reviews (42)', content: 'Average 4.6 / 5.0. "Best phone I have ever owned", "Outstanding low-light camera".' },
    { key: 'shipping', label: 'Shipping & Returns', content: 'Free shipping on orders over $50. Returns accepted within 30 days.' },
  ] as const;
  protected readonly panels = signal<Record<string, boolean>>({ specs: false, reviews: false, shipping: false });
  protected togglePanel(key: string): void {
    this.panels.update((p) => ({ ...p, [key]: !p[key] }));
  }`,
  template: `  <div style="display:flex;flex-direction:column;gap:4px;max-width:480px">
    @for (item of items; track item.key) {
      <button
        type="button"
        [id]="'trigger-' + item.key"
        [cngxAriaExpanded]="panels()[item.key]"
        [controls]="'panel-' + item.key"
        (click)="togglePanel(item.key)">
        {{ item.label }}
      </button>
      <div
        role="region"
        [id]="'panel-' + item.key"ja
        [attr.aria-labelledby]="'trigger-' + item.key"
        [hidden]="!panels()[item.key]">
        {{ item.content }}
      </div>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    @for (key of ['specs', 'reviews', 'shipping']; track key) {
      <div class="event-row">
        <span class="event-label">{{ key }}</span>
        <span class="event-value">{{ panels()[key] ? 'expanded' : 'collapsed' }}</span>
      </div>
    }
  </div>`,
};
