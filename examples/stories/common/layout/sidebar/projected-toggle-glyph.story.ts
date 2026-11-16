import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPanelToggle: Projected glyph',
  subtitle:
    'A <code>[cngxPanelToggle]</code> with its own icon. The exported instance (<code>#toggle="cngxPanelToggle"</code>) exposes <code>expanded()</code>, <code>modalOverlay()</code> and <code>mirrored()</code>, so the projected glyph follows the panel the way the default one does.',
  description:
    'An order inspector on the end edge: a [cngxSidebar] with side="end" that rests hidden. The toggle in the header projects a Material chevron instead of the built-in panel glyph. The chevron reads toggle.expanded() to point the way a press moves the panel, and toggle.mirrored() flips it because the panel sits on the end edge (it would flip back under RTL). toggle.modalOverlay() stays false here; for a modal over-drawer it switches to true, which is where the default glyph draws menu bars and a cross. The projected icon sits inside the toggle glyph slot, which is aria-hidden, so the toggle stays icon-only and is named after the sidebar label. aria-expanded and aria-controls come from the composed panel trigger.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxPanelToggle', 'CngxSidebar'],
  moduleImports: [
    "import { CngxPanelToggle, CngxSidebar } from '@cngx/common/layout';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxStack } from '@cngx/ui/layout';",
    "import { MatIconModule } from '@angular/material/icon';",
  ],
  imports: ['CngxPanelToggle', 'CngxSidebar', 'CngxIcon', 'CngxStack', 'MatIconModule'],
  setup: `
  protected readonly collapsed = signal(true);`,
  template: `
  <cngx-stack direction="row" gap="none">
    <div style="flex: 1 1 auto; min-inline-size: 0; padding: var(--cngx-space-md, 1rem)">
      <cngx-stack direction="row" gap="sm" align="center">
        <strong style="flex: 1 1 auto">Order 1042</strong>
        <button type="button" [cngxPanelToggle]="details" #toggle="cngxPanelToggle">
          <cngx-icon [style.transform]="toggle.mirrored() ? 'scaleX(-1)' : null">
            <mat-icon>{{ toggle.expanded() ? 'chevron_left' : 'chevron_right' }}</mat-icon>
          </cngx-icon>
        </button>
      </cngx-stack>
      <p>Shipped to Vienna, three items. Open the inspector for the details.</p>
    </div>

    <aside cngxSidebar #details="cngxSidebar" side="end" collapsedAs="hidden"
           [expandOnHover]="false" label="Order details" [(collapsed)]="collapsed"
           class="cngx-sidebar">
      <div style="padding: var(--cngx-space-md, 1rem)">
        <strong>Details</strong>
        <dl>
          <dt>Status</dt>
          <dd>Shipped</dd>
          <dt>Items</dt>
          <dd>3</dd>
        </dl>
      </div>
    </aside>
  </cngx-stack>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">toggle.expanded()</span>
      <span class="event-value">{{ toggle.expanded() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">toggle.mirrored()</span>
      <span class="event-value">{{ toggle.mirrored() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">toggle.modalOverlay()</span>
      <span class="event-value">{{ toggle.modalOverlay() }}</span>
    </div>
  </div>`,
};
