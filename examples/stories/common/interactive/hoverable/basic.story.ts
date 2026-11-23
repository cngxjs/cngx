import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHoverable: Basic',
  subtitle: 'Pointer hover state exposed as a read-only signal. Read it via the template reference to drive any reactive binding; pair it with focus so keyboard users get the same highlight.',
  description: 'Attach <code>[cngxHoverable]</code> to any element and expose the directive via <code>#h="cngxHoverable"</code>. The <code>hovered</code> signal flips true when a mouse or pen pointer enters the host and false when it leaves. A tap does not leave the host hovered: the directive records the pointer type and ignores the mouse event browsers emulate after a touch contact. Hover is a pointer concept, so the directive has no keyboard surface; this demo puts it on a button next to <code>cngxFocusVisible</code> and ORs the two signals, so the highlight also follows keyboard focus.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxHoverable',
    'CngxFocusVisible',
  ],
  moduleImports: [
    'import { CngxHoverable } from \'@cngx/common/interactive\';',
    'import { CngxFocusVisible } from \'@cngx/common/a11y\';',
  ],
  imports: ['CngxHoverable', 'CngxFocusVisible'],
  template: `
  <button
    type="button"
    cngxHoverable
    #h="cngxHoverable"
    cngxFocusVisible
    #fv="cngxFocusVisible"
    class="demo-hoverable-target"
    [class.demo-hoverable-target--active]="h.hovered() || fv.focusVisible()"
    [style.transform]="h.hovered() || fv.focusVisible() ? 'scale(1.05)' : 'none'"
    style="display:inline-flex; align-items:center; justify-content:center; min-width:12rem; height:5rem; font:inherit"
  >
    Hover or focus me
  </button>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">hovered()</span>
      <span class="event-value">{{ h.hovered() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">focusVisible()</span>
      <span class="event-value">{{ fv.focusVisible() }}</span>
    </div>
  </div>`,
};
