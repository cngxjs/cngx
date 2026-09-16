import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'withCngxAsyncState: Two keys one store',
  subtitle:
    'Stack the feature twice - <code>(\'users\')</code> and <code>(\'stats\')</code> - and one store carries two fully independent async slices. Each key owns its own <code>createManualState</code>: statuses, errors and first-load latches never bleed across.',
  description:
    'Per-key isolation: <code>usersSink</code> and <code>statsSink</code> are separate <code>createManualState</code> instances, so a slow or failing stats load leaves the users slice untouched. Load both and watch users settle while stats is still busy; fail stats and only the stats slice reports the error. Key collisions with existing store members are not guarded by cngx - NgRx SignalStore warns about duplicate props in dev mode, so pick keys that do not shadow existing state or props.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'async-state', 'error-handling'],
  apiComponents: ['withCngxAsyncState'],
  moduleImports: [
    "import { signalStore, withMethods } from '@ngrx/signals';",
    "import { withCngxAsyncState } from '@cngx/interop/signals';",
    "import { tapAsyncState } from '@cngx/common/data';",
    "import { map, timer } from 'rxjs';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `private readonly DashboardStore = signalStore(
    withCngxAsyncState<Person[]>()('users'),
    withCngxAsyncState<{ total: number; locations: number }>()('stats'),
    withMethods((store) => ({
      loadUsers: () =>
        timer(700)
          .pipe(
            map(() => PEOPLE.slice(0, 4)),
            tapAsyncState(store.usersSink),
          )
          .subscribe({
            // The sink already captured the failure as state; an empty error
            // callback keeps the global ErrorHandler out of the demo console.
            error: () => {},
          }),
      loadStats: (fail: boolean) =>
        timer(1600)
          .pipe(
            map(() => {
              if (fail) {
                throw new Error('Stats endpoint unavailable');
              }
              return {
                total: PEOPLE.length,
                locations: new Set(PEOPLE.map((p) => p.location)).size,
              };
            }),
            tapAsyncState(store.statsSink),
          )
          .subscribe({
            // The sink already captured the failure as state; an empty error
            // callback keeps the global ErrorHandler out of the demo console.
            error: () => {},
          }),
    })),
  );

  protected readonly store = new this.DashboardStore();`,
  setupChrome: `protected readonly failStats = signal(false);

  protected loadBoth(): void {
    this.store.loadUsers();
    this.store.loadStats(this.failStats());
  }`,
  template: `  <div style="display:flex;gap:24px;flex-wrap:wrap">
    <section aria-label="Users slice" style="min-width:200px">
      <p style="margin:0 0 4px"><strong>users</strong>: {{ store.usersState.status() }}</p>
      <ul style="list-style:none;padding:0;margin:0">
        @for (person of store.usersState.data() ?? []; track person.name) {
          <li>{{ person.name }}</li>
        }
      </ul>
    </section>
    <section aria-label="Stats slice" style="min-width:200px">
      <p style="margin:0 0 4px"><strong>stats</strong>: {{ store.statsState.status() }}</p>
      @if (store.statsState.data(); as stats) {
        <p style="margin:0">{{ stats.total }} people across {{ stats.locations }} locations</p>
      }
      @if (store.statsState.error(); as err) {
        <p style="margin:0">{{ $any(err).message }}</p>
      }
    </section>
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="store.loadUsers()">Load users</button>
    <button type="button" class="chip" (click)="store.loadStats(failStats())">Load stats</button>
    <button type="button" class="chip" (click)="loadBoth()">Load both</button>
    <label style="margin-left:1rem">
      <input
        type="checkbox"
        [checked]="failStats()"
        (change)="failStats.set($any($event.target).checked)"
      />
      Fail stats
    </label>
  </div>
<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">usersState.status</span>
      <span class="event-value">{{ store.usersState.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">statsState.status</span>
      <span class="event-value">{{ store.statsState.status() }}</span>
    </div>
  </div>`,
};
