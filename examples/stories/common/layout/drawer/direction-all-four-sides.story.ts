import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Direction all four sides',
  subtitle:
    'Change <code>[position]</code> to <code>left</code>, <code>right</code>, <code>top</code>, or <code>bottom</code>. The directives only set CSS classes - the consumer provides the transition.',
  description:
    'Switches the [position] input across left, right, top, and bottom so the same drawer renders with four different slide directions. The directive only flips host classes; transform direction is owned by the demo stylesheet.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  moduleImports: ["import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent } from '@cngx/common/layout';"],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  setup: `protected readonly direction = signal<'left' | 'right' | 'top' | 'bottom'>('left');
  protected readonly directions: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom'];`,
  template: `
  <div class="filter-row" role="group" aria-label="Drawer position">
    @for (d of directions; track d) {
      <button type="button" class="chip" [attr.aria-pressed]="direction() === d"
              (click)="direction.set(d)">{{ d }}</button>
    }
  </div>

  <div cngxDrawer #dirDrawer="cngxDrawer" class="demo-drawer-container demo-drawer-container--bordered">
    <div class="button-row" style="padding: 0.5rem;">
      <button type="button" class="sort-btn" (click)="dirDrawer.toggle()">
        Toggle {{ direction() }} drawer
      </button>
    </div>

    <div class="demo-drawer-layout demo-drawer-layout--relative">
      <aside [cngxDrawerPanel]="dirDrawer" [position]="direction()"
             [enabled]="dirDrawer.opened()"
             class="demo-drawer-panel">
        <div class="demo-drawer-panel-content">
          <strong>{{ direction() }} panel</strong>
          <button type="button" class="sort-btn" (click)="dirDrawer.close()">Close</button>
        </div>
      </aside>

      <main [cngxDrawerContent]="dirDrawer" class="demo-drawer-main demo-drawer-main--tall">
        <p>Content shifts when the drawer opens. Direction: <strong>{{ direction() }}</strong></p>
      </main>
    </div>
  </div>`,
};
