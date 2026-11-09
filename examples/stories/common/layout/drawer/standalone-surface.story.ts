import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawerSurface: Standalone',
  subtitle:
    '<code>[cngxDrawerSurface]</code> without a drawer: the consumer owns the open state, the surface reports <code>(dismiss)</code> on Escape, the back gesture and a press outside, and returns focus to the opener when it deactivates.',
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
  <div class="demo-drawer-container demo-drawer-container--bordered demo-app-frame">
    <div class="demo-app-header">
      <span class="demo-app-brand">Orders</span>
      <span class="demo-app-spacer"></span>
      <button type="button" aria-controls="standalone-filters"
              [attr.aria-expanded]="open()" (click)="open.set(!open())">Filters</button>
    </div>
    <aside id="standalone-filters" cngxDrawerSurface [active]="open()" modality="none"
           [role]="null" aria-label="Filters" [hidden]="!open()"
           (dismiss)="open.set(false)" class="demo-drawer-panel-content">
      <label><input type="checkbox" checked /> Open</label>
      <label><input type="checkbox" /> Shipped</label>
    </aside>
    <main class="demo-app-main">
      <p>The order list stays operable while the filters are open.</p>
    </main>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">open()</span>
      <span class="event-value">{{ open() }}</span>
    </div>
  </div>`,
};
