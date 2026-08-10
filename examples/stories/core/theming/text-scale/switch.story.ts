import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Text scale: a global S / M / L switch',
  subtitle:
    '<code>injectTextScale()</code> returns the writable app-wide scale signal. Binding an S / M / L toggle to it reflects <code>data-text-size</code> onto <code>&lt;html&gt;</code> and re-scales the whole page live.',
  description:
    "This is the global text-scale switch a consumer builds. <code>provideTextScale()</code> is installed once at the app root (already wired in this examples app), which reflects the chosen rung onto <code>&lt;html data-text-size&gt;</code>. The shipped <code>text-scale-tokens.css</code> then applies <code>font-size: calc(var(--cngx-font-base, 100%) * var(--cngx-font-scale, 1))</code> at the root, so every <code>rem</code>-based size in the type ramp scales together - not just this card, but the whole page. <code>injectTextScale()</code> hands you the writable signal; bind it to any control and writing it re-scales reactively. The default rung <strong>M</strong> is the identity multiplier (1), so unset markup is pixel-identical to today; <strong>S</strong> is 0.9375 and <strong>L</strong> is 1.125. The multiplier stacks on the user's own browser font-size (WCAG 1.4.4), augmenting their setting rather than replacing it. Set the switch back to <strong>M</strong> to restore the default.",
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  moduleImports: [
    "import { injectTextScale } from '@cngx/core';",
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: ['CngxButtonToggleGroup', 'CngxButtonToggle'],
  references: [
    {
      label: 'WCAG 1.4.4 Resize Text',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html',
    },
  ],
  setup: `
  protected readonly textScale = injectTextScale();`,
  template: `
  <div style="display:flex; flex-direction:column; gap:12px; align-items:flex-start; max-width:52ch">
    <cngx-button-toggle-group label="Text size" [(value)]="textScale">
      <button type="button" cngxButtonToggle value="sm">S</button>
      <button type="button" cngxButtonToggle value="md">M</button>
      <button type="button" cngxButtonToggle value="lg">L</button>
    </cngx-button-toggle-group>

    <p style="margin:0">
      The quick brown fox jumps over the lazy dog. Switching the control
      re-scales every rem-based size on the page, because provideTextScale
      reflects the choice onto the root element.
    </p>
  </div>`,
  templateChromeBefore: `
  <div class="cngx-ex-chrome" style="margin-bottom:12px">
    This switch is wired to the app root, so it re-scales the <strong>whole</strong>
    examples app (every route), not just this card. Choose <strong>M</strong> to
    restore the default scale.
  </div>`,
};
