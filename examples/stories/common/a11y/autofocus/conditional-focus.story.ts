import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Conditional Focus',
  subtitle: 'The input is always rendered, but focus is applied only when the condition becomes <code>true</code>.',
  description: 'Reactive autofocus for dynamically inserted elements. Works where native autofocus fails (dialogs, panels, conditional views).',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxAutofocus',
  ],
  moduleImports: [
    'import { CngxAutofocus } from \'@cngx/common/a11y\';',
  ],
  imports: ['CngxAutofocus'],
  setup: `protected readonly conditionMet = signal(false);`,
  template: `
  <button (click)="conditionMet.set(!conditionMet())" class="chip">
    {{ conditionMet() ? 'Deactivate' : 'Activate Field' }}
  </button>
  <div style="margin-top:12px">
    <input [cngxAutofocus]="conditionMet()" placeholder="Focused when active"
           style="padding:8px 12px;border:1px solid var(--cngx-color-border,#ddd);border-radius:6px;width:240px" />
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Condition</span>
      <span class="event-value">{{ conditionMet() }}</span>
    </div>
  </div>`,
};
