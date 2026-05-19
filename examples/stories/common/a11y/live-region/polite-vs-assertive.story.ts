import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLiveRegion — Polite vs Assertive',
  subtitle: '<code>[cngxLiveRegion]</code> manages <code>aria-live</code>, <code>aria-atomic</code>, and <code>role</code> on the host element. Screen readers announce content changes — <code>polite</code> queues after the current utterance, <code>assertive</code> interrupts.',
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
  protected announce(): void {
    this.counter.update(n => n + 1);
    this.message.set('Action completed — count: ' + this.counter());
    this.flashActive.set(true);
    setTimeout(() => this.flashActive.set(false), 600);
  }`,
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
      border: 1px solid var(--cngx-color-border, #ddd);
      transition: background 0.3s, border-color 0.3s;
    "
    [style.background]="flashActive() ? 'var(--cngx-accent, #f5a623)' : 'var(--cngx-surface-alt, #f8f9fa)'"
    [style.borderColor]="flashActive() ? 'var(--cngx-accent, #f5a623)' : 'var(--cngx-color-border, #ddd)'"
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
};
