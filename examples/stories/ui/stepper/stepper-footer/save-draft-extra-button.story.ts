import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperFooter: extra Save-draft action',
  subtitle:
    'The footer regions are open slots - drop any control beside the nav atoms. Here a plain "Save draft" button sits in the start region next to Back, while Continue holds the end. Only the nav atoms gate themselves; the extra action stays always-live.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxStepperFooter', 'CngxStepperFooterStart', 'CngxStepperFooterEnd'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious, CngxStepperNext } from '@cngx/common/stepper';",
    "import { CngxStepper, CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterEnd } from '@cngx/ui/stepper';",
  ],
  imports: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepperFooter',
    'CngxStepperFooterStart',
    'CngxStepperFooterEnd',
    'CngxStepperPrevious',
    'CngxStepperNext',
  ],
  setup: `protected readonly active = signal(0);
  protected readonly savedAt = signal<string | null>(null);
  protected saveDraft(): void {
    this.savedAt.set(new Date().toLocaleTimeString());
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Article editor">
    <div cngxStep label="Title">
      <ng-template cngxStepContent><p>Give the article a working title.</p></ng-template>
    </div>
    <div cngxStep label="Body">
      <ng-template cngxStepContent><p>Write the body content.</p></ng-template>
    </div>
    <div cngxStep label="Review">
      <ng-template cngxStepContent><p>Review before publishing.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      <button type="button" class="chip" cngxStepperFooterStart (click)="saveDraft()">Save draft</button>
      <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
    </cngx-stepper-footer>
  </cngx-stepper>`,
  templateChrome: `  @if (savedAt(); as ts) {
    <div class="event-row" style="margin-top:12px">
      <span class="event-label">Draft saved at</span><span class="event-value">{{ ts }}</span>
    </div>
  }`,
};
