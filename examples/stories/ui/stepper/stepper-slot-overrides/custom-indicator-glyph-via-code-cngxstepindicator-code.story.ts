import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStepper: custom step indicator slot',
  subtitle: 'Replace the default 1-based number with a status-aware glyph (check on success, cross on error, fallback to position number). The slot context carries <code>{ position, node, active, status, busy }</code> - destructure what you need.',
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
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides - indicator">
    <ng-template cngxStepIndicator let-position let-status="status">
      @if (status === 'success') {
        <span aria-hidden="true">&#10003;</span>
      } @else if (status === 'error') {
        <span aria-hidden="true">&#10007;</span>
      } @else {
        <span aria-hidden="true">{{ position }}</span>
      }
    </ng-template>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent>
        <p>Indicator glyph is now status-aware - finish this step (advance) and the badge becomes check.</p>
      </ng-template>
    </div>
    <div cngxStep label="Address">
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
  templateChrome: `<div class="event-grid" style="margin-top:var(--demo-grid-gap, 12px)">
    <div class="event-row"><span class="event-label">Active step</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
