import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Dialog Use Case',
  subtitle: 'Each dialog gets its own <code>CngxAlertStack</code> with an independent <code>CngxAlerter</code>. Nested dialogs are fully isolated — closing a child destroys its alerts without affecting the parent.',
  description: 'Scoped inline alert stack with programmatic service, overflow collapse, and DI-scoped nesting for dialogs and forms.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxAlertStack',
    'CngxAlerter',
  ],
  moduleImports: [
    'import { CngxAlertStack } from \'@cngx/ui/feedback\';',
  ],
  template: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">Architecture</span>
      <span class="event-value">CngxAlertStack provides CngxAlerter via viewProviders</span>
    </div>
    <div class="event-row">
      <span class="event-label">Nesting</span>
      <span class="event-value">inject(CngxAlerter) resolves to nearest ancestor stack</span>
    </div>
    <div class="event-row">
      <span class="event-label">Cleanup</span>
      <span class="event-value">Dialog close destroys stack + all alerts automatically</span>
    </div>
  </div>`,
};
