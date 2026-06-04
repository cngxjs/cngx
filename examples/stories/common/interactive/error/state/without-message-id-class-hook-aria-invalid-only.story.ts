import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxErrorState: No message id, class hook plus aria-invalid only',
  subtitle:
    '<code>cngxErrorMessageId</code> is optional. Skip it when the error message is rendered elsewhere (e.g. a summary panel) or when only the visual cue is needed. <code>aria-invalid</code> still flips between <code>"false"</code> and <code>"true"</code>; <code>aria-errormessage</code> simply never appears in the DOM.',
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
      label: 'WCAG 2.1 SC 3.3.1 Error Identification',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html',
    },
  ],
  setup: `protected readonly passwordInvalid = signal(false);`,
  template: `
  <label style="display: block; margin-bottom: 6px; font-weight: 600;">
    <span>Password</span>
    <input
      #passwordInput
      id="cngx-error-state-noid-input"
      name="password"
      type="password"
      autocomplete="new-password"
      class="demo-error-input"
      [cngxErrorState]="passwordInvalid()"
    />
  </label>`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row"><span class="event-label">aria-invalid</span><span class="event-value">"{{ passwordInput.getAttribute('aria-invalid') }}"</span></div>
    <div class="event-row"><span class="event-label">aria-errormessage</span><span class="event-value">{{ passwordInput.getAttribute('aria-errormessage') ?? 'null (no id bound)' }}</span></div>
    <div class="event-row"><span class="event-label">class.cngx-error</span><span class="event-value">{{ passwordInput.classList.contains('cngx-error') }}</span></div>
  </div>
  <div class="button-row" style="margin-top: 12px;">
    <button type="button" (click)="passwordInvalid.set(!passwordInvalid())">
      Toggle invalid state
    </button>
  </div>`,
};
