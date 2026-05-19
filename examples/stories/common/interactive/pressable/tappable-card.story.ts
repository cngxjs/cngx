import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tappable Card',
  subtitle: 'Apply to any element — cards, list items, nav links. The <code>pressed()</code> signal drives visual feedback.',
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
  <div cngxPressable #card="cngxPressable"
       style="padding:20px;border:1px solid var(--cngx-color-border,#ddd);border-radius:8px;cursor:pointer;
              transition:transform 100ms ease,box-shadow 100ms ease;max-width:280px;user-select:none"
       [style.transform]="card.pressed() ? 'scale(0.98)' : ''"
       [style.box-shadow]="card.pressed() ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'">
    <strong>Tappable Card</strong>
    <p style="margin:8px 0 0;font-size:0.875rem;color:var(--cngx-text-secondary,#666)">
      Press and hold to see the feedback.
    </p>
  </div>`,
};
