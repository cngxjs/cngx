import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom error badge via <code>*cngxStepBadge</code>',
  subtitle: 'Replace the default <code>!</code> glyph with a counter pill driven by the step\'s aggregator. Context is <code>{ count, node }</code>; the badge only renders when <code>node.errorAggregator()?.shouldShow()</code> is truthy, so the slot is purely additive — no visibility plumbing in consumer markup.',
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
    'import { CngxStep, CngxStepBadge, CngxStepContent } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepBadge', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);`,
  template: `
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides — badge">
    <ng-template cngxStepBadge let-count="count">
      <span class="chip" style="background:#dc2626;color:#fff;font-size:0.7em;padding:0 6px">{{ count }}</span>
    </ng-template>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent>
        <p>No errors registered — no badge rendered.</p>
      </ng-template>
    </div>
    <div cngxStep label="Validation">
      <ng-template cngxStepContent>
        <p>The aggregator integration belongs to the consumer; in production wire <code>[errorAggregator]</code> on the <code>cngxStep</code> directive. The slot context's <code>count</code> field is the same source of truth as the default <code>!</code> glyph.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
};
