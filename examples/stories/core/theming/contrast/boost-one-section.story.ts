import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxContrast: boost one section',
  subtitle:
    '<code>[cngxContrast]="\'more\'"</code> reflects <code>data-contrast</code> onto one section, so its borders and muted text strengthen while the rest of the page keeps the root contrast.',
  description:
    "Both panels draw their hairline from <code>--cngx-color-border</code> and their caption from <code>--cngx-color-text-muted</code>. The right panel carries <code>cngxContrast</code>; the override block in <code>contrast-tokens.css</code> is unanchored, so <code>data-contrast='more'</code> on the section demotes the muted text to the full text colour and mixes the border from 60% text into the surface, for that subtree only and correct in both colour schemes. The input accepts only <code>more</code> and <code>normal</code>: <code>auto</code> means \"follow the OS <code>prefers-contrast</code> query\" and lives on <code>provideContrast()</code> at the root. A subtree <code>normal</code> cannot un-boost inside a root <code>more</code> or an OS high-contrast context - subtree scoping is for raising contrast; opting out is the root's job. If the page is already boosted, both panels look the same.",
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'visual-variants'],
  apiComponents: ['CngxContrast', 'injectContrast'],
  moduleImports: [
    "import { CngxContrast, injectContrast } from '@cngx/core';",
    "import { CngxToggle } from '@cngx/common/interactive';",
  ],
  imports: ['CngxContrast', 'CngxToggle'],
  references: [
    {
      label: 'WCAG 1.4.11 Non-text Contrast',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html',
    },
  ],
  setup: `
  protected readonly boostSection = signal(true);`,
  template: `
  <div class="demo-scope-compare">
    <section class="demo-scope-panel" aria-labelledby="contrast-root-h">
      <h3 id="contrast-root-h">Root contrast</h3>
      <p>No directive - the hairline and this caption use the document tokens.</p>
    </section>

    <section
      class="demo-scope-panel"
      [cngxContrast]="boostSection() ? 'more' : undefined"
      aria-labelledby="contrast-scoped-h"
    >
      <h3 id="contrast-scoped-h">Scoped contrast</h3>
      <p>Carries cngxContrast - the hairline and this caption strengthen here only.</p>
    </section>
  </div>`,
  templateChromeBefore: `
  <div class="cngx-ex-chrome" style="margin-bottom:12px">
    Toggle the scope on the right-hand section and compare its border and
    caption with the unscoped panel on the left.
  </div>
  <div style="margin-bottom:20px">
    <cngx-toggle [(value)]="boostSection">Boost contrast in the right section</cngx-toggle>
  </div>`,
  setupChrome: `
  protected readonly rootContrast = injectContrast();
  protected readonly scope = viewChild(CngxContrast);`,
  templateChrome: `
  <div class="event-grid">
    <div class="event-row">
      <span class="event-label">injectContrast() (root)</span>
      <span class="event-value">{{ rootContrast() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">CngxContrast.contrast() (section)</span>
      <span class="event-value">{{ scope()?.contrast() ?? 'unset' }}</span>
    </div>
  </div>`,
};
