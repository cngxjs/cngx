import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHoverable: Basic',
  subtitle: 'Mouse-driven hover state exposed as a writable signal. Read it via the template reference to drive any reactive binding.',
  description: 'Attach <code>[cngxHoverable]</code> to any element and expose the directive via <code>#h="cngxHoverable"</code>. The <code>hovered</code> signal flips true on <code>mouseenter</code> and false on <code>mouseleave</code> so consumers can drive style bindings, conditional content, or downstream signals without writing their own pointer-event handlers. Hover is a mouse-pointer concept by design, so the directive intentionally has no keyboard surface; consumers that need a keyboard-equivalent state should compose with <code>:focus-within</code> or a focus-state directive instead.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxHoverable',
  ],
  moduleImports: [
    'import { CngxHoverable } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxHoverable'],
  template: `
  <div
    cngxHoverable
    #h="cngxHoverable"
    [style.transform]="h.hovered() ? 'scale(1.05)' : 'none'"
    style="display:inline-flex; align-items:center; justify-content:center; min-width:12rem; height:5rem; transition:transform 120ms ease"
  >
    Hover me
  </div>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">hovered()</span>
      <span class="event-value">{{ h.hovered() }}</span>
    </div>
  </div>`,
};
