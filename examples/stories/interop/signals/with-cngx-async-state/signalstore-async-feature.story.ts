import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'withCngxAsyncState: SignalStore async feature',
  subtitle:
    '<code>withCngxAsyncState&lt;T&gt;()(\'users\')</code> grants a signalStore a <code>usersState</code> / <code>usersSink</code> pair: the load method pushes through <code>tapAsyncState(store.usersSink)</code> and <code>store.usersState</code> binds straight into <code>[state]</code>.',
  description:
    'The feature contributes one <code>createManualState</code> per key via <code>withProps</code> - no hand-written <code>isLoading</code> flags, no new state machine. The <code>&lt;T&gt;()</code> / <code>(key)</code> currying keeps the key literal, so the members are concretely named. The demo instantiates the store inline for a self-contained example; an application registers the store class in <code>providers</code> and injects it. Check the fail flag to route the same stream through <code>setError</code> and watch the error surface take over.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'async-state', 'error-handling'],
  apiComponents: ['withCngxAsyncState', 'CngxAsyncContainer'],
  moduleImports: [
    "import { signalStore, withMethods } from '@ngrx/signals';",
    "import { withCngxAsyncState } from '@cngx/interop/signals';",
    "import { tapAsyncState } from '@cngx/common/data';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncErrorTpl } from '@cngx/ui/feedback';",
    "import { map, timer } from 'rxjs';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncErrorTpl'],
  setup: `private readonly UsersStore = signalStore(
    withCngxAsyncState<Person[]>()('users'),
    withMethods((store) => ({
      load: (fail: boolean) =>
        timer(900)
          .pipe(
            map(() => {
              if (fail) {
                throw new Error('Users endpoint unavailable');
              }
              return PEOPLE.slice(0, 5);
            }),
            tapAsyncState(store.usersSink),
          )
          .subscribe({
            // The sink already captured the failure as state; an empty error
            // callback keeps the global ErrorHandler out of the demo console.
            error: () => {},
          }),
    })),
  );

  protected readonly store = new this.UsersStore();

  constructor() {
    this.store.load(false);
  }`,
  setupChrome: `protected readonly failLoad = signal(false);`,
  template: `  <cngx-async-container [state]="store.usersState" ariaLabel="Users">
    <ng-template cngxAsyncSkeleton>
      <div class="demo-stack--tight" style="display:flex;flex-direction:column">
        @for (i of [1, 2, 3]; track i) {
          <div class="demo-skeleton-bar" style="height:24px"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul style="list-style:none;padding:0;margin:0">
        @for (person of data; track person.name) {
          <li>{{ person.name }} ({{ person.role }})</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <p style="margin:0">Load failed: {{ $any(err).message }}</p>
    </ng-template>
  </cngx-async-container>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="store.load(failLoad())">Load</button>
    <label style="margin-left:1rem">
      <input
        type="checkbox"
        [checked]="failLoad()"
        (change)="failLoad.set($any($event.target).checked)"
      />
      Fail next load
    </label>
  </div>
<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">usersState.status</span>
      <span class="event-value">{{ store.usersState.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">First load</span>
      <span class="event-value">{{ store.usersState.isFirstLoad() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
