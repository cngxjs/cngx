import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Press Feedback on Buttons',
  subtitle: 'Press and hold each button. The scale/opacity change is instant — applied via <code>.cngx-pressed</code> CSS, not inline styles.',
  description: 'Instant press feedback via CSS class on pointerdown. 0ms latency — the class appears before click fires.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxPressable',
  ],
  moduleImports: [
    'import { CngxPressable } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxPressable'],
  template: `
  <div class="button-row" style="gap:8px">
    <button cngxPressable #p1="cngxPressable" class="chip"
            style="transition:transform 80ms ease,opacity 80ms ease"
            [style.transform]="p1.pressed() ? 'scale(0.95)' : ''"
            [style.opacity]="p1.pressed() ? '0.8' : ''">
      Scale Down
    </button>

    <button cngxPressable #p2="cngxPressable" class="chip"
            style="transition:background 80ms ease"
            [style.background]="p2.pressed() ? 'var(--interactive-subtle-bg, #e3f2fd)' : ''">
      Color Flash
    </button>

    <button cngxPressable [pressableReleaseDelay]="200" #p3="cngxPressable" class="chip"
            style="transition:transform 80ms ease"
            [style.transform]="p3.pressed() ? 'scale(0.92)' : ''">
      200ms Delay
    </button>
  </div>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Button 1</span>
      <span class="event-value">{{ p1.pressed() ? 'pressed' : 'idle' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Button 2</span>
      <span class="event-value">{{ p2.pressed() ? 'pressed' : 'idle' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Button 3 (200ms)</span>
      <span class="event-value">{{ p3.pressed() ? 'pressed' : 'idle' }}</span>
    </div>
  </div>`,
};
