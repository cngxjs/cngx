import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Nav Badge — Counts and Dots',
  subtitle: '<code>cngxNavBadge</code> adds count/dot/status indicators. <code>aria-hidden="true"</code> by default — provide <code>[ariaLabel]</code> for unique information.',
  description: 'Composable navigation atoms: CngxNavLink (active state + depth), CngxNavGroup (accordion), CngxNavLabel (section header), CngxNavBadge (counter/dot). Combine them to build sidebar menus.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: [
    'CngxNavLink',
    'CngxNavGroup',
    'CngxNavBadge',
    'CngxNavLabel',
  ],
  moduleImports: [
    'import { CngxNavLink, CngxNavBadge } from \'@cngx/common\';',
  ],
  imports: ['CngxNavLink', 'CngxNavBadge'],
  template: `
  <nav class="nav-demo" style="width: 240px; border: 1px solid var(--cngx-color-border); border-radius: 6px; padding: 0.5rem 0; background: var(--cngx-surface-alt, #f9fafb);">
    <a cngxNavLink style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
      Inbox
      <span cngxNavBadge [value]="12" ariaLabel="12 unread"
            style="background: var(--interactive, #f5a623); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.1em 0.5em; border-radius: 10px; min-width: 1.2em; text-align: center;">
        12
      </span>
    </a>
    <a cngxNavLink style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
      Updates
      <span cngxNavBadge variant="dot" [value]="1"
            style="width: 8px; height: 8px; border-radius: 50%; background: var(--cngx-color-success);">
      </span>
    </a>
    <a cngxNavLink style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
      Archive
      <span cngxNavBadge [value]="0"
            style="background: var(--cngx-color-border, #ddd); color: var(--cngx-color-text-muted); font-size: 0.7rem; padding: 0.1em 0.5em; border-radius: 10px;">
        0
      </span>
    </a>
  </nav>
  <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--cngx-color-text-muted);">
    "Archive" badge has value 0 — <code>cngx-nav-badge--hidden</code> class is applied.
  </p>`,
};
