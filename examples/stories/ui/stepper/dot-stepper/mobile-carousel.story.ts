import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDotStepper: mobile carousel',
  subtitle: 'Five dots, one per step. Arrow keys navigate when <code>[linear]</code> is off. Active dot carries <code>aria-current="step"</code> per the W3C APG step-indicator pattern (not <code>role="tab"</code>).',
  description: 'Mobile-first sequential indicator. The active dot scales up; completed dots fill with the success cue; upcoming dots use the surface tint. Keyboard arrow keys route through the presenter.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG - Step indicator pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/' },
  ],
  apiComponents: ['CngxDotStepper', 'CngxStep'],
  moduleImports: [
    'import { CngxStep } from \'@cngx/common/stepper\';',
    'import { CngxDotStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxDotStepper', 'CngxStep'],
  setup: `protected readonly active = signal(0);
  protected readonly slides = [
    { title: 'Welcome', body: 'Swipe to learn what is new.' },
    { title: 'Customise', body: 'Tune the dashboard layout to your routine.' },
    { title: 'Invite', body: 'Bring teammates into the workspace.' },
    { title: 'Connect', body: 'Plug in the integrations you already use.' },
    { title: 'Ready', body: 'You are all set.' },
  ];`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 4));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <article style="display:grid;gap:12px">
    <cngx-dot-stepper
      [(activeStepIndex)]="active"
      aria-label="Carousel slides"
    >
      <div cngxStep label="Slide 1"></div>
      <div cngxStep label="Slide 2"></div>
      <div cngxStep label="Slide 3"></div>
      <div cngxStep label="Slide 4"></div>
      <div cngxStep label="Slide 5"></div>
    </cngx-dot-stepper>
    @let slide = slides[active()];
    <section aria-live="polite" style="display:grid;gap:4px;min-height:64px">
      <h4 style="margin:0">{{ slide.title }}</h4>
      <p style="margin:0">{{ slide.body }}</p>
    </section>
  </article>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active dot</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
