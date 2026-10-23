import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRipple: Button ripples',
  subtitle: 'Click each <code>cngxButton</code> and the <code>cngxIconButton</code> to see the ripple expand from the pointer position. The wave color follows <code>currentColor</code> by default; <code>[rippleColor]</code> swaps it and <code>[rippleCentered]</code> pins the origin to the host center.',
  description: 'Touch / click ripple feedback without a Material dependency. The directive renders the wave into an overlay layer that clips to the host radius (the host itself is never clipped, so touch hit areas and badges overhang freely), computes the wave origin from the pointer event, and removes the wave after the CSS animation ends. Wave color and shape are CSS-var driven so consumers re-skin without forking the directive.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxRipple',
    'CngxButton',
    'CngxIconButton',
  ],
  moduleImports: [
    'import { CngxRipple } from \'@cngx/common/interactive\';',
    'import { CngxButton, CngxIconButton } from \'@cngx/common/button\';',
  ],
  imports: ['CngxRipple', 'CngxButton', 'CngxIconButton'],
  template: `  <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center">
    <button cngxButton tone="primary" cngxRipple>Default ripple</button>
    <button cngxButton="outline" cngxRipple [rippleColor]="'#f5a623'">Custom color</button>
    <button cngxIconButton="outline" cngxRipple [rippleCentered]="true" aria-label="Centered ripple">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
    </button>
  </div>`,
};
