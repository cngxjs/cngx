import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sidenav',
  description:
    'Declarative sidebar organism composing drawer, backdrop, scroll lock, and responsive media query atoms. Supports dual sidebars (start + end), mode switching (over/push/side), and responsive auto-switch.',
  moduleImports: [
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxSidenavHeader, CngxSidenavFooter } from '@cngx/ui';",
    "import { CngxNavLink, CngxNavLabel } from '@cngx/common';",
  ],
  setup: `
  // Single sidebar
  protected readonly singleOpen = signal(true);
  protected readonly singleMode = signal<'over' | 'push' | 'side'>('side');
  protected readonly modes: ('over' | 'push' | 'side')[] = ['over', 'push', 'side'];

  // Dual sidebar
  protected readonly leftOpen = signal(true);
  protected readonly rightOpen = signal(false);

  // Active link
  protected readonly activeLink = signal('/dashboard');
  protected readonly navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/reports', label: 'Reports' },
  ];
  `,
  sections: [
    {
      title: 'Single Sidebar -- Mode Switching',
      subtitle:
        'A single <code>cngx-sidenav</code> with mode control. ' +
        '<strong>side</strong> = permanent, <strong>push</strong> = pushes content, <strong>over</strong> = overlays. ' +
        'The component handles all CSS transitions, positioning, and backdrop internally.',
      imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxSidenavFooter', 'CngxNavLink', 'CngxNavLabel'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Mode:</span>
    @for (m of modes; track m) {
      <button class="chip" [class.chip--active]="singleMode() === m"
              (click)="singleMode.set(m)">{{ m }}</button>
    }
    <button class="sort-btn" (click)="singleOpen.set(!singleOpen())">
      {{ singleOpen() ? 'Close' : 'Open' }}
    </button>
  </div>

  <cngx-sidenav-layout style="height: 320px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; margin-top: 0.75rem;">
    <cngx-sidenav position="start" [(opened)]="singleOpen" [mode]="singleMode()" width="220px">
      <cngx-sidenav-header style="padding: 1rem; font-weight: 700;">
        My App
      </cngx-sidenav-header>

      <span cngxNavLabel style="display: block; padding: 0.5rem 1rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #888);">
        Navigation
      </span>
      @for (link of navLinks; track link.path) {
        <a cngxNavLink [active]="activeLink() === link.path"
           (click)="activeLink.set(link.path); $event.preventDefault()"
           style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.85rem; color: inherit; border-left: 3px solid transparent;"
           [style.border-left-color]="activeLink() === link.path ? 'var(--interactive, #f5a623)' : 'transparent'"
           [style.background]="activeLink() === link.path ? 'var(--interactive-subtle-bg, rgba(245, 166, 35, 0.08))' : ''"
           [style.font-weight]="activeLink() === link.path ? '600' : '400'">
          {{ link.label }}
        </a>
      }

      <cngx-sidenav-footer style="padding: 0.75rem 1rem; font-size: 0.75rem; color: var(--text-muted, #888);">
        v1.0.0
      </cngx-sidenav-footer>
    </cngx-sidenav>

    <cngx-sidenav-content style="padding: 1rem;">
      <p><strong>Mode:</strong> {{ singleMode() }}</p>
      <p><strong>Active:</strong> {{ activeLink() }}</p>
      <p style="color: var(--text-muted, #888); font-size: 0.85rem;">
        @if (singleMode() === 'side') {
          Sidebar is always visible. No toggle needed.
        } @else if (singleMode() === 'push') {
          Content shifts when the sidebar opens.
        } @else {
          Sidebar overlays content. Click backdrop or press Escape to close.
        }
      </p>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
    },
    {
      title: 'Dual Sidebar -- Start + End',
      subtitle:
        'Two sidenavs in the same layout. The left sidebar uses <code>push</code> mode, ' +
        'the right is an <code>over</code> overlay panel. The layout manages a shared backdrop.',
      imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxNavLink'],
      template: `
  <div class="button-row">
    <button class="sort-btn" (click)="leftOpen.set(!leftOpen())">
      Left: {{ leftOpen() ? 'open' : 'closed' }}
    </button>
    <button class="sort-btn" (click)="rightOpen.set(!rightOpen())">
      Right: {{ rightOpen() ? 'open' : 'closed' }}
    </button>
  </div>

  <cngx-sidenav-layout style="height: 300px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; margin-top: 0.75rem;">
    <cngx-sidenav position="start" [(opened)]="leftOpen" mode="push" width="180px">
      @for (item of ['Home', 'Tasks', 'Messages', 'Calendar']; track item) {
        <a cngxNavLink style="display: block; padding: 0.5rem 1rem; text-decoration: none; font-size: 0.85rem; color: inherit;">
          {{ item }}
        </a>
      }
    </cngx-sidenav>

    <cngx-sidenav-content style="padding: 1rem;">
      <p><strong>Main content</strong> with dual sidebars.</p>
      <p style="font-size: 0.85rem; color: var(--text-muted, #888);">
        Left is push mode, right is overlay. Open the right panel to see the shared backdrop.
      </p>
    </cngx-sidenav-content>

    <cngx-sidenav position="end" [(opened)]="rightOpen" mode="over" width="260px">
      <div style="padding: 1rem;">
        <strong>Detail Panel</strong>
        <p style="font-size: 0.85rem; color: var(--text-muted, #888); margin-top: 0.5rem;">
          Right-side overlay for item details, settings, or contextual info.
        </p>
        <button class="sort-btn" (click)="rightOpen.set(false)">Close</button>
      </div>
    </cngx-sidenav>
  </cngx-sidenav-layout>

  <div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="leftOpen()">left: {{ leftOpen() ? 'open' : 'closed' }}</span>
    <span class="status-badge" [class.active]="rightOpen()">right: {{ rightOpen() ? 'open' : 'closed' }}</span>
  </div>`,
    },
    {
      title: 'API -- Component Structure',
      subtitle:
        'The organism composes drawer, backdrop, scroll lock, and media query atoms. The consumer only needs the declarative template. ' +
        'Material theming via <code>sidenav-theme.scss</code> provides colors, borders, and density tokens.',
      template: `
  <pre class="code-block"><code>// styles.scss
@use '@cngx/ui/sidenav/sidenav-theme' as sidenav;

html &#123;
  @include sidenav.theme($theme);
&#125;

// template
&lt;cngx-sidenav-layout&gt;
  &lt;cngx-sidenav position="start"
                [(opened)]="navOpen"
                [responsive]="'(min-width: 1024px)'"
                width="280px"&gt;
    &lt;cngx-sidenav-header&gt;Logo&lt;/cngx-sidenav-header&gt;

    &lt;span cngxNavLabel&gt;Section&lt;/span&gt;
    &lt;a cngxNavLink [active]="true"&gt;Dashboard&lt;/a&gt;
    &lt;a cngxNavLink&gt;Settings&lt;/a&gt;

    &lt;cngx-sidenav-footer&gt;v1.0&lt;/cngx-sidenav-footer&gt;
  &lt;/cngx-sidenav&gt;

  &lt;cngx-sidenav-content&gt;
    &lt;router-outlet /&gt;
  &lt;/cngx-sidenav-content&gt;

  &lt;cngx-sidenav position="end" [(opened)]="detailOpen"&gt;
    Right detail panel
  &lt;/cngx-sidenav&gt;
&lt;/cngx-sidenav-layout&gt;</code></pre>`,
    },
  ],
};
