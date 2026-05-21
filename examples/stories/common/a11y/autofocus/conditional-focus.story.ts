import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAutofocus: Conditional focus',
  subtitle:
    'The input is always rendered, but focus is applied only when the condition becomes <code>true</code>.',
  description:
    'Tracks a boolean signal on an always-mounted input: every transition to <code>true</code> calls <code>focus()</code>; <code>false</code> is a no-op. Use this when the element is permanently in the DOM and only the focus intent toggles (multi-step forms, settings panels, conditional editors).',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxAutofocus'],
  moduleImports: ["import { CngxAutofocus } from '@cngx/common/a11y';"],
  imports: ['CngxAutofocus'],
  references: [
    {
      label: 'WCAG 2.1 SC 2.4.3 Focus Order',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html',
    },
  ],
  setup: `protected readonly conditionMet = signal(false);`,
  template: `  <button type="button" (click)="conditionMet.set(!conditionMet())" class="chip">
    {{ conditionMet() ? 'Deactivate' : 'Activate field' }}
  </button>
  <div style="margin-top:12px;display:flex;flex-direction:column;gap:4px;max-width:240px">
    <label for="cngx-autofocus-conditional">Activatable field</label>
    <input id="cngx-autofocus-conditional"
           [cngxAutofocus]="conditionMet()"
           placeholder="Focused when active" />
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Condition</span>
      <span class="event-value">{{ conditionMet() }}</span>
    </div>
  </div>`,
};
