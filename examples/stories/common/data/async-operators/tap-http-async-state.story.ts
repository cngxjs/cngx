import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'tapHttpAsyncState: Upload with progress',
  subtitle:
    'One operator on an <code>HttpClient</code> event stream sets <code>loading</code>, reports upload progress, extracts the response body and settles the state with success or error.',
  description:
    'Pipe <code>tapHttpAsyncState(state)</code> onto a request made with <code>{ reportProgress: true, observe: \'events\' }</code>. The operator sets <code>loading</code> on subscribe, turns each progress event into <code>state.progress()</code> (an integer 0-100), emits only the response body and calls <code>setSuccess(body)</code>, or <code>setError(err)</code> when the request fails. The error is rethrown, so the subscriber handles it (here: ignores it, the state holds it). A native <code>&lt;progress&gt;</code> shows the percentage; one status region speaks only the outcome, not every percent. The demo backend answers without a network call; the chrome switch makes it fail.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'integration'],
  apiComponents: ['tapHttpAsyncState', 'createManualState', 'CngxAsyncStatus'],
  moduleImports: [
    "import { DestroyRef } from '@angular/core';",
    "import { takeUntilDestroyed } from '@angular/core/rxjs-interop';",
    "import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';",
    "import { createManualState, tapHttpAsyncState } from '@cngx/common/data';",
    "import { CngxAsyncStatus } from '@cngx/common/interactive';",
    "import { createDemoHttpBackend, createIsolatedRoot } from '../../../../fixtures';",
  ],
  imports: ['CngxAsyncStatus'],
  setup: `// Demo backend: answers every request after a few progress events.
  private readonly backend = createDemoHttpBackend({
    respond: () => ({ name: 'report.pdf' }),
  });
  // In an app this list goes into bootstrapApplication providers.
  private readonly root = createIsolatedRoot([
    provideHttpClient(withInterceptors([this.backend.interceptor])),
  ]);
  private readonly http = this.root.run(() => inject(HttpClient));
  private readonly destroyRef = inject(DestroyRef);

  protected readonly upload = createManualState<{ name: string }>();

  protected handleUpload(): void {
    this.http
      .post<{ name: string }>('/api/upload', { file: 'report.pdf' }, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(tapHttpAsyncState(this.upload), takeUntilDestroyed(this.destroyRef))
      // The state holds the error; nothing else to do here.
      .subscribe({ error: () => undefined });
  }`,
  template: `
  <div class="demo-inline-actions">
    <button
      type="button"
      class="chip"
      (click)="handleUpload()"
      [cngxAsyncStatus]="upload"
      [disableWhilePending]="true"
    >
      Upload report
    </button>
    <progress max="100" [value]="upload.progress() ?? 0" aria-label="Upload progress"></progress>
  </div>
  <p role="status" class="demo-sr-only">{{
    upload.status() === 'success' ? 'Upload complete' : upload.status() === 'error' ? 'Upload failed' : ''
  }}</p>`,
  setupChrome: `  // The demo backend's fail switch, for the checkbox below.
  protected readonly serverFails = this.backend.fail;`,
  templateChrome: `<label class="event-row" style="margin-top:12px;gap:6px;align-items:center">
    <input type="checkbox" [checked]="serverFails()" (change)="serverFails.set($any($event.target).checked)" />
    <span>Server fails</span>
  </label>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">status</span>
      <span class="event-value">{{ upload.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">progress</span>
      <span class="event-value">{{ upload.progress() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">data</span>
      <span class="event-value">{{ upload.data()?.name ?? '-' }}</span>
    </div>
  </div>`,
};
