import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDrawer: Header inset',
  subtitle:
    'The header row with the trigger sits inside the <code>[cngxDrawerContent]</code> lane, so the panel spans the full height of the layout.',
  description:
    'An over drawer whose trigger lives in a sticky header row inside the content lane instead of above the layout. The open panel covers the header too; as a modal drawer it traps focus, makes everything outside the panel inert, locks scrolling on the lane and shows a scrim keyed on the panel modal class. Compare the Mode over push story, where the header row sits above the layout.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  moduleImports: [
    "import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent } from '@cngx/common/layout';",
  ],
  imports: ['CngxDrawer', 'CngxDrawerPanel', 'CngxDrawerContent'],
  setup: `protected readonly rows = Array.from({ length: 12 }, (_, i) => i + 1);`,
  template: `
  <div cngxDrawer #insetDrawer="cngxDrawer"
       class="demo-drawer-container demo-drawer-container--bordered demo-drawer-container--scrim">
    <div class="demo-drawer-layout demo-drawer-layout--scroll">
      <nav id="inset-panel" [cngxDrawerPanel]="insetDrawer" position="left" [role]="null"
           aria-label="Sections" class="demo-drawer-panel">
        <div class="demo-drawer-panel-content">
          <strong>Sections</strong>
          <button type="button" class="sort-btn">Inbox</button>
          <button type="button" class="sort-btn">Archive</button>
          <button type="button" class="sort-btn" (click)="insetDrawer.close()">Close</button>
        </div>
      </nav>

      <main [cngxDrawerContent]="insetDrawer" class="demo-drawer-main">
        <div class="demo-drawer-lane-header">
          <button type="button" class="sort-btn" aria-controls="inset-panel"
                  [attr.aria-expanded]="insetDrawer.opened()" (click)="insetDrawer.toggle()">
            Menu
          </button>
          <strong>Inbox</strong>
        </div>
        @for (row of rows; track row) {
          <p>Content row {{ row }}. The header row scrolls with the lane and sticks to its top.</p>
        }
      </main>
    </div>
  </div>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">drawer.opened()</span>
      <span class="event-value">{{ insetDrawer.opened() }}</span>
    </div>
  </div>`,
};
