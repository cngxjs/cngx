import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Buttons with Press + Ripple',
  subtitle: 'Click or tap each button. You get both instant press feedback (scale via <code>.cngx-pressed</code>) and a ripple wave expanding from the pointer position.',
  description: 'Molecule combining CngxPressable + CngxRipple in one directive. Press feedback + ripple wave with a single attribute.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants', 'behavior'],
  apiComponents: [
    'CngxPressRipple',
  ],
  moduleImports: [
    'import { CngxPressRipple } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxPressRipple'],
  template: `  <p style="margin-top:12px;font-size:0.8125rem;color:var(--cngx-text-secondary,#666)">
    One directive, two behaviors. The molecule composes <code>CngxPressable</code> + <code>CngxRipple</code> via hostDirectives.
  </p>`,
  templateChrome: `<div class="button-row" style="gap:12px">
    <button cngxPressRipple class="chip"
            style="transition:transform 80ms ease"
            [class.cngx-pressed]="">
      Default
    </button>

    <button cngxPressRipple [rippleColor]="'#f5a623'" class="chip"
            style="transition:transform 80ms ease">
      Amber Ripple
    </button>

    <button cngxPressRipple [rippleCentered]="true" class="chip"
            style="width:48px;height:48px;border-radius:50%;padding:0;transition:transform 80ms ease">
      C
    </button>
  </div>`,
};
