import {
  type MonoTypeOperatorFunction,
  type Observable,
  type OperatorFunction,
  defer,
  filter,
  finalize,
  map,
  tap,
} from 'rxjs';

/**
 * Minimal write interface for async state operators.
 *
 * Any `ManualAsyncState<T>` satisfies this - operators only need the write side.
 */
interface AsyncStateSink<T> {
  set(status: 'idle' | 'loading' | 'refreshing' | 'pending'): void;
  setSuccess(data: T): void;
  setError(error: unknown): void;
  setProgress(value: number | undefined): void;
  /**
   * Optional read side: when present, `tapAsyncState` picks `refreshing`
   * over `loading` for a re-subscribe after data has already landed.
   * Any `ManualAsyncState<T>` provides it.
   */
  isFirstLoad?: () => boolean;
}

/**
 * RxJS operator that wires an Observable's lifecycle to a `ManualAsyncState`.
 *
 * On subscribe: sets `loading` (or `refreshing` if data was already loaded,
 * read via the sink's `isFirstLoad`; an explicit `options.status` wins).
 * On next: calls `setSuccess(value)`.
 * On error: calls `setError(err)` and **re-throws** (does not swallow).
 * On teardown without a value (unsubscribe mid-flight, empty complete):
 * resets the sink to `idle` so a cancelled request never leaves it busy.
 *
 * The Observable passes through unchanged - `tapAsyncState` is a side-effect operator.
 *
 * ```typescript
 * readonly residents = createManualState<Resident[]>();
 *
 * load(): void {
 *   this.http.get<Resident[]>('/api/residents').pipe(
 *     tapAsyncState(this.residents),
 *     takeUntilDestroyed(this.destroyRef),
 *   ).subscribe();
 * }
 * ```
 *
 * @category common/data/async-state
 */
export function tapAsyncState<T>(
  state: AsyncStateSink<T>,
  options?: { status?: 'loading' | 'refreshing' | 'pending' },
): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    defer(() => {
      state.set(options?.status ?? (state.isFirstLoad?.() === false ? 'refreshing' : 'loading'));
      let settled = false;
      return source.pipe(
        tap({
          next: (value) => {
            settled = true;
            state.setSuccess(value);
          },
          error: (err: unknown) => {
            settled = true;
            state.setError(err);
          },
        }),
        finalize(() => {
          // Torn down without ever settling (cancelled mid-flight or an
          // empty complete) - do not leave the sink busy forever.
          if (!settled) {
            state.set('idle');
          }
        }),
      );
    });
}

/**
 * Shape of an Angular `HttpProgressEvent` - declared structurally to
 * avoid a hard import on `@angular/common/http` from this entry point.
 */
interface HttpProgressLike {
  type: number; // HttpEventType.UploadProgress = 1, DownloadProgress = 3
  loaded: number;
  total?: number;
}

/**
 * Shape of an Angular `HttpResponse` - declared structurally.
 */
interface HttpResponseLike<T> {
  type: number; // HttpEventType.Response = 4
  body: T | null;
}

// HttpEventType values (from @angular/common/http)
const UPLOAD_PROGRESS = 1;
const DOWNLOAD_PROGRESS = 3;
const RESPONSE = 4;

/**
 * RxJS operator that extracts upload/download progress from an
 * `HttpEvent` stream and reports it to a `ManualAsyncState`.
 *
 * Filters progress events, calculates percentage, calls `setProgress()`.
 * Non-progress events pass through unchanged.
 *
 * Use with `{ observe: 'events', reportProgress: true }` on HttpClient.
 *
 * ```typescript
 * readonly upload = createManualState<UploadResult>();
 *
 * handleUpload(file: File): void {
 *   this.http.post('/api/upload', file, {
 *     reportProgress: true,
 *     observe: 'events',
 *   }).pipe(
 *     tapAsyncProgress(this.upload),
 *     takeUntilDestroyed(this.destroyRef),
 *   ).subscribe();
 * }
 * ```
 *
 * @category common/data/async-state
 */
export function tapAsyncProgress<E>(
  state: Pick<AsyncStateSink<unknown>, 'setProgress'>,
): MonoTypeOperatorFunction<E> {
  return tap((event) => {
    const e = event as unknown as HttpProgressLike;
    if (
      (e.type === UPLOAD_PROGRESS || e.type === DOWNLOAD_PROGRESS) &&
      e.total != null &&
      e.total > 0
    ) {
      state.setProgress(Math.round((100 * e.loaded) / e.total));
    }
  });
}

/**
 * RxJS operator that combines `tapAsyncState` + `tapAsyncProgress` for HTTP event streams.
 *
 * Pipe this onto an `HttpClient` call with `{ observe: 'events', reportProgress: true }`.
 * It will:
 * 1. Set `loading` on subscribe
 * 2. Report upload/download progress via `setProgress()`
 * 3. Extract the response body on `HttpEventType.Response`
 * 4. Call `setSuccess(body)` with the extracted body
 * 5. Call `setError(err)` on error
 *
 * The output Observable emits the **response body** (not HttpEvents).
 * Throws if the response body is `null`.
 *
 * ```typescript
 * readonly upload = createManualState<UploadResult>();
 *
 * handleUpload(file: File): void {
 *   this.http.post('/api/upload', file, {
 *     reportProgress: true,
 *     observe: 'events',
 *   }).pipe(
 *     tapHttpAsyncState(this.upload),
 *     takeUntilDestroyed(this.destroyRef),
 *   ).subscribe();
 *   // upload.status(), upload.progress(), upload.data() - all wired
 * }
 * ```
 *
 * @category common/data/async-state
 */
export function tapHttpAsyncState<T>(
  state: AsyncStateSink<T>,
  options?: { status?: 'loading' | 'refreshing' | 'pending' },
): OperatorFunction<unknown, T> {
  return (source: Observable<unknown>) =>
    defer(() => {
      state.set(options?.status ?? 'loading');
      let settled = false;
      return source.pipe(
        tapAsyncProgress<unknown>(state),
        filter((event): event is HttpResponseLike<T> => {
          return (event as HttpResponseLike<T>).type === RESPONSE;
        }),
        map((response) => {
          if (response.body == null) {
            throw new Error('tapHttpAsyncState: response body is null');
          }
          return response.body;
        }),
        tap({
          next: (value) => {
            settled = true;
            state.setSuccess(value);
          },
          error: (err: unknown) => {
            settled = true;
            state.setError(err);
          },
        }),
        finalize(() => {
          if (!settled) {
            state.set('idle');
          }
        }),
      );
    });
}
