import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'cngxAsyncInterceptor: every HttpClient request in the async registry',
  subtitle:
    '<code>provideAsyncRegistry()</code> plus <code>cngxAsyncInterceptor</code> in the app\'s own <code>withInterceptors</code> registers each request while it is in flight, so one app-shell indicator reads <code>isAnythingLoading()</code>.',
  description:
    'The interceptor registers a request with <code>CngxAsyncRegistry</code> when it starts and unregisters it when it settles, success or error. <code>isAnythingLoading()</code> is the aggregate busy flag an app shell binds to a top progress bar or a status line; <code>activeOperations()</code> lists what is in flight. Add the interceptor to your own <code>provideHttpClient(withInterceptors([...]))</code>: <code>provideAsyncHttpObservability()</code> sets up a second <code>HttpClient</code> and is only for apps where cngx owns that setup. The indicator is a status region that speaks once when loading starts, empties when it ends and says so when a request failed. It carries no <code>aria-busy</code>: a busy region holds back the very text it is meant to speak. The demo backend answers without a network call; the chrome switch makes it fail.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'integration'],
  apiComponents: ['provideAsyncRegistry', 'cngxAsyncInterceptor', 'CngxAsyncRegistry'],
  moduleImports: [
    "import { DestroyRef, type WritableSignal } from '@angular/core';",
    "import { takeUntilDestroyed } from '@angular/core/rxjs-interop';",
    "import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';",
    "import { CngxAsyncRegistry, cngxAsyncInterceptor, provideAsyncRegistry } from '@cngx/common/data';",
    "import { createDemoHttpBackend, createIsolatedRoot } from '../../../../fixtures';",
  ],
  imports: [],
  setup: `// Demo backend: users answer after 1.6 s, teams after 0.8 s.
  private readonly backend = createDemoHttpBackend({
    steps: 1,
    stepMs: (req) => (req.url.endsWith('users') ? 800 : 400),
    respond: (req) => (req.url.endsWith('users') ? ['Ada', 'Grace', 'Linus'] : ['Core', 'Docs']),
  });
  // In an app this list goes into bootstrapApplication providers.
  private readonly root = createIsolatedRoot([
    provideAsyncRegistry(),
    provideHttpClient(withInterceptors([cngxAsyncInterceptor, this.backend.interceptor])),
  ]);
  protected readonly registry = this.root.run(() => inject(CngxAsyncRegistry));
  private readonly http = this.root.run(() => inject(HttpClient));
  private readonly destroyRef = inject(DestroyRef);

  protected readonly users = signal<string[]>([]);
  protected readonly teams = signal<string[]>([]);

  protected readonly lastError = signal<unknown>(undefined);
  protected readonly statusText = computed(() => {
    if (this.registry.isAnythingLoading()) {
      return 'Loading data...';
    }
    return this.lastError() === undefined ? '' : 'Loading failed. Try again.';
  });

  protected handleLoad(): void {
    this.lastError.set(undefined);
    this.load('/api/users', this.users);
    this.load('/api/teams', this.teams);
  }

  private load(url: string, target: WritableSignal<string[]>): void {
    this.http
      .get<string[]>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (rows) => target.set(rows), error: (err: unknown) => this.lastError.set(err) });
  }`,
  setupChrome: `  // The demo backend's fail switch, for the checkbox below.
  protected readonly serverFails = this.backend.fail;
  protected readonly errorText = computed(() => {
    const err = this.lastError() as { status?: number; statusText?: string } | undefined;
    return err ? \`\${err.status} \${err.statusText}\` : '-';
  });`,
  template: `
  <div class="demo-inline-actions">
    <button type="button" class="chip" (click)="handleLoad()">Load users and teams</button>
  </div>
  <p role="status">{{ statusText() }}</p>`,
  templateChrome: `<label class="event-row" style="margin-top:12px;gap:6px;align-items:center">
    <input type="checkbox" [checked]="serverFails()" (change)="serverFails.set($any($event.target).checked)" />
    <span>Server fails</span>
  </label>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isAnythingLoading()</span>
      <span class="event-value">{{ registry.isAnythingLoading() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">activeOperations()</span>
      <span class="event-value">{{ registry.activeOperations().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">users</span>
      <span class="event-value">{{ users().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">teams</span>
      <span class="event-value">{{ teams().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">last error</span>
      <span class="event-value">{{ errorText() }}</span>
    </div>
  </div>`,
};
