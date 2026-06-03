import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: classic + [connectors] wizard rail',
  subtitle:
    'Opt the classic skin into the canonical wizard look via <code>[connectors]="true"</code>: disc on top, label stacked below, full-width rail between adjacent disc centers. Per-segment color cascades from the preceding step\'s <code>[data-state]</code> - 100% CSS, no derivation. Works horizontally and vertically; AsyncState (success/error/pending) colors flow through automatically.',
  description:
    'Toggle <strong>orientation</strong> to flip the strip between horizontal (stacked labels under discs) and vertical (labels beside discs, rail runs down). Toggle <strong>commit outcome</strong> to switch the Next-step action between an immediate success, a 1500&nbsp;ms pending (orange rail) leading to success, or a 1500&nbsp;ms pending leading to error (red rail). The disc and the trailing rail both honor the same <code>[data-state]</code>; no per-state TS derivation.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  moduleImports: [
    "import { CngxStep, CngxStepContent } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent'],
  setup: `protected readonly active = signal(0);
  protected readonly commitAction = (target: number) => {
    if (this.outcome() === 'success') {
      return true;
    }
    return new Promise<boolean>((resolve, reject) => {
      setTimeout(() => {
        if (this.outcome() === 'error') {
          reject(new Error('Simulated commit failure'));
        } else {
          resolve(true);
        }
      }, 1500);
    });
  };`,
  setupChrome: `  protected readonly orientationOptions = ['horizontal', 'vertical'] as const;
  protected readonly orientation = signal<typeof this.orientationOptions[number]>('horizontal');
  protected readonly outcomeOptions = ['success', 'pending', 'error'] as const;
  protected readonly outcome = signal<typeof this.outcomeOptions[number]>('success');`,
  template: `  <cngx-stepper
    #stepper="cngxStepper"
    [(activeStepIndex)]="active"
    [connectors]="true"
    [orientation]="orientation()"
    [commitAction]="commitAction"
    aria-label="Account setup"
  >
    <div cngxStep label="Method" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Choose how to sign in - email, SSO, or magic link.</p>
      </ng-template>
    </div>
    <div cngxStep label="Details" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Provide the basics: display name, locale, avatar.</p>
      </ng-template>
    </div>
    <div cngxStep label="Verify" [completed]="active() > 2">
      <ng-template cngxStepContent>
        <p>Confirm the email address with the code we sent.</p>
      </ng-template>
    </div>
    <div cngxStep label="Complete">
      <ng-template cngxStepContent>
        <p>Setup complete - jump into the dashboard.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="stepper.presenter.select(active() - 1)">Previous</button>
      <button type="button" class="chip" (click)="stepper.presenter.select(active() + 1)">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <fieldset style="display:flex;gap:12px;align-items:center;border:0;padding:0;margin:0">
      <legend style="font-weight:600;margin-right:4px">Orientation</legend>
      @for (o of orientationOptions; track o) {
        <label style="display:inline-flex;gap:4px;align-items:center">
          <input type="radio" name="wizard-rail-orientation" [value]="o" [checked]="orientation() === o" (change)="orientation.set(o)" />
          <span>{{ o }}</span>
        </label>
      }
    </fieldset>
    <fieldset style="display:flex;gap:12px;align-items:center;border:0;padding:0;margin:0">
      <legend style="font-weight:600;margin-right:4px">Commit outcome</legend>
      @for (o of outcomeOptions; track o) {
        <label style="display:inline-flex;gap:4px;align-items:center">
          <input type="radio" name="wizard-rail-outcome" [value]="o" [checked]="outcome() === o" (change)="outcome.set(o)" />
          <span>{{ o }}</span>
        </label>
      }
    </fieldset>
  </div>`,
};
