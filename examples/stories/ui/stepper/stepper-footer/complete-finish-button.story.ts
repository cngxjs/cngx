import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepperFooter: Complete finish button',
  subtitle:
    'On the last step the footer swaps Continue for a <code>[cngxStepperComplete]</code> button. Unlike Next (which reflects and advances), Complete <em>runs</em> an async finish action - it composes <code>CngxAsyncClick</code>, busy-disables while in flight, and emits <code>(completed)</code> after success.',
  description:
    'Finish keeps its label while the action runs and after it settles, so the result is not painted on the button: it is spoken through the polite live region <code>cngxAsyncClick</code> renders next to it.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'async-state'],
  apiComponents: ['CngxStepperFooter', 'CngxStepperComplete'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperPrevious, CngxStepperNext, CngxStepperComplete } from '@cngx/common/stepper';",
    "import { CngxStepper, CngxStepperFooter, CngxStepperFooterStart, CngxStepperFooterEnd } from '@cngx/ui/stepper';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
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
    'CngxStepperComplete',
  ],
  setup: `protected readonly active = signal(0);
  protected readonly lastIndex = 2;
  protected readonly finishAction = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 800));
  protected readonly submitted = signal(false);

  protected onCompleted(): void {
    this.submitted.set(true);
  }`,
  setupChrome: `
  // Mirrors the busy state and the live region writes into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'finish', selector: 'button:has(+ [aria-live])' },
  ]);`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Sign up">
    <div cngxStep label="Account">
      <ng-template cngxStepContent><p>Create your account.</p></ng-template>
    </div>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent><p>Fill in your profile.</p></ng-template>
    </div>
    <div cngxStep label="Confirm">
      <ng-template cngxStepContent><p>Confirm and submit.</p></ng-template>
    </div>

    <cngx-stepper-footer>
      <button type="button" class="chip" cngxStepperFooterStart cngxStepperPrevious>Back</button>
      @if (active() < lastIndex) {
        <button type="button" class="chip" cngxStepperFooterEnd cngxStepperNext>Continue</button>
      } @else {
        <button
          type="button"
          class="chip"
          cngxStepperFooterEnd
          [cngxStepperComplete]="finishAction"
          succeededAnnouncement="Sign-up complete. Your account is ready."
          (completed)="onCompleted()"
        >
          Finish
        </button>
      }
    </cngx-stepper-footer>
  </cngx-stepper>`,
  templateChrome: `  @if (submitted()) {
    <div class="event-row" style="margin-top:12px">
      <span class="event-label">Status</span><span class="event-value">Submitted - (completed) fired</span>
    </div>
  }
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} aria-busy</dt>
        <dd>{{ row.busy }}</dd>
      }
      @for (entry of sr.heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      The last five texts written to the polite live region next to Finish, newest last. They are spoken only, the button keeps its label; two writes in one frame may be voiced once, depending on the screen reader.
    </p>
  </div>`,
};
