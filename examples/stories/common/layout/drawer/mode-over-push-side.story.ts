import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Mode — Over / Push / Side',
  subtitle: '<code>[mode]</code> controls how the panel interacts with content. <strong>over</strong> (default) overlays content. <strong>push</strong> pushes content aside. <strong>side</strong> is always visible — no toggle needed.',
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
    'import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent, type DrawerMode } from \'@cngx/common\';',
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  setup: `protected readonly mode = signal<DrawerMode>('over');
  protected readonly modes: DrawerMode[] = ['over', 'push', 'side'];`,
  template: `
  <div class="filter-row">
    <span class="filter-label">Mode:</span>
    @for (m of modes; track m) {
      <button class="chip" [class.chip--active]="mode() === m"
              (click)="mode.set(m)">{{ m }}</button>
    }
  </div>

  <div cngxDrawer #modeDrawer="cngxDrawer" class="drawer-container drawer-container--bordered">
    @if (mode() !== 'side') {
      <button class="sort-btn" (click)="modeDrawer.toggle()">
        Toggle {{ mode() }} drawer
      </button>
    }

    <div class="drawer-layout drawer-layout--relative"
         [class.drawer-layout--push]="mode() === 'push' || mode() === 'side'">
      <aside [cngxDrawerPanel]="modeDrawer" position="left" [mode]="mode()"
             [enabled]="modeDrawer.opened() && mode() !== 'side'"
             class="drawer-panel"
             [class.drawer-panel--static]="mode() === 'push' || mode() === 'side'">
        <div class="drawer-panel-content">
          <strong>{{ mode() }} panel</strong>
          @if (mode() !== 'side') {
            <button class="sort-btn" (click)="modeDrawer.close()">Close</button>
          }
        </div>
      </aside>

      <main [cngxDrawerContent]="modeDrawer" class="drawer-main drawer-main--tall">
        <p>Mode: <strong>{{ mode() }}</strong></p>
        @if (mode() === 'side') {
          <p>Always visible — no toggle button needed.</p>
        } @else if (mode() === 'push') {
          <p>Content shifts when the drawer opens.</p>
        } @else {
          <p>Panel overlays content.</p>
        }
      </main>
    </div>
  </div>`,
};
