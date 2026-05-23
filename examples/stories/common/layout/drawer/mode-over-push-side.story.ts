import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Mode over push side',
  subtitle:
    '<code>[mode]</code> controls how the panel interacts with content. <strong>over</strong> (default) overlays content. <strong>push</strong> pushes content aside. <strong>side</strong> is always visible - no toggle needed.',
  description:
    'Compares the three DrawerMode values: over keeps the panel absolutely positioned above content, push lays it out next to the content lane, and side pins it permanently open so the toggle button hides.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'behavior'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent, type DrawerMode } from '@cngx/common/layout';",
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  setup: `protected readonly mode = signal<DrawerMode>('over');
  protected readonly modes: DrawerMode[] = ['over', 'push', 'side'];`,
  template: `
  <div class="filter-row" role="group" aria-label="Drawer mode">
    @for (m of modes; track m) {
      <button type="button" class="chip" [attr.aria-pressed]="mode() === m"
              (click)="mode.set(m)">{{ m }}</button>
    }
  </div>

  <div cngxDrawer #modeDrawer="cngxDrawer" class="demo-drawer-container demo-drawer-container--bordered">
    @if (mode() !== 'side') {
      <div class="button-row" style="padding: 0.5rem;">
        <button type="button" class="sort-btn" (click)="modeDrawer.toggle()">
          Toggle {{ mode() }} drawer
        </button>
      </div>
    }

    <div class="demo-drawer-layout demo-drawer-layout--relative"
         [class.demo-drawer-layout--push]="mode() === 'push' || mode() === 'side'">
      <aside [cngxDrawerPanel]="modeDrawer" position="left" [mode]="mode()"
             [enabled]="modeDrawer.opened() && mode() !== 'side'"
             class="demo-drawer-panel"
             [class.demo-drawer-panel--static]="mode() === 'push' || mode() === 'side'">
        <div class="demo-drawer-panel-content">
          <strong>{{ mode() }} panel</strong>
          @if (mode() !== 'side') {
            <button type="button" class="sort-btn" (click)="modeDrawer.close()">Close</button>
          }
        </div>
      </aside>

      <main [cngxDrawerContent]="modeDrawer" class="demo-drawer-main demo-drawer-main--tall">
        <p>Mode: <strong>{{ mode() }}</strong></p>
        @if (mode() === 'side') {
          <p>Always visible - no toggle button needed.</p>
        } @else if (mode() === 'push') {
          <p>Content shifts when the drawer opens.</p>
        } @else {
          <p>Panel overlays content.</p>
        }
      </main>
    </div>
  </div>`,
};
