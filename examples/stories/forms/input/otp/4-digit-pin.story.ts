import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: '4-Digit PIN',
  subtitle: 'Shorter PIN input with password masking via <code>[inputType]="\'password\'"</code>.',
  description: 'One-time password / PIN input with auto-advance, paste distribution, and keyboard navigation.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxOtpInput',
    'CngxOtpSlot',
  ],
  moduleImports: [
    'import { CngxOtpInput, CngxOtpSlot } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxOtpInput', 'CngxOtpSlot'],
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">PIN</label>
      <div cngxOtpInput [length]="4" inputType="password" #pin="cngxOtpInput"
        style="display:flex;gap:8px">
        @for (i of pin.indices(); track i) {
          <input [cngxOtpSlot]="i" class="demo-input"
            style="width:48px;height:48px;text-align:center;font-size:1.5rem" />
        }
      </div>
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Complete: {{ pin.isComplete() }}</span>
      </div>`,
};
