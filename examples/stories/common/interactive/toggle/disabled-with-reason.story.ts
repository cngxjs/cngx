import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled with reason',
  subtitle: 'When <code>[disabled]</code> is true and <code>disabledReason</code> is non-empty, the host emits <code>aria-describedby</code> pointing to a hidden span — screen-readers announce <em>why</em> the control is disabled.',
  description: 'Single-value boolean switch atom. role="switch" with reactive aria-checked, aria-disabled, aria-describedby for the consumer-supplied disabled reason. Click + Space + Enter all flip. Provides CNGX_CONTROL_VALUE so CngxFormBridge (Phase 7) can bind to it without per-atom CVA.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxToggle',
  ],
  moduleImports: [
    'import { CngxToggle } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxToggle'],
  setup: `protected readonly dark = signal(true);
  protected readonly systemLocked = signal(false);`,
  template: `
  <button type="button" (click)="systemLocked.set(!systemLocked())" class="sort-btn">
    {{ systemLocked() ? 'Unlock OS preference' : 'Lock OS preference' }}
  </button>
  <cngx-toggle
    [(value)]="dark"
    [disabled]="systemLocked()"
    [disabledReason]="systemLocked() ? 'Locked by your OS preference' : ''"
  >Dark mode</cngx-toggle>`,
  css: `.sort-btn { margin-bottom: 16px; }`,
};
