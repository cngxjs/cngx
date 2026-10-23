import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPressRipple: Buttons with press + ripple',
  subtitle: 'One attribute, two behaviors: instant press feedback (<code>.cngx-pressed</code> class for the consumer to style) AND a ripple wave from the pointer position.',
  description: 'Molecule that composes CngxPressable + CngxRipple via hostDirectives so the consumer wires one attribute instead of two. Forwards both directives\' inputs (pressableReleaseDelay, rippleColor, rippleCentered, rippleDisabled) verbatim. The press class is the consumer\'s CSS responsibility - this demo binds a scale transform to the co-hosted CngxPressable through its cngxPressable export, on cngxButton and cngxIconButton hosts.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxPressRipple',
    'CngxButton',
    'CngxIconButton',
  ],
  moduleImports: [
    'import { CngxPressRipple } from \'@cngx/common/interactive\';',
    'import { CngxButton, CngxIconButton } from \'@cngx/common/button\';',
  ],
  imports: ['CngxPressRipple', 'CngxButton', 'CngxIconButton'],
  template: `  <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center">
    <button
      cngxButton
      tone="primary"
      cngxPressRipple
      #p1="cngxPressable"
      style="transition:transform 80ms ease"
      [style.transform]="p1.pressed() ? 'scale(0.96)' : ''"
    >
      Default
    </button>
    <button
      cngxButton="outline"
      cngxPressRipple
      #p2="cngxPressable"
      [rippleColor]="'#f5a623'"
      style="transition:transform 80ms ease"
      [style.transform]="p2.pressed() ? 'scale(0.96)' : ''"
    >
      Amber ripple
    </button>
    <button
      cngxIconButton="outline"
      cngxPressRipple
      #p3="cngxPressable"
      [rippleCentered]="true"
      aria-label="Centered press + ripple"
      style="transition:transform 80ms ease"
      [style.transform]="p3.pressed() ? 'scale(0.9)' : ''"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
    </button>
  </div>`,
};
