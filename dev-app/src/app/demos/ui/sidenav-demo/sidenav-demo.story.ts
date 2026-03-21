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
  protected readonly singleOpen = signal(false);
  protected readonly singleMode = signal<'over' | 'push' | 'side'>('side');
  protected readonly modes: ('over' | 'push' | 'side')[] = ['over', 'push', 'side'];

  // Dual sidebar
  protected readonly leftOpen = signal(true);
  protected readonly rightOpen = signal(false);

  // Active link
  protected readonly activeLink = signal('/dashboard');
  `,
  sections: [
    {
      title: 'Single Sidebar — Mode Switching',
      subtitle:
        'A single <code>cngx-sidenav</code> with mode control. ' +
        '<strong>side</strong> = permanent, <strong>push</strong> = pushes content, <strong>over</strong> = overlays.',
      imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxSidenavHeader', 'CngxSidenavFooter', 'CngxNavLink', 'CngxNavLabel'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Mode:</span>
    @for (m of modes; track m) {
      <button class="chip" [class.chip--active]="singleMode() === m"
              (click)="singleMode.set(m)">{{ m }}</button>
    }
    @if (singleMode() !== 'side') {
      <button class="sort-btn" (click)="singleOpen.set(!singleOpen())">
        {{ singleOpen() ? 'Close' : 'Open' }}
      </button>
    }
  </div>

  <div style="height: 300px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; overflow: hidden; position: relative; margin-top: 0.75rem;">
    <cngx-sidenav-layout style="display: flex; height: 100%; position: relative;">
      <cngx-sidenav position="start" [(opened)]="singleOpen" [mode]="singleMode()" width="220px"
                    style="background: var(--cngx-surface-alt, #f5f6f7); border-right: 1px solid var(--border-color, #e0e0e0); display: flex; flex-direction: column; z-index: 10;"
                    [style.position]="singleMode() === 'over' ? 'absolute' : 'relative'"
                    [style.top]="singleMode() === 'over' ? '0' : ''"
                    [style.bottom]="singleMode() === 'over' ? '0' : ''"
                    [style.width]="singleMode() !== 'over' && singleOpen() ? '220px' : singleMode() === 'over' && singleOpen() ? '220px' : '0'"
                    [style.overflow]="'hidden'"
                    [style.transition]="'width 0.25s ease, transform 0.25s ease'">
        <cngx-sidenav-header style="padding: 1rem; border-bottom: 1px solid var(--border-color, #eee); font-weight: 700;">
          My App
        </cngx-sidenav-header>

        <div style="flex: 1; padding: 0.5rem 0;">
          <span cngxNavLabel style="display: block; padding: 0.5rem 1rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted, #888);">
            Navigation
          </span>
          @for (link of ['/dashboard', '/analytics', '/reports']; track link) {
            <a cngxNavLink [active]="activeLink() === link"
               (click)="activeLink.set(link); $event.preventDefault()"
               style="display: block; padding: 0.4rem 1rem; text-decoration: none; font-size: 0.85rem; color: var(--text-primary, #333); border-left: 3px solid transparent; transition: all 0.15s;"
               [style.border-left-color]="activeLink() === link ? 'var(--interactive, #f5a623)' : 'transparent'"
               [style.background]="activeLink() === link ? 'var(--interactive-subtle-bg, rgba(245, 166, 35, 0.08))' : 'transparent'"
               [style.font-weight]="activeLink() === link ? '600' : '400'">
              {{ link.substring(1) }}
            </a>
          }
        </div>

        <cngx-sidenav-footer style="padding: 0.75rem 1rem; border-top: 1px solid var(--border-color, #eee); font-size: 0.75rem; color: var(--text-muted, #888);">
          v1.0.0
        </cngx-sidenav-footer>
      </cngx-sidenav>

      <cngx-sidenav-content style="flex: 1; padding: 1rem; transition: margin 0.25s ease;">
        <p><strong>Mode:</strong> {{ singleMode() }}</p>
        <p><strong>Active:</strong> {{ activeLink() }}</p>
        <p style="color: var(--text-muted, #888); font-size: 0.85rem;">
          @if (singleMode() === 'side') {
            Sidebar is always visible. No toggle needed.
          } @else if (singleMode() === 'push') {
            Content shifts when the sidebar opens.
          } @else {
            Sidebar overlays content. Click outside or press Escape to close.
          }
        </p>
      </cngx-sidenav-content>
    </cngx-sidenav-layout>
  </div>`,
    },
    {
      title: 'Dual Sidebar — Start + End',
      subtitle:
        'Two sidenavs in the same layout. The left sidebar is permanent (<code>mode="side"</code>), ' +
        'the right is an overlay panel that opens on demand.',
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

  <div style="height: 280px; border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; overflow: hidden; position: relative; margin-top: 0.75rem;">
    <cngx-sidenav-layout style="display: flex; height: 100%; position: relative;">
      <cngx-sidenav position="start" [(opened)]="leftOpen" mode="side" width="180px"
                    style="background: var(--cngx-surface-alt, #f5f6f7); border-right: 1px solid var(--border-color, #e0e0e0); display: flex; flex-direction: column; overflow: hidden; transition: width 0.25s ease;"
                    [style.width]="leftOpen() ? '180px' : '0'">
        <div style="padding: 0.5rem 0;">
          @for (item of ['Home', 'Tasks', 'Messages', 'Calendar']; track item) {
            <a cngxNavLink style="display: block; padding: 0.4rem 1rem; text-decoration: none; font-size: 0.85rem; color: var(--text-primary, #333);">
              {{ item }}
            </a>
          }
        </div>
      </cngx-sidenav>

      <cngx-sidenav-content style="flex: 1; padding: 1rem; transition: margin 0.25s ease;">
        <p>Main content with dual sidebars.</p>
        <p style="font-size: 0.85rem; color: var(--text-muted, #888);">Left is permanent (side mode), right is an overlay.</p>
      </cngx-sidenav-content>

      <cngx-sidenav position="end" [(opened)]="rightOpen" mode="over" width="240px"
                    style="background: var(--cngx-surface-alt, #f5f6f7); border-left: 1px solid var(--border-color, #e0e0e0); position: absolute; top: 0; bottom: 0; right: 0; z-index: 10; overflow: hidden; transition: width 0.25s ease, visibility 0.25s;"
                    [style.width]="rightOpen() ? '240px' : '0'"
                    [style.visibility]="rightOpen() ? 'visible' : 'hidden'">
        <div style="padding: 1rem;">
          <strong>Detail Panel</strong>
          <p style="font-size: 0.85rem; color: var(--text-muted, #888); margin-top: 0.5rem;">
            Right-side overlay for item details, settings, or contextual info.
          </p>
          <button class="sort-btn" (click)="rightOpen.set(false)">Close</button>
        </div>
      </cngx-sidenav>
    </cngx-sidenav-layout>
  </div>

  <div class="status-row" style="margin-top: 0.5rem;">
    <span class="status-badge" [class.active]="leftOpen()">left: {{ leftOpen() ? 'open' : 'closed' }}</span>
    <span class="status-badge" [class.active]="rightOpen()">right: {{ rightOpen() ? 'open' : 'closed' }}</span>
  </div>`,
    },
    {
      title: 'API — Component Structure',
      subtitle:
        'The organism composes drawer, backdrop, scroll lock, and media query atoms. The consumer only needs the declarative template.',
      template: `
  <pre class="code-block"><code>&lt;cngx-sidenav-layout&gt;
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
