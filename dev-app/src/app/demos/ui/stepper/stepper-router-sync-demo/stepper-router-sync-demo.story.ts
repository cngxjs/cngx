import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stepper — router sync',
  navLabel: 'Router sync',
  navCategory: 'stepper',
  description:
    'Bind <code>cngxStepperRouterSync</code> to deep-link the active step into the URL. Clicking a step updates the fragment (<code>#step=&lt;id&gt;</code>) by default; reloading the page lands on that step; browser-back walks the visited history without reload. Toggle <code>[mode]</code> to swap to query-param mode (<code>?step=&lt;id&gt;</code>). The directive becomes a no-op when <code>@angular/router</code> is not provided — log surfaces a one-time dev warning.',
  apiComponents: ['CngxStepper'],
  moduleImports: [
    "import { CngxStep, CngxStepContent, CngxStepperRouterSync } from '@cngx/common/stepper';",
    "import { CngxStepper } from '@cngx/ui/stepper';",
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly mode = signal<'fragment' | 'queryParam'>('fragment');
  protected readonly lastError = signal<string | null>(null);

  protected onSyncError(err: unknown): void {
    this.lastError.set(err instanceof Error ? err.message : String(err));
  }
  `,
  sections: [
    {
      title: 'Deep-linking with fragment + queryParam modes',
      subtitle:
        'Click any step — the URL updates to match. Reload the demo page with the fragment / query-param intact and the wizard lands on that step. Browser-back replays visited steps. The <code>(syncError)</code> output captures Router rejections (rare in practice, e.g. a guard refusing the navigation).',
      imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepperRouterSync'],
      template: `
  <div role="group" aria-label="URL sync mode" class="event-row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <button type="button" class="chip"
            [attr.aria-pressed]="mode() === 'fragment'"
            [style.background]="mode() === 'fragment' ? '#c8e6c9' : ''"
            (click)="mode.set('fragment')">fragment (#)</button>
    <button type="button" class="chip"
            [attr.aria-pressed]="mode() === 'queryParam'"
            [style.background]="mode() === 'queryParam' ? '#c8e6c9' : ''"
            (click)="mode.set('queryParam')">queryParam (?)</button>
  </div>
  <cngx-stepper
    [(activeStepIndex)]="active"
    cngxStepperRouterSync
    [mode]="mode()"
    paramName="step"
    (syncError)="onSyncError($event)"
    aria-label="Onboarding wizard"
  >
    <div cngxStep id="profile" label="Profile">
      <ng-template cngxStepContent><p>Set your display name and avatar.</p></ng-template>
    </div>
    <div cngxStep id="notifications" label="Notifications">
      <ng-template cngxStepContent><p>Choose which events should email you.</p></ng-template>
    </div>
    <div cngxStep id="security" label="Security">
      <ng-template cngxStepContent><p>Enable two-factor authentication.</p></ng-template>
    </div>
    <div cngxStep id="confirm" label="Confirm">
      <ng-template cngxStepContent><p>Review your choices and finish.</p></ng-template>
    </div>
  </cngx-stepper>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">URL mode</span><span class="event-value">{{ mode() }}</span></div>
    <div role="status" aria-live="polite" aria-atomic="true">
      @if (lastError()) {
        <div class="event-row"><span class="event-label">syncError</span><span class="event-value">{{ lastError() }}</span></div>
      }
    </div>
  </div>`,
    },
  ],
};
