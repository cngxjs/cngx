import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxOtpInput: 6 digit otp',
  subtitle: 'Type digits one at a time - cursor auto-advances. Paste a 6-digit code to fill all at once. Backspace navigates to the previous slot.',
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
  setup: `protected readonly otpResult = signal('');
  protected handleOtpComplete(code: string): void {
    this.otpResult.set(code);
  }`,
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Verification Code</label>
      <div cngxOtpInput [length]="6" #otp="cngxOtpInput"
        (completed)="handleOtpComplete($event)"
        style="display:flex;gap:8px">
        @for (i of otp.indices(); track i) {
          <input [cngxOtpSlot]="i" class="demo-input demo-otp-slot" />
        }
      </div>
      
      <button type="button" class="chip" (click)="otp.clear()">Clear</button>
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Value: {{ otp.value() || '—' }}</span>
        <span class="status-badge">Complete: {{ otp.isComplete() }}</span>
        @if (otpResult()) {
          <span class="status-badge demo-success-text">Verified: {{ otpResult() }}</span>
        }
      </div>`,
};
