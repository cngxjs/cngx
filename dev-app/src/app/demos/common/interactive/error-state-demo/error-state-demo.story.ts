import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Error State',
  navLabel: 'Error State',
  navCategory: 'interactive',
  description:
    '<code>[cngxErrorState]</code> is a generic host-element marker. Toggles ' +
    '<code>.cngx-error</code> + reactive <code>aria-invalid</code> / ' +
    '<code>aria-errormessage</code> on any DOM element — cngx, Material, CDK, ' +
    'native, or third-party host. Works without an aggregator; pair with ' +
    '<code>cngxErrorScope</code> when you need reveal-on-submit semantics.',
  apiComponents: ['CngxErrorState'],
  moduleImports: ["import { CngxErrorState } from '@cngx/common/interactive';"],
  setup: `
  protected readonly emailInvalid = signal(false);
  protected readonly passwordInvalid = signal(false);
  `,
  sections: [
    {
      title: 'Basic — boolean flag flips aria-invalid',
      subtitle:
        'Toggle the controls below and observe <code>aria-invalid</code> on the input ' +
        'plus the <code>.cngx-error</code> hook.',
      imports: ['CngxErrorState'],
      template: `
  <label>
    <span>Email</span>
    <input
      type="email"
      placeholder="user@example.com"
      [cngxErrorState]="emailInvalid()"
      cngxErrorMessageId="email-error"
    />
  </label>
  <p
    id="email-error"
    role="alert"
    [attr.aria-hidden]="emailInvalid() ? null : 'true'"
    class="error-text"
  >Please enter a valid email address.</p>
  <button type="button" (click)="emailInvalid.set(!emailInvalid())">
    Toggle invalid state
  </button>`,
      css: `
.error-text { color: var(--cngx-error-text, #b00020); margin: 4px 0 12px; font-size: 0.875em; }
.error-text[aria-hidden='true'] { display: none; }
input.cngx-error { border-color: var(--cngx-error-text, #b00020); outline-color: var(--cngx-error-text, #b00020); }
label { display: block; margin-bottom: 4px; }
input { padding: 6px 8px; min-width: 240px; }`,
    },
    {
      title: 'Without message id — class hook only',
      subtitle:
        '<code>cngxErrorMessageId</code> is optional. Skip it when the error message ' +
        'is rendered elsewhere (e.g. summary panel) or when you only need the visual ' +
        'cue.',
      imports: ['CngxErrorState'],
      template: `
  <label>
    <span>Password</span>
    <input
      type="password"
      [cngxErrorState]="passwordInvalid()"
    />
  </label>
  <button type="button" (click)="passwordInvalid.set(!passwordInvalid())">
    Toggle invalid state
  </button>`,
      css: `
input.cngx-error { border-color: var(--cngx-error-text, #b00020); outline-color: var(--cngx-error-text, #b00020); }
label { display: block; margin-bottom: 4px; }
input { padding: 6px 8px; min-width: 240px; }`,
    },
  ],
};
