import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxA11yPanel: Inline on a settings page',
  subtitle:
    'The panel is a plain in-flow card. Drop <code>&lt;cngx-a11y-panel /&gt;</code> where it belongs; it ships no trigger and no overlay. Each group is split-bound to the app-wide preference signal, so a pick reflects onto the root <code>&lt;html data-*&gt;</code> attribute live.',
  description:
    'The four axis groups are CngxButtonToggleGroup radiogroups; the shell is a CngxCard. The panel writes injectA11yPreferences() and nothing else - placement, persistence, and the axis reflectors are the consumer/app concern. This examples app installs all four reflectors at its root, so a pick here re-themes the whole page. Reset restores every axis default and announces through the shared live region.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxA11yPanel'],
  moduleImports: [
    "import { CngxA11yPanel } from '@cngx/ui/a11y';",
    "import { injectA11yPreferences } from '@cngx/core';",
  ],
  imports: ['CngxA11yPanel'],
  setup: `protected readonly prefs = injectA11yPreferences();`,
  template: `<cngx-a11y-panel style="max-width:32rem" />`,
  templateChrome: `<div class="status-row" style="margin-top:16px">
    <span class="cngx-ex-status-readout">density: {{ prefs.density() }}</span>
    <span class="cngx-ex-status-readout">text size: {{ prefs.textScale() }}</span>
    <span class="cngx-ex-status-readout">motion: {{ prefs.motion() }}</span>
    <span class="cngx-ex-status-readout">contrast: {{ prefs.contrast() }}</span>
  </div>`,
};
