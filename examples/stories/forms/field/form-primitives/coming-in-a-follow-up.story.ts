import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChipInput — coming in a follow-up',
  subtitle: '<code>CngxChipInput</code> (the tokenizer that emits <code>tokenCreated</code> events as the user types) does not fit the same bridge as the nine controls above — it has no single <code>value</code> to bind because the consumer holds the chip list externally. A dedicated bridge ships in a follow-up so consumers can drop <code>&lt;input cngxChipInput formControlName="tags"&gt;</code> next to the existing <code>tokenCreated</code> output. Until then, wire the input manually as you would today.',
  description: 'Nine cngx form controls — toggle, checkbox, radio group, two flavours of checkbox/button-toggle/chip group, plus the standalone chip — bind to whatever forms paradigm your app uses. Drop them into <cngx-form-field [field]> for Signal Forms, or bind [formControl] for Reactive Forms. Same atom, same template. No CVA-per-control boilerplate, and switching paradigms later costs nothing in the atom layer.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'integration'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxFormBridge',
    'CngxFormField',
    'CngxToggle',
    'CngxCheckbox',
    'CngxChipInteraction',
    'CngxRadioGroup',
    'CngxRadio',
    'CngxCheckboxGroup',
    'CngxButtonToggleGroup',
    'CngxButtonMultiToggleGroup',
    'CngxChipGroup',
    'CngxMultiChipGroup',
    'CngxChipInGroup',
  ],
  template: `
  <p style="color:var(--cngx-muted, #6b7280);font-style:italic">
    Demo for CngxChipInput Forms integration ships in Phase 7.x.
  </p>`,
};
