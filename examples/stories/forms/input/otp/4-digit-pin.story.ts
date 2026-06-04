import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxOtpInput: 4 digit pin',
  subtitle: 'Shorter PIN input with password masking via <code>[inputType]="\'password\'"</code>.',
  description: 'One-time password / PIN input with auto-advance, paste distribution, and keyboard navigation.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
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
          <input [cngxOtpSlot]="i" class="demo-input demo-otp-slot demo-otp-slot--lg" />
        }
      </div>
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Complete: {{ pin.isComplete() }}</span>
      </div>`,
};
