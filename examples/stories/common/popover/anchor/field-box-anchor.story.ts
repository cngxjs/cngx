import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverAnchor: Field-box anchor',
  subtitle:
    'The inset <code>&lt;button&gt;</code> is the trigger, the bordered row is the anchor. The panel hangs under the row, not under the button.',
  description:
    'The row carries <code>[cngxPopoverAnchor]="pop"</code>, the button inside it carries <code>[cngxPopoverTrigger]="pop"</code>. The input stays a plain textbox: <code>aria-expanded</code> is not allowed on the <code>textbox</code> role, so the disclosure state lives on the button, which keeps <code>aria-expanded</code> and <code>aria-controls</code>. <code>haspopup="none"</code> drops <code>aria-haspopup</code>, because a list of plain text items is no listbox. The trigger yields its <code>anchor-name</code> while the anchor atom holds the popover, so CSS Anchor Positioning and the Floating UI fallback both measure the row. Same idea as Material\'s <code>matAutocompleteOrigin</code>. Press the button to toggle, press Escape or click outside to close.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition'],
  references: [
    {
      label: 'Angular Material: autocomplete origin',
      href: 'https://material.angular.dev/components/autocomplete/overview#attaching-the-autocomplete-panel-to-a-different-element',
    },
    {
      label: 'MDN: CSS anchor positioning',
      href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning',
    },
  ],
  apiComponents: ['CngxPopoverAnchor', 'CngxPopoverTrigger', 'CngxPopover'],
  moduleImports: [
    "import { CngxPopover, CngxPopoverAnchor, CngxPopoverTrigger } from '@cngx/common/popover';",
  ],
  imports: ['CngxPopover', 'CngxPopoverAnchor', 'CngxPopoverTrigger'],
  setup: `protected readonly cities = signal(['Basel', 'Bern', 'Geneva', 'Zurich']);`,
  template: `  <div class="demo-popover-stage">
    <label for="field-box-anchor-city">City</label>
    <div class="demo-popover-field" [cngxPopoverAnchor]="pop">
      <span aria-hidden="true">@</span>
      <input id="field-box-anchor-city" type="text" />
      <button
        type="button"
        haspopup="none"
        [cngxPopoverTrigger]="pop"
        (click)="pop.toggle()"
        (keydown.escape)="pop.hide()">
        Suggestions
      </button>
    </div>
    <div cngxPopover #pop="cngxPopover" placement="bottom-start" [closeOnOutsideClick]="true"
         class="demo-popover-surface">
      <ul class="demo-popover-menu" role="list">
        @for (city of cities(); track city) {
          <li>{{ city }}</li>
        }
      </ul>
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">state</span>
      <span class="event-value">{{ pop.state() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">anchored to row</span>
      <span class="event-value">{{ pop.explicitAnchorElement() !== null }}</span>
    </div>
  </div>`,
};
