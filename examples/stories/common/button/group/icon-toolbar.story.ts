import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonGroup: Icon toolbar',
  subtitle: 'A group of groups: labelled sub-groups of icon buttons, spaced apart, one <code>variant</code> and <code>size</code> for all.',
  description: 'When the direct children of a group are groups, the outer group spaces them by <code>--cngx-button-group-gap</code> instead of joining them, floored to <code>--cngx-target-gap</code> on a coarse pointer. A nested group without its own <code>variant</code> or <code>size</code> inherits the outer one. Every group, outer and inner, needs a name, and every icon button needs its own <code>aria-label</code>. Each button is its own Tab stop; a roving-tabindex toolbar is a later addition.',
  level: 'molecule',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxButtonGroup', 'CngxIconButton'],
  moduleImports: ["import { CngxButtonGroup, CngxIconButton } from '@cngx/common/button';"],
  imports: ['CngxButtonGroup', 'CngxIconButton'],
  template: `
  <div cngxButtonGroup variant="outline" size="sm" aria-label="Formatting">
    <div cngxButtonGroup aria-label="Text style">
      <button cngxIconButton aria-label="Bold">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"><path d="M7 4h6a4 4 0 0 1 0 8H7zM7 12h7a4 4 0 0 1 0 8H7z" /></svg>
      </button>
      <button cngxIconButton aria-label="Italic">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 4h8M6 20h8M14 4l-4 16" /></svg>
      </button>
      <button cngxIconButton aria-label="Underline">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14" /></svg>
      </button>
    </div>
    <div cngxButtonGroup aria-label="Alignment">
      <button cngxIconButton aria-label="Align left">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h14" /></svg>
      </button>
      <button cngxIconButton aria-label="Align center">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M5 18h14" /></svg>
      </button>
      <button cngxIconButton aria-label="Align right">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M10 12h10M6 18h14" /></svg>
      </button>
    </div>
    <div cngxButtonGroup aria-label="History">
      <button cngxIconButton aria-label="Undo">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
      </button>
      <button cngxIconButton aria-label="Redo">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></svg>
      </button>
    </div>
  </div>`,
};
