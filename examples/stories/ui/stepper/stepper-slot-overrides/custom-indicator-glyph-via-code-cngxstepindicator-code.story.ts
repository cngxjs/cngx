import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom indicator glyph via <code>*cngxStepIndicator</code>',
  subtitle: 'Replace the default 1-based number with a status-aware glyph (✓ on success, ✕ on error, fallback to position number). The slot context carries <code>{ position, node, active, status, busy }</code> — destructure what you need.',
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
    'import { CngxStep, CngxStepContent, CngxStepIndicator } from \'@cngx/common/stepper\';',
    'import { CngxStepper } from \'@cngx/ui/stepper\';',
  ],
  imports: ['CngxStepper', 'CngxStep', 'CngxStepContent', 'CngxStepIndicator'],
  setup: `protected readonly active = signal(0);`,
  template: `  <cngx-stepper [(activeStepIndex)]="active" aria-label="Slot-overrides — indicator">
    <ng-template cngxStepIndicator let-position let-status="status">
      @if (status === 'success') {
        <span aria-hidden="true">✓</span>
      } @else if (status === 'error') {
        <span aria-hidden="true">✕</span>
      } @else {
        <span aria-hidden="true">{{ position }}</span>
      }
    </ng-template>
    <div cngxStep label="Profile">
      <ng-template cngxStepContent>
        <p>Indicator glyph is now status-aware — finish this step (advance) and the badge becomes ✓.</p>
      </ng-template>
    </div>
    <div cngxStep label="Address">
      <ng-template cngxStepContent>
        <p>Same glyph contract — the slot fires once per step row, status comes from <code>node.state()</code>.</p>
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
