import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'canDeactivateWhenClean: Route guard on dirty form',
  subtitle: 'Wire <code>canDeactivateWhenClean((page: EditPage) =&gt; page.isDirty())</code> into a route\'s <code>canDeactivate</code> array. The Router passes the component it leaves; the guard shows a <code>confirm()</code> when that component is dirty and lets the navigation through when it is clean. Type a draft, then press "Try to leave".',
  description: 'Functional route guard factory. <code>isDirty</code> receives the routed component on every navigation attempt; when it returns <code>true</code> the guard opens the browser <code>confirm()</code> with the message and gates the navigation on the reply. <code>inject(DOCUMENT)</code> at call time keeps it SSR-safe (allow when no window exists). In an app the guard sits in the route config: <code>&#123; path: \'edit\', component: EditPage, canDeactivate: [canDeactivateWhenClean((page: EditPage) =&gt; page.isDirty())] &#125;</code>. The examples app generates its routes, so the demo chrome registers the same guard on this demo\'s own route at runtime; the navigation runs through the real Router. Pair with <code>CngxBeforeUnload</code> to also cover tab close and reload.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: [
    'canDeactivateWhenClean',
  ],
  moduleImports: [
    'import { canDeactivateWhenClean } from \'@cngx/common/interactive\';',
    'import { ActivatedRoute, Router } from \'@angular/router\';',
  ],
  imports: [],
  references: [
    { label: 'Angular Router: `CanDeactivateFn` guard', href: 'https://angular.dev/api/router/CanDeactivateFn' },
    { label: 'WCAG 2.1 SC 3.3.4 Error Prevention', href: 'https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data.html' },
  ],
  setup: `
  protected readonly isDirty = signal<boolean>(false);
  protected readonly draft = signal<string>('');

  /** The guard as it goes into a route config; the Router calls it with this component. */
  protected readonly canLeave = canDeactivateWhenClean(
    (page: { isDirty(): boolean }) => page.isDirty(),
    'You have unsaved changes. Leave anyway?',
  );

  protected handleInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.draft.set(value);
    this.isDirty.set(value.length > 0);
  }

  protected handleSave(): void {
    this.isDirty.set(false);
  }`,
  setupChrome: `
  protected readonly lastAttempt = signal<'none' | 'blocked' | 'allowed'>('none');
  private readonly router = inject(Router);

  protected tryToLeave(): void {
    void this.router.navigateByUrl('/common/interactive/guard/protect-dirty-form');
  }

  constructor() {
    // The generated route has no canDeactivate, so register the guard on it
    // here; the readout records each decision.
    const route = inject(ActivatedRoute).routeConfig;
    if (route) {
      route.canDeactivate = [
        (page: { isDirty(): boolean }) => {
          const allowed = this.canLeave(page);
          this.lastAttempt.set(allowed ? 'allowed' : 'blocked');
          return allowed;
        },
      ];
    }
  }`,
  template: `
  <form style="display:flex; flex-direction:column; gap:8px; max-width:32rem">
    <label for="dg-draft">Draft note</label>
    <textarea
      id="dg-draft"
      rows="4"
      [value]="draft()"
      (input)="handleInput($event)"
    ></textarea>
    <button type="button" (click)="handleSave()" style="align-self:flex-start">Save</button>
  </form>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="tryToLeave()">Try to leave: open the beforeunload demo</button>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isDirty()</span>
      <span class="event-value">{{ isDirty() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last leave attempt</span>
      <span class="event-value">{{ lastAttempt() }}</span>
    </div>
  </div>`,
};
