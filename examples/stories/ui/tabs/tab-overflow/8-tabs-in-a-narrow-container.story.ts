import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabOverflow: eight tabs in a narrow container',
  subtitle: 'The strip wrapper is constrained to 320px. With 8 tabs only the first few fit; the rest report <code>intersectionRatio &lt; 1</code> and surface in the More dropdown. Picking a hidden tab calls <code>panelHost.selectById()</code> - same delegation a real-keyboard ArrowRight roving move uses.',
  description: 'IntersectionObserver-driven overflow: eight tab buttons in a resizable 320px frame. Hidden tabs surface inside a CngxPopover anchored on the More button; selection delegates back to the panel host so keyboard and pointer paths converge.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: [
    'CngxTabGroup',
    'CngxTabOverflow',
    'CngxTab',
    'CngxTabContent',
  ],
  moduleImports: [
    'import { CngxTab, CngxTabContent } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup, CngxTabOverflow } from \'@cngx/ui/tabs\';',
  ],
  imports: ['CngxTabGroup', 'CngxTabOverflow', 'CngxTab', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);`,
  template: `  <div class="demo-narrow-frame">
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
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
