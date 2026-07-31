import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabNav: a section link stays current for its whole subtree',
  subtitle:
    'A <code>&lt;cngx-tab-nav&gt;</code> link is an application <em>section</em>, not a leaf, so it owns every URL beneath it. <code>[cngxTabsRouteSync]</code> reads that from the nav flavour and matches the URL by prefix - the non-exact form of <code>routerLinkActive</code>. A <code>&lt;cngx-tab-group&gt;</code> tablist keeps the exact-leaf (suffix) default.',
  description:
    'The nav below points at three sections of this documentation app, and the page you are reading sits at <code>/ui/tabs/tab-nav/section-deep-link</code> - a child of the Tab nav section. No click is needed: <code>[cngxTabsRouteSync]</code> resolves the owning section from the current URL on load, which is the case a deep link or a reload exercises. Flip the match mode to <code>suffix</code> to see the defect this fixes: the URL\'s trailing segment matches no link, the read resolves to nothing, and the <em>first</em> link keeps <code>aria-current="page"</code> - a screen reader is told you are on Tab group while Tab nav is rendered. When several sections match, the longest route wins, so a <code>/ui/tabs</code> link could not shadow <code>/ui/tabs/tab-nav</code>.',
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
  protected readonly matchMode = signal<'prefix' | 'suffix'>('prefix');
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
    [match]="matchMode()"
    [routeFor]="sectionRoute"
    [(activeIndex)]="active"
    aria-label="Tabs documentation sections"
  >
    <a cngxTabLink id="tab-group" label="Tab group" href="/ui/tabs/tab-group/three-tab-navigation">
      Tab group
    </a>
    <a cngxTabLink id="tab-nav" label="Tab nav" href="/ui/tabs/tab-nav/section-deep-link">
      Tab nav
    </a>
    <a cngxTabLink id="tab-skins" label="Tab skins" href="/ui/tabs/tab-skins/line">
      Tab skins
    </a>
  </cngx-tab-nav>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    This page lives under the <strong>Tab nav</strong> section. In
    <code>prefix</code> mode that link carries <code>aria-current="page"</code>;
    in <code>suffix</code> mode nothing matches and the first link takes it
    instead.
  </p>`,
  setupChrome: `
  // Read back from the nav's own active index, so the readout cannot drift
  // from what the directive actually resolved.
  protected readonly currentLabel = computed(
    () => ['Tab group', 'Tab nav', 'Tab skins'][this.active()],
  );`,
  templateChrome: `
  <fieldset style="margin-top:12px; border:0; padding:0">
    <legend style="padding:0 0 4px">Match mode</legend>
    <div class="button-row">
      <label style="display:flex; gap:6px; align-items:center">
        <input
          type="radio"
          name="match-mode"
          value="prefix"
          [checked]="matchMode() === 'prefix'"
          (change)="matchMode.set('prefix')"
        />
        prefix (the nav default)
      </label>
      <label style="display:flex; gap:6px; align-items:center">
        <input
          type="radio"
          name="match-mode"
          value="suffix"
          [checked]="matchMode() === 'suffix'"
          (change)="matchMode.set('suffix')"
        />
        suffix (the tablist default)
      </label>
    </div>
  </fieldset>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Match mode</span><span class="event-value">{{ matchMode() }}</span></div>
    <div class="event-row"><span class="event-label">Link with aria-current</span><span class="event-value">{{ currentLabel() }}</span></div>
  </div>`,
};
