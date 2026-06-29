import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxInputMask: national Austrian phone',
  subtitle:
    'A purely national number (leading <code>0</code>, no <code>+43</code>) using a custom <code>|</code> multi-pattern - landline below, mobile above the length threshold.',
  description:
    'When you do not want the international country code, skip the phone preset and mask the national format directly.',
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
      <label class="demo-label" for="at-phone">Austrian phone (national)</label>
      <input
        id="at-phone"
        cngxInputMask="00 00000000|0000 0000000"
        #atMask="cngxInputMask"
        class="demo-input"
      />
      <span class="demo-hint">e.g. 01 2345678 (Vienna) or 0664 1234567 (mobile) - leading 0, no +43</span>
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Display: {{ atMask.maskedValue() }}</span>
        <span class="status-badge">Raw: {{ atMask.rawValue() }}</span>
      </div>`,
};
