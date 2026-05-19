import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tabs — overflow dropdown',
  navLabel: 'Overflow',
  navCategory: 'tabs',
  description:
    'Opt-in <code>&lt;cngx-tab-overflow&gt;</code> molecule projected inside <code>&lt;cngx-tab-group&gt;</code> — surfaces tab buttons that have scrolled out of the strip viewport (or never fit) through a "More" <code>CngxPopover</code> dropdown. Visibility is tracked via a native <code>IntersectionObserver</code> rooted on the strip; partial-clip thresholds fall through to "hidden" so users always reach every tab. Talks to the organism only through <code>CNGX_TAB_PANEL_HOST</code> — no concrete-class injection.',
  apiComponents: ['CngxTabGroup', 'CngxTabOverflow', 'CngxTab', 'CngxTabContent'],
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  moduleImports: [
    "import { CngxTab, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxTabGroup, CngxTabOverflow } from '@cngx/ui/tabs';",
  ],
  setup: `
  protected readonly active = signal(0);
  `,
  sections: [
    {
      title: '8 tabs in a narrow container',
      subtitle:
        'The strip wrapper is constrained to 320px. With 8 tabs only the first few fit; the rest report <code>intersectionRatio &lt; 1</code> and surface in the More dropdown. Picking a hidden tab calls <code>panelHost.selectById()</code> — same delegation a real-keyboard ArrowRight roving move uses.',
      imports: [
        'CngxTabGroup',
        'CngxTabOverflow',
        'CngxTab',
        'CngxTabContent',
      ],
      template: `
  <div style="max-width: 320px; border: 1px dashed currentColor; padding: 4px; resize: horizontal; overflow: auto">
    <cngx-tab-group [(activeIndex)]="active" aria-label="Overflow demo">
      <div cngxTab [label]="'Profile'">
        <ng-template cngxTabContent><p>Profile</p></ng-template>
      </div>
      <div cngxTab [label]="'Account'">
        <ng-template cngxTabContent><p>Account</p></ng-template>
      </div>
      <div cngxTab [label]="'Notifications'">
        <ng-template cngxTabContent><p>Notifications</p></ng-template>
      </div>
      <div cngxTab [label]="'Privacy'">
        <ng-template cngxTabContent><p>Privacy</p></ng-template>
      </div>
      <div cngxTab [label]="'Sessions'">
        <ng-template cngxTabContent><p>Sessions</p></ng-template>
      </div>
      <div cngxTab [label]="'Tokens'">
        <ng-template cngxTabContent><p>API tokens</p></ng-template>
      </div>
      <div cngxTab [label]="'Billing'">
        <ng-template cngxTabContent><p>Billing</p></ng-template>
      </div>
      <div cngxTab [label]="'Danger zone'">
        <ng-template cngxTabContent><p>Destructive actions</p></ng-template>
      </div>
      <cngx-tab-overflow></cngx-tab-overflow>
    </cngx-tab-group>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
  ],
};
