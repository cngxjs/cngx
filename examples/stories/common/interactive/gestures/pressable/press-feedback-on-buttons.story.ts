import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPressable: press feedback on buttons',
  subtitle: 'Press and hold each button. The <code>.cngx-pressed</code> class is added on <code>pointerdown</code> with 0ms latency. The directive is presentation-only and does not write <code>aria-pressed</code>, because press feedback is not a toggle state.',
  description: 'Press-feedback layer applied to native buttons. Each variant illustrates a different visual treatment driven by the pressed() signal.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxPressable',
  ],
  moduleImports: [
    'import { CngxPressable } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxPressable'],
  template: `  <div style="display:flex; flex-wrap:wrap; gap:8px">
    <button
      type="button"
      cngxPressable
      #p1="cngxPressable"
      class="chip"
      style="transition:transform 80ms ease, opacity 80ms ease"
      [style.transform]="p1.pressed() ? 'scale(0.95)' : ''"
      [style.opacity]="p1.pressed() ? '0.8' : ''"
    >
      Scale down
    </button>

    <button
      type="button"
      cngxPressable
      #p2="cngxPressable"
      class="chip"
      [class.demo-gesture-flash]="p2.pressed()"
      style="transition:background 80ms ease, border-color 80ms ease"
    >
      Color flash
    </button>

    <button
      type="button"
      cngxPressable
      [pressableReleaseDelay]="200"
      #p3="cngxPressable"
      class="chip"
      style="transition:transform 80ms ease"
      [style.transform]="p3.pressed() ? 'scale(0.92)' : ''"
    >
      200ms release delay
    </button>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Button 1 (scale)</span>
      <span class="event-value">{{ p1.pressed() ? 'pressed' : 'idle' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Button 2 (flash)</span>
      <span class="event-value">{{ p2.pressed() ? 'pressed' : 'idle' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Button 3 (200ms)</span>
      <span class="event-value">{{ p3.pressed() ? 'pressed' : 'idle' }}</span>
    </div>
  </div>`,
};
