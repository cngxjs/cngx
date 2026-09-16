import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'fromQuery: TanStack query bridge',
  subtitle:
    '<code>fromQuery</code> projects a real <code>injectQuery</code> result onto <code>CngxAsyncState</code>: TanStack\'s <code>status</code> / <code>fetchStatus</code> pair maps onto the cngx status union, so <code>cngx-async-container</code> binds the query directly through <code>[state]</code>.',
  description:
    'The query is a genuine TanStack Angular Query - <code>provideTanStackQuery(new QueryClient())</code> is component-scoped via <code>viewProviders</code>, no app-level setup. <code>fromQuery</code> is pure <code>computed()</code>: first load reads <code>loading</code>, a refetch over retained data reads <code>refreshing</code>, and a failed refetch keeps the rows on screen while <code>status</code> flips to <code>error</code>. The demo sets <code>retry: false</code> so the error path is immediate; TanStack\'s default is three retries with backoff. The readout shows the raw TanStack pair next to the mapped cngx status.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'async-state', 'error-handling'],
  apiComponents: ['fromQuery', 'CngxAsyncContainer'],
  moduleImports: [
    "import { fromQuery } from '@cngx/interop/query';",
    "import { injectQuery, provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncErrorTpl } from '@cngx/ui/feedback';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncErrorTpl'],
  viewProviders: ['provideTanStackQuery(new QueryClient())'],
  setup: `protected readonly failNext = signal(false);

  protected readonly query = injectQuery(() => ({
    queryKey: ['people'],
    queryFn: () => this.fetchPeople(),
    retry: false,
  }));

  protected readonly people = fromQuery<Person[]>(this.query);

  private fetchPeople(): Promise<Person[]> {
    const fail = this.failNext();
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (fail) {
          reject(new Error('People endpoint unavailable'));
          return;
        }
        resolve(PEOPLE.slice(0, 5));
      }, 900);
    });
  }`,
  template: `  <cngx-async-container [state]="people" ariaLabel="People">
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
    <button type="button" class="chip" (click)="query.refetch()">Refetch</button>
    <label style="margin-left:1rem">
      <input
        type="checkbox"
        [checked]="failNext()"
        (change)="failNext.set($any($event.target).checked)"
      />
      Fail next fetch
    </label>
  </div>
<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">TanStack status</span>
      <span class="event-value">{{ query.status() }} / {{ query.fetchStatus() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">cngx status</span>
      <span class="event-value">{{ people.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">First load</span>
      <span class="event-value">{{ people.isFirstLoad() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
