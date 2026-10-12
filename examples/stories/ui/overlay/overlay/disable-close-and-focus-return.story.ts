import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxOverlay: Disable close and focus return',
  subtitle:
    '<code>open(Component, { disableClose: true })</code> turns off the Escape and backdrop dismiss: only a programmatic <code>close()</code> ends the overlay. On close, focus returns to the element that was focused when <code>open()</code> ran.',
  description:
    'Open the panel, then press Escape or click the backdrop: the panel stays. Pick a button to close it and watch the readout: focus lands back on the trigger, because the service captures <code>document.activeElement</code> before attaching the panel and the ref focuses it again in <code>close()</code>. Any other <code>OverlayConfig</code> field (position strategy, scroll strategy, panel class) passes through to the CDK overlay.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxOverlay', 'CngxOverlayRef'],
  moduleImports: [
    "import { CngxOverlay, type CngxOverlayRef } from '@cngx/ui/overlay';",
    "import { DraftDecisionPanel, type DraftDecision } from './_draft-decision-panel.component';",
  ],
  viewProviders: ['CngxOverlay'],
  references: [
    {
      label: 'WAI-ARIA APG: Dialog (Modal) pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/',
    },
  ],
  setup: `private readonly overlay = inject(CngxOverlay);
  protected readonly ref = signal<CngxOverlayRef<DraftDecision> | null>(null);

  protected handleOpen(): void {
    this.ref.set(
      this.overlay.open<DraftDecisionPanel, DraftDecision>(DraftDecisionPanel, {
        disableClose: true,
      }),
    );
  }`,
  template: `<button type="button" class="chip" (click)="handleOpen()">Open overlay</button>`,
  setupChrome: `protected readonly focused = signal('-');

  constructor() {
    const doc = (inject(ElementRef).nativeElement as HTMLElement).ownerDocument;
    const handleFocusIn = (event: FocusEvent): void => {
      const el = event.target as HTMLElement;
      this.focused.set(el.textContent?.trim() || el.tagName.toLowerCase());
    };
    doc.addEventListener('focusin', handleFocusIn);
    inject(DestroyRef).onDestroy(() => doc.removeEventListener('focusin', handleFocusIn));
  }`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">isOpen()</span>
      <span class="event-value">{{ ref()?.isOpen() ?? false }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Focused element</span>
      <span class="event-value">{{ focused() }}</span>
    </div>
  </div>`,
};
