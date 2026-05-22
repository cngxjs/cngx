import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Without message id — class hook + aria-invalid only',
  subtitle: '<code>cngxErrorMessageId</code> is optional. Skip it when the error message is rendered elsewhere (e.g. a summary panel) or when only the visual cue is needed. <code>aria-invalid</code> still flips between <code>"false"</code> and <code>"true"</code>; <code>aria-errormessage</code> simply never appears.',
  description: '<code>[cngxErrorState]</code> is a generic host-element marker. Toggles <code>.cngx-error</code> + reactive <code>aria-invalid</code> + <code>aria-errormessage</code> on any DOM element — cngx, Material, CDK, native, or third-party host. Works without an aggregator; pair with <code>cngxErrorScope</code> when you need reveal-on-submit semantics. Both ARIA attributes stay in the DOM with explicit values per cngx convention; visibility of the linked message is the consumer\'s <code>aria-hidden</code> to wire.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['error-handling'],
  apiComponents: [
    'CngxErrorState',
  ],
  moduleImports: [
    'import { CngxErrorState } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxErrorState'],
  setup: `protected readonly passwordInvalid = signal(false);`,
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
};
