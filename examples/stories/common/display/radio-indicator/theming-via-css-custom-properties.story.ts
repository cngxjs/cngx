import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Theming via CSS custom properties',
  subtitle: 'Override <code>--cngx-radio-indicator-checked-color</code>, <code>--cngx-radio-indicator-border-width</code>, <code>--cngx-radio-indicator-dot-size</code>, and friends per consumer.',
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
  <div class="row themed">
    <cngx-radio-indicator [checked]="true" size="lg" />
    <cngx-radio-indicator [checked]="true" size="lg" class="brand-magenta" />
    <cngx-radio-indicator [checked]="true" size="lg" class="brand-emerald" />
  </div>`,
  css: `.row.themed {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 1.75em;
  color: var(--cngx-accent, #4a8cff);
}
.brand-magenta {
  --cngx-radio-indicator-checked-color: #d6266a;
  --cngx-radio-indicator-border-width: 2px;
}
.brand-emerald {
  --cngx-radio-indicator-checked-color: #059669;
  --cngx-radio-indicator-dot-size: 0.6em;
}`,
};
