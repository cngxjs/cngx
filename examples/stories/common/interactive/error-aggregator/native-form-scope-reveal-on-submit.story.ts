import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Native form + scope reveal-on-submit',
  subtitle: 'A <code>&lt;form cngxErrorScope&gt;</code> wraps a fieldset aggregator. Errors stay hidden until <code>(submit)</code> fires <code>scope.reveal()</code>; the resolved <code>shouldShow()</code> then unblocks the visible error list. The state readout below always reflects every signal — observe how <code>hasError</code> stays <code>true</code> from page load while <code>shouldShow</code> only flips after submit.',
  description: '<code>cngxErrorAggregator</code> rolls up child <code>cngxErrorSource</code> directives into one live A11y surface. Derived signals (<code>hasError</code>, <code>errorCount</code>, <code>activeErrors</code>, <code>errorLabels</code>, <code>shouldShow</code>, <code>announcement</code>) all carry structural <code>equal</code> fns so unrelated re-emissions do not cascade. The directive is template-free — render the SR live region yourself. Each section below shows the reactive state at the top so the consumer sees every signal toggle live.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern', 'error-handling'],
  apiComponents: [
    'CngxErrorAggregator',
    'CngxErrorScope',
    'CngxErrorSource',
  ],
  moduleImports: [
    'import { CngxErrorAggregator, CngxErrorScope, CngxErrorSource } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxErrorScope', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly emailFormatBad = signal(true);
  protected readonly emailTaken = signal(false);
  protected readonly passwordWeak = signal(true);`,
  template: `
  <form
    cngxErrorScope
    cngxErrorScopeName="signup"
    #scope="cngxErrorScope"
    (submit)="$event.preventDefault(); scope.reveal()"
    [style.border]="signup.shouldShow() ? '1px solid #b00020' : '1px solid #d1d5db'"
    style="padding: 12px 16px; border-radius: 6px;"
  >
    <fieldset cngxErrorAggregator #signup="cngxErrorAggregator" style="border: none; padding: 0; margin: 0;">
      <legend style="font-weight: 600;">Sign up</legend>
      <span cngxErrorSource="email-format" [when]="emailFormatBad()" label="Email format invalid"></span>
      <span cngxErrorSource="email-taken" [when]="emailTaken()" label="Email already in use"></span>
      <span cngxErrorSource="password-weak" [when]="passwordWeak()" label="Password too weak"></span>

      <pre style="margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 0.85em;">hasError    : {{ signup.hasError() }}
errorCount  : {{ signup.errorCount() }}
shouldShow  : {{ signup.shouldShow() }}
announcement: "{{ signup.announcement() }}"</pre>

      <label style="display: block; margin: 6px 0;">
        <span>Email </span>
        <input type="email" style="padding: 6px 8px; min-width: 240px;" />
      </label>
      <label style="display: block; margin: 6px 0;">
        <span>Password </span>
        <input type="password" style="padding: 6px 8px; min-width: 240px;" />
      </label>

      @if (signup.shouldShow()) {
        <ul role="list" style="color: #b00020; margin: 8px 0 0; padding-inline-start: 24px;">
          @for (label of signup.errorLabels(); track label) {
            <li>{{ label }}</li>
          }
        </ul>
      }

      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button type="submit">Submit</button>
        <button type="button" (click)="scope.reset()">Reset</button>
        <button type="button" (click)="emailFormatBad.set(!emailFormatBad())">Toggle email-format</button>
        <button type="button" (click)="emailTaken.set(!emailTaken())">Toggle email-taken</button>
        <button type="button" (click)="passwordWeak.set(!passwordWeak())">Toggle password-weak</button>
      </div>
    </fieldset>
  </form>`,
};
