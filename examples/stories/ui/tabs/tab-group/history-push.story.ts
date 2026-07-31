import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabsFragmentSync: [replaceUrl]="false" makes browser-back step between tabs',
  subtitle:
    'Reflecting the active tab into the URL <em>replaces</em> the current history entry by default, so browser-back leaves the page rather than walking the tabs the user opened on the way. Bind <code>[replaceUrl]="false"</code> when the tabs read as distinct destinations and back should step between them.',
  description:
    'Switch a few tabs, then press browser-back. With <code>[replaceUrl]="false"</code> each switch pushed an entry, so back walks the tabs in reverse before it leaves the page; the readout below tracks the fragment the directive wrote. The default is the opposite trade and is right for a view toggle: a user who opened four tabs to find one thing should not have to press back four times to get out. Cost of the non-default: every switch consumes a history entry, so a group people flip through quickly will bury the entry they actually came from.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'behavior'],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabsFragmentSync'],
  moduleImports: [
    "import { CngxTab, CngxTabContent, CngxTabsFragmentSync } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabsFragmentSync'],
  references: [
    {
      label: 'Angular Router: `NavigationExtras.replaceUrl`',
      href: 'https://angular.dev/api/router/NavigationExtras#replaceUrl',
    },
  ],
  template: `
  <cngx-tab-group cngxTabsFragmentSync [replaceUrl]="false" aria-label="Release notes">
    <div cngxTab id="summary" label="Summary">
      <ng-template cngxTabContent><p>Summary panel.</p></ng-template>
    </div>
    <div cngxTab id="changes" label="Changes">
      <ng-template cngxTabContent><p>Changes panel.</p></ng-template>
    </div>
    <div cngxTab id="upgrade" label="Upgrade">
      <ng-template cngxTabContent><p>Upgrade panel.</p></ng-template>
    </div>
  </cngx-tab-group>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    Switch between all three tabs, then press browser-back repeatedly: each
    press restores the previous tab instead of leaving this page.
  </p>`,
  setupChrome: `
  // Reads the live URL rather than the group's state, so the readout shows
  // what actually landed in history.
  protected readonly fragment = signal(location.hash);
  constructor() {
    const onHashChange = () => this.fragment.set(location.hash);
    window.addEventListener('hashchange', onHashChange);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('hashchange', onHashChange));
  }`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">URL</span><span class="event-value">{{ fragment() }}</span></div>
    <div class="event-row"><span class="event-label">replaceUrl</span><span class="event-value">false (pushes history)</span></div>
  </div>`,
};
