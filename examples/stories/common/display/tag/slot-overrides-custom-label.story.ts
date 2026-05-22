import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTag: custom label slot',
  subtitle: 'Replace the default <code>cngx-tag__label</code> wrapper with a richer inner element. Use <code>&lt;bdi&gt;</code> for bidi-safe rendering of user-supplied names; replacing the label drops the default ellipsis hook so the consumer template owns the overflow strategy.',
  description: 'The label slot context exposes <code>variant</code>, <code>color</code>, <code>size</code>, and <code>truncate</code> reactively via <code>let-*</code> bindings, so the override stays in sync with host inputs without injecting the directive.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxTag', 'CngxTagLabel'],
  moduleImports: ["import { CngxTag, CngxTagLabel } from '@cngx/common/display';"],
  imports: ['CngxTag', 'CngxTagLabel'],
  references: [
    {
      label: 'HTML Living Standard: the bdi element',
      href: 'https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-bdi-element',
    },
  ],
  template: `
  <div class="demo-tag-row">
    <span cngxTag color="info">
      <ng-template cngxTagLabel>
        <bdi>عربى</bdi>
      </ng-template>
    </span>
    <span cngxTag color="success" variant="outline">
      <ng-template cngxTagLabel let-variant="variant" let-color="color">
        <span class="demo-tag-label-strong">{{ color }}</span>
        <span class="demo-tag-label-meta">({{ variant }})</span>
      </ng-template>
    </span>
  </div>`,
};
