import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabOverflow: custom overflow trigger and item',
  subtitle:
    'Project <code>*cngxTabOverflowTrigger</code> and <code>*cngxTabOverflowItem</code> into <code>&lt;cngx-tab-overflow&gt;</code> to replace the overflow-button label and the body of each row in the overflow menu. Untick "Use custom slot templates" to compare with the built-in "N more" label and plain label rows.',
  description:
    'The trigger template receives <code>{ $implicit: count, count, hiddenTabs }</code>; the item template receives <code>{ $implicit: tab, tab, pick, disabled, index }</code>. Both slots paint content only: the library keeps the <code>&lt;button&gt;</code> shell with its <code>aria-label</code>, <code>aria-haspopup</code> and <code>aria-expanded</code>, and each <code>&lt;li role="menuitem"&gt;</code> keeps its id, <code>aria-disabled</code> and click handler, so keyboard navigation and the accessible names do not change. The <strong>Billing</strong> tab is disabled to show the <code>disabled</code> flag in the row context.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: [
    'CngxTabOverflow',
    'CngxTabOverflowTrigger',
    'CngxTabOverflowItem',
    'CngxTabGroup',
    'CngxTab',
  ],
  moduleImports: [
    "import { CngxTab, CngxTabContent, CngxTabOverflowItem, CngxTabOverflowTrigger } from '@cngx/common/tabs';",
    "import { CngxTabGroup, CngxTabOverflow } from '@cngx/ui/tabs';",
  ],
  imports: [
    'CngxTabGroup',
    'CngxTabOverflow',
    'CngxTab',
    'CngxTabContent',
    'CngxTabOverflowTrigger',
    'CngxTabOverflowItem',
  ],
  setup: `protected readonly active = signal(0);
  protected readonly customSlots = signal(true);`,
  template: `  <div class="demo-narrow-frame">
    <cngx-tab-group [(activeIndex)]="active" aria-label="Account settings">
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
      <div cngxTab [label]="'Billing'" [disabled]="true">
        <ng-template cngxTabContent><p>Billing</p></ng-template>
      </div>
      <div cngxTab [label]="'Danger zone'">
        <ng-template cngxTabContent><p>Destructive actions</p></ng-template>
      </div>
      <cngx-tab-overflow>
        @if (customSlots()) {
          <ng-template cngxTabOverflowTrigger let-count let-hiddenTabs="hiddenTabs">
            <span class="demo-overflow-trigger" [title]="hiddenTabs[0]?.label() ?? ''">
              <span class="demo-overflow-trigger__count">+{{ count }}</span>
            </span>
          </ng-template>
          <ng-template cngxTabOverflowItem let-tab let-index="index" let-disabled="disabled">
            <span class="demo-overflow-item" [class.demo-overflow-item--disabled]="disabled">
              <span class="demo-overflow-item__index">{{ index + 1 }}</span>
              <span>{{ tab.label() }}</span>
              @if (disabled) {
                <small>(unavailable)</small>
              }
            </span>
          </ng-template>
        }
      </cngx-tab-overflow>
    </cngx-tab-group>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input
        type="checkbox"
        [checked]="customSlots()"
        (change)="customSlots.set($any($event.target).checked)"
      />
      Use custom slot templates
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
