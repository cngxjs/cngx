import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLiveRegion: Polite vs assertive',
  subtitle:
    '<code>[cngxLiveRegion]</code> manages <code>aria-live</code>, <code>aria-atomic</code>, and <code>role</code> on the host. Screen readers announce content changes; <code>polite</code> queues after the current utterance, <code>assertive</code> interrupts.',
  description:
    'Toggles between the three politeness modes on the same live region and shows the resulting ARIA attribute set on the right. Each "Trigger announcement" click rewrites the host\'s text content; the directive ensures the screen reader picks up the change with the chosen urgency. The visible flash exists only as confirmation for sighted readers that the announcement fired.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxLiveRegion'],
  imports: ['CngxLiveRegion'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-live',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live',
    },
    {
      label: 'WCAG 2.1 SC 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html',
    },
  ],
  setup: `protected readonly message = signal('');
  protected readonly politeness = signal<'polite' | 'assertive' | 'off'>('polite');`,
  setupChrome: `protected readonly flashActive = signal(false);
  protected readonly counter = signal(0);
  protected announce(): void {
    this.counter.update((n) => n + 1);
    this.message.set('Action completed, count: ' + this.counter());
    this.flashActive.set(true);
    setTimeout(() => this.flashActive.set(false), 600);
  }`,
  template: `  <div cngxLiveRegion
       [politeness]="politeness()"
       class="cngx-ex-live-region"
       [class.cngx-ex-live-region--flash]="flashActive()">
    {{ message() || 'Waiting for announcement…' }}
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" [attr.aria-pressed]="politeness() === 'polite'" (click)="politeness.set('polite')">polite</button>
    <button type="button" class="chip" [attr.aria-pressed]="politeness() === 'assertive'" (click)="politeness.set('assertive')">assertive</button>
    <button type="button" class="chip" [attr.aria-pressed]="politeness() === 'off'" (click)="politeness.set('off')">off</button>
  </div>
  <div class="button-row" style="margin-top:8px">
    <button type="button" class="chip" (click)="announce()">Trigger announcement</button>
    <button type="button" class="chip" (click)="message.set('')">Clear</button>
  </div>
  <div class="event-grid" style="margin-top:10px">
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
