import {
  type HttpEvent,
  type HttpHandlerFn,
  HttpErrorResponse,
  type HttpInterceptorFn,
  type HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { type Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';

/** One workspace section, as the (fake) API returns it. */
export interface Section {
  id: string;
  label: string;
  body: string;
}

const SECTIONS: Section[] = [
  { id: 'overview', label: 'Overview', body: 'Workspace overview.' },
  { id: 'members', label: 'Members', body: 'Team members and roles.' },
  {
    id: 'billing',
    label: 'Billing',
    body: 'Billing settings. The server refuses to commit a switch TO this section while a payment is pending (HTTP 409) - watch the busy spinner, then the rejection decoration.',
  },
  { id: 'danger', label: 'Danger zone', body: 'Destructive actions.' },
];

/**
 * In-memory fake backend so the playground is self-contained yet exercises the
 * real `HttpClient` path (which is exactly why this is a StackBlitz playground,
 * not an `<example-url>` story - it needs `provideHttpClient` + an interceptor):
 *
 * - `GET /api/sections` -> the section list, after a short latency.
 * - `PUT /api/sections/<id>/activate` -> commits a switch: 200 after latency,
 *   or 409 for `billing` to demonstrate a server-refused commit.
 */
export const backendInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (req.method === 'GET' && req.url.endsWith('/api/sections')) {
    return of(new HttpResponse({ status: 200, body: SECTIONS })).pipe(delay(400));
  }

  const activate = req.url.match(/\/api\/sections\/([^/]+)\/activate$/);
  if (req.method === 'PUT' && activate) {
    const id = activate[1];
    return of(null).pipe(
      delay(600),
      mergeMap(() =>
        id === 'billing'
          ? throwError(
              () =>
                new HttpErrorResponse({
                  status: 409,
                  statusText: 'Conflict',
                  url: req.url,
                  error: { message: 'A payment is pending; cannot leave billing.' },
                }),
            )
          : of(new HttpResponse({ status: 200 })),
      ),
    );
  }

  return next(req);
};
