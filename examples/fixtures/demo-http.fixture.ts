import {
  HttpErrorResponse,
  HttpEventType,
  HttpResponse,
  type HttpEvent,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { signal, type Signal, type WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';

/** Options of {@link createDemoHttpBackend}. */
export interface DemoHttpBackendOptions {
  /** Response body for a request. Default: `{ ok: true }`. */
  readonly respond?: (req: HttpRequest<unknown>) => unknown;
  /** Progress events before the response. Default: 4. */
  readonly steps?: number;
  /** Time between two events in ms, per request. Default: 300. */
  readonly stepMs?: number | ((req: HttpRequest<unknown>) => number);
}

/** The demo backend: an interceptor plus the switch that makes it fail. */
export interface DemoHttpBackend {
  /** Put it last in `withInterceptors([...])`: it answers and never calls `next`. */
  readonly interceptor: HttpInterceptorFn;
  /** While `true`, a request ends with a 503 instead of the response. Read when it settles. */
  readonly fail: WritableSignal<boolean>;
  /** URLs of the requests the backend is answering right now, in start order. */
  readonly inFlight: Signal<readonly string[]>;
}

const TOTAL_BYTES = 1000;

/**
 * Demo chrome: an `HttpClient` backend for stories, so a story can show real
 * `HttpClient` code without a network. Each request gets `steps` progress
 * events (upload progress for a request with a body, download progress
 * otherwise, only when the request asked for `reportProgress`), then an
 * `HttpResponse` or, while `fail()` is true, an `HttpErrorResponse` 503.
 * Unsubscribing cancels the pending timers.
 */
export function createDemoHttpBackend(options: DemoHttpBackendOptions = {}): DemoHttpBackend {
  const fail = signal(false);
  const inFlight = signal<readonly string[]>([]);
  const steps = options.steps ?? 4;
  const respond = options.respond ?? (() => ({ ok: true }));
  const stepOf = (req: HttpRequest<unknown>): number => {
    const step = options.stepMs ?? 300;
    return typeof step === 'function' ? step(req) : step;
  };

  const interceptor: HttpInterceptorFn = (req) =>
    new Observable<HttpEvent<unknown>>((subscriber) => {
      const stepMs = stepOf(req);
      const type = req.body == null ? HttpEventType.DownloadProgress : HttpEventType.UploadProgress;
      const timers: ReturnType<typeof setTimeout>[] = [];
      inFlight.update((urls) => [...urls, req.url]);
      subscriber.next({ type: HttpEventType.Sent });
      if (req.reportProgress) {
        for (let i = 1; i <= steps; i++) {
          timers.push(
            setTimeout(
              () => subscriber.next({ type, loaded: (TOTAL_BYTES * i) / steps, total: TOTAL_BYTES }),
              stepMs * i,
            ),
          );
        }
      }
      timers.push(
        setTimeout(
          () => {
            if (fail()) {
              subscriber.error(
                new HttpErrorResponse({
                  status: 503,
                  statusText: 'Service Unavailable',
                  url: req.urlWithParams,
                }),
              );
              return;
            }
            subscriber.next(new HttpResponse({ body: respond(req), status: 200, url: req.urlWithParams }));
            subscriber.complete();
          },
          stepMs * (steps + 1),
        ),
      );
      return () => {
        timers.forEach((t) => clearTimeout(t));
        inFlight.update((urls) => {
          const index = urls.indexOf(req.url);
          return index < 0 ? urls : [...urls.slice(0, index), ...urls.slice(index + 1)];
        });
      };
    });

  return { interceptor, fail, inFlight: inFlight.asReadonly() };
}
