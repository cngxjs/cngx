import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sizes',
  subtitle: 'Three presets driven by <code>--cngx-radio-indicator-size</code>. Defaults to <code>md</code> (1em).',
  description: 'Decorative dot-in-circle atom. Mirrors CngxCheckboxIndicator: aria-hidden, no outputs, full --cngx-radio-indicator-* theming. Used by the CngxSelect "radio" indicator variant; future single-value form atoms compose the same skin.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxRadioIndicator',
  ],
  moduleImports: [
    'import { CngxRadioIndicator } from \'@cngx/common/display\';',
  ],
  imports: ['CngxRadioIndicator'],
  template: `
  <div class="row">
    <div class="cell">
      <cngx-radio-indicator [checked]="true" size="sm" />
      <span class="caption">sm — 0.875em</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [checked]="true" size="md" />
      <span class="caption">md — 1em</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [checked]="true" size="lg" />
      <span class="caption">lg — 1.25em</span>
    </div>
  </div>`,
  css: `.row { display: flex; gap: 24px; align-items: baseline; color: var(--cngx-accent, #4a8cff); font-size: 1.5em; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.caption { font-size: 0.625em; color: var(--cngx-text-muted, #6b7280); }`,
};
