import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorAggregator: Native form, scope reveal-on-submit',
  subtitle:
    'A <code>&lt;form cngxErrorScope&gt;</code> wraps a fieldset aggregator. Errors stay hidden until <code>(submit)</code> fires <code>scope.reveal()</code>; the resolved <code>shouldShow()</code> then unblocks the visible error list. <code>hasError</code> stays <code>true</code> from page load while <code>shouldShow</code> only flips after submit.',
  description:
    '<code>cngxErrorAggregator</code> rolls up child <code>cngxErrorSource</code> directives into one live A11y surface. Derived signals (<code>hasError</code>, <code>errorCount</code>, <code>activeErrors</code>, <code>errorLabels</code>, <code>shouldShow</code>, <code>announcement</code>) carry structural <code>equal</code> fns so unrelated re-emissions do not cascade. The directive is template-free; render the SR live region yourself.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'error-handling'],
  apiComponents: ['CngxErrorAggregator', 'CngxErrorScope', 'CngxErrorSource'],
  moduleImports: [
    "import { CngxErrorAggregator, CngxErrorScope, CngxErrorSource } from '@cngx/common/interactive';",
  ],
  imports: ['CngxErrorScope', 'CngxErrorAggregator', 'CngxErrorSource'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-invalid',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-invalid',
    },
    {
      label: 'WAI-ARIA 1.2: aria-live',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live',
    },
    {
      label: 'WCAG 2.1 SC 3.3.1 Error Identification',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html',
    },
  ],
  setup: `protected readonly emailFormatBad = signal(true);
  protected readonly emailTaken = signal(false);
  protected readonly passwordWeak = signal(true);`,
  template: `
  <form
    cngxErrorScope
    cngxErrorScopeName="signup"
    #scope="cngxErrorScope"
    (submit)="$event.preventDefault(); scope.reveal()"
    class="demo-error-surface"
    [class.cngx-error]="signup.shouldShow()"
  >
    <fieldset cngxErrorAggregator #signup="cngxErrorAggregator" style="border: none; padding: 0; margin: 0;">
      <legend style="font-weight: 600;">Sign up</legend>
      <span cngxErrorSource="email-format" [when]="emailFormatBad()" label="Email format invalid"></span>
      <span cngxErrorSource="email-taken" [when]="emailTaken()" label="Email already in use"></span>
      <span cngxErrorSource="password-weak" [when]="passwordWeak()" label="Password too weak"></span>

      <label style="display: block; margin: 6px 0;">
        <span>Email </span>
        <input id="cngx-error-signup-email" name="email" type="email" autocomplete="email" class="demo-error-input" />
      </label>
      <label style="display: block; margin: 6px 0;">
        <span>Password </span>
        <input id="cngx-error-signup-password" name="password" type="password" autocomplete="new-password" class="demo-error-input" />
      </label>

      @if (signup.shouldShow()) {
        <ul role="alert" class="demo-error-list">
          @for (label of signup.errorLabels(); track label) {
            <li>{{ label }}</li>
          }
        </ul>
      }

      <div class="button-row" style="margin-top: 12px;">
        <button type="submit">Submit</button>
        <button type="button" (click)="scope.reset()">Reset</button>
      </div>
    </fieldset>
  </form>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row"><span class="event-label">hasError()</span><span class="event-value">{{ signup.hasError() }}</span></div>
    <div class="event-row"><span class="event-label">errorCount()</span><span class="event-value">{{ signup.errorCount() }}</span></div>
    <div class="event-row"><span class="event-label">shouldShow()</span><span class="event-value">{{ signup.shouldShow() }}</span></div>
    <div class="event-row"><span class="event-label">announcement()</span><span class="event-value">{{ signup.announcement() || '-' }}</span></div>
  </div>
  <div class="button-row" style="margin-top: 12px;">
    <button type="button" (click)="emailFormatBad.set(!emailFormatBad())">Toggle email-format</button>
    <button type="button" (click)="emailTaken.set(!emailTaken())">Toggle email-taken</button>
    <button type="button" (click)="passwordWeak.set(!passwordWeak())">Toggle password-weak</button>
  </div>`,
};
