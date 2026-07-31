import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabNav: a section link stays current for its whole subtree',
  subtitle:
    'A <code>&lt;cngx-tab-nav&gt;</code> link is an application <em>section</em>, not a leaf, so it owns every URL beneath it. <code>[cngxTabsRouteSync]</code> reads that from the nav flavour and matches the URL by prefix - the non-exact form of <code>routerLinkActive</code>. A <code>&lt;cngx-tab-group&gt;</code> tablist keeps the exact-leaf (suffix) default.',
  description:
    'Both navs below point at the same three sections of this documentation app, and the page you are reading sits at <code>/ui/tabs/tab-nav/section-deep-link</code> - a child of the Tab nav section. No click is needed: <code>[cngxTabsRouteSync]</code> resolves the owning section from the URL when it mounts, which is what a deep link or a reload exercises. The first nav takes the flavour default, <code>prefix</code>, and marks Tab nav. The second is pinned to <code>match="suffix"</code> to show what a leaf-matching read does here: the trailing segment matches no link, the read resolves to nothing, and the <em>first</em> link keeps <code>aria-current="page"</code> - a screen reader is told you are on Tab group while Tab nav is rendered. When several sections match, the longest route wins, so a <code>/ui/tabs</code> link could not shadow <code>/ui/tabs/tab-nav</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern', 'behavior'],
  apiComponents: ['CngxTabNav', 'CngxTabLink', 'CngxTabsRouteSync'],
  moduleImports: [
    "import { CngxTabLink, CngxTabsRouteSync } from '@cngx/common/tabs';",
    "import { CngxTabNav } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabNav', 'CngxTabLink', 'CngxTabsRouteSync'],
  references: [
    {
      label: 'Angular Router: `RouterLinkActive` exact vs subset matching',
      href: 'https://angular.dev/api/router/RouterLinkActive',
    },
    {
      label: 'WAI-ARIA: `aria-current`',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-current',
    },
  ],
  setup: `
  protected readonly activePrefix = signal(0);
  protected readonly activeSuffix = signal(0);

  /**
   * Each link owns a section of the docs app, so its route is the section
   * prefix rather than the leaf page the href points at. Prefix matching is
   * what lets one link cover every page beneath it. The 'suffix-' strip only
   * exists because this page renders two navs and link ids must stay unique.
   */
  protected readonly sectionRoute = (handle: { id: string }): unknown[] => [
    '/ui',
    'tabs',
    handle.id.replace('suffix-', ''),
  ];`,
  template: `
  <cngx-tab-nav
    cngxTabsRouteSync
    [routeFor]="sectionRoute"
    [(activeIndex)]="activePrefix"
    aria-label="Tabs documentation sections, prefix matching"
  >
    <a cngxTabLink id="tab-group" label="Tab group" href="#/ui/tabs/tab-group/three-tab-navigation">
      Tab group
    </a>
    <a cngxTabLink id="tab-nav" label="Tab nav" href="#/ui/tabs/tab-nav/section-deep-link">
      Tab nav
    </a>
    <a cngxTabLink id="tab-skins" label="Tab skins" href="#/ui/tabs/tab-skins/line">
      Tab skins
    </a>
  </cngx-tab-nav>

  <cngx-tab-nav
    cngxTabsRouteSync
    match="suffix"
    [routeFor]="sectionRoute"
    [(activeIndex)]="activeSuffix"
    aria-label="Tabs documentation sections, suffix matching"
  >
    <a cngxTabLink id="suffix-tab-group" label="Tab group" href="#/ui/tabs/tab-group/three-tab-navigation">
      Tab group
    </a>
    <a cngxTabLink id="suffix-tab-nav" label="Tab nav" href="#/ui/tabs/tab-nav/section-deep-link">
      Tab nav
    </a>
    <a cngxTabLink id="suffix-tab-skins" label="Tab skins" href="#/ui/tabs/tab-skins/line">
      Tab skins
    </a>
  </cngx-tab-nav>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    This page lives under the <strong>Tab nav</strong> section. The first nav
    uses the flavour default and marks it; the second is pinned to
    <code>match="suffix"</code> and marks the wrong link.
  </p>`,
  setupChrome: `
  // Read back from each nav's own active index, so the readout cannot drift
  // from what the directive actually resolved.
  private readonly labels = ['Tab group', 'Tab nav', 'Tab skins'];
  protected readonly prefixLabel = computed(() => this.labels[this.activePrefix()]);
  protected readonly suffixLabel = computed(() => this.labels[this.activeSuffix()]);`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">prefix (default) marks</span><span class="event-value">{{ prefixLabel() }}</span></div>
    <div class="event-row"><span class="event-label">match="suffix" marks</span><span class="event-value">{{ suffixLabel() }}</span></div>
  </div>`,
};
