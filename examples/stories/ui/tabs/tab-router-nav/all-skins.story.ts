import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabNav: all five skins on a routed navigation',
  subtitle:
    'The <code>[skin]</code> input paints every <code>CngxTabsSkin</code> value on <code>&lt;cngx-tab-nav&gt;</code> - <code>line</code>, <code>contained</code>, <code>segmented</code>, <code>pill</code>, <code>pill-outline</code> - the same five the programmatic <code>&lt;cngx-tab-group&gt;</code> ships. The nav is a <code>role="navigation"</code> row of real <code>&lt;a&gt;</code> links, so each skin is re-expressed on the link elements rather than the tablist buttons the group uses.',
  description:
    'A visual gallery: one nav per skin, first link active. Skin and orientation are orthogonal - the <code>contained</code> skin fuses the active folder tab with the host rule (there is no owned panel on a routed nav, so the seam runs against the host border). The links point back at this page, so they are real anchors without navigating away; in production each is a <code>routerLink</code> over a <code>&lt;router-outlet&gt;</code>. The active link carries <code>aria-current="page"</code> from a single route-derived source (Pillar 1).',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxTabNav', 'CngxTabLink'],
  moduleImports: [
    "import { CngxTabLink } from '@cngx/common/tabs';",
    "import { CngxTabNav } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabNav', 'CngxTabLink'],
  setup: `
  protected readonly skins = ['line', 'contained', 'segmented', 'pill', 'pill-outline'] as const;
  // The links are a visual showcase, not a working router: point them back at
  // this same route so they stay real, focusable anchors without leaving the
  // page. In production each is a routerLink over a <router-outlet>.
  protected readonly demoHref = '#/ui/tabs/tab-router-nav/all-skins';`,
  template: `
  <div style="display:flex;flex-direction:column;gap:24px">
    @for (skin of skins; track skin) {
      <div style="display:flex;flex-direction:column;gap:6px">
        <span style="font-weight:600;text-transform:capitalize">{{ skin }}</span>
        <cngx-tab-nav [skin]="skin" [activeIndex]="0" [aria-label]="skin + ' skin'">
          <a cngxTabLink id="overview" label="Overview" [href]="demoHref">Overview</a>
          <a cngxTabLink id="activity" label="Activity" [href]="demoHref">Activity</a>
          <a cngxTabLink id="settings" label="Settings" [href]="demoHref">Settings</a>
        </cngx-tab-nav>
      </div>
    }
  </div>`,
  templateChrome: `
  <div style="display:flex;flex-direction:column;gap:24px;margin-top:24px">
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">Contained, vertical</span>
      <cngx-tab-nav
        skin="contained"
        orientation="vertical"
        [activeIndex]="0"
        aria-label="contained vertical"
      >
        <a cngxTabLink id="v-overview" label="Overview" [href]="demoHref">Overview</a>
        <a cngxTabLink id="v-activity" label="Activity" [href]="demoHref">Activity</a>
        <a cngxTabLink id="v-settings" label="Settings" [href]="demoHref">Settings</a>
      </cngx-tab-nav>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      <span style="font-weight:600">Contained, active tab also in error</span>
      <cngx-tab-nav skin="contained" [activeIndex]="0" aria-label="contained active error">
        <a
          cngxTabLink
          id="e-overview"
          label="Overview"
          error="Unsaved changes"
          [href]="demoHref"
        >
          Overview
        </a>
        <a cngxTabLink id="e-activity" label="Activity" [href]="demoHref">Activity</a>
        <a cngxTabLink id="e-settings" label="Settings" [href]="demoHref">Settings</a>
      </cngx-tab-nav>
    </div>
  </div>`,
};
