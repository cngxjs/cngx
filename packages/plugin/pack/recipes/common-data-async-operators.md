---
title: "tapHttpAsyncState: Upload with progress"
whenToUse: "Pipe tapHttpAsyncState(state) onto a request made with { reportProgress: true, observe: 'events' }. The operator sets loading on subscribe, turns each progress event into state.progress() (an integer 0-100), emits only the response body and calls setSuccess(body), or setError(err) when the request fails. The error is rethrown, so the subscriber handles it (here: ignores it, the state holds it). A native &lt;progress&gt; shows the percentage; one status region speaks only the outcome, not every percent. The demo backend answers without a network call; the chrome switch makes it fail."
symbols: [CngxAsyncStatus]
---

# tapHttpAsyncState: Upload with progress

Pipe tapHttpAsyncState(state) onto a request made with { reportProgress: true, observe: 'events' }. The operator sets loading on subscribe, turns each progress event into state.progress() (an integer 0-100), emits only the response body and calls setSuccess(body), or setError(err) when the request fails. The error is rethrown, so the subscriber handles it (here: ignores it, the state holds it). A native &lt;progress&gt; shows the percentage; one status region speaks only the outcome, not every percent. The demo backend answers without a network call; the chrome switch makes it fail.

## Symbols

- `CngxAsyncStatus`

## Setup

```ts
// Demo backend: answers every request after a few progress events.
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
}
```

## Wiring

```html
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
}}</p>
```
