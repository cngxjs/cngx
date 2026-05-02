import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Error State',
  navLabel: 'Error State',
  navCategory: 'interactive',
  description:
    '<code>[cngxErrorState]</code> is a generic host-element marker. Toggles ' +
    '<code>.cngx-error</code> + reactive <code>aria-invalid</code> + ' +
    '<code>aria-errormessage</code> on any DOM element — cngx, Material, CDK, ' +
    'native, or third-party host. Works without an aggregator; pair with ' +
    '<code>cngxErrorScope</code> when you need reveal-on-submit semantics. ' +
    'Both ARIA attributes stay in the DOM with explicit values per cngx ' +
    'convention; visibility of the linked message is the consumer\'s ' +
    '<code>aria-hidden</code> to wire.',
  apiComponents: ['CngxErrorState'],
  moduleImports: ["import { CngxErrorState } from '@cngx/common/interactive';"],
  setup: `
  protected readonly emailInvalid = signal(false);
  protected readonly passwordInvalid = signal(false);
  `,
  sections: [
    {
      title: 'Basic — boolean flag flips aria-invalid + aria-errormessage',
      subtitle:
        'Toggle the button to flip the boolean. Watch the input border + the ' +
        '<code>aria-invalid</code> attribute switch between <code>"false"</code> and ' +
        '<code>"true"</code> on every render. The <code>aria-errormessage</code> ID ' +
        'stays in the DOM regardless — the message element\'s own <code>aria-hidden</code> ' +
        'gates whether the text is announced.',
      imports: ['CngxErrorState'],
      template: `
  <label style="display: block; margin-bottom: 6px; font-weight: 600;">
    <span>Email</span>
    <input
      #emailInput
      type="email"
      placeholder="user@example.com"
      [cngxErrorState]="emailInvalid()"
      cngxErrorMessageId="email-error"
      [style.border]="emailInvalid() ? '1px solid #b00020' : '1px solid #d1d5db'"
      [style.outline-color]="emailInvalid() ? '#b00020' : 'transparent'"
      style="padding: 6px 8px; min-width: 240px; border-radius: 4px; display: block; margin-top: 4px;"
    />
  </label>
  <p
    id="email-error"
    role="alert"
    [attr.aria-hidden]="emailInvalid() ? null : 'true'"
    [style.display]="emailInvalid() ? 'block' : 'none'"
    style="color: #b00020; margin: 4px 0 12px; font-size: 0.875em;"
  >Please enter a valid email address.</p>

  <pre style="margin: 0 0 12px; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 0.85em;">aria-invalid      : "{{ emailInput.getAttribute('aria-invalid') }}"
aria-errormessage : "{{ emailInput.getAttribute('aria-errormessage') }}"
class.cngx-error  : {{ emailInput.classList.contains('cngx-error') }}</pre>

  <button type="button" (click)="emailInvalid.set(!emailInvalid())">
    Toggle invalid state
  </button>`,
    },
    {
      title: 'Without message id — class hook + aria-invalid only',
      subtitle:
        '<code>cngxErrorMessageId</code> is optional. Skip it when the error message ' +
        'is rendered elsewhere (e.g. a summary panel) or when only the visual cue is ' +
        'needed. <code>aria-invalid</code> still flips between <code>"false"</code> and ' +
        '<code>"true"</code>; <code>aria-errormessage</code> simply never appears.',
      imports: ['CngxErrorState'],
      template: `
  <label style="display: block; margin-bottom: 6px; font-weight: 600;">
    <span>Password</span>
    <input
      #passwordInput
      type="password"
      [cngxErrorState]="passwordInvalid()"
      [style.border]="passwordInvalid() ? '1px solid #b00020' : '1px solid #d1d5db'"
      [style.outline-color]="passwordInvalid() ? '#b00020' : 'transparent'"
      style="padding: 6px 8px; min-width: 240px; border-radius: 4px; display: block; margin-top: 4px;"
    />
  </label>

  <pre style="margin: 8px 0 12px; padding: 8px; background: #f3f4f6; border-radius: 4px; font-size: 0.85em;">aria-invalid      : "{{ passwordInput.getAttribute('aria-invalid') }}"
aria-errormessage : {{ passwordInput.getAttribute('aria-errormessage') ?? 'null (no id bound)' }}
class.cngx-error  : {{ passwordInput.classList.contains('cngx-error') }}</pre>

  <button type="button" (click)="passwordInvalid.set(!passwordInvalid())">
    Toggle invalid state
  </button>`,
    },
  ],
};
