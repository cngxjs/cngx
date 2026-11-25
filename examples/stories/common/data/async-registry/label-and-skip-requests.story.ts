import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'withAsyncLabel and withAsyncSkip: name a request or keep it out of the registry',
  subtitle:
    'An <code>HttpContext</code> from <code>withAsyncLabel(label)</code> names the request in <code>activeOperations()</code>; one from <code>withAsyncSkip()</code> keeps it out of the registry entirely.',
  description:
    '<code>cngxAsyncInterceptor</code> reads two context tokens per request. <code>withAsyncLabel(\'Invoices\')</code> sets the label the registry lists in <code>activeOperations()</code>, for display only, never as a key. <code>withAsyncSkip()</code> passes the request through unregistered, so polling, heartbeats or telemetry never make the app look busy. Both take an existing context as their second argument to chain with other tokens. The list below renders <code>activeOperations()</code>; the heartbeat runs but never shows up there. The demo backend answers without a network call.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'integration'],
  apiComponents: ['withAsyncLabel', 'withAsyncSkip', 'CngxAsyncRegistry'],
  moduleImports: [
    "import { DestroyRef } from '@angular/core';",
    "import { takeUntilDestroyed } from '@angular/core/rxjs-interop';",
    "import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';",
    "import { CngxAsyncRegistry, cngxAsyncInterceptor, provideAsyncRegistry, withAsyncLabel, withAsyncSkip } from '@cngx/common/data';",
    "import { createDemoHttpBackend, createIsolatedRoot } from '../../../../fixtures';",
  ],
  imports: [],
  setup: `// Demo backend: every request answers after 1.2 s.
  private readonly backend = createDemoHttpBackend({ steps: 1, stepMs: 600 });
  // In an app this list goes into bootstrapApplication providers.
  private readonly root = createIsolatedRoot([
    provideAsyncRegistry(),
    provideHttpClient(withInterceptors([cngxAsyncInterceptor, this.backend.interceptor])),
  ]);
  protected readonly registry = this.root.run(() => inject(CngxAsyncRegistry));
  private readonly http = this.root.run(() => inject(HttpClient));
  private readonly destroyRef = inject(DestroyRef);

  protected handleInvoices(): void {
    this.http
      .get('/api/invoices', { context: withAsyncLabel('Invoices') })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected handleHeartbeat(): void {
    this.http
      .post('/api/heartbeat', null, { context: withAsyncSkip() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }`,
  setupChrome: `  // What the demo backend is answering, registered or not.
  protected readonly backendInFlight = this.backend.inFlight;`,
  template: `
  <div class="demo-inline-actions">
    <button type="button" class="chip" (click)="handleInvoices()">Load invoices</button>
    <button type="button" class="chip" (click)="handleHeartbeat()">Send heartbeat</button>
  </div>
  <ul aria-label="Requests in flight" class="demo-stack" style="list-style:none;padding:0;margin:12px 0 0;gap:4px">
    @for (op of registry.activeOperations(); track op.id) {
      <li class="demo-card-tile">{{ op.label ?? op.id }}: {{ op.status }}</li>
    }
  </ul>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">isAnythingLoading()</span>
      <span class="event-value">{{ registry.isAnythingLoading() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">backend requests</span>
      <span class="event-value">{{ backendInFlight().join(', ') || '-' }}</span>
    </div>
  </div>`,
};
