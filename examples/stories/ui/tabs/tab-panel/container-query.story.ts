import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: panel container query',
  subtitle:
    'Every tab panel is a <code>cngx-tab-panel</code> container-query context. The cards inside reflow on the <strong>panel\'s own width</strong> - not the viewport - so the same panel adapts whether it sits in a wide page or a narrow column. Drag the bottom-right handle to resize.',
  description:
    'The panel carries <code>container-type: inline-size; container-name: cngx-tab-panel</code> (per-panel, not on the host - a host container would measure the strip width too under vertical orientation). Consumer CSS writes <code>@container cngx-tab-panel (min-width: 420px)</code> to switch the card grid from one column to three. No extra wrapper div: the panel is both the <code>role="tabpanel"</code> and the query context.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  references: [
    {
      label: 'MDN - CSS container queries',
      href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries',
    },
  ],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  moduleImports: [
    "import { CngxTab, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);`,
  templateChromeBefore: `<p style="margin:0 0 8px">Drag the bottom-right corner to resize the panel - the cards reflow on the panel's own width.</p>`,
  template: `  <div class="demo-cq-resize">
    <cngx-tab-group [(activeIndex)]="active" aria-label="Container-query panel">
      <div cngxTab [label]="'Cards'">
        <ng-template cngxTabContent>
          <div class="demo-cq-grid">
            <div class="demo-cq-card">Card one</div>
            <div class="demo-cq-card">Card two</div>
            <div class="demo-cq-card">Card three</div>
          </div>
        </ng-template>
      </div>
      <div cngxTab [label]="'About'">
        <ng-template cngxTabContent>
          <p>The card grid on the first tab reflows via <code>@container cngx-tab-panel</code>.</p>
        </ng-template>
      </div>
    </cngx-tab-group>
  </div>`,
};
