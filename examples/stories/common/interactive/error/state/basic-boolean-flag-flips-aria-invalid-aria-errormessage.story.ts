import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorState: Boolean flag flips aria-invalid and aria-errormessage',
  subtitle:
    'Toggle the button to flip the boolean. The input border, the <code>aria-invalid</code> attribute, and the <code>aria-errormessage</code> id all read directly from the directive host bindings. Both ARIA attributes stay in the DOM with explicit values; the message element\'s own <code>aria-hidden</code> gates whether the text is announced.',
  description:
    '<code>[cngxErrorState]</code> is a generic host-element marker. Toggles <code>.cngx-error</code> + reactive <code>aria-invalid</code> + <code>aria-errormessage</code> on any DOM element (cngx, Material, CDK, native, third-party). Works without an aggregator; pair with <code>cngxErrorScope</code> when reveal-on-submit semantics are needed. Both ARIA attributes stay in the DOM with explicit values per cngx convention; visibility of the linked message is the consumer\'s <code>aria-hidden</code> to wire.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['error-handling', 'a11y-pattern'],
  apiComponents: ['CngxErrorState'],
  moduleImports: ["import { CngxErrorState } from '@cngx/common/interactive';"],
  imports: ['CngxErrorState'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-invalid',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-invalid',
    },
    {
      label: 'WAI-ARIA 1.2: aria-errormessage',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-errormessage',
    },
    {
      label: 'WCAG 2.1 SC 3.3.1 Error Identification',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html',
    },
  ],
  setup: `protected readonly emailInvalid = signal(false);`,
  template: `
  <label style="display: block; margin-bottom: 6px; font-weight: 600;">
    <span>Email</span>
    <input
      #emailInput
      id="cngx-error-state-basic-input"
      name="email"
      type="email"
      autocomplete="email"
      class="demo-error-input"
      [cngxErrorState]="emailInvalid()"
      cngxErrorMessageId="cngx-error-state-basic-email"
    />
  </label>
  <p
    id="cngx-error-state-basic-email"
    role="alert"
    class="demo-error-message"
    [attr.aria-hidden]="emailInvalid() ? null : 'true'"
    [style.display]="emailInvalid() ? 'block' : 'none'"
  >Please enter a valid email address.</p>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row"><span class="event-label">aria-invalid</span><span class="event-value">"{{ emailInput.getAttribute('aria-invalid') }}"</span></div>
    <div class="event-row"><span class="event-label">aria-errormessage</span><span class="event-value">"{{ emailInput.getAttribute('aria-errormessage') }}"</span></div>
    <div class="event-row"><span class="event-label">class.cngx-error</span><span class="event-value">{{ emailInput.classList.contains('cngx-error') }}</span></div>
  </div>
  <div class="button-row" style="margin-top: 12px;">
    <button type="button" (click)="emailInvalid.set(!emailInvalid())">
      Toggle invalid state
    </button>
  </div>`,
};
