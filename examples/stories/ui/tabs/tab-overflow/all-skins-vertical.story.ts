import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabOverflow: every skin, vertical',
  subtitle:
    'The same overflow molecule under <code>orientation="vertical"</code> across all five skins. Skin and orientation are orthogonal axes, and overflow is axis-agnostic: the tabs that do not fit the column surface in the More menu stacked below it, just as they spill into the trailing More menu of a horizontal strip. The IntersectionObserver root is the strip itself, so it works on whichever axis the strip runs.',
  description:
    'Overflow x skin, vertical orientation. Each <code>&lt;cngx-tab-group orientation="vertical"&gt;</code> keeps four tabs in the column and folds the rest into the projected <code>&lt;cngx-tab-overflow&gt;</code>, which lists them in a CngxPopover under the column. Selecting a hidden tab delegates to the panel host - the same path ArrowDown roving uses - and the self-healing scrollIntoView keeps the active tab in view across skins.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'visual-variants', 'a11y-pattern'],
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
  template: `  <div style="display:flex;flex-wrap:wrap;gap:32px">
    @for (skin of skins; track skin) {
      <div style="display:flex;flex-direction:column;gap:6px">
        <span style="font-weight:600;text-transform:capitalize">{{ skin }}</span>
        <div class="demo-vtab-overflow">
          <cngx-tab-group
            [skin]="skin"
            orientation="vertical"
            [(activeIndex)]="active"
            [attr.aria-label]="skin + ' skin, vertical overflow'"
          >
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
