import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom group header via <code>*cngxStepGroupHeader</code>',
  subtitle: 'Replace the built-in group label span with richer markup — heading tag, child-count badge, status indicator. Slot context is <code>{ group, expanded, status }</code>. Group nodes are declared with <code>[cngxStepGroup]</code> wrapping nested <code>[cngxStep]</code> atoms.',
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
    'import { CngxStep, CngxStepContent, CngxStepGroup, CngxStepGroupHeader } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepGroup', 'CngxStepContent', 'CngxStepGroupHeader'],
  setup: `protected readonly active = signal(0);`,
  template: `
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides — group header">
    <ng-template cngxStepGroupHeader let-group="group" let-status="status">
      <strong style="text-transform:uppercase;letter-spacing:0.05em;font-size:0.8em">
        {{ group.label() }}
      </strong>
      <span class="chip" style="padding:0 6px;font-size:0.7em;margin-inline-start:6px">{{ status }}</span>
    </ng-template>
    <div cngxStepGroup label="Onboarding">
      <div cngxStep label="Profile">
        <ng-template cngxStepContent>
          <p>Step inside the Onboarding group.</p>
        </ng-template>
      </div>
      <div cngxStep label="Notifications">
        <ng-template cngxStepContent>
          <p>Second step inside Onboarding.</p>
        </ng-template>
      </div>
    </div>
    <div cngxStepGroup label="Security">
      <div cngxStep label="Password">
        <ng-template cngxStepContent>
          <p>Step inside the Security group.</p>
        </ng-template>
      </div>
    </div>
  </cngx-stepper>`,
};
