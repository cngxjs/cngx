import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabOverflow: every skin, horizontal',
  subtitle:
    'The same eight tabs and the same <code>&lt;cngx-tab-overflow&gt;</code> under <code>line</code>, <code>contained</code>, <code>segmented</code>, <code>pill</code>, and <code>pill-outline</code>. Each group is clamped to a 320px frame, so the tabs that do not fit report <code>intersectionRatio &lt; 1</code> and surface in the per-group More menu. Skin is purely visual - the overflow plumbing is identical across all five.',
  description:
    'Overflow x skin, horizontal orientation. Each <code>&lt;cngx-tab-group&gt;</code> differs only by its <code>[skin]</code> input; the projected <code>&lt;cngx-tab-overflow&gt;</code> molecule observes its own strip via IntersectionObserver and lists the clipped tabs in a CngxPopover anchored on the More button. Picking a hidden tab delegates to the panel host, so keyboard and pointer paths converge regardless of skin.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'visual-variants'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: ['CngxTabGroup', 'CngxTabOverflow', 'CngxTab', 'CngxTabContent'],
  moduleImports: [
    "import { CngxTab, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxTabGroup, CngxTabOverflow } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTabOverflow', 'CngxTab', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);
  protected readonly skins = ['line', 'contained', 'segmented', 'pill', 'pill-outline'] as const;`,
  template: `  <div style="display:flex;flex-direction:column;gap:24px">
    @for (skin of skins; track skin) {
      <div style="display:flex;flex-direction:column;gap:6px">
        <span style="font-weight:600;text-transform:capitalize">{{ skin }}</span>
        <div class="demo-narrow-frame">
          <cngx-tab-group [skin]="skin" [(activeIndex)]="active" [attr.aria-label]="skin + ' skin, overflow'">
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
      </div>
    }
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row"><span class="event-label">Shared active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
