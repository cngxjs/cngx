import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabNav: match="suffix" when the links are pages, not sections',
  subtitle:
    'The nav flavour defaults to prefix matching because a nav link usually owns a subtree. When it does not - when each link addresses exactly one page - <code>match="suffix"</code> opts that instance back into the leaf semantics a <code>&lt;cngx-tab-group&gt;</code> uses by default.',
  description:
    'Each link here points at one concrete demo page, and this page is the first of them. With <code>match="suffix"</code> the read compares the trailing URL segment against each link\'s route, so <code>/ui/tabs/tab-nav/leaf-links</code> resolves the first link and nothing else. Leave the default in place instead and every link would still resolve, but by subtree, which is the wrong claim for a set of leaves that share a parent. The links keep the <code>aria-current="page"</code> default here, unlike the section nav: these really are pages. The same mode is available app-wide via <code>provideTabsConfig(withTabsRouteMatch(\'suffix\'))</code>, and swapping the comparison itself is <code>CNGX_TAB_URL_MATCH_STRATEGY</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'behavior'],
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
  ],
  setup: `
  protected readonly active = signal(0);`,
  template: `
  <cngx-tab-nav
    cngxTabsRouteSync
    match="suffix"
    [(activeIndex)]="active"
    aria-label="Tab demo pages"
  >
    <a cngxTabLink id="leaf-links" label="Leaf links" href="#/ui/tabs/tab-nav/leaf-links">
      Leaf links
    </a>
    <a
      cngxTabLink
      id="section-deep-link"
      label="Section deep link"
      href="#/ui/tabs/tab-nav/section-deep-link"
    >
      Section deep link
    </a>
    <a
      cngxTabLink
      id="three-tab-navigation"
      label="Tab group basics"
      href="#/ui/tabs/tab-group/three-tab-navigation"
    >
      Tab group basics
    </a>
  </cngx-tab-nav>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    The default <code>routeFor</code> maps each link id to one URL segment, so
    the ids here are the demo slugs. Follow a link and the marker lands on it.
  </p>`,
  setupChrome: `
  protected readonly currentLabel = computed(
    () => ['Leaf links', 'Section deep link', 'Tab group basics'][this.active()],
  );`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Match mode</span><span class="event-value">suffix</span></div>
    <div class="event-row"><span class="event-label">Link with aria-current</span><span class="event-value">{{ currentLabel() }}</span></div>
  </div>`,
};
