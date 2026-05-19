import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Slot overrides — custom label',
  subtitle: 'Replace the default <code>cngx-tag__label</code> wrapper with a richer inner element. Use <code>&lt;bdi&gt;</code> for bidi-safe rendering of user-supplied names; replacing the label drops the default ellipsis hook so the consumer template owns the overflow strategy. The label slot context exposes <code>variant</code>, <code>color</code>, <code>size</code>, and <code>truncate</code> reactively via <code>let-*</code> bindings.',
  description: 'Decorative label / badge / status indicator. Dual selector ([cngxTag] and <cngx-tag>) so it composes onto any host element including <a> for link-mode tags. Removable affordances live in CngxChip; clickable interactions live on native <button cngxTag> / <a cngxTag>.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxTag',
    'CngxTagLabel',
    'CngxTagPrefix',
    'CngxTagSuffix',
    'CngxIcon',
    'CngxTagGroup',
    'CngxTagGroupHeader',
    'CngxTagGroupAccessory',
  ],
  moduleImports: [
    'import { CngxTag, CngxTagLabel } from \'@cngx/common/display\';',
  ],
  imports: ['CngxTag', 'CngxTagLabel'],
  template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag color="info">
      <ng-template cngxTagLabel>
        <bdi>عربى</bdi>
      </ng-template>
    </span>
    <span cngxTag color="success" variant="outline">
      <ng-template cngxTagLabel let-variant="variant" let-color="color">
        <span style="font-weight: 700;">{{ color }}</span>
        <span style="opacity: 0.7;">— {{ variant }}</span>
      </ng-template>
    </span>
  </div>`,
  css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
};
