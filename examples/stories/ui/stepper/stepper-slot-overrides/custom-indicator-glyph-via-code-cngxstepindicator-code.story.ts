import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: custom step indicator slot',
  subtitle: 'Replace the default indicator with a status-aware glyph (star on success, cross on error, fallback to position number). The star is deliberately distinct from the default success check so the override is unmistakable. The slot context carries <code>{ position, node, active, status, busy }</code> - destructure what you need.',
  description: 'Slot focus: <code>*cngxStepIndicator</code>. Switches the strip number for a success/error glyph based on each step\'s <code>status</code> field, exercising the full slot context shape with destructured <code>let-position</code> and <code>let-status</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxStepper',
    'CngxStep',
    'CngxStepContent',
    'CngxStepIndicator',
  ],
  moduleImports: [
    'import { CngxStep, CngxStepContent, CngxStepIndicator } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepIndicator'],
  setup: `protected readonly active = signal(0);`,
  setupChrome: `  protected handleNext(): void {
    this.active.update(i => Math.min(i + 1, 2));
  }
  protected handlePrev(): void {
    this.active.update(i => Math.max(i - 1, 0));
  }`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides - indicator">
    <ng-template cngxStepIndicator let-position let-status="status">
      @if (status === 'success') {
        <span aria-hidden="true">&#9733;</span>
      } @else if (status === 'error') {
        <span aria-hidden="true">&#10007;</span>
      } @else {
        <span aria-hidden="true">{{ position }}</span>
      }
    </ng-template>
    <div cngxStep label="Profile" [completed]="active() > 0">
      <ng-template cngxStepContent>
        <p>Indicator glyph is now status-aware - advance past this step and the number becomes a star (the default would show a check, so the star proves the slot fired).</p>
      </ng-template>
    </div>
    <div cngxStep label="Address" [completed]="active() > 1">
      <ng-template cngxStepContent>
        <p>Same glyph contract - the slot fires once per step row, status comes from <code>node.state()</code>.</p>
      </ng-template>
    </div>
    <div cngxStep label="Done">
      <ng-template cngxStepContent>
        <p>Final step. Notice the indicator on completed steps.</p>
      </ng-template>
    </div>
  </cngx-stepper>`,
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px);gap:8px">
    <div class="event-row">
      <button type="button" class="chip" (click)="handlePrev()">Previous</button>
      <button type="button" class="chip" (click)="handleNext()">Next</button>
    </div>
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
