import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'tapAsyncProgress: Progress only, consumer settles',
  subtitle:
    'The operator only turns progress events into <code>state.progress()</code>; the consumer sets <code>loading</code> and settles the state itself.',
  description:
    '<code>tapAsyncProgress(state)</code> is the progress half of <code>tapHttpAsyncState</code>: it reads upload and download progress events, writes an integer 0-100 through <code>setProgress()</code> and passes every event through unchanged. Status and settle stay with the consumer, which is what you want when the response needs mapping before it becomes state, or when one request feeds more than one state. When the body goes into the state as it arrives, prefer <code>tapHttpAsyncState</code>, which does all of it in one operator. The demo backend answers without a network call; the chrome switch makes it fail.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'integration'],
  apiComponents: ['tapAsyncProgress', 'createManualState', 'CngxAsyncStatus'],
  moduleImports: [
    "import { DestroyRef } from '@angular/core';",
    "import { takeUntilDestroyed } from '@angular/core/rxjs-interop';",
    "import { HttpClient, HttpEventType, provideHttpClient, withInterceptors, type HttpEvent } from '@angular/common/http';",
    "import { filter, map } from 'rxjs';",
    "import { createManualState, tapAsyncProgress } from '@cngx/common/data';",
    "import { CngxAsyncStatus } from '@cngx/common/interactive';",
    "import { createDemoHttpBackend, createIsolatedRoot } from '../../../../fixtures';",
  ],
  imports: ['CngxAsyncStatus'],
  setup: `// Demo backend: answers every request after a few progress events.
  private readonly backend = createDemoHttpBackend({
    respond: () => ['north', 'south', 'west'],
  });
  // In an app this list goes into bootstrapApplication providers.
  private readonly root = createIsolatedRoot([
    provideHttpClient(withInterceptors([this.backend.interceptor])),
  ]);
  private readonly http = this.root.run(() => inject(HttpClient));
  private readonly destroyRef = inject(DestroyRef);

  protected readonly download = createManualState<string>();

  protected handleDownload(): void {
    this.download.set('loading');
    this.http
      .get<string[]>('/api/export', { reportProgress: true, observe: 'events' })
      .pipe(
        tapAsyncProgress(this.download),
        filter((event: HttpEvent<string[]>) => event.type === HttpEventType.Response),
        map((response) => \`\${response.body?.length ?? 0} rows\`),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (summary) => this.download.setSuccess(summary),
        error: (err: unknown) => this.download.setError(err),
      });
  }`,
  setupChrome: `  // The demo backend's fail switch, for the checkbox below.
  protected readonly serverFails = this.backend.fail;`,
  template: `
  <div class="demo-inline-actions">
    <button
      type="button"
      class="chip"
      (click)="handleDownload()"
      [cngxAsyncStatus]="download"
      [disableWhilePending]="true"
    >
      Download export
    </button>
    <progress max="100" [value]="download.progress() ?? 0" aria-label="Download progress"></progress>
  </div>
  <p role="status" class="demo-sr-only">{{
    download.status() === 'success' ? 'Download complete' : download.status() === 'error' ? 'Download failed' : ''
  }}</p>`,
  templateChrome: `<label class="event-row" style="margin-top:12px;gap:6px;align-items:center">
    <input type="checkbox" [checked]="serverFails()" (change)="serverFails.set($any($event.target).checked)" />
    <span>Server fails</span>
  </label>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status</span>
      <span class="event-value">{{ download.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">progress</span>
      <span class="event-value">{{ download.progress() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">data</span>
      <span class="event-value">{{ download.data() ?? '-' }}</span>
    </div>
  </div>`,
};
