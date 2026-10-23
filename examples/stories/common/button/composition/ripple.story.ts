import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Composition: Ripple',
  subtitle: 'Co-host <code>cngxRipple</code> on a <code>cngxButton</code> or <code>cngxIconButton</code>; inside a <code>cngxButtonGroup</code> each segment ripples on its own.',
  description: 'The ripple is composed on the host, not built into the button: add <code>cngxRipple</code> where you want the press feedback and leave it off where you do not. <code>[rippleCentered]="true"</code> starts the wave from the host center, which suits a square icon button. Under <code>prefers-reduced-motion: reduce</code> the ripple is off. The wave is clipped inside its own container that follows the host radius, so the host is never clipped and the touch target around an icon button stays intact.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxRipple', 'CngxButton', 'CngxIconButton', 'CngxButtonGroup', 'CngxIcon'],
  moduleImports: [
    "import { CngxButton, CngxButtonGroup, CngxIconButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxRipple } from '@cngx/common/interactive';",
  ],
  imports: ['CngxButton', 'CngxButtonGroup', 'CngxIconButton', 'CngxIcon', 'CngxRipple'],
  template: `
  <div style="display:flex; flex-wrap:wrap; align-items:center; gap:12px">
    <button cngxButton tone="primary" cngxRipple>Save changes</button>
    <button cngxIconButton="outline" cngxRipple [rippleCentered]="true" aria-label="Add item">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </cngx-icon>
    </button>
    <div cngxButtonGroup variant="outline" aria-label="Calendar navigation">
      <button cngxButton cngxRipple>Previous</button>
      <button cngxButton cngxRipple>Today</button>
      <button cngxButton cngxRipple>Next</button>
    </div>
  </div>`,
};
