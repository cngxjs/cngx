import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPressRipple: Buttons with press + ripple',
  subtitle: 'One attribute, two behaviors: instant press feedback (<code>.cngx-pressed</code> class for the consumer to style) AND a ripple wave from the pointer position.',
  description: 'Molecule that composes CngxPressable + CngxRipple via hostDirectives so the consumer wires one attribute instead of two. Forwards both directives\' inputs (pressableReleaseDelay, rippleColor, rippleCentered, rippleDisabled) verbatim. The press class is the consumer\'s CSS responsibility - this demo wires a transform transition via the .demo-press-ripple-button helper.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxPressRipple',
  ],
  moduleImports: [
    'import { CngxPressRipple } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxPressRipple'],
  template: `  <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center">
    <button cngxPressRipple type="button" class="chip demo-press-ripple-button">Default</button>
    <button cngxPressRipple type="button" class="chip demo-press-ripple-button" [rippleColor]="'#f5a623'">Amber ripple</button>
    <button cngxPressRipple type="button" class="chip demo-press-ripple-button demo-ripple-icon-button" [rippleCentered]="true" aria-label="Centered press + ripple">C</button>
  </div>`,
};
