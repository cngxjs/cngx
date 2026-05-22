import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChip: Custom close icon',
  subtitle: 'Project any element tagged <code>cngxChipClose</code> into the close button to replace the default ✕ glyph.',
  description: 'The close button uses a named content slot, not a <code>TemplateRef</code> input, so consumers drop in their own component or SVG element directly without the outlet / context dance. The chip continues to own the button shell, the <code>(remove)</code> output, and the <code>aria-label</code>; only the inner glyph swaps. Useful when the project ships its own icon set and the default <code>×</code> would look out of place next to it.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: [
    'CngxChip',
  ],
  moduleImports: [
    'import { CngxChip } from \'@cngx/common/display\';',
  ],
  imports: ['CngxChip'],
  template: `
  <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center">
    <cngx-chip [removable]="true" [removeAriaLabel]="'Remove Frontend'">
      Frontend
      <svg cngxChipClose viewBox="0 0 24 24" aria-hidden="true"
        style="width:1em; height:1em; fill:none; stroke:currentColor; stroke-width:2; display:block">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </svg>
    </cngx-chip>

    <cngx-chip [removable]="true" [removeAriaLabel]="'Remove Pending'">
      Pending
      <svg cngxChipClose viewBox="0 0 24 24" aria-hidden="true"
        style="width:1em; height:1em; fill:currentColor; display:block">
        <path d="M19 13H5v-2h14v2z" />
      </svg>
    </cngx-chip>
  </div>`,
};
