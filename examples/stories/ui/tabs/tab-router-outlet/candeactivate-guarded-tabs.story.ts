import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: routed tabs gated by a CanDeactivate guard',
  subtitle:
    'Routed tabs are a <code>[commitAction]</code> over <code>@angular/router</code>. In production you add <code>[cngxTabsRouteSync]</code> to the group and let <code>createTabRouterCommit()</code> navigate to each tab\'s child route, with a <code>CanDeactivate</code> guard gating the leave. This sandbox renders one page without child routes, so the guard decision is simulated locally with a dirty-form signal - the user-visible gate is identical.',
  description:
    'Pessimistic mode pins the active tab to the resolved route: while the editor form is dirty the guard refuses the switch, so the active tab never moves and the refused target lights its rejection icon. The dirty editor binds <code>[error]</code> so its badge marks the tab that needs attention. Production wiring lives in the route config and the directive: <code>&lt;cngx-tab-group cngxTabsRouteSync&gt;</code> supplies the router commit-action via the <code>CNGX_TABS_COMMIT_ACTION</code> DI fallback and pins pessimistic mode, while each child route carries <code>canDeactivate: [unsavedChangesGuard]</code>. The presenter\'s commit lifecycle is the gate - <code>createTabRouterCommit()</code> resolves <code>true</code> on <code>NavigationEnd</code> and <code>false</code> on <code>NavigationCancel</code> / <code>NavigationError</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['integration', 'error-handling', 'behavior'],
  apiComponents: [
    'CngxTabGroup',
    'CngxTab',
    'CngxTabContent',
    'CngxTabsRouteSync',
    'createTabRouterCommit',
  ],
  moduleImports: [
    "import { CngxTab, CngxTabContent, type CngxTabsCommitAction } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  references: [
    { label: 'Angular Router: `CanDeactivateFn` guard', href: 'https://angular.dev/api/router/CanDeactivateFn' },
    { label: 'WAI-ARIA APG: Tabs pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  setup: `
  protected readonly active = signal(0);
  protected readonly draft = signal('');
  protected readonly isDirty = computed(() => this.draft().length > 0);

  /**
   * Stands in for the route's CanDeactivate guard. In production the
   * guard runs inside the router and createTabRouterCommit() maps its
   * NavigationCancel into a refused commit; here it gates the leave of
   * the editor tab while the form is dirty. Pessimistic mode keeps the
   * active tab on the resolved route, so a refusal never flashes the
   * target.
   */
  protected readonly guardedSwitch: CngxTabsCommitAction = (from) =>
    !(from === 0 && this.isDirty());

  protected handleInput(event: Event): void {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected handleSave(): void {
    this.draft.set('');
  }`,
  template: `
  <cngx-tab-group
    [(activeIndex)]="active"
    [commitAction]="guardedSwitch"
    commitMode="pessimistic"
    aria-label="Routed account settings"
  >
    <div cngxTab [label]="'Editor'" [error]="isDirty() ? 'Unsaved changes' : ''">
      <ng-template cngxTabContent>
        <form style="display:flex; flex-direction:column; gap:8px; max-width:32rem">
          <label for="rg-draft">Note (leaving while dirty is blocked)</label>
          <textarea
            id="rg-draft"
            rows="3"
            [value]="draft()"
            (input)="handleInput($event)"
          ></textarea>
          <button type="button" (click)="handleSave()" style="align-self:flex-start">
            Save
          </button>
        </form>
      </ng-template>
    </div>
    <div cngxTab [label]="'Preview'">
      <ng-template cngxTabContent><p>Rendered preview of the saved note.</p></ng-template>
    </div>
    <div cngxTab [label]="'Settings'">
      <ng-template cngxTabContent><p>Account settings.</p></ng-template>
    </div>
  </cngx-tab-group>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">
    Type in the editor, then try another tab: the switch is refused, the active
    tab stays put, the refused tab shows a rejection icon, and the dirty editor
    keeps its error badge. Save to clear the form, then the switch succeeds.
  </p>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
    <div class="event-row"><span class="event-label">isDirty()</span><span class="event-value">{{ isDirty() }}</span></div>
  </div>`,
};
