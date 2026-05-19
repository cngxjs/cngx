import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Custom dotGlyph',
  subtitle: 'Project a <code>TemplateRef&lt;void&gt;</code> via <code>[dotGlyph]</code> to replace the default dot with a brand glyph or SVG. Glyph still gates on <code>checked</code>.',
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
  <ng-template #starGlyph>
    <span aria-hidden="true" style="font-size:0.6em">★</span>
  </ng-template>
  <div class="row">
    <div class="cell">
      <cngx-radio-indicator [checked]="true" [dotGlyph]="starGlyph" />
      <span class="caption">custom — star</span>
    </div>
    <div class="cell">
      <cngx-radio-indicator [dotGlyph]="starGlyph" />
      <span class="caption">unchecked — glyph hidden</span>
    </div>
  </div>`,
  css: `.row { display: flex; gap: 24px; align-items: center; color: var(--cngx-accent, #4a8cff); font-size: 1.5em; }
.cell { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.caption { font-size: 0.625em; color: var(--cngx-text-muted, #6b7280); }`,
};
