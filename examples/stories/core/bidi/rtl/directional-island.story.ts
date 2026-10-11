import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDir: directional island',
  subtitle:
    '<code>[cngxDir]</code> reflects its value onto the host <code>dir</code> attribute, so one section lays out in the opposite writing direction while the document keeps its own.',
  description:
    'Both panels use only logical CSS: the thick border sits on <code>border-inline-start</code>, the list and the action row follow the inline axis. The right panel carries <code>cngxDir</code>, so the browser flips its layout and native bidi for that subtree - the case of an LTR code sample inside an RTL page, or the reverse. The directive scopes DOM and CSS direction only. It does not fork the <code>injectDirection()</code> signal, which stays bound to the document root: the readout below keeps reporting the document direction whatever the island says. A composite whose keyboard navigation must follow a forced subtree direction supplies <code>provideDirectionAt()</code> in its own <code>viewProviders</code>. An unset or bare <code>cngxDir</code> leaves the attribute off and the section inherits again.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['rtl', 'behavior'],
  apiComponents: ['CngxDir', 'injectDirection'],
  moduleImports: [
    "import { CngxDir, injectDirection, type CngxDirection } from '@cngx/core';",
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: ['CngxDir', 'CngxButtonToggleGroup', 'CngxButtonToggle'],
  references: [
    {
      label: 'MDN: the dir global attribute',
      href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir',
    },
  ],
  setup: `
  protected readonly islandDirection = signal<CngxDirection>('rtl');`,
  template: `
  <div class="demo-scope-compare">
    <section class="demo-scope-panel" aria-labelledby="dir-root-h">
      <h3 id="dir-root-h">Document direction</h3>
      <p>No directive - inherits the page direction.</p>
      <ol style="margin:0">
        <li>Open the release notes.</li>
        <li>Check the migration steps.</li>
      </ol>
      <div class="demo-inline-actions">
        <button type="button">Back</button>
        <button type="button">Next</button>
      </div>
    </section>

    <section class="demo-scope-panel" [cngxDir]="islandDirection()" aria-labelledby="dir-island-h">
      <h3 id="dir-island-h">Directional island</h3>
      <p>Carries cngxDir - lays out in its own direction.</p>
      <ol style="margin:0">
        <li>Open the release notes.</li>
        <li>Check the migration steps.</li>
      </ol>
      <div class="demo-inline-actions">
        <button type="button">Back</button>
        <button type="button">Next</button>
      </div>
    </section>
  </div>`,
  templateChromeBefore: `
  <div class="cngx-ex-chrome" style="margin-bottom:12px">
    Pick the island direction. Choose the one opposite to the page (the
    floating dir toggle switches the page) to see the right-hand panel mirror.
  </div>
  <div style="margin-bottom:20px">
    <cngx-button-toggle-group label="Island direction" [(value)]="islandDirection">
      <button type="button" cngxButtonToggle value="ltr">LTR</button>
      <button type="button" cngxButtonToggle value="rtl">RTL</button>
    </cngx-button-toggle-group>
  </div>`,
  setupChrome: `
  protected readonly documentDirection = injectDirection();
  protected readonly island = viewChild(CngxDir);`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">injectDirection() (document)</span>
      <span class="event-value">{{ documentDirection() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">CngxDir.direction() (island)</span>
      <span class="event-value">{{ island()?.direction() ?? 'unset' }}</span>
    </div>
  </div>`,
};
