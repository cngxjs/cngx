import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSidenav: Drawer modal inside its layout only',
  subtitle:
    'With <code>modality="contained"</code> an open overlay blocks only its own <code>cngx-sidenav-layout</code>: the content beside it is <code>inert</code> and its scroll is locked, everything outside the layout stays operable. There is no focus trap and no <code>aria-modal</code>, since the page around the layout is live; the rail keeps its <code>navigation</code> landmark and focus moves into it on open.',
  description:
    'Open the filters, then press the counter button above the panel: it stays operable and counts, and its press closes the drawer as an outside press. Inside the panel only the <code>[cngxPanelTrigger]</code> button, which names the drawer in <code>aria-controls</code>, stays live; the Export button beside it is inert until the drawer closes. Escape inside the drawer closes it.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxSidenav', 'CngxSidenavLayout'],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { CngxSidenavLayout, CngxSidenav, CngxSidenavContent } from '@cngx/ui/sidenav';",
    "import { CngxNavHeader, CngxNavLink } from '@cngx/common/interactive';",
    "import { CngxPanelTrigger } from '@cngx/common/layout';",
  ],
  imports: ['CngxSidenavLayout', 'CngxSidenav', 'CngxSidenavContent', 'CngxNavHeader', 'CngxNavLink', 'CngxPanelTrigger'],
  setup: `protected readonly filtersOpen = signal(false);`,
  setupChrome: `protected readonly outsideClicks = signal(0);`,
  templateChromeBefore: `<button type="button" (click)="outsideClicks.set(outsideClicks() + 1)">
    Outside the layout: {{ outsideClicks() }}
  </button>`,
  template: `  <cngx-sidenav-layout style="block-size: 18rem">
    <cngx-sidenav #nav="cngxSidenav"
                  position="start"
                  mode="over"
                  modality="contained"
                  ariaLabel="Filters"
                  [(opened)]="filtersOpen">
      <cngx-nav-header>Filters</cngx-nav-header>
      @for (item of ['Open', 'In review', 'Done']; track item) {
        <a cngxNavLink [active]="item === 'Open'" (click)="$event.preventDefault()">{{ item }}</a>
      }
    </cngx-sidenav>
    <cngx-sidenav-content style="padding: var(--cngx-space-md, 1rem)">
      <button type="button" [cngxPanelTrigger]="nav.panelTarget">
        {{ filtersOpen() ? 'Close filters' : 'Open filters' }}
      </button>
      <button type="button">Export</button>
    </cngx-sidenav-content>
  </cngx-sidenav-layout>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Drawer</span>
      <span class="event-value">{{ filtersOpen() ? 'open' : 'closed' }}</span>
    </div>
  </div>`,
};
