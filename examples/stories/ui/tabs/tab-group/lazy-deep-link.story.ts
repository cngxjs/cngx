import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: a deep link under panelMode="lazy" mounts one panel, not two',
  subtitle:
    '<code>panelMode="lazy"</code> renders a panel\'s content the first time its tab is activated and keep-alives it after. <code>[cngxTabsFragmentSync]</code> resolves the deep-linked tab at content-init, before the group renders any panel, so the default tab is never activated on the way and its content never mounts.',
  description:
    'Each panel body is wrapped in a fixture that counts its own construction. Append <code>#tab=reports</code> to this page\'s URL and reload: the Overview counter stays at <code>0</code> while Reports reads <code>1</code>, because the URL was read before the first panel render and the heavy default tab was skipped entirely. Switch to Overview and its counter goes to <code>1</code>; switch away and back and it stays at <code>1</code>, since keep-alive holds the content once mounted. Seeding after the first render instead would count that render as the default tab\'s first activation, mount its content, and hold it for the rest of the session - which quietly defeats the input in exactly the deep-link case that motivates it.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabsFragmentSync'],
  moduleImports: [
    "import { CngxTab, CngxTabContent, CngxTabsFragmentSync } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
    "import { DemoMountCounter, demoMountCounts } from '../_fixtures/demo-mount-counter.component';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabsFragmentSync', 'DemoMountCounter'],
  references: [
    {
      label: 'WAI-ARIA APG: Tabs pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
    },
  ],
  template: `
  <cngx-tab-group cngxTabsFragmentSync panelMode="lazy" aria-label="Workspace">
    <div cngxTab id="overview" label="Overview">
      <ng-template cngxTabContent>
        <demo-mount-counter key="overview">Overview body - expensive to build.</demo-mount-counter>
      </ng-template>
    </div>
    <div cngxTab id="reports" label="Reports">
      <ng-template cngxTabContent>
        <demo-mount-counter key="reports">Reports body.</demo-mount-counter>
      </ng-template>
    </div>
  </cngx-tab-group>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    Append <code>#tab=reports</code> to this page's URL and reload: Reports opens
    and the Overview counter stays at <code>0</code>. Switching tabs only ever
    moves a counter from <code>0</code> to <code>1</code>, never higher.
  </p>`,
  setupChrome: `
  protected readonly overviewMounts = computed(() => demoMountCounts()['overview'] ?? 0);
  protected readonly reportsMounts = computed(() => demoMountCounts()['reports'] ?? 0);`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Overview body constructed</span><span class="event-value">{{ overviewMounts() }}x</span></div>
    <div class="event-row"><span class="event-label">Reports body constructed</span><span class="event-value">{{ reportsMounts() }}x</span></div>
  </div>`,
};
