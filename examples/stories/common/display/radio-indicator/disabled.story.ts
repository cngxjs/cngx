import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Disabled',
  subtitle: 'Cosmetic only — opacity is dimmed via <code>--cngx-radio-indicator-disabled-opacity</code>. The atom never intercepts events; the parent row owns the disabled hit-test.',
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
      <cngx-radio-indicator [checked]="true" [disabled]="true" />
      <span class="caption">checked + disabled</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [disabled]="true" />
      <span class="caption">unchecked + disabled</span>
    </div>
  </div>`,
  css: `.row { display: flex; gap: 24px; align-items: center; color: var(--cngx-accent, #4a8cff); font-size: 1.5em; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.caption { font-size: 0.625em; color: var(--cngx-text-muted, #6b7280); opacity: 1; }`,
};
