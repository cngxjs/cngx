import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Button Ripples',
  subtitle: 'Click each button to see the ripple expand from the pointer position. The ripple color follows <code>currentColor</code> by default.',
  description: 'Touch/click ripple feedback without Material dependency. CSS-var positioned, consumer-styled.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxRipple',
  ],
  moduleImports: [
    'import { CngxRipple } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxRipple'],
  template: `
  <div class="button-row" style="gap:12px">
    <button cngxRipple class="chip" >
      Default Ripple
    </button>

    <button cngxRipple [rippleColor]="'#f5a623'" class="chip"
            >
      Custom Color
    </button>

    <button cngxRipple [rippleCentered]="true" class="chip"
            style="position:relative;overflow:hidden;width:48px;height:48px;border-radius:50%;padding:0">
      C
    </button>
  </div>`,
};
