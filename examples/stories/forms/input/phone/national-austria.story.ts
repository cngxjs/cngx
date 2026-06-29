import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputMask: national Austrian mobile',
  subtitle:
    'A national mobile number (leading <code>0</code>, no <code>+43</code>) - the mobile NDC is a regular 3-digit <code>06xx</code>, so a fixed <code>0000 0000000</code> mask groups it correctly.',
  description:
    'Landline is deliberately not masked here: Austrian area codes vary in length (Vienna 01, Graz 0316, up to 5-digit in small municipalities), so a fixed mask cannot place the grouping - that needs phone metadata (libphonenumber), not a pattern.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxInputMask'],
  moduleImports: ["import { CngxInputMask } from '@cngx/forms/input';"],
  imports: ['CngxInputMask'],
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label" for="at-mobile">Austrian mobile (national)</label>
      <input
        id="at-mobile"
        cngxInputMask="0000 0000000"
        #atMask="cngxInputMask"
        class="demo-input"
      />
      <span class="demo-hint">e.g. 0664 1234567 - leading 0, no +43</span>
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Display: {{ atMask.maskedValue() }}</span>
        <span class="status-badge">Raw: {{ atMask.rawValue() }}</span>
      </div>`,
};
