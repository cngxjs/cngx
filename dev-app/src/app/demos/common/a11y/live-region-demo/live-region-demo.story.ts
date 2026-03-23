import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'LiveRegion',
  description: 'Configures the host element as an ARIA live region for screen reader announcements.',
  apiComponents: ['CngxLiveRegion'],
  setup: `
  protected message = signal('');
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
  }
  `,
  sections: [
    {
      title: 'CngxLiveRegion — Polite vs Assertive',
      subtitle:
        '<code>[cngxLiveRegion]</code> manages <code>aria-live</code>, <code>aria-atomic</code>, ' +
        'and <code>role</code> on the host element. Screen readers announce content changes — ' +
        '<code>polite</code> queues after the current utterance, <code>assertive</code> interrupts.',
      imports: ['CngxLiveRegion'],
      template: `
  <div class="button-row">
    <button class="sort-btn" (click)="politeness.set('polite')">
      <span class="chip" [class.chip--active]="politeness() === 'polite'">polite</span>
    </button>
    <button class="sort-btn" (click)="politeness.set('assertive')">
      <span class="chip" [class.chip--active]="politeness() === 'assertive'">assertive</span>
    </button>
    <button class="sort-btn" (click)="politeness.set('off')">
      <span class="chip" [class.chip--active]="politeness() === 'off'">off</span>
    </button>
  </div>

  <div class="button-row" style="margin-top: 8px">
    <button class="sort-btn" (click)="announce()">
      Trigger announcement
    </button>
    <button class="sort-btn" (click)="message.set('')">Clear</button>
  </div>

  <div
    cngxLiveRegion
    [politeness]="politeness()"
    style="
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 6px;
      min-height: 40px;
      border: 1px solid var(--cngx-border, #ddd);
      transition: background 0.3s, border-color 0.3s;
    "
    [style.background]="flashActive() ? 'var(--cngx-accent, #f5a623)' : 'var(--cngx-surface-alt, #f8f9fa)'"
    [style.borderColor]="flashActive() ? 'var(--cngx-accent, #f5a623)' : 'var(--cngx-border, #ddd)'"
    [style.color]="flashActive() ? '#000' : 'inherit'"
  >
    {{ message() || 'Waiting for announcement…' }}
  </div>

  <div class="event-grid" style="margin-top: 10px">
    <div class="event-row">
      <span class="event-label">aria-live</span>
      <span class="event-value">{{ politeness() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">role</span>
      <span class="event-value">{{ politeness() === 'assertive' ? 'alert' : 'status' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">aria-atomic</span>
      <span class="event-value">true</span>
    </div>
  </div>`,
    },
    {
      title: 'Form Validation — Assertive Error Announcements',
      subtitle:
        '<code>[cngxLiveRegion]</code> with <code>assertive</code> politeness on a ' +
        'validation error message. Screen readers interrupt to announce the error immediately ' +
        'when the message content changes.',
      imports: ['CngxLiveRegion'],
      template: `
  <div style="display: flex; flex-direction: column; gap: 6px; max-width: 360px;">
    <label style="font-size: 0.875rem; font-weight: 500;">Email address</label>
    <input
      type="text"
      placeholder="user@example.com"
      [value]="email()"
      (input)="email.set($any($event.target).value)"
      [style.borderColor]="emailError() ? '#e53e3e' : 'var(--cngx-border, #ddd)'"
      style="padding: 8px 12px; border-radius: 6px; border: 1px solid var(--cngx-border, #ddd); font-size: 0.875rem;"
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
    },
  ],
};
