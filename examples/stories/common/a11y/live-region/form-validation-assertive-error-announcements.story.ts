import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLiveRegion: Form validation assertive error announcements',
  subtitle:
    '<code>[cngxLiveRegion]</code> with <code>politeness="assertive"</code> on a validation error message. The directive paints <code>aria-live="assertive"</code> and <code>role="alert"</code> on the host so screen readers interrupt to announce the error the moment the message changes.',
  description:
    'Realistic form-validation pattern: a single input with a computed error signal that drives an assertive live region next to it. <code>aria-describedby</code> points the input at the error region by id, so the same message is announced via the live region and exposed to AT as the field\'s description. Type an invalid email to see the message paint and hear it announced.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'integration'],
  apiComponents: ['CngxLiveRegion'],
  imports: ['CngxLiveRegion'],
  references: [
    {
      label: 'WAI-ARIA APG: Alert pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/',
    },
    {
      label: 'WCAG 2.1 SC 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html',
    },
    {
      label: 'WAI-ARIA 1.2: aria-live',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live',
    },
  ],
  setup: `protected readonly email = signal('');
  protected readonly emailError = computed(() => {
    const v = this.email();
    if (!v) {
      return '';
    }
    if (!v.includes('@')) {
      return 'Missing @ symbol';
    }
    if (!v.includes('.')) {
      return 'Missing domain (e.g. .com)';
    }
    return '';
  });`,
  template: `  <div style="display:flex;flex-direction:column;gap:6px;max-width:360px">
    <label for="cngx-live-region-email" style="font-size:0.875rem">Email address</label>
    <input id="cngx-live-region-email"
           type="email"
           placeholder="user@example.com"
           [value]="email()"
           (input)="email.set($any($event.target).value)"
           [attr.aria-invalid]="!!emailError() || null"
           aria-describedby="cngx-live-region-email-error" />
    <div id="cngx-live-region-email-error"
         cngxLiveRegion
         politeness="assertive"
         class="cngx-ex-form-error">
      {{ emailError() }}
    </div>
  </div>`,
};
