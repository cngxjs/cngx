import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: per step error badges',
  subtitle: 'Toggle the validity flags below - the step badge appears whenever the step carries <code>data-state="error"</code> or its <code>aggregator.shouldShow()</code> turns true. The descriptor span carries the announcement phrase for SR.',
  description: 'Validation badge pattern: each step opts into a <code>CngxErrorAggregator</code> wired through a wrapping fieldset. The badge is default-on for any errored step (driven by <code>data-state="error"</code>) so step 1 errors stay visible while the user is on step 3, and the aggregator drives the optional count + announcement.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['error-handling', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
  ],
  apiComponents: [
    'CngxStepper',
    'CngxErrorAggregator',
    'CngxStep',
    'CngxStepContent',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepContent } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
    'import { CngxErrorAggregator, CngxErrorSource } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxErrorAggregator', 'CngxErrorSource'],
  setup: `protected readonly active = signal(0);
  protected readonly profileInvalid = signal(true);
  protected readonly addressInvalid = signal(false);`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Validated wizard">
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
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row" style="gap:8px">
      <label><input type="checkbox" [checked]="profileInvalid()" (change)="profileInvalid.set($any($event.target).checked)" /> profile invalid</label>
      <label><input type="checkbox" [checked]="addressInvalid()" (change)="addressInvalid.set($any($event.target).checked)" /> address invalid</label>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
