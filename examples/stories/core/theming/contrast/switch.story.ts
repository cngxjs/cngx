import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Contrast: a global Normal / More / Auto switch',
  subtitle:
    '<code>injectContrast()</code> returns the writable app-wide contrast signal. Binding a Normal / More / Auto toggle to it reflects <code>data-contrast</code> onto <code>&lt;html&gt;</code>, and the shipped overrides strengthen borders and muted text app-wide - correct in both colour schemes.',
  description:
    "This is the global contrast switch a consumer builds. <code>provideContrast()</code> is installed once at the app root (already wired in this examples app), reflecting the chosen preference onto <code>&lt;html data-contrast&gt;</code>. The shipped <code>contrast-tokens.css</code> then boosts the two lowest-contrast foundation surfaces app-wide - for every component, not just this card: <code>--cngx-color-border</code> and <code>--cngx-color-text-muted</code> demote toward the full text colour by <em>referencing</em> the ramp tokens (never a literal), so the boost stays correct in light and dark. <strong>Auto</strong> (the default) removes the attribute so the OS <code>prefers-contrast: more</code> preference drives; <strong>More</strong> forces the boost on; <strong>Normal</strong> opts out even when the OS asks for more. Flip to <strong>More</strong>: the card hairlines darken and the muted captions strengthen toward full text. Set the switch back to <strong>Auto</strong> to follow the OS again.",
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'visual-variants', 'behavior'],
  moduleImports: [
    "import { injectContrast } from '@cngx/core';",
    "import { CngxButtonToggleGroup, CngxButtonToggle } from '@cngx/common/interactive';",
  ],
  imports: ['CngxButtonToggleGroup', 'CngxButtonToggle'],
  references: [
    {
      label: 'MDN prefers-contrast',
      href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-contrast',
    },
    {
      label: 'WCAG 1.4.11 Non-text Contrast',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html',
    },
  ],
  template: `
  <div style="display:flex; flex-wrap:wrap; gap:16px">
    <div style="flex:1 1 220px; border:1px solid var(--cngx-color-border); border-radius:8px; padding:16px; background:var(--cngx-color-surface)">
      <h3 style="margin:0 0 4px; font-size:1rem; color:var(--cngx-color-text)">Bordered card</h3>
      <p style="margin:0; color:var(--cngx-color-text-muted)">A muted caption that strengthens toward full text under More.</p>
    </div>
    <div style="flex:1 1 220px; border:1px solid var(--cngx-color-border); border-radius:8px; padding:16px; background:var(--cngx-color-surface)">
      <h3 style="margin:0 0 4px; font-size:1rem; color:var(--cngx-color-text)">Second card</h3>
      <p style="margin:0; color:var(--cngx-color-text-muted)">Hairline borders derive from <code>--cngx-color-border</code>.</p>
    </div>
  </div>`,
  templateChromeBefore: `
  <div class="cngx-ex-chrome" style="margin-bottom:12px">
    This switch is wired to the app root, so it reflects
    <code>data-contrast</code> onto the whole examples app (every route), not
    just these cards. Choose <strong>More</strong> to strengthen borders and
    muted text; <strong>Auto</strong> follows the OS preference.
  </div>
  <div style="margin-bottom:20px">
    <cngx-button-toggle-group label="Contrast" [(value)]="contrast">
      <button type="button" cngxButtonToggle value="normal">Normal</button>
      <button type="button" cngxButtonToggle value="more">More</button>
      <button type="button" cngxButtonToggle value="auto">Auto</button>
    </cngx-button-toggle-group>
  </div>`,
  setupChrome: `
  protected readonly contrast = injectContrast();`,
};
