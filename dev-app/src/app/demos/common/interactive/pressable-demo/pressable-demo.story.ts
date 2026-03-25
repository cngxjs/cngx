import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Pressable',
  navLabel: 'Pressable',
  navCategory: 'interactive',
  description:
    'Instant press feedback via CSS class on pointerdown. 0ms latency — the class appears before click fires.',
  apiComponents: ['CngxPressable'],
  overview:
    '<p><code>[cngxPressable]</code> toggles the <code>cngx-pressed</code> CSS class immediately on pointer contact. ' +
    'All visual treatment (scale, opacity, color) is consumer CSS. The directive only manages the state.</p>',
  moduleImports: [
    "import { CngxPressable } from '@cngx/common/interactive';",
  ],
  sections: [
    {
      title: 'Press Feedback on Buttons',
      subtitle:
        'Press and hold each button. The scale/opacity change is instant — applied via <code>.cngx-pressed</code> CSS, not inline styles.',
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
    },
    {
      title: 'Tappable Card',
      subtitle:
        'Apply to any element — cards, list items, nav links. The <code>pressed()</code> signal drives visual feedback.',
      imports: ['CngxPressable'],
      template: `
  <div cngxPressable #card="cngxPressable"
       style="padding:20px;border:1px solid var(--cngx-border,#ddd);border-radius:8px;cursor:pointer;
              transition:transform 100ms ease,box-shadow 100ms ease;max-width:280px;user-select:none"
       [style.transform]="card.pressed() ? 'scale(0.98)' : ''"
       [style.box-shadow]="card.pressed() ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'">
    <strong>Tappable Card</strong>
    <p style="margin:8px 0 0;font-size:0.875rem;color:var(--cngx-text-secondary,#666)">
      Press and hold to see the feedback.
    </p>
  </div>`,
    },
  ],
};
