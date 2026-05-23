import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRipple: Button ripples',
  subtitle: 'Click each button to see the ripple expand from the pointer position. The wave color follows <code>currentColor</code> by default; <code>[rippleColor]</code> swaps it and <code>[rippleCentered]</code> pins the origin to the host center.',
  description: 'Touch / click ripple feedback without a Material dependency. The directive sets position: relative + overflow: hidden on the host, computes the wave origin from the pointer event, and removes the wave after the CSS animation ends. Wave color and shape are CSS-var driven so consumers re-skin without forking the directive.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxRipple',
  ],
  moduleImports: [
    'import { CngxRipple } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRipple'],
  template: `  <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center">
    <button cngxRipple type="button" class="chip">Default ripple</button>
    <button cngxRipple type="button" class="chip" [rippleColor]="'#f5a623'">Custom color</button>
    <button cngxRipple type="button" class="chip demo-ripple-icon-button" [rippleCentered]="true" aria-label="Centered ripple">C</button>
  </div>`,
};
