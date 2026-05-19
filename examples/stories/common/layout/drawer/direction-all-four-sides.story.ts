import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Direction — All Four Sides',
  subtitle: 'Change <code>[position]</code> to <code>left</code>, <code>right</code>, <code>top</code>, or <code>bottom</code>. The directives only set CSS classes — the consumer provides the transition.',
  description: 'Headless drawer/sidebar system: CngxDrawer (state), CngxDrawerPanel (sliding panel), CngxDrawerContent (content offset). Supports left/right/top/bottom, focus trapping, click-outside close, Escape key, and controlled+uncontrolled modes.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxDrawer',
    'CngxDrawerPanel',
    'CngxDrawerContent',
  ],
  moduleImports: [
    'import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent } from \'@cngx/common\';',
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  setup: `protected readonly direction = signal<'left' | 'right' | 'top' | 'bottom'>('left');
  protected readonly directions: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom'];`,
  template: `
  <div class="filter-row">
    <span class="filter-label">Position:</span>
    @for (d of directions; track d) {
      <button class="chip" [class.chip--active]="direction() === d"
              (click)="direction.set(d)">{{ d }}</button>
    }
  </div>

  <div cngxDrawer #dirDrawer="cngxDrawer" class="drawer-container drawer-container--bordered">
    <button class="sort-btn" (click)="dirDrawer.toggle()">
      Toggle {{ direction() }} drawer
    </button>

    <div class="drawer-layout drawer-layout--relative">
      <aside [cngxDrawerPanel]="dirDrawer" [position]="direction()"
             [enabled]="dirDrawer.opened()"
             class="drawer-panel drawer-panel--direction"
             [class.drawer-panel--horizontal]="direction() === 'left' || direction() === 'right'"
             [class.drawer-panel--vertical]="direction() === 'top' || direction() === 'bottom'">
        <div class="drawer-panel-content">
          <strong>{{ direction() }} panel</strong>
          <button class="sort-btn" (click)="dirDrawer.close()">Close</button>
        </div>
      </aside>

      <main [cngxDrawerContent]="dirDrawer" class="drawer-main drawer-main--tall">
        <p>Content shifts when the drawer opens. Direction: <strong>{{ direction() }}</strong></p>
      </main>
    </div>
  </div>`,
};
