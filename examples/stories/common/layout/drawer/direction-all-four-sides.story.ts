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
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent } from '@cngx/common/layout';",
    "import { CngxStack } from '@cngx/ui/layout';",
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent', 'CngxStack'],
  setup: `protected readonly direction = signal<'left' | 'right' | 'top' | 'bottom'>('left');
  protected readonly directions: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom'];`,
  templateChromeBefore: `
  <div class="filter-row" role="group" aria-label="Drawer position">
    @for (d of directions; track d) {
      <button type="button" class="chip" [attr.aria-pressed]="direction() === d"
              (click)="direction.set(d)">{{ d }}</button>
    }
  </div>`,
  template: `
  <div cngxDrawer #dirDrawer="cngxDrawer" class="cngx-drawer">
    <aside id="dir-panel" [cngxDrawerPanel]="dirDrawer" [position]="direction()" label="Sliding panel">
      <cngx-stack gap="sm" align="start" style="padding: var(--cngx-space-md, 1rem)">
        <strong>{{ direction() }} panel</strong>
        <button type="button" (click)="dirDrawer.close()">Close</button>
      </cngx-stack>
    </aside>

    <main [cngxDrawerContent]="dirDrawer" style="padding: var(--cngx-space-md, 1rem)">
      <button type="button" aria-controls="dir-panel"
              [attr.aria-expanded]="dirDrawer.opened()" (click)="dirDrawer.toggle()">
        Toggle {{ direction() }} drawer
      </button>
      <p>Content shifts when the drawer opens. Direction: <strong>{{ direction() }}</strong></p>
    </main>
  </div>`,
};
