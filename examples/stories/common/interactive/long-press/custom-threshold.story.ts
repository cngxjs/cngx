import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom Threshold',
  subtitle: 'Set <code>[threshold]="1000"</code> for a 1-second hold. Useful for destructive actions.',
  description: 'Detects long-press gestures via Pointer Events. Cancels on move to prevent accidental triggers during scrolling.',
  level: 'atom',
  audience: ['dev', 'a11y'],
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
  template: `
  <button cngxLongPress [threshold]="1000" #lp2="cngxLongPress"
          (longPressed)="pressCount.update(n => n + 1)"
          class="chip"
          [style.background]="lp2.longPressing() ? '#ffebee' : ''"
          [style.borderColor]="lp2.longPressing() ? '#c62828' : ''">
    {{ lp2.longPressing() ? 'Hold 1s to delete...' : 'Long press to delete' }}
  </button>`,
};
