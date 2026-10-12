import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLiveAnnouncer: Polite vs assertive',
  subtitle:
    '<code>inject(CngxLiveAnnouncer).announce(message, politeness)</code> writes the message into one of two visually hidden <code>aria-live</code> regions the root service appends to <code>document.body</code>. <code>polite</code> (the default) queues after the current utterance, <code>assertive</code> interrupts it.',
  description:
    'A screen reader speaks each message; nothing appears on screen. The readout below mirrors the two hidden regions for sighted readers. Each region is created on the first announcement of its politeness and reused after that, so a polite and an assertive message never overwrite each other. The region is cleared and the text written one frame later, which is why sending the same message twice is still read twice.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxLiveAnnouncer'],
  moduleImports: [
    "import { CngxLiveAnnouncer, type AriaLivePoliteness } from '@cngx/common/a11y';",
  ],
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
  setup: `private readonly announcer = inject(CngxLiveAnnouncer);
  protected readonly message = signal('Draft saved');

  protected handleAnnounce(politeness: AriaLivePoliteness): void {
    this.announcer.announce(this.message(), politeness);
  }`,
  template: `<div class="cngx-ex-stack-form">
    <label for="live-announcer-message">Message</label>
    <input
      id="live-announcer-message"
      type="text"
      [value]="message()"
      (input)="message.set($any($event.target).value)"
    />
    <div class="demo-inline-actions">
      <button type="button" class="chip" (click)="handleAnnounce('polite')">Announce polite</button>
      <button type="button" class="chip" (click)="handleAnnounce('assertive')">Announce assertive</button>
    </div>
  </div>`,
  setupChrome: `protected readonly regionText = signal<Record<AriaLivePoliteness, string>>({ polite: '', assertive: '' });
  protected readonly sent = signal<readonly { id: number; politeness: AriaLivePoliteness; text: string }[]>([]);
  private sentCount = 0;

  constructor() {
    const doc = (inject(ElementRef).nativeElement as HTMLElement).ownerDocument;
    const observer = new MutationObserver(() => this.readRegions(doc));
    observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  private readRegions(doc: Document): void {
    for (const politeness of ['polite', 'assertive'] as const) {
      const region = doc.body.querySelector(':scope > span.cngx-sr-only[aria-live="' + politeness + '"]');
      const text = region?.textContent ?? '';
      if (text === this.regionText()[politeness]) {
        continue;
      }
      this.regionText.update((current) => ({ ...current, [politeness]: text }));
      if (text) {
        this.sentCount += 1;
        const entry = { id: this.sentCount, politeness, text };
        this.sent.update((list) => [entry, ...list].slice(0, 5));
      }
    }
  }`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">aria-live="polite" region</span>
      <span class="event-value">{{ regionText().polite || '(empty)' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">aria-live="assertive" region</span>
      <span class="event-value">{{ regionText().assertive || '(empty)' }}</span>
    </div>
    @for (entry of sent(); track entry.id) {
      <div class="event-row">
        <span class="event-label">#{{ entry.id }} {{ entry.politeness }}</span>
        <span class="event-value">{{ entry.text }}</span>
      </div>
    }
  </div>`,
};
