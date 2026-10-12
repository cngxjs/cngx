import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTypeahead: slot override input prefix suffix',
  subtitle:
    'Project <code>*cngxSelectInputPrefix</code> and <code>*cngxSelectInputSuffix</code> to place decoration before and after the trigger <code>&lt;input&gt;</code>. Both templates receive <code>{ disabled, focused, panelOpen }</code>; the suffix below prints the three flags so you can watch them change while you focus, type and close the panel.',
  description:
    "Without the templates nothing is rendered in either position - there is no default prefix or suffix. The suffix sits after the input and before the clear button and caret. Each slot is wrapped in a span that stops click propagation, so a click on the decoration does not open the panel. The decoration is not part of the input's accessible name, so mark purely visual glyphs <code>aria-hidden</code>. The input-bearing composites render these slots: <code>CngxTypeahead</code>, <code>CngxCombobox</code>, <code>CngxActionSelect</code> and <code>CngxActionMultiSelect</code>.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'template-only',
  apiComponents: ['CngxTypeahead', 'CngxSelectInputPrefix', 'CngxSelectInputSuffix'],
  moduleImports: [
    "import { CngxSelectInputPrefix, CngxSelectInputSuffix, CngxTypeahead, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxTypeahead', 'CngxSelectInputPrefix', 'CngxSelectInputSuffix'],
  setup: `protected readonly cities: CngxSelectOptionDef<string>[] = [
    { value: 'ber', label: 'Berlin' },
    { value: 'ham', label: 'Hamburg' },
    { value: 'muc', label: 'Munich' },
    { value: 'cgn', label: 'Cologne' },
    { value: 'fra', label: 'Frankfurt' },
  ];
  protected readonly city = signal<string | undefined>(undefined);
  protected readonly customSlots = signal(true);
  protected readonly disabled = signal(false);`,
  template: `  <cngx-typeahead
    [label]="'City'"
    [options]="cities"
    [(value)]="city"
    [disabled]="disabled()"
    [clearable]="true"
    placeholder="Search a city"
  >
    @if (customSlots()) {
      <ng-template cngxSelectInputPrefix let-focused="focused">
        <span aria-hidden="true" class="demo-input-adornment" [class.demo-input-adornment--active]="focused">
          &#9906;
        </span>
      </ng-template>
      <ng-template
        cngxSelectInputSuffix
        let-focused="focused"
        let-panelOpen="panelOpen"
        let-disabled="disabled"
      >
        <small aria-hidden="true" class="demo-input-flags">
          {{ focused ? 'focused' : 'idle' }} / {{ panelOpen ? 'open' : 'closed' }}{{ disabled ? ' / disabled' : '' }}
        </small>
      </ng-template>
    }
  </cngx-typeahead>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input
        type="checkbox"
        [checked]="customSlots()"
        (change)="customSlots.set($any($event.target).checked)"
      />
      Use custom slot templates
    </label>
    <label>
      <input
        type="checkbox"
        [checked]="disabled()"
        (change)="disabled.set($any($event.target).checked)"
      />
      Disabled
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ city() ?? 'none' }}</span></div>
  </div>`,
};
