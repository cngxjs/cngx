import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckboxIndicator: Variant matrix',
  subtitle: '<code>variant="checkbox"</code> renders a bordered box around the glyph; <code>variant="checkmark"</code> renders the bare glyph. Pick by the surrounding row chrome.',
  description: 'Two side-by-side indicators in the same selected state, one per variant. <code>variant="checkbox"</code> reads as a real form-style checkbox and fits row layouts that need a hit-target shape (table cells, tree nodes, menu-item-checkbox). <code>variant="checkmark"</code> sheds the box and reads as a confirmation tick, used by the forms-select panel where the row itself already carries the visual frame. Both forms share size, color, and glyph slot tokens.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxCheckboxIndicator',
  ],
  moduleImports: [
    'import { CngxCheckboxIndicator } from \'@cngx/common/display\';',
  ],
  imports: ['CngxCheckboxIndicator'],
  template: `
  <div style="display:flex; gap:32px; align-items:center">
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px">
      <cngx-checkbox-indicator variant="checkbox" [checked]="true" />
      <code>variant="checkbox"</code>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px">
      <cngx-checkbox-indicator variant="checkmark" [checked]="true" />
      <code>variant="checkmark"</code>
    </div>
  </div>`,
};
