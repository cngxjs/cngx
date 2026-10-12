import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxOverlayRef: Close with a result',
  subtitle:
    '<code>CngxOverlay.open(Component)</code> attaches the component in a centered, backdropped CDK overlay and returns a typed <code>CngxOverlayRef&lt;R&gt;</code>. The opened component injects the same ref and calls <code>close(result)</code>; <code>afterClosed$</code> emits that result once and completes, <code>isOpen()</code> is the signal view of the lifecycle.',
  description:
    'Open the panel and pick a button: the readout shows the typed result. Escape or a click on the backdrop also close it, with <code>undefined</code> as the result. <code>CngxOverlay</code> is not provided in root: an app adds <code>provideOverlay()</code> to its <code>bootstrapApplication</code> providers, a feature can list <code>CngxOverlay</code> in its component providers as this example does. Panels still open when the providing scope is destroyed are closed with it.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxOverlay', 'CngxOverlayRef'],
  moduleImports: [
    "import { CngxOverlay, type CngxOverlayRef } from '@cngx/ui/overlay';",
    "import { DraftDecisionPanel, type DraftDecision } from './_draft-decision-panel.component';",
  ],
  viewProviders: ['CngxOverlay'],
  setup: `private readonly overlay = inject(CngxOverlay);
  protected readonly ref = signal<CngxOverlayRef<DraftDecision> | null>(null);
  protected readonly result = signal<DraftDecision | undefined>(undefined);

  protected handleOpen(): void {
    const ref = this.overlay.open<DraftDecisionPanel, DraftDecision>(DraftDecisionPanel);
    this.ref.set(ref);
    ref.afterClosed$.subscribe((result) => this.result.set(result));
  }`,
  template: `<button type="button" class="chip" (click)="handleOpen()">Open overlay</button>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">isOpen()</span>
      <span class="event-value">{{ ref()?.isOpen() ?? false }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">afterClosed$ result</span>
      <span class="event-value">{{ ref() && !ref()?.isOpen() ? (result() ?? 'undefined') : '-' }}</span>
    </div>
  </div>`,
};
