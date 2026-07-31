import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabNav: a section link stays current for its whole subtree',
  subtitle:
    'A <code>&lt;cngx-tab-nav&gt;</code> link is an application <em>section</em>, not a leaf, so it owns every URL beneath it. <code>[cngxTabsRouteSync]</code> reads that from the nav flavour and matches the URL by prefix - the non-exact form of <code>routerLinkActive</code>. A <code>&lt;cngx-tab-group&gt;</code> tablist keeps the exact-leaf (suffix) default. One <code>provideTabsConfigAt(withTabsLinkAriaCurrent(\'true\'))</code> switches the whole nav off the <code>page</code> default, since the active link is the current <em>section</em>, not the page you are on.',
  description:
    'The nav points at three sections of this documentation app, and the page you are reading sits at <code>/ui/tabs/tab-nav/section-deep-link</code> - a child of the Tab nav section. No click is needed: <code>[cngxTabsRouteSync]</code> resolves the owning section from the URL when it mounts, which is what a deep link or a reload exercises, and the Tab nav link carries <code>aria-current="true"</code>. The suffix default a tablist uses would resolve nothing here, because the URL\'s trailing segment matches no link - the read returns null, the seed is a no-op, and the first link keeps <code>aria-current</code> from the initial index. That is the whole reason the nav flavour defaults to prefix. When several sections match, the longest route wins, so a <code>/ui/tabs</code> link could not shadow <code>/ui/tabs/tab-nav</code>. Set <code>match="suffix"</code> on the nav to opt an instance back into leaf matching.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'a11y-pattern', 'behavior'],
  apiComponents: ['CngxTabNav', 'CngxTabLink', 'CngxTabsRouteSync'],
  moduleImports: [
    "import { CngxTabLink, CngxTabsRouteSync, provideTabsConfigAt, withTabsLinkAriaCurrent } from '@cngx/common/tabs';",
    "import { CngxTabNav } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabNav', 'CngxTabLink', 'CngxTabsRouteSync'],
  viewProviders: ['provideTabsConfigAt(withTabsLinkAriaCurrent(\'true\'))'],
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
  protected readonly active = signal(0);

  /**
   * Each link owns a section of the docs app, so its route is the section
   * prefix rather than the leaf page the href points at. Prefix matching is
   * what lets one link cover every page beneath it.
   */
  protected readonly sectionRoute = (handle: { id: string }): unknown[] => [
    '/ui',
    'tabs',
    handle.id,
  ];`,
  template: `
  <cngx-tab-nav
    cngxTabsRouteSync
    [routeFor]="sectionRoute"
    [(activeIndex)]="active"
    aria-label="Tabs documentation sections"
  >
    <a
      cngxTabLink
      id="tab-group"
      label="Tab group"
      href="#/ui/tabs/tab-group/three-tab-navigation"
    >
      Tab group
    </a>
    <a
      cngxTabLink
      id="tab-nav"
      label="Tab nav"
      href="#/ui/tabs/tab-nav/section-deep-link"
    >
      Tab nav
    </a>
    <a
      cngxTabLink
      id="tab-skins"
      label="Tab skins"
      href="#/ui/tabs/tab-skins/line"
    >
      Tab skins
    </a>
  </cngx-tab-nav>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    This page lives under the <strong>Tab nav</strong> section, so that link is
    the current one. Follow another link and the marker moves with the URL.
  </p>`,
  setupChrome: `
  // The index comes from the nav itself, so the readout tracks what the
  // directive resolved. The label list is a demo-side duplicate of the
  // link text.
  protected readonly currentLabel = computed(
    () => ['Tab group', 'Tab nav', 'Tab skins'][this.active()],
  );`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Page URL</span><span class="event-value">/ui/tabs/tab-nav/section-deep-link</span></div>
    <div class="event-row"><span class="event-label">Link with aria-current</span><span class="event-value">{{ currentLabel() }}</span></div>
  </div>`,
};
