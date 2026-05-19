import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Form Validation — Assertive Error Announcements',
  subtitle: '<code>[cngxLiveRegion]</code> with <code>assertive</code> politeness on a validation error message. Screen readers interrupt to announce the error immediately when the message content changes.',
  description: 'Configures the host element as an ARIA live region for screen reader announcements.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern'],
  apiComponents: [
    'CngxLiveRegion',
  ],
  imports: ['CngxLiveRegion'],
  setup: `protected message = signal('');
  protected politeness = signal<'polite' | 'assertive' | 'off'>('polite');
  protected counter = signal(0);
  protected flashActive = signal(false);
  protected email = signal('');
  protected emailError = computed(() => {
    const v = this.email();
    if (!v) return '';
    if (!v.includes('@')) return 'Missing @ symbol';
    if (!v.includes('.')) return 'Missing domain (e.g. .com)';
    return '';
  });
  protected announce(): void {
    this.counter.update(n => n + 1);
    this.message.set('Action completed — count: ' + this.counter());
    this.flashActive.set(true);
    setTimeout(() => this.flashActive.set(false), 600);
  }`,
  template: `
  <div style="display: flex; flex-direction: column; gap: 6px; max-width: 360px;">
    <label style="font-size: 0.875rem; font-weight: 500;">Email address</label>
    <input
      type="text"
      placeholder="user@example.com"
      [value]="email()"
      (input)="email.set($any($event.target).value)"
      [style.borderColor]="emailError() ? '#e53e3e' : 'var(--cngx-color-border, #ddd)'"
      style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--cngx-color-border, #ddd); font-size: 0.875rem;"
      aria-describedby="email-error"
    />
    <div
      id="email-error"
      cngxLiveRegion
      [politeness]="'assertive'"
      style="min-height: 1.25rem; font-size: 0.8125rem;"
      [style.color]="emailError() ? '#e53e3e' : 'transparent'"
    >
      {{ emailError() }}
    </div>
  </div>

  <p style="margin-top: 12px; font-size: 0.75rem; color: var(--cngx-text-secondary, #999);">
    Type an invalid email to see the error. A screen reader would announce the error
    message immediately due to <code>aria-live="assertive"</code> and <code>role="alert"</code>.
  </p>`,
};
