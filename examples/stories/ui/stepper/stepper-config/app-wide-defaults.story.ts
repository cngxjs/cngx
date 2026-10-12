import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: App-wide defaults',
  subtitle:
    "One <code>provideCngxStepperAt(...)</code> moves five stepper defaults at once: <code>withStepperDefaultOrientation('vertical')</code>, <code>withStepperLinear(true)</code>, <code>withStepperConnectors(true)</code>, <code>withStepperHeaderNavigation('none')</code> and <code>withStepperCommitMode('optimistic')</code>. Both wizards below use the same markup and the same 1.2s commit action; only the second one sits under the scoped config.",
  description:
    'The first wizard reads the library defaults: a horizontal strip, free header navigation, no connector rail and a pessimistic commit, so Continue keeps you on the step until the commit action resolves. The second wizard stacks vertically with a connector rail between the indicators, its headers are inert labels so only the footer moves it, Continue stays <code>aria-disabled</code> until the current step is ticked complete (linear), and Continue advances at once while the commit runs in the background (optimistic). A <code>provideCngxStepperAt</code> call in <code>viewProviders</code> would scope every stepper in this view, so the demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>; a per-instance input such as <code>[linear]</code> still wins over either cascade level.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxStepper', 'CngxStepperPresenter', 'CngxStepperFooter'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { Observable } from 'rxjs';",
    "import { CngxStep, CngxStepContent, CngxStepperNext, CngxStepperPrevious, provideCngxStepperAt, withStepperCommitMode, withStepperConnectors, withStepperDefaultOrientation, withStepperHeaderNavigation, withStepperLinear, type CngxStepperCommitAction } from '@cngx/common/stepper';",
    "import { CngxStepper, CngxStepperFooter, CngxStepperFooterEnd, CngxStepperFooterStart } from '@cngx/ui/stepper';",
  ],
  imports: [
    'NgTemplateOutlet',
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepperFooter',
    'CngxStepperFooterStart',
    'CngxStepperFooterEnd',
    'CngxStepperPrevious',
    'CngxStepperNext',
  ],
  setup: `private readonly injector = inject(Injector);

  protected readonly stepperScope = Injector.create({
    parent: this.injector,
    providers: provideCngxStepperAt(
      withStepperDefaultOrientation('vertical'),
      withStepperLinear(true),
      withStepperConnectors(true),
      withStepperHeaderNavigation('none'),
      withStepperCommitMode('optimistic'),
    ),
  });

  protected readonly steps = [
    { label: 'Account', body: 'Create the account the order belongs to.' },
    { label: 'Shipping', body: 'Pick a delivery address and a carrier.' },
    { label: 'Review', body: 'Check the order before you place it.' },
  ];
  protected readonly names = ['Checkout with library defaults', 'Checkout with scoped config'];
  protected readonly active = [signal(0), signal(0)];
  protected readonly done = [
    signal<readonly boolean[]>([false, false, false]),
    signal<readonly boolean[]>([false, false, false]),
  ];

  protected toggleDone(side: number, index: number, value: boolean): void {
    this.done[side].update((list) => list.map((v, i) => (i === index ? value : v)));
  }

  protected readonly commitAction: CngxStepperCommitAction = () =>
    new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        sub.next(true);
        sub.complete();
      }, 1200);
      return () => clearTimeout(handle);
    });`,
  template: `  <ng-template #wizard let-side>
    <cngx-stepper
      [aria-label]="names[side]"
      [activeStepIndex]="active[side]()"
      (activeStepIndexChange)="active[side].set($event)"
      [commitAction]="commitAction"
    >
      @for (step of steps; track step.label; let i = $index) {
        <div cngxStep [label]="step.label" [completed]="done[side]()[i]">
          <ng-template cngxStepContent>
            <p>{{ step.body }}</p>
            <label>
              <input
                type="checkbox"
                [checked]="done[side]()[i]"
                (change)="toggleDone(side, i, $any($event.target).checked)"
              />
              {{ step.label }} complete
            </label>
          </ng-template>
        </div>
      }
      <cngx-stepper-footer>
        <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
        <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
      </cngx-stepper-footer>
    </cngx-stepper>
  </ng-template>

  <div class="demo-config-compare demo-config-compare--stacked">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Library defaults</h3>
      <ng-container *ngTemplateOutlet="wizard; context: { $implicit: 0 }" />
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="wizard; context: { $implicit: 1 }; injector: stepperScope" />
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Defaults: active step</span><span class="event-value">{{ active[0]() }}</span></div>
    <div class="event-row"><span class="event-label">Defaults: completed</span><span class="event-value">{{ done[0]().join(', ') }}</span></div>
    <div class="event-row"><span class="event-label">Scoped: active step</span><span class="event-value">{{ active[1]() }}</span></div>
    <div class="event-row"><span class="event-label">Scoped: completed</span><span class="event-value">{{ done[1]().join(', ') }}</span></div>
  </div>`,
};
