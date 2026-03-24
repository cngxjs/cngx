import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'OTP Input',
  navLabel: 'OTP',
  navCategory: 'input',
  description:
    'One-time password / PIN input with auto-advance, paste distribution, and keyboard navigation.',
  apiComponents: ['CngxOtpInput', 'CngxOtpSlot'],
  overview:
    '<p><code>CngxOtpInput</code> is a container directive. The consumer provides <code>&lt;input [cngxOtpSlot]="i"&gt;</code> ' +
    'elements inside. Auto-advance on input, backspace to go back, arrow keys to navigate, paste to fill all slots.</p>' +
    '<p>Emits <code>completed</code> when all slots are filled. First slot gets <code>autocomplete="one-time-code"</code>.</p>',
  moduleImports: [
    "import { CngxOtpInput, CngxOtpSlot } from '@cngx/forms/input';",
  ],
  setup: `
  protected readonly otpResult = signal('');
  protected handleOtpComplete(code: string): void {
    this.otpResult.set(code);
  }
  `,
  sections: [
    {
      title: '6-Digit OTP',
      subtitle:
        'Type digits one at a time — cursor auto-advances. Paste a 6-digit code to fill all at once. ' +
        'Backspace navigates to the previous slot.',
      imports: ['CngxOtpInput', 'CngxOtpSlot'],
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
    },
    {
      title: '4-Digit PIN',
      subtitle:
        'Shorter PIN input with password masking via <code>[inputType]="\'password\'"</code>.',
      imports: ['CngxOtpInput', 'CngxOtpSlot'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">PIN</label>
      <div cngxOtpInput [length]="4" inputType="password" #pin="cngxOtpInput"
        style="display:flex;gap:8px">
        @for (i of pin.indices(); track i) {
          <input [cngxOtpSlot]="i" class="demo-input"
            style="width:48px;height:48px;text-align:center;font-size:1.5rem" />
        }
      </div>
      <div class="status-row">
        <span class="status-badge">Complete: {{ pin.isComplete() }}</span>
      </div>
    </div>
  </div>`,
    },
  ],
};
