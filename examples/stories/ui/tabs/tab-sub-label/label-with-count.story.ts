import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: sub-label with count',
  subtitle:
    'An optional second text line under the primary label. Set it with the <code>[subLabel]</code> string for the common count case, or project a <code>*cngxTabSubLabel</code> template for richer content. A trailing <code>*cngxTabIcon</code> (<code>iconLayout="end"</code>) sits to the right of the stacked text column. The sub-label stacks on every skin - cycle through all five and watch the pill grow vertically rather than clip.',
  description:
    'Content axis, orthogonal to skin and icon-layout. <code>subLabel</code> is a per-tab <code>input()</code> (parallel to <code>[label]</code>), and <code>*cngxTabSubLabel</code> mirrors <code>*cngxTabLabel</code>. The string form folds into the tab\'s accessible name via the <code>CngxTabsI18n.tabLabelWithDetail</code> key, so AT announces "Tab 1 of 3: Bookmarks, 45"; the template form is visual content, matching how <code>*cngxTabLabel</code> relates to <code>[label]</code>. The label and sub-label live in a <code>.cngx-tabs__text</code> column, so the trailing icon stays beside the whole stack. No <code>[showSubLabel]</code> knob and no abbreviation - arbitrary content stacks and the tab grows.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabSubLabel', 'CngxTabIcon', 'CngxTabContent'],
  moduleImports: [
    "import { CngxTab, CngxTabContent, CngxTabIcon, CngxTabSubLabel } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabSubLabel', 'CngxTabIcon', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);
  protected readonly skin = signal<'line' | 'contained' | 'segmented' | 'pill' | 'pill-outline'>('segmented');`,
  template: `  <cngx-tab-group [skin]="skin()" iconLayout="end" [(activeIndex)]="active" aria-label="Library sections">
    <ng-template cngxTabIcon let-active="active" let-index="index">
      <svg viewBox="0 0 16 16" width="16" height="16"
           [attr.fill]="active ? 'currentColor' : 'none'"
           stroke="currentColor" stroke-width="1.5"
           stroke-linecap="round" stroke-linejoin="round">
        @switch (index) {
          @case (0) { <path d="M4 2 h8 v12 l-4 -3 l-4 3 Z" /> }
          @case (1) { <path d="M8 2.5 L13.5 7.5 V13.5 H2.5 V7.5 Z" /> }
          @default { <path d="M4 2 H9 L12 5 V14 H4 Z" /> }
        }
      </svg>
    </ng-template>
    <div cngxTab [label]="'Bookmarks'" [subLabel]="'45'">
      <ng-template cngxTabContent><p>Saved bookmarks.</p></ng-template>
    </div>
    <div cngxTab [label]="'Home'">
      <ng-template cngxTabSubLabel>2 tasks</ng-template>
      <ng-template cngxTabContent><p>Home overview.</p></ng-template>
    </div>
    <div cngxTab [label]="'Drafts'" [subLabel]="'12'">
      <ng-template cngxTabContent><p>Unpublished drafts.</p></ng-template>
    </div>
  </cngx-tab-group>`,
  setupChrome: `protected readonly skins = ['line', 'contained', 'segmented', 'pill', 'pill-outline'] as const;`,
  templateChrome: `<div class="button-row" role="radiogroup" aria-label="Tab skin" style="margin-top:12px;gap:12px;flex-wrap:wrap">
    @for (s of skins; track s) {
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-tab-sublabel-skin"
               [checked]="skin() === s"
               (change)="skin.set(s)" />
        {{ s }}
      </label>
    }
  </div>`,
};
