import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxLongPress: custom threshold',
  subtitle: '<code>[threshold]="1000"</code> requires a one-second hold before <code>(longPressed)</code> fires. Useful for destructive actions where a fast tap should not commit.',
  description: 'The directive is an input trigger; it raises events but adds no semantics. Keyboard activation must be wired separately because long-press is a touch-only gesture (WCAG 2.5.1).',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxLongPress',
  ],
  moduleImports: [
    'import { CngxLongPress } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxLongPress'],
  setup: `protected pressCount = signal(0);`,
  template: `  <button
    type="button"
    cngxLongPress
    [threshold]="1000"
    #lp2="cngxLongPress"
    (longPressed)="pressCount.update(n => n + 1)"
    class="chip"
    [class.demo-gesture-target--danger]="lp2.longPressing()"
  >
    {{ lp2.longPressing() ? 'Hold 1s to delete...' : 'Long press to delete' }}
  </button>
  <p class="demo-gesture-hint" style="margin-top:8px">
    Confirmations: <strong>{{ pressCount() }}</strong>
  </p>`,
};
