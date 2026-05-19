import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: '6-Digit OTP',
  subtitle: 'Type digits one at a time — cursor auto-advances. Paste a 6-digit code to fill all at once. Backspace navigates to the previous slot.',
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
  setup: `protected readonly otpResult = signal('');
  protected handleOtpComplete(code: string): void {
    this.otpResult.set(code);
  }`,
  template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Verification Code</label>
      <div cngxOtpInput [length]="6" #otp="cngxOtpInput"
        (completed)="handleOtpComplete($event)"
        style="display:flex;gap:8px">
        @for (i of otp.indices(); track i) {
          <input [cngxOtpSlot]="i" class="demo-input"
            style="width:48px;height:48px;text-align:center;font-size:1.25rem;font-family:var(--font-mono)" />
        }
      </div>
      <div class="status-row">
        <span class="status-badge">Value: {{ otp.value() || '—' }}</span>
        <span class="status-badge">Complete: {{ otp.isComplete() }}</span>
        @if (otpResult()) {
          <span class="status-badge" style="color:var(--success-fg,green)">Verified: {{ otpResult() }}</span>
        }
      </div>
      <button class="chip" (click)="otp.clear()">Clear</button>
    </div>
  </div>`,
};
