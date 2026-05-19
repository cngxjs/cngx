import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Nav Links — Active State + Depth',
  subtitle: '<code>cngxNavLink</code> sets a <code>--cngx-nav-depth</code> CSS var for indentation and toggles <code>cngx-nav-link--active</code>. Click a link to change the active state.',
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
    'import { CngxNavLink } from \'@cngx/common\';',
  ],
  imports: ['CngxNavLink'],
  setup: `protected readonly activeLink = signal('/dashboard');
  protected readonly links = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/analytics', label: 'Analytics', badge: 3 },
    { path: '/reports', label: 'Reports' },
  ];`,
  template: `
  <nav class="nav-demo" style="width: 240px; border: 1px solid var(--cngx-color-border); border-radius: 6px; padding: 0.5rem 0; background: var(--cngx-surface-alt, #f9fafb);">
    @for (link of links; track link.path) {
      <a cngxNavLink [active]="activeLink() === link.path"
         (click)="activeLink.set(link.path); $event.preventDefault()"
         [href]="link.path"
         style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text); border-left: 3px solid transparent; transition: all 0.15s ease;"
         [style.border-left-color]="activeLink() === link.path ? 'var(--interactive, #f5a623)' : 'transparent'"
         [style.background]="activeLink() === link.path ? 'var(--interactive-subtle-bg, rgba(245, 166, 35, 0.08))' : 'transparent'"
         [style.font-weight]="activeLink() === link.path ? '600' : '400'">
        {{ link.label }}
      </a>
    }

    <div style="margin: 0.5rem 1rem; border-top: 1px solid var(--cngx-color-border);"></div>

    <a cngxNavLink [depth]="0" [active]="false"
       style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
      Top level (depth 0)
    </a>
    <a cngxNavLink [depth]="1" [active]="false"
       style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 12px); text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
      Nested (depth 1)
    </a>
    <a cngxNavLink [depth]="2" [active]="false"
       style="display: block; padding: 0.5rem 1rem; padding-left: calc(1rem + 24px); text-decoration: none; font-size: 0.875rem; color: var(--cngx-color-text);">
      Deep nested (depth 2)
    </a>
  </nav>`,
};
