import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Tag',
  navLabel: 'Tag',
  navCategory: 'display',
  description:
    'Decorative label / badge / status indicator. Dual selector ([cngxTag] and <cngx-tag>) so it composes onto any host element including <a> for link-mode tags. Removable affordances live in CngxChip; clickable interactions live on native <button cngxTag> / <a cngxTag>.',
  apiComponents: ['CngxTag', 'CngxTagIcon'],
  overview:
    '<p><code>[cngxTag]</code> applies host classes for variant / color / size / truncate / maxWidth. ' +
    'Predefined colours (<code>neutral</code>, <code>success</code>, <code>warning</code>, <code>error</code>, <code>info</code>) cascade through <code>--cngx-tag-{name}-*</code> custom properties; ' +
    'open-string colours emit a <code>data-color="…"</code> attribute consumers can theme directly.</p>',
  moduleImports: ["import { CngxTag, CngxTagIcon } from '@cngx/common/display';"],
  sections: [
    {
      title: 'Variant matrix',
      subtitle: 'Same colour, three visual variants — filled, outline, subtle.',
      imports: ['CngxTag'],
      template: `
  <div class="row">
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
  <div class="row">
    <span cngxTag color="neutral">Neutral</span>
    <span cngxTag color="success">Active</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
    <span cngxTag color="info">Beta</span>
    <span cngxTag color="my-brand">Branded</span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
[data-color="my-brand"] {
  --cngx-tag-bg: #4f46e5;
  --cngx-tag-color: #ffffff;
}`,
    },
    {
      title: 'Density',
      subtitle: '<code>md</code> default; <code>sm</code> shrinks padding + font-size.',
      imports: ['CngxTag'],
      template: `
  <div class="row">
    <span cngxTag size="md" color="info">Medium</span>
    <span cngxTag size="sm" color="info">Small</span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; }`,
    },
    {
      title: 'Truncate + maxWidth',
      subtitle: 'Visual-only truncation — full text remains in the DOM for assistive tech.',
      imports: ['CngxTag'],
      template: `
  <div class="row">
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
  <div class="row">
    <a cngxTag color="info" href="#category/frontend">frontend</a>
    <a cngxTag color="success" href="#category/cleared">cleared</a>
    <a cngxTag color="warning" href="#category/pending">pending</a>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; }
.row a { text-decoration: none; }
.row a:hover { filter: brightness(0.92); }`,
    },
    {
      title: 'Icon slot',
      subtitle: '<code>&lt;svg cngxTagIcon&gt;</code> / <code>&lt;img cngxTagIcon&gt;</code> hosts get sized + <code>aria-hidden="true"</code>; semantic meaning lives on the tag\u2019s text.',
      imports: ['CngxTag', 'CngxTagIcon'],
      template: `
  <div class="row">
    <span cngxTag color="success">
      <svg cngxTagIcon viewBox="0 0 16 16" focusable="false">
        <path fill="currentColor" d="M6.5 11.5 3 8l1.4-1.4 2.1 2.1L11.6 4l1.4 1.4z" />
      </svg>
      Active
    </span>
    <span cngxTag color="warning">
      <svg cngxTagIcon viewBox="0 0 16 16" focusable="false">
        <circle cx="8" cy="8" r="4" fill="currentColor" />
      </svg>
      Pending
    </span>
    <span cngxTag color="error">
      <svg cngxTagIcon viewBox="0 0 16 16" focusable="false">
        <path fill="currentColor" d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="2" />
      </svg>
      Failed
    </span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }`,
    },
  ],
};
