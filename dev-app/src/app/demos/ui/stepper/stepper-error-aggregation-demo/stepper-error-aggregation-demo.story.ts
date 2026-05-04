import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stepper — error aggregation',
  navLabel: 'Errors',
  navCategory: 'stepper',
  description:
    'Bind <code>[errorAggregator]</code> on a step to surface a badge + SR phrase whenever the aggregator opts to show errors. Compose <code>CngxErrorAggregator</code> on a fieldset; the step reads <code>shouldShow()</code> and <code>announcement()</code> reactively.',
  apiComponents: ['CngxStepper', 'CngxErrorAggregator'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
    "import { CngxErrorAggregator, CngxErrorSource } from '@cngx/common/interactive';",
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly profileInvalid = signal(true);
  protected readonly addressInvalid = signal(false);
  `,
  sections: [
    {
      title: 'Per-step error badges',
      subtitle:
        'Toggle the validity flags below — the step badge appears the moment <code>aggregator.shouldShow()</code> turns true. The descriptor span carries the announcement phrase for SR.',
      imports: [
        'CngxStepper',
        'CngxStep',
        'CngxStepContent',
        'CngxErrorAggregator',
        'CngxErrorSource',
      ],
      template: `
  <cngx-stepper [(activeStepIndex)]="active" aria-label="Validated wizard">
    <fieldset cngxErrorAggregator #profileAgg="cngxErrorAggregator" style="display:contents">
      <input cngxErrorSource="profile-name" [when]="profileInvalid()" hidden />
      <div cngxStep label="Profile" [errorAggregator]="profileAgg">
        <ng-template cngxStepContent>
          <p>Profile fields go here. Toggle "profile invalid" to flip the badge.</p>
        </ng-template>
      </div>
    </fieldset>
    <fieldset cngxErrorAggregator #addressAgg="cngxErrorAggregator" style="display:contents">
      <input cngxErrorSource="address-postal" [when]="addressInvalid()" hidden />
      <div cngxStep label="Address" [errorAggregator]="addressAgg">
        <ng-template cngxStepContent>
          <p>Address fields go here.</p>
        </ng-template>
      </div>
    </fieldset>
    <div cngxStep label="Confirm">
      <ng-template cngxStepContent><p>Final review.</p></ng-template>
    </div>
  </cngx-stepper>
  <div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row" style="gap:8px">
      <label><input type="checkbox" [checked]="profileInvalid()" (change)="profileInvalid.set($any($event.target).checked)" /> profile invalid</label>
      <label><input type="checkbox" [checked]="addressInvalid()" (change)="addressInvalid.set($any($event.target).checked)" /> address invalid</label>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
    },
  ],
};
