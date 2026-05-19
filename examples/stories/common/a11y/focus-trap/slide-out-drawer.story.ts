import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFocusTrap — Slide-out Drawer',
  subtitle: 'A drawer that slides in from either side. Focus is trapped inside while open. Demonstrates <code>[cngxFocusTrap]</code> on a non-modal overlay — useful for filters, settings, or navigation panels.',
  description: 'Traps keyboard focus within the host element using the Angular CDK FocusTrap. Useful for modals, drawers, and other overlay components.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxFocusTrap',
  ],
  imports: ['CngxFocusTrap'],
  setup: `protected drawerOpen = signal(false);
  protected drawerSide = signal<'left' | 'right'>('right');`,
  template: `
  <div class="button-row">
    <button class="sort-btn" (click)="drawerSide.set('left'); drawerOpen.set(true)">Open left drawer</button>
    <button class="sort-btn" (click)="drawerSide.set('right'); drawerOpen.set(true)">Open right drawer</button>
  </div>

  @if (drawerOpen()) {
    <div
      style="
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.3);
        z-index: 100;
        display: flex;
      "
      [style.justify-content]="drawerSide() === 'right' ? 'flex-end' : 'flex-start'"
      (click)="drawerOpen.set(false)"
    >
      <div
        cngxFocusTrap
        [enabled]="drawerOpen()"
        (keydown.escape)="drawerOpen.set(false)"
        (click)="$event.stopPropagation()"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="drawerSide() + ' drawer'"
        style="
          width: 300px;
          height: 100%;
          background: var(--cngx-surface, #fff);
          box-shadow: 0 0 24px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          padding: 20px;
          gap: 12px;
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1rem;">Filter Options</h3>
          <button class="sort-btn" (click)="drawerOpen.set(false)" aria-label="Close drawer" style="padding: 4px 8px;">&#x2715;</button>
        </div>

        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 0.8125rem;">
          Category
          <select style="padding: 6px 10px; border-radius: 4px; border: 1px solid var(--cngx-color-border, #ddd);">
            <option>All categories</option>
            <option>Electronics</option>
            <option>Clothing</option>
            <option>Books</option>
          </select>
        </label>

        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 0.8125rem;">
          Price range
          <input type="range" min="0" max="500" value="250" style="width: 100%;" />
        </label>

        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem;">
          <input type="checkbox" />
          In stock only
        </label>

        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem;">
          <input type="checkbox" />
          Free shipping
        </label>

        <div style="flex: 1;"></div>

        <div class="button-row">
          <button class="sort-btn" (click)="drawerOpen.set(false)">Apply filters</button>
          <button class="sort-btn" (click)="drawerOpen.set(false)">Reset</button>
        </div>
      </div>
    </div>
  }

  <div class="output-badge" style="margin-top: 12px">
    Drawer: <strong>{{ drawerOpen() ? drawerSide() + ' — focus trapped' : 'closed' }}</strong>
  </div>`,
};
