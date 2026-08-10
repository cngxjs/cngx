import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Motion: a global Full / Reduced / Auto switch',
  subtitle:
    '<code>injectMotion()</code> returns the writable app-wide motion signal. Binding a Full / Reduced / Auto toggle to it reflects <code>data-motion</code> onto <code>&lt;html&gt;</code>, and the shipped safety net collapses motion app-wide - while keeping essential loading affordances legible.',
  description:
    "This is the global motion switch a consumer builds. <code>provideMotion()</code> is installed once at the app root (already wired in this examples app), reflecting the chosen preference onto <code>&lt;html data-motion&gt;</code>. The shipped <code>motion-tokens.css</code> safety net then collapses <code>animation-duration</code> / <code>transition-duration</code> app-wide - for every element, not just this card. <strong>Auto</strong> (the default) removes the attribute so the OS <code>prefers-reduced-motion</code> preference drives; <strong>Reduced</strong> forces motion off; <strong>Full</strong> opts back into motion even when the OS asks to reduce. Crucially, reduced motion should silence <em>decorative</em> motion without dropping <em>essential</em> status: the safety net carves out <code>role='status'</code> / <code>role='progressbar'</code> hosts (which <code>CngxLoadingIndicator</code> and <code>CngxProgress</code> expose) to a slow opacity pulse instead of freezing them - so a loader never dies into a frozen ring. A skeleton is deliberately not carved out: its static placeholder shape still reads as loading, so its shimmer may freeze. Flip to <strong>Reduced</strong>: the spinner, bar and progress indicators keep pulsing while the skeleton shimmer stops. Set the switch back to <strong>Auto</strong> to follow the OS again.",
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'async-state', 'behavior'],
  moduleImports: [
    "import { injectMotion } from '@cngx/core';",
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
    "import { CngxLoadingIndicator, CngxProgress } from '@cngx/ui/feedback';",
    "import { CngxSkeleton } from '@cngx/common/layout';",
  ],
  imports: [
    'CngxButtonToggleGroup',
    'CngxButtonToggle',
    'CngxLoadingIndicator',
    'CngxProgress',
    'CngxSkeleton',
  ],
  references: [
    {
      label: 'WCAG 2.3.3 Animation from Interactions',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html',
    },
    {
      label: 'MDN prefers-reduced-motion',
      href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion',
    },
  ],
  template: `
  <div style="display:flex; flex-wrap:wrap; gap:28px 32px; align-items:center">
    <div style="display:flex; flex-direction:column; gap:8px; align-items:center">
      <cngx-loading-indicator [loading]="true" [delay]="0" variant="spinner" label="Loading data" />
      <small>spinner</small>
    </div>
    <div style="display:flex; flex-direction:column; gap:8px; align-items:stretch; min-inline-size:160px">
      <cngx-loading-indicator [loading]="true" [delay]="0" variant="bar" label="Loading data" />
      <small style="text-align:center">bar</small>
    </div>
    <div style="display:flex; flex-direction:column; gap:8px; align-items:center">
      <cngx-progress variant="circular" label="Working" />
      <small>progress (circular)</small>
    </div>
    <div style="display:flex; flex-direction:column; gap:8px; align-items:stretch; min-inline-size:160px">
      <cngx-progress variant="linear" label="Working" />
      <small style="text-align:center">progress (linear)</small>
    </div>
    <div style="display:flex; flex-direction:column; gap:8px; align-items:stretch; min-inline-size:160px">
      <div [cngxSkeleton]="true" class="demo-skeleton-line"></div>
      <small style="text-align:center">skeleton</small>
    </div>
  </div>`,
  templateChromeBefore: `
  <div class="cngx-ex-chrome" style="margin-bottom:12px">
    This switch is wired to the app root, so it reflects
    <code>data-motion</code> onto the whole examples app (every route), not just
    this card. Choose <strong>Reduced</strong> to watch the loaders pulse while
    the skeleton shimmer freezes; <strong>Auto</strong> follows the OS preference.
  </div>
  <div style="margin-bottom:20px">
    <cngx-button-toggle-group label="Motion" [(value)]="motion">
      <button type="button" cngxButtonToggle value="full">Full</button>
      <button type="button" cngxButtonToggle value="reduced">Reduced</button>
      <button type="button" cngxButtonToggle value="auto">Auto</button>
    </cngx-button-toggle-group>
  </div>`,
  setupChrome: `
  protected readonly motion = injectMotion();`,
};
