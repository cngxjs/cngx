import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tabs — vertical',
  navLabel: 'Vertical',
  navCategory: 'tabs',
  description:
    'Sidebar layout — <code>[orientation]="vertical"</code> renders a 2-column grid with a vertical strip and a panel column. Roving tabindex switches to ArrowUp / ArrowDown semantics automatically.',
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabLabel', 'CngxTabContent'],
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'visual-variants'],
  moduleImports: [
    "import { CngxTab, CngxTabLabel, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  setup: `
  protected readonly active = signal(0);
  `,
  sections: [
    {
      title: 'Vertical sidebar tabs',
      subtitle:
        'Pass <code>orientation="vertical"</code>. <code>aria-orientation</code> on the tablist plus <code>data-orientation</code> on the wrapper drive the layout split.',
      imports: ['CngxTabGroup', 'CngxTab', 'CngxTabLabel', 'CngxTabContent'],
      template: `
  <cngx-tab-group orientation="vertical" [(activeIndex)]="active" aria-label="Vertical tabs">
    <div cngxTab [label]="'Overview'">
      <ng-template cngxTabLabel>Overview</ng-template>
      <ng-template cngxTabContent>
        <p>Overview content — top-level summary.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Activity'">
      <ng-template cngxTabLabel>Activity</ng-template>
      <ng-template cngxTabContent>
        <p>Activity content — recent events, audit log.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Members'">
      <ng-template cngxTabLabel>Members</ng-template>
      <ng-template cngxTabContent>
        <p>Members content — team roster, roles.</p>
      </ng-template>
    </div>
    <div cngxTab [label]="'Billing'">
      <ng-template cngxTabLabel>Billing</ng-template>
      <ng-template cngxTabContent>
        <p>Billing content — plan, invoices, payment method.</p>
      </ng-template>
    </div>
  </cngx-tab-group>
  <div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
  ],
};
