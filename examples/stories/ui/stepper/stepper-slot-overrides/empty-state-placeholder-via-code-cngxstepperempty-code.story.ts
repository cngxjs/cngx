import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Empty-state placeholder via <code>*cngxStepperEmpty</code>',
  subtitle: 'When the registered step list is empty (e.g. async-loaded wizard with no data yet), the slot renders in place of the strip + panels. No context — render static markup or read injected services directly. Toggle the button below to register / unregister all steps and watch the slot swap in.',
  description: 'Override every visual region inside <code>&lt;cngx-stepper&gt;</code> via the six new slot directives — <code>*cngxStepIndicator</code>, <code>*cngxStepBadge</code>, <code>*cngxStepBusySpinner</code>, <code>*cngxStepRejection</code>, <code>*cngxStepGroupHeader</code>, <code>*cngxStepperEmpty</code>. Each slot ships a typed context object — destructure via <code>let-status="status"</code> / <code>let-failedIndex="failedIndex"</code> / <code>let-group="group"</code> / etc. The library renders sensible defaults; the slots are purely additive.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxStepper',
    'CngxStep',
    'CngxStepGroup',
    'CngxStepContent',
    'CngxStepIndicator',
    'CngxStepBadge',
    'CngxStepBusySpinner',
    'CngxStepGroupHeader',
    'CngxStepperEmpty',
    'CngxStepRejection',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepContent, CngxStepperEmpty } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepperEmpty', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);
  protected readonly hasSteps = signal(true);`,
  template: `
  <button
    type="button"
    class="chip"
    style="margin-bottom:var(--demo-grid-gap, 12px)"
    (click)="hasSteps.update((v) => !v)"
  >
    {{ hasSteps() ? 'Unregister all steps' : 'Register steps' }}
  </button>
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides — empty state">
    <ng-template cngxStepperEmpty>
      <div style="padding:24px;text-align:center;color:var(--mat-sys-on-surface-variant, #666)">
        <strong>No steps configured yet</strong>
        <p style="margin:6px 0 0;font-size:0.9em">Steps will appear here once the wizard config loads.</p>
      </div>
    </ng-template>
    @if (hasSteps()) {
      <div cngxStep label="One">
        <ng-template cngxStepContent>
          <p>Step 1.</p>
        </ng-template>
      </div>
      <div cngxStep label="Two">
        <ng-template cngxStepContent>
          <p>Step 2.</p>
        </ng-template>
      </div>
    }
  </cngx-stepper>`,
};
