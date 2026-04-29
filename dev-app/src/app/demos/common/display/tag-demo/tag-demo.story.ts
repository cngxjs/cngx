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
  apiComponents: ['CngxTag', 'CngxIcon', 'CngxAvatar'],
  overview:
    '<p><code>[cngxTag]</code> applies host classes for variant / color / size / truncate / maxWidth. ' +
    'Predefined colours (<code>neutral</code>, <code>success</code>, <code>warning</code>, <code>error</code>, <code>info</code>) cascade through <code>--cngx-tag-{name}-*</code> custom properties; ' +
    'open-string colours emit a <code>data-color="…"</code> attribute consumers can theme directly.</p>',
  moduleImports: ["import { CngxTag, CngxIcon, CngxAvatar } from '@cngx/common/display';"],
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
      title: 'Composition with CngxAvatar',
      subtitle: 'Drop <code>&lt;cngx-avatar&gt;</code> directly inside <code>&lt;span cngxTag&gt;</code> — the tag overrides <code>--cngx-avatar-size</code> via the <code>--cngx-tag-content-size</code> cascade so the avatar scales with the tag\u2019s density instead of forcing the chip taller. Override <code>--cngx-tag-content-size</code> per instance for finer control.',
      imports: ['CngxTag', 'CngxAvatar'],
      template: `
  <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
    <span cngxTag size="sm" color="info">
      <cngx-avatar initials="SM" />
      Sarah M.
    </span>
    <span cngxTag size="md" color="success">
      <cngx-avatar initials="JD" />
      Jane Doe
    </span>
    <span cngxTag size="lg" color="warning">
      <cngx-avatar initials="AK" />
      Alex K.
    </span>
    <span cngxTag size="xl" color="error">
      <cngx-avatar initials="MS" />
      Marcus S.
    </span>
  </div>`,
      css: `.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.cngx-tag cngx-avatar {
  /* Tag overrides --cngx-avatar-size via --cngx-tag-content-size cascade.
   * Consumers can override per-instance:
   *   <span cngxTag style="--cngx-tag-content-size: 2em">…</span>
   */
}`,
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
  ],
};
