import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTouchTarget: pin the hit-area floor',
  subtitle:
    '<code>[cngxTouchTarget]="\'on\'"</code> pins the 44px touch floor on a subtree; <code>\'off\'</code> keeps it dense. The default derives from <code>(any-pointer: coarse)</code>, so the directive is override-only.',
  description:
    'CngxTouchTarget reflects its value onto <code>[data-touch]</code>, scoping the inheritable <code>--cngx-target-min</code> floor to a subtree. Every interactive atom inside clamps its host box with <code>max(&lt;natural&gt;, var(--cngx-target-min, 0px))</code>, so the indicator glyphs keep their design size inside a larger hit area. On a mouse (fine pointer) the floor is inert at 0px, so pick <strong>on</strong> to see the 44px lift here; a touch device gets it automatically from <strong>auto</strong>. The floor now sweeps the whole interactive surface: the tabs, paginator, select, breadcrumb (items and the overflow ellipsis) and stepper headers below all lift with the same token (the treetable expander is clamped too, though not shown here). A companion <code>--cngx-target-gap</code> handles WCAG 2.5.8: the dense Size chip row at the end pins its own gap to 2px, and the floor lifts the adjacent spacing to 8px on a coarse pointer so the small chips stay distinguishable as separate tap targets.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxTouchTarget'],
  moduleImports: [
    "import { CngxTouchTarget } from '@cngx/core';",
    "import { CngxCheckbox, CngxToggle, CngxRadioGroup, CngxRadio, CngxButtonToggleGroup, CngxButtonToggle, CngxCloseButton, CngxChipGroup, CngxChipInGroup } from '@cngx/common/interactive';",
    "import { CngxChip } from '@cngx/common/display';",
    "import { CngxTab, CngxTabContent } from '@cngx/common/tabs';",
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
    "import { CngxBreadcrumbBar } from '@cngx/ui/breadcrumb';",
    "import { CngxPaginator, CngxPaginatorFirst, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext, CngxPaginatorLast } from '@cngx/ui/paginator';",
    "import { CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: [
    'CngxTouchTarget',
    'CngxCheckbox',
    'CngxToggle',
    'CngxRadioGroup',
    'CngxRadio',
    'CngxButtonToggleGroup',
    'CngxButtonToggle',
    'CngxCloseButton',
    'CngxChip',
    'CngxChipGroup',
    'CngxChipInGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxTabGroup',
    'CngxStep',
    'CngxStepContent',
    'CngxStepper',
    'CngxBreadcrumbBar',
    'CngxPaginator',
    'CngxPaginatorFirst',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorLast',
    'CngxSelect',
  ],
  references: [
    {
      label: 'WCAG 2.5.5 Target Size (Enhanced)',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html',
    },
    {
      label: 'Apple HIG: Layout (44pt targets)',
      href: 'https://developer.apple.com/design/human-interface-guidelines/layout',
    },
  ],
  setup: `
  protected readonly mode = signal<'auto' | 'on' | 'off'>('on');
  protected readonly accept = signal(false);
  protected readonly notifications = signal(false);
  protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);
  protected readonly view = signal<'grid' | 'list' | 'table' | undefined>('grid');
  protected readonly tags = signal<string[]>(['Design', 'Review']);
  protected readonly activeTab = signal(0);
  protected readonly pageIndex = signal(2);
  protected readonly stepIndex = signal(0);
  protected readonly color = signal<string | undefined>(undefined);
  protected readonly size = signal<string>('md');
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
  protected readonly crumbs = [
    { label: 'Home', href: '#/' },
    { label: 'Catalog', href: '#/catalog' },
    { label: 'Books', href: '#/catalog/books' },
    { label: 'Fantasy', href: '#/catalog/books/fantasy' },
    { label: 'Tolkien', href: '#/catalog/books/fantasy/tolkien' },
    { label: 'The Hobbit' },
  ];

  protected handleRemove(tag: string): void {
    this.tags.update((current) => current.filter((entry) => entry !== tag));
  }`,
  template: `
  <div
    [cngxTouchTarget]="mode() === 'auto' ? undefined : mode()"
    style="display:flex; flex-direction:column; gap:16px; align-items:flex-start"
  >
    <cngx-checkbox class="tt-hitbox" [(value)]="accept">I accept the terms</cngx-checkbox>

    <cngx-toggle class="tt-hitbox" [(value)]="notifications">Receive e-mail notifications</cngx-toggle>

    <cngx-radio-group [(value)]="payment" name="tt-payment" label="Payment method">
      <cngx-radio class="tt-hitbox" value="card">Credit card</cngx-radio>
      <cngx-radio class="tt-hitbox" value="cash">Cash on delivery</cngx-radio>
      <cngx-radio class="tt-hitbox" value="invoice">Invoice</cngx-radio>
    </cngx-radio-group>

    <cngx-button-toggle-group label="Layout" [(value)]="view">
      <button type="button" cngxButtonToggle value="grid">Grid</button>
      <button type="button" cngxButtonToggle value="list">List</button>
      <button type="button" cngxButtonToggle value="table">Table</button>
    </cngx-button-toggle-group>

    <div style="display:flex; gap:8px; flex-wrap:wrap; min-height:2rem">
      @for (tag of tags(); track tag) {
        <cngx-chip [removable]="true" [removeAriaLabel]="'Remove ' + tag" (remove)="handleRemove(tag)">
          {{ tag }}
        </cngx-chip>
      } @empty {
        <span>No chips.</span>
      }
    </div>

    <cngx-close-button class="tt-hitbox" label="Dismiss notice" />

    <cngx-tab-group [(activeIndex)]="activeTab" aria-label="Account settings">
      <div cngxTab [label]="'Profile'">
        <ng-template cngxTabContent><p>Profile</p></ng-template>
      </div>
      <div cngxTab [label]="'Account'">
        <ng-template cngxTabContent><p>Account</p></ng-template>
      </div>
      <div cngxTab [label]="'Privacy'">
        <ng-template cngxTabContent><p>Privacy</p></ng-template>
      </div>
    </cngx-tab-group>

    <cngx-paginator [total]="28" [pageIndex]="pageIndex()" (pageIndexChange)="pageIndex.set($event)" style="width: min(420px, 100%)">
      <cngx-pgn-first />
      <cngx-pgn-prev />
      <cngx-pgn-pages />
      <cngx-pgn-next />
      <cngx-pgn-last />
    </cngx-paginator>

    <cngx-select [options]="colors" [(value)]="color" placeholder="Pick a colour" aria-label="Colour" />

    <cngx-breadcrumb [items]="crumbs" [maxVisible]="3" label="Library breadcrumb" />

    <cngx-stepper [(activeStepIndex)]="stepIndex" aria-label="Sign up" style="width: min(440px, 100%)">
      <div cngxStep label="Account">
        <ng-template cngxStepContent><p>Create your account.</p></ng-template>
      </div>
      <div cngxStep label="Profile">
        <ng-template cngxStepContent><p>Fill in your profile.</p></ng-template>
      </div>
      <div cngxStep label="Confirm">
        <ng-template cngxStepContent><p>Confirm and submit.</p></ng-template>
      </div>
    </cngx-stepper>

    <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-start">
      <span style="font-size:0.8125rem; opacity:0.7">
        Dense chip row - the adjacent gap floors to 8px on a coarse pointer (WCAG 2.5.8):
      </span>
      <cngx-chip-group label="Size" [(selected)]="size" [style.--cngx-chip-group-gap.px]="2">
        <cngx-chip cngxChipInGroup [value]="'xs'">XS</cngx-chip>
        <cngx-chip cngxChipInGroup [value]="'sm'">S</cngx-chip>
        <cngx-chip cngxChipInGroup [value]="'md'">M</cngx-chip>
        <cngx-chip cngxChipInGroup [value]="'lg'">L</cngx-chip>
        <cngx-chip cngxChipInGroup [value]="'xl'">XL</cngx-chip>
      </cngx-chip-group>
    </div>
  </div>`,
  templateChromeBefore: `
  <div class="cngx-ex-chrome" style="margin-bottom:12px">
    On a mouse the floor is inert, so <strong>on</strong> is the mode that shows the
    44px lift here. A touch device gets it from <strong>auto</strong> with no config.
  </div>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label>
      <input type="radio" name="tt-mode" value="auto"
        [checked]="mode() === 'auto'" (change)="mode.set('auto')" />
      auto (environment)
    </label>
    <label>
      <input type="radio" name="tt-mode" value="on"
        [checked]="mode() === 'on'" (change)="mode.set('on')" />
      on (pin 44px)
    </label>
    <label>
      <input type="radio" name="tt-mode" value="off"
        [checked]="mode() === 'off'" (change)="mode.set('off')" />
      off (dense)
    </label>
  </div>`,
};
