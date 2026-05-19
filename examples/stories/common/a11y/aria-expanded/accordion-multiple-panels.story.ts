import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion — Multiple Panels',
  subtitle: 'Multiple <code>[cngxAriaExpanded]</code> triggers with independent state — a typical product-page accordion. Each button controls its own panel.',
  description: 'Manages aria-expanded and aria-controls attributes for disclosure patterns (accordions, dropdowns, details panels).',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern'],
  apiComponents: [
    'CngxAriaExpanded',
  ],
  imports: ['CngxAriaExpanded'],
  setup: `protected panels = signal<Record<string, boolean>>({ specs: false, reviews: false, shipping: false });
  protected togglePanel(key: string): void {
    this.panels.update(p => ({ ...p, [key]: !p[key] }));
  }`,
  template: `
  <div style="display: flex; flex-direction: column; gap: 1px; border: 1px solid var(--cngx-color-border, #ddd); border-radius: 6px; overflow: hidden;">
    @for (item of [
      { key: 'specs', label: 'Specifications', content: 'Display: 6.1" OLED, 120Hz — Processor: A17 Pro — Storage: 256GB — Battery: 4,422 mAh' },
      { key: 'reviews', label: 'Reviews (42)', content: 'Average rating: 4.6 / 5.0 — "Best phone I have ever owned" — "Camera is outstanding in low light"' },
      { key: 'shipping', label: 'Shipping & Returns', content: 'Free shipping on orders over $50. Returns accepted within 30 days. Contact support for exchanges.' }
    ]; track item.key) {
      <button
        [cngxAriaExpanded]="panels()[item.key]"
        [controls]="'panel-' + item.key"
        (click)="togglePanel(item.key)"
        style="
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px;
          background: var(--cngx-surface, #fff);
          border: none;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          text-align: left;
          color: inherit;
        "
      >
        {{ item.label }}
        <span [style.transform]="panels()[item.key] ? 'rotate(180deg)' : 'rotate(0)'" style="transition: transform 0.2s; font-size: 0.75rem;">&#x25BC;</span>
      </button>
      @if (panels()[item.key]) {
        <div
          [id]="'panel-' + item.key"
          role="region"
          style="
            padding: 12px 16px;
            font-size: 0.8125rem;
            background: var(--cngx-surface-alt, #f8f9fa);
            color: var(--cngx-text-secondary, #666);
          "
        >
          {{ item.content }}
        </div>
      }
    }
  </div>

  <div class="event-grid" style="margin-top: 12px">
    @for (key of ['specs', 'reviews', 'shipping']; track key) {
      <div class="event-row">
        <span class="event-label">{{ key }}</span>
        <span class="event-value">{{ panels()[key] ? 'expanded' : 'collapsed' }}</span>
      </div>
    }
  </div>`,
};
