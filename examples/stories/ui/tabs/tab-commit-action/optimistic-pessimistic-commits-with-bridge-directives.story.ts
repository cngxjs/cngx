import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: optimistic and pessimistic commits with bridge directives',
  subtitle: 'Toggle the mode and pick "accept", "simulate error" or "simulate refusal" to compare a failed and a refused tab switch. The toast and banner bridges fire on a failure without any explicit <code>[state]</code> binding - they read <code>CNGX_STATEFUL</code> from the presenter via <code>{ host: true }</code>. A refusal stays out of the bridges. Rapid consecutive clicks supersede in-flight commits.',
  description: 'Tabs treat <code>[commitAction]</code> as a navigation guard. Optimistic flips the panel immediately and rolls back when the commit does not land; pessimistic blocks until the action resolves. A throw or an erroring observable is a failure: the commit state goes to <code>error</code> and the bridges report it. Answering <code>false</code> is a refusal: the tab rolls back, the tab group announces it, <code>lastOutcome()</code> reads <code>refused</code> and the commit state goes back to <code>idle</code> with its data, so no bridge fires. To toast a refusal, the action shows its own warning toast before it answers <code>false</code>; the visible reason next to the tab group is driven by <code>lastOutcome()</code>. <code>presenter.clearLastFailed()</code> wipes the persistent rejection icon programmatically.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'error-handling'],
  apiComponents: [
    'CngxTabGroup',
    'CngxTabGroupPresenter',
    'CngxTab',
    'CngxTabContent',
    'CngxToastOn',
    'CngxBannerOn',
  ],
  moduleImports: [
    'import { Observable } from \'rxjs\';',
    'import { CngxTab, CngxTabContent, CngxTabGroupPresenter, type CngxTabsCommitAction } from \'@cngx/common/tabs\';',
    'import { CngxTabGroup } from \'@cngx/ui/tabs\';',
    'import { CngxToaster, CngxToastOn, CngxBannerOn } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxToastOn', 'CngxBannerOn'],
  setup: `private readonly toaster = inject(CngxToaster);
  protected readonly presenter = viewChild(CngxTabGroupPresenter);
  protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly outcome = signal<'accept' | 'error' | 'refusal'>('accept');
  protected readonly latencyMs = signal(600);
  protected readonly refused = computed(() => {
    const presenter = this.presenter();
    return presenter?.lastFailedIndex() !== undefined && presenter?.lastOutcome()?.kind === 'refused';
  });
  protected readonly commitAction: CngxTabsCommitAction = (from, to) => {
    const ms = this.latencyMs();
    const outcome = this.outcome();
    return new Observable<boolean>((sub) => {
      const handle = setTimeout(() => {
        if (outcome === 'error') {
          sub.error(new Error('Could not save tab ' + from + ' -> ' + to));
          return;
        }
        if (outcome === 'refusal') {
          // A refusal is the action's own decision: it toasts its reason
          // itself, then answers false. The bridges stay silent.
          this.toaster.show({ message: 'Save the profile first.', severity: 'warning' });
          sub.next(false);
          sub.complete();
          return;
        }
        sub.next(true);
        sub.complete();
      }, ms);
      return () => clearTimeout(handle);
    });
  };`,
  template: `  <cngx-tab-group
    #tg="cngxTabGroup"
    [(activeIndex)]="active"
    [commitAction]="commitAction"
    [commitMode]="mode()"
    cngxToastOn
    [toastSuccess]="'Tab saved'"
    [toastError]="'Tab transition failed'"
    cngxBannerOn
    bannerId="tabs:commit-error"
    [bannerError]="'The server could not switch the tab.'"
    aria-label="Async tab navigation"
  >
    <div cngxTab [label]="'Profile'">
      <ng-template cngxTabContent><p>Profile content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Account'">
      <ng-template cngxTabContent><p>Account content.</p></ng-template>
    </div>
    <div cngxTab [label]="'Notifications'">
      <ng-template cngxTabContent><p>Notification preferences.</p></ng-template>
    </div>
  </cngx-tab-group>
  @if (refused()) {
    <p>Not allowed yet: save the profile first.</p>
  }`,
  templateChrome: `<div class="event-row" style="gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <button type="button" class="chip"
            [class.demo-chip-toggle--active]="mode() === 'optimistic'"
            (click)="mode.set('optimistic')">optimistic</button>
    <button type="button" class="chip"
            [class.demo-chip-toggle--active]="mode() === 'pessimistic'"
            (click)="mode.set('pessimistic')">pessimistic</button>
    <div role="radiogroup" aria-label="Commit outcome" style="display:inline-flex;gap:12px;margin-inline-start:12px">
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-tabs-commit-outcome"
               [checked]="outcome() === 'accept'"
               (change)="outcome.set('accept')" />
        accept
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-tabs-commit-outcome"
               [checked]="outcome() === 'error'"
               (change)="outcome.set('error')" />
        simulate error
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-tabs-commit-outcome"
               [checked]="outcome() === 'refusal'"
               (change)="outcome.set('refusal')" />
        simulate refusal
      </label>
    </div>
    <label style="margin-inline-start:12px">
      latency
      <input type="range" min="100" max="2000" step="100"
             [value]="latencyMs()"
             (input)="latencyMs.set(+$any($event.target).value)" />
      {{ latencyMs() }}ms
    </label>
  </div>
<div class="event-row" style="gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap">
    <button type="button" class="chip" (click)="tg.clearLastFailed()">
      Clear last failed
    </button>
    <span style="opacity:0.7;font-size:12px">
      programmatic dismissal - calls <code>presenter.clearLastFailed()</code>
    </span>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Active tab</span><span class="event-value">{{ active() }}</span></div>
  </div>`,
};
