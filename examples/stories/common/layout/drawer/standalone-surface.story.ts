import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawerSurface: Dismissible panel without a drawer',
  subtitle:
    'The behaviour of a drawer panel without the drawer: the consumer positions <code>[cngxDrawerSurface]</code> and owns its open state, the surface reports <code>(dismiss)</code> on Escape, the back gesture and a press outside, and returns focus to the opener when it deactivates.',
  description:
    'A filter panel driven by a plain signal. The surface does not own the open state: (dismiss) fires on Escape inside the panel, on the Android back gesture and on a press outside it, and the consumer sets open to false. The Filters button names the panel in aria-controls, so a press on it is not an outside press and it toggles the panel itself. modality="none" keeps the page operable: no focus trap, no inert, no scroll lock, and the panel keeps its landmark role. On a nav or aside host, [role]="null" keeps the implicit role; this one is an aside with an aria-label, so the implicit complementary landmark stays. When the panel closes while focus is inside it, focus returns to the Filters button.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxDrawerSurface'],
  moduleImports: ["import { CngxDrawerSurface } from '@cngx/common/layout';"],
  imports: ['CngxDrawerSurface'],
  setup: `
  protected readonly open = signal(false);`,
  template: `
  <div class="demo-drawer-surface">
    <div class="demo-drawer-surface__header">
      <strong class="demo-drawer-surface__title">Orders</strong>
      <button type="button" aria-controls="standalone-filters"
              [attr.aria-expanded]="open()" (click)="open.set(!open())">Filters</button>
    </div>
    <aside id="standalone-filters" cngxDrawerSurface [active]="open()" modality="none"
           [role]="null" aria-label="Filters" [hidden]="!open()"
           (dismiss)="open.set(false)" class="demo-drawer-surface__panel">
      <label><input type="checkbox" checked /> Open</label>
      <label><input type="checkbox" /> Shipped</label>
    </aside>
    <div class="demo-drawer-surface__main">
      <p>The order list stays operable while the filters are open.</p>
    </div>
  </div>`,
  css: `.demo-drawer-surface {
  display: flex;
  flex-direction: column;
  block-size: 340px;
  border: 1px solid var(--cngx-color-border, #e5e7eb);
  border-radius: var(--cngx-radius-md, 6px);
  overflow: hidden;
}
.demo-drawer-surface__header {
  display: flex;
  align-items: center;
  gap: var(--cngx-space-sm, 0.5rem);
  min-block-size: 3rem;
  padding-inline: var(--cngx-space-md, 1rem);
  border-block-end: 1px solid var(--cngx-color-border, #e5e7eb);
}
.demo-drawer-surface__title {
  flex: 1 1 auto;
}
/* :not([hidden]), so the closed surface stays hidden. */
.demo-drawer-surface__panel:not([hidden]) {
  display: flex;
  flex-direction: column;
  gap: var(--cngx-space-sm, 0.5rem);
  padding: var(--cngx-space-md, 1rem);
  border-block-end: 1px solid var(--cngx-color-border, #e5e7eb);
}
.demo-drawer-surface__main {
  flex: 1 1 auto;
  min-block-size: 0;
  overflow-y: auto;
  padding: var(--cngx-space-md, 1rem);
}`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">open()</span>
      <span class="event-value">{{ open() }}</span>
    </div>
  </div>`,
};
