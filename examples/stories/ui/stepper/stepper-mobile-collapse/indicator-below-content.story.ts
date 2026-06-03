import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: mobile indicator below content',
  subtitle:
    'The dot row drops below the panel content via <code>[mobileIndicatorPosition]="bottom"</code>. App-wide consumers reach the same default through <code>provideStepperConfig(withStepperMobileIndicatorPosition(\'bottom\'))</code>. This demo forces the mobile collapse on every viewport via <code>withStepperMobileBreakpoint(\'(min-width: 0px)\')</code> so the flip is visible without resizing.',
  description:
    'Mobile UX precedent (carousel paginators, chat composers, onboarding cards) places the navigation indicator at thumb height so the user reads the panel first and acts second. The cngx-stepper exposes the flip as a per-instance input plus a config feature; the cascade is Input -> config -> top default. The classic strip branch ignores the setting - it only kicks in once the mobile auto-collapse policy engages.',
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
    [mobileIndicatorPosition]="'bottom'"
    [showStepCount]="true"
    aria-label="Onboarding"
  >
    <div cngxStep label="Welcome">
      <ng-template cngxStepContent>
        <p>Swipe through the highlights to see what is new this release.</p>
      </ng-template>
    </div>
    <div cngxStep label="Customise">
      <ng-template cngxStepContent>
        <p>Tune the dashboard layout to match your daily routine.</p>
      </ng-template>
    </div>
    <div cngxStep label="Ready">
      <ng-template cngxStepContent>
        <p>You are all set - open the workspace whenever you want.</p>
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
