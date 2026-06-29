import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputMask: custom pattern',
  subtitle: 'Define a mask with tokens: <code>0</code> (digit), <code>A</code> (letter), <code>*</code> (alphanumeric), <code>9</code> (optional digit), <code>a</code> (optional letter). Escape with <code>\\\\</code>.',
  description: 'Pattern-based input masking with locale-aware presets, multi-pattern support, custom tokens, and Reactive Forms integration.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxInputMask',
  ],
  moduleImports: [
    'import { CngxInputMask } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxInputMask'],
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label" for="iban-ch">Swiss IBAN</label>
      <input id="iban-ch" cngxInputMask="AA00 0000 0000 0000 0000 0" #ibanMask="cngxInputMask" class="demo-input" />
    </div>
    <div class="demo-field">
      <label class="demo-label" for="plate-ch">License Plate (with prefix)</label>
      <input id="plate-ch" cngxInputMask="AA 000 000" prefix="CH-" #plateMask="cngxInputMask" class="demo-input" />
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Raw: {{ ibanMask.rawValue() }}</span>
      </div>
<div class="status-row">
        <span class="status-badge">Display: {{ plateMask.maskedValue() }}</span>
        <span class="status-badge">Raw: {{ plateMask.rawValue() }}</span>
      </div>`,
};
