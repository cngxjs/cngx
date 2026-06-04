import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: mobile swipe navigation',
  subtitle:
    'Horizontal swipe advances and retreats the active step while the stepper is in mobile-collapse mode. The composition is built-in via <code>[mobileSwipe]</code> (default <code>true</code>); app-wide consumers reach the same default through <code>provideStepperConfig(withStepperMobileSwipe(false))</code>. This demo forces the dot-collapse on every viewport via <code>withStepperMobileBreakpoint(\'(min-width: 0px)\')</code> so the panel-region swipe is visible without resizing.',
  description:
    'Mobile UX precedent (carousel paginators, onboarding cards) treats the panel region as a swipeable surface. The cngx-stepper composes the existing CngxSwipe atom onto the panel host - no pointer-handling is reimplemented. Left-swipe routes through the presenter\'s selectNext (so a linear policy + a commit window gate the move identically to a click), right-swipe routes through selectPrevious (ungated direct back-move, same path the existing strip back-nav already uses).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, provideStepperConfigAt, withStepperMobileCollapse, withStepperMobileBreakpoint } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  viewProviders: ['provideStepperConfigAt(withStepperMobileCollapse(\'dots\'), withStepperMobileBreakpoint(\'(min-width: 0px)\'))'],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper
    [(activeStepIndex)]="active"
    [mobileSwipe]="true"
    [showStepCount]="true"
    aria-label="Onboarding"
  >
    <div cngxStep label="Welcome">
      <ng-template cngxStepContent>
        <p>Drag the panel left or right to advance and retreat. The page can still scroll vertically while you swipe.</p>
      </ng-template>
    </div>
    <div cngxStep label="Customise">
      <ng-template cngxStepContent>
        <p>The swipe routes through the same presenter path a click does, so a linear gate or commit window applies identically.</p>
      </ng-template>
    </div>
    <div cngxStep label="Ready">
      <ng-template cngxStepContent>
        <p>You can opt out per-instance with <code>[mobileSwipe]="false"</code> or app-wide via <code>withStepperMobileSwipe(false)</code>.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
