import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTouchTarget: pin the hit-area floor',
  subtitle:
    '<code>[cngxTouchTarget]="\'on\'"</code> pins the 44px touch floor on a subtree; <code>\'off\'</code> keeps it dense. The default derives from <code>(any-pointer: coarse)</code>, so the directive is override-only.',
  description:
    'CngxTouchTarget reflects its value onto <code>[data-touch]</code>, scoping the inheritable <code>--cngx-target-min</code> floor to a subtree. Every interactive atom inside clamps its host box with <code>max(&lt;natural&gt;, var(--cngx-target-min, 0px))</code>, so the indicator glyphs keep their design size inside a larger hit area. On a mouse (fine pointer) the floor is inert at 0px, so pick <strong>on</strong> to see the 44px lift here; a touch device gets it automatically from <strong>auto</strong>.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxTouchTarget'],
  moduleImports: [
    "import { CngxTouchTarget } from '@cngx/core';",
    "import { CngxCheckbox, CngxToggle, CngxRadioGroup, CngxRadio, CngxButtonToggleGroup, CngxButtonToggle, CngxCloseButton } from '@cngx/common/interactive';",
    "import { CngxChip } from '@cngx/common/display';",
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

  protected handleRemove(tag: string): void {
    this.tags.update((current) => current.filter((entry) => entry !== tag));
  }`,
  template: `
  <div
    [cngxTouchTarget]="mode() === 'auto' ? undefined : mode()"
    style="display:flex; flex-direction:column; gap:16px; align-items:flex-start"
  >
    <cngx-checkbox [(value)]="accept">I accept the terms</cngx-checkbox>

    <cngx-toggle [(value)]="notifications">Receive e-mail notifications</cngx-toggle>

    <cngx-radio-group [(value)]="payment" name="tt-payment" label="Payment method">
      <cngx-radio value="card">Credit card</cngx-radio>
      <cngx-radio value="cash">Cash on delivery</cngx-radio>
      <cngx-radio value="invoice">Invoice</cngx-radio>
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

    <cngx-close-button label="Dismiss notice" />
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
