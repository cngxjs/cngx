import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: custom step badge slot',
  subtitle: 'Replace the default <code>!</code> glyph with a counter pill driven by the step\'s aggregator. Context is <code>{ count, node }</code>; the badge only renders when <code>node.errorAggregator()?.shouldShow()</code> is truthy, so the slot is purely additive - no visibility plumbing in consumer markup. Toggle "profile invalid" to see the slot fire.',
  description: 'Slot focus: <code>*cngxStepBadge</code>. A wrapping <code>CngxErrorAggregator</code> feeds the slot context (<code>let-count</code>); the slot only fires when the aggregator opts to show errors, so visibility is automatic.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepBadge',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepBadge, CngxStepContent } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
    'import { CngxErrorAggregator, CngxErrorSource } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepBadge', 'CngxStepContent', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly active = signal(0);
  protected readonly profileInvalid = signal(true);`,
  template: `
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides - badge">
    <ng-template cngxStepBadge let-count="count">
      <span class="chip demo-slot-error-pill">{{ count }}</span>
    </ng-template>
    <fieldset cngxErrorAggregator #profileAgg="cngxErrorAggregator" style="display:contents">
      <input cngxErrorSource="profile-name" [when]="profileInvalid()" hidden />
      <div cngxStep label="Profile" [errorAggregator]="profileAgg">
        <ng-template cngxStepContent>
          <p>Toggle "profile invalid" below - the badge counter pill appears with the aggregator's error count.</p>
        </ng-template>
      </div>
    </fieldset>
    <div cngxStep label="Validation">
      <ng-template cngxStepContent>
        <p>No aggregator bound here, so the slot never fires for this step. The slot context's <code>count</code> field is the same source of truth as the default <code>!</code> glyph.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px);gap:8px">
    <div class="event-row" style="gap:8px">
      <label>
        <input type="checkbox"
               [checked]="profileInvalid()"
               (change)="profileInvalid.set($any($event.target).checked)" />
        profile invalid
      </label>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
