import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckboxIndicator: Custom glyph',
  subtitle: '<code>[checkGlyph]</code> and <code>[dashGlyph]</code> accept a <code>TemplateRef&lt;void&gt;</code> that replaces the default check / dash glyph without forking the atom.',
  description: 'Two indicators in the same checked / indeterminate state, but with consumer-supplied SVG glyphs in place of the built-in ✓ and − characters. The slot inputs are convention-compatible with the other cngx slot directives: pass a local <code>#ref</code> from an <code>ng-template</code>. The replacement template renders inside the same <code>.cngx-checkbox-indicator__box</code> in checkbox mode (or bare in checkmark mode), so size, border, color, and disabled-dim continue to come from the atom.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
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
      <cngx-checkbox-indicator
        variant="checkbox"
        size="lg"
        [checked]="true"
        [checkGlyph]="heartGlyph"
      />
      <code>checkGlyph</code>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px">
      <cngx-checkbox-indicator
        variant="checkbox"
        size="lg"
        [indeterminate]="true"
        [dashGlyph]="ellipsisGlyph"
      />
      <code>dashGlyph</code>
    </div>
  </div>

  <ng-template #heartGlyph>
    <svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em; height:1em; fill:currentColor; display:block">
      <path d="M12 21s-7-4.5-9.5-9C.9 8.6 2.5 5 6 5c2 0 3.5 1 4 2.5C10.5 6 12 5 14 5c3.5 0 5.1 3.6 3.5 7-2.5 4.5-9.5 9-9.5 9z"/>
    </svg>
  </ng-template>

  <ng-template #ellipsisGlyph>
    <svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em; height:1em; fill:currentColor; display:block">
      <circle cx="6" cy="12" r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
      <circle cx="18" cy="12" r="1.5"/>
    </svg>
  </ng-template>`,
};
