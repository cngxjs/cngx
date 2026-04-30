import type { DemoSpec } from '../../../../dev-tools/demo-spec';

// Row styling is repeated as an inline `style` attribute on each wrapper
// div instead of being extracted to a module-scope const because the
// demo generator's regex-based story loader (scripts/generate-demos.mjs)
// only evals the `STORY` export inside a `new Function()` scope — any
// helper consts at module scope would be undefined at eval time and the
// story would silently fail to load. Per CLAUDE.md the `css` field on a
// story section is display-only (shown as source, not injected at
// runtime), so inline `style` is the correct path.

export const STORY: DemoSpec = {
  title: 'Tag',
  navLabel: 'Tag',
  navCategory: 'display',
  description:
    'Decorative label / badge / status indicator. Dual selector ([cngxTag] and <cngx-tag>) so it composes onto any host element including <a> for link-mode tags. Removable affordances live in CngxChip; clickable interactions live on native <button cngxTag> / <a cngxTag>.',
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
  overview:
    '<p><code>[cngxTag]</code> applies host classes for variant / color / size / truncate / maxWidth. ' +
    'Predefined colours (<code>neutral</code>, <code>success</code>, <code>warning</code>, <code>error</code>, <code>info</code>) cascade through <code>--cngx-tag-{name}-*</code> custom properties; ' +
    'open-string colours emit a <code>data-color="…"</code> attribute consumers can theme directly. ' +
    '<code>&lt;cngx-tag-group&gt;</code> wraps siblings in a flex-wrap row with optional <code>role="list"</code> semantics that cascade <code>role="listitem"</code> to every projected <code>cngxTag</code> reactively via the <code>CNGX_TAG_GROUP</code> DI token.</p>',
  moduleImports: [
    "import { CngxTag, CngxTagGroup, CngxTagGroupHeader, CngxTagGroupAccessory, CngxTagLabel, CngxTagPrefix, CngxTagSuffix, CngxIcon } from '@cngx/common/display';",
  ],
  sections: [
    {
      title: 'Variant matrix',
      subtitle: 'Same colour, three visual variants — filled, outline, subtle.',
      imports: ['CngxTag'],
      template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag variant="filled" color="success">Filled</span>
    <span cngxTag variant="outline" color="success">Outline</span>
    <span cngxTag variant="subtle" color="success">Subtle</span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
    },
    {
      title: 'Color palette',
      subtitle: 'Five predefined semantic colours plus open-string extension via <code>data-color</code>.',
      imports: ['CngxTag'],
      template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag color="neutral">Neutral</span>
    <span cngxTag color="success">Active</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
    <span cngxTag color="info">Beta</span>
    <span cngxTag color="my-brand" style="--cngx-tag-bg: #4f46e5; --cngx-tag-color: #ffffff;">Branded</span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
[data-color="my-brand"] {
  --cngx-tag-bg: #4f46e5;
  --cngx-tag-color: #ffffff;
}`,
    },
    {
      title: 'Density',
      subtitle: 'Four sizes scale padding + font-size; <code>md</code> is the default.',
      imports: ['CngxTag'],
      template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag size="sm" color="info">Small</span>
    <span cngxTag size="md" color="info">Medium</span>
    <span cngxTag size="lg" color="info">Large</span>
    <span cngxTag size="xl" color="info">Extra large</span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
    },
    {
      title: 'Truncate + maxWidth',
      subtitle: 'Visual-only truncation — full text remains in the DOM for assistive tech.',
      imports: ['CngxTag'],
      template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag color="neutral" [truncate]="true" maxWidth="8rem">A very long taxonomy label that overflows</span>
    <span cngxTag color="info" [truncate]="true" maxWidth="12rem">Another lengthy descriptor here</span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
    },
    {
      title: 'Link mode',
      subtitle: 'Native <code>&lt;a cngxTag&gt;</code> preserves anchor semantics — focus, keyboard, navigation.',
      imports: ['CngxTag'],
      template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <a cngxTag color="info" href="#category/frontend" style="text-decoration: none;">frontend</a>
    <a cngxTag color="success" href="#category/cleared" style="text-decoration: none;">cleared</a>
    <a cngxTag color="warning" href="#category/pending" style="text-decoration: none;">pending</a>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; }
.row a { text-decoration: none; }
.row a:hover { filter: brightness(0.92); }`,
    },
    {
      title: 'Composition with CngxIcon',
      subtitle: 'Drop <code>&lt;cngx-icon&gt;</code> directly inside <code>&lt;span cngxTag&gt;</code> — no tag-specific icon atom needed. CngxIcon handles sizing, vertical alignment, and <code>aria-hidden</code>.',
      imports: ['CngxTag', 'CngxIcon'],
      template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag color="success">
      <cngx-icon size="sm">
        <svg viewBox="0 0 16 16" focusable="false"><path fill="currentColor" d="M6.5 11.5 3 8l1.4-1.4 2.1 2.1L11.6 4l1.4 1.4z" /></svg>
      </cngx-icon>
      Active
    </span>
    <span cngxTag color="warning">
      <cngx-icon size="sm">
        <svg viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="4" fill="currentColor" /></svg>
      </cngx-icon>
      Pending
    </span>
    <span cngxTag color="error">
      <cngx-icon size="sm">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" focusable="false"><path d="m4 4 8 8m0-8-8 8" /></svg>
      </cngx-icon>
      Failed
    </span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
    },
    {
      title: 'Slot overrides — prefix / label / suffix',
      subtitle:
        'Project <code>&lt;ng-template cngxTagPrefix&gt;</code>, <code>&lt;ng-template cngxTagLabel&gt;</code>, or <code>&lt;ng-template cngxTagSuffix&gt;</code> to control each region. Prefix and suffix slots render no DOM when omitted; the default label wraps content in <code>cngx-tag__label</code> for ellipsis support.',
      imports: ['CngxTag', 'CngxTagPrefix', 'CngxTagSuffix', 'CngxIcon'],
      template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag color="success">
      <ng-template cngxTagPrefix>
        <cngx-icon size="sm" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false"><path fill="currentColor" d="M6.5 11.5 3 8l1.4-1.4 2.1 2.1L11.6 4l1.4 1.4z" /></svg>
        </cngx-icon>
      </ng-template>
      Active
    </span>
    <span cngxTag color="info">
      Frontend
      <ng-template cngxTagSuffix>
        <cngx-icon size="sm" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" focusable="false"><path d="m4 6 4 4 4-4" /></svg>
        </cngx-icon>
      </ng-template>
    </span>
    <span cngxTag color="warning">
      <ng-template cngxTagPrefix>
        <cngx-icon size="sm" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false"><circle cx="8" cy="8" r="4" fill="currentColor" /></svg>
        </cngx-icon>
      </ng-template>
      Pending review
    </span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
    },
    {
      title: 'Slot overrides — custom label',
      subtitle:
        'Replace the default <code>cngx-tag__label</code> wrapper with a richer inner element. Use <code>&lt;bdi&gt;</code> for bidi-safe rendering of user-supplied names; replacing the label drops the default ellipsis hook so the consumer template owns the overflow strategy. The label slot context exposes <code>variant</code>, <code>color</code>, <code>size</code>, and <code>truncate</code> reactively via <code>let-*</code> bindings.',
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
    },
    {
      title: 'Group + semantic list',
      subtitle: 'Wrap projected tags in <code>&lt;cngx-tag-group [semanticList]="true" label="…"&gt;</code> to expose a real <code>role="list"</code> with reactive <code>role="listitem"</code> children — AT reads "Filters, list, 5 items".',
      imports: ['CngxTag', 'CngxTagGroup'],
      template: `
  <cngx-tag-group [semanticList]="true" label="Filters">
    <span cngxTag color="info">Frontend</span>
    <span cngxTag color="info">Backend</span>
    <span cngxTag color="success">Cleared</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
  </cngx-tag-group>`,
      css: `cngx-tag-group { /* role="list", aria-label="Filters" applied automatically */ }`,
    },
    {
      title: 'Group with header + accessory',
      subtitle:
        'Project <code>&lt;ng-template cngxTagGroupHeader&gt;</code> above the tag row and <code>&lt;ng-template cngxTagGroupAccessory&gt;</code> below it. Both slot contexts expose the live <code>count</code> of projected <code>cngxTag</code> children plus the group\'s reactive state — consumer "Filters ({{ count }})" patterns work without injecting the directive.',
      imports: ['CngxTag', 'CngxTagGroup', 'CngxTagGroupHeader', 'CngxTagGroupAccessory'],
      template: `
  <cngx-tag-group [semanticList]="true" label="Active filters">
    <ng-template cngxTagGroupHeader let-count="count">
      <strong>Filters ({{ count }})</strong>
    </ng-template>
    <span cngxTag color="info">Frontend</span>
    <span cngxTag color="info">Backend</span>
    <span cngxTag color="success">Cleared</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
    <ng-template cngxTagGroupAccessory let-count="count">
      <button type="button">Clear all ({{ count }})</button>
    </ng-template>
  </cngx-tag-group>`,
      css: `/* Header / accessory zones flow through --cngx-tag-group-stack-gap; row layout untouched. */`,
    },
    {
      title: 'Layout-only — gap variants',
      subtitle: 'Without <code>[semanticList]</code> the group is a decorative flex-wrap row; <code>[gap]</code> scales the spacing through <code>--cngx-tag-group-gap-*</code> custom properties.',
      imports: ['CngxTag', 'CngxTagGroup'],
      template: `
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <cngx-tag-group gap="xs">
      <span cngxTag color="neutral">xs</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">tight</span>
    </cngx-tag-group>
    <cngx-tag-group gap="sm">
      <span cngxTag color="neutral">sm</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">default</span>
    </cngx-tag-group>
    <cngx-tag-group gap="md">
      <span cngxTag color="neutral">md</span>
      <span cngxTag color="neutral">gap</span>
      <span cngxTag color="neutral">roomy</span>
    </cngx-tag-group>
  </div>`,
      css: `cngx-tag-group { /* gap resolves through --cngx-tag-group-gap-{xs,sm,md} */ }`,
    },
    {
      title: 'Layout-only — alignment',
      subtitle: 'When the group has more horizontal room than its tags, <code>[align]</code> picks the cross-axis distribution. <code>between</code> resolves to <code>justify-content: space-between</code>.',
      imports: ['CngxTag', 'CngxTagGroup'],
      template: `
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <cngx-tag-group align="start" style="border: 1px dashed #d1d5db; padding: 8px; min-width: 24rem;">
      <span cngxTag color="info">start</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="center" style="border: 1px dashed #d1d5db; padding: 8px; min-width: 24rem;">
      <span cngxTag color="info">center</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="end" style="border: 1px dashed #d1d5db; padding: 8px; min-width: 24rem;">
      <span cngxTag color="info">end</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
    <cngx-tag-group align="between" style="border: 1px dashed #d1d5db; padding: 8px; min-width: 24rem;">
      <span cngxTag color="info">between</span>
      <span cngxTag color="info">align</span>
    </cngx-tag-group>
  </div>`,
      css: `cngx-tag-group[align="between"] { justify-content: space-between; }`,
    },
  ],
};
