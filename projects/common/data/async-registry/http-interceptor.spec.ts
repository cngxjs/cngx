import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxAsyncRegistry } from './async-registry';
import { provideAsyncRegistry } from './provide-async-registry';
import { withAsyncLabel, withAsyncSkip } from './http-context';
import { cngxAsyncInterceptor, provideCngxHttpObservability } from './http-interceptor';

interface Harness {
  http: HttpClient;
  httpMock: HttpTestingController;
  registry: CngxAsyncRegistry;
}

function configure(): Harness {
  TestBed.configureTestingModule({
    providers: [
      provideAsyncRegistry(),
      provideHttpClient(withInterceptors([cngxAsyncInterceptor])),
      provideHttpClientTesting(),
    ],
  });
  return {
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
    registry: TestBed.inject(CngxAsyncRegistry),
  };
}

describe('cngxAsyncInterceptor', () => {
  it('flips isAnythingLoading during flight and clears on success', () => {
    const { http, httpMock, registry } = configure();

    http.get('/api/x').subscribe();
    expect(registry.isAnythingLoading()).toBe(true);

    httpMock.expectOne('/api/x').flush([1, 2]);

    expect(registry.isAnythingLoading()).toBe(false);
    expect(registry.activeOperations()).toHaveLength(0);
  });

  it('clears on the error path too (finalize fires on error - no pinned loading)', () => {
    const { http, httpMock, registry } = configure();

    http.get('/api/err').subscribe({ error: () => undefined });
    expect(registry.isAnythingLoading()).toBe(true);

    httpMock.expectOne('/api/err').flush('boom', { status: 500, statusText: 'Server Error' });

    expect(registry.isAnythingLoading()).toBe(false);
    expect(registry.activeOperations()).toHaveLength(0);
  });

  it('never registers a request carrying CNGX_ASYNC_SKIP', () => {
    const { http, httpMock, registry } = configure();

    http.get('/api/ping', { context: withAsyncSkip() }).subscribe();

    expect(registry.activeOperations()).toHaveLength(0);
    expect(registry.isAnythingLoading()).toBe(false);

    httpMock.expectOne('/api/ping').flush(null);
  });

  it('surfaces a labeled request under its label', () => {
    const { http, httpMock, registry } = configure();

    http.get('/api/users', { context: withAsyncLabel('users') }).subscribe();

    const ops = registry.activeOperations();
    expect(ops).toHaveLength(1);
    expect(ops[0].label).toBe('users');
    expect(ops[0].status).toBe('loading');

    httpMock.expectOne('/api/users').flush([]);
    expect(registry.activeOperations()).toHaveLength(0);
  });

  it('tracks two concurrent same-label requests independently (per-uid identity)', () => {
    const { http, httpMock, registry } = configure();

    http.get('/api/a', { context: withAsyncLabel('shared') }).subscribe();
    http.get('/api/b', { context: withAsyncLabel('shared') }).subscribe();

    expect(registry.activeOperations()).toHaveLength(2);
    expect(registry.isAnythingLoading()).toBe(true);

    httpMock.expectOne('/api/a').flush([]);

    // Completing one must not evict the other - the second is still in flight.
    expect(registry.isAnythingLoading()).toBe(true);
    expect(registry.activeOperations()).toHaveLength(1);

    httpMock.expectOne('/api/b').flush([]);

    expect(registry.isAnythingLoading()).toBe(false);
    expect(registry.activeOperations()).toHaveLength(0);
  });

  it('tracks two concurrent unlabeled requests independently', () => {
    const { http, httpMock, registry } = configure();

    http.get('/api/1').subscribe();
    http.get('/api/2').subscribe();

    expect(registry.activeOperations()).toHaveLength(2);
    expect(registry.activeOperations().every((op) => op.label === undefined)).toBe(true);

    httpMock.expectOne('/api/1').flush([]);
    expect(registry.activeOperations()).toHaveLength(1);

    httpMock.expectOne('/api/2').flush([]);
    expect(registry.activeOperations()).toHaveLength(0);
  });

  it('provideCngxHttpObservability wires the interceptor end-to-end', () => {
    TestBed.configureTestingModule({
      providers: [provideAsyncRegistry(), provideCngxHttpObservability(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);
    const registry = TestBed.inject(CngxAsyncRegistry);

    http.get('/api/z').subscribe();
    expect(registry.isAnythingLoading()).toBe(true);

    httpMock.expectOne('/api/z').flush([]);
    expect(registry.isAnythingLoading()).toBe(false);
  });

  it('passes the request through untouched when no registry is provided', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([cngxAsyncInterceptor])), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    let received: unknown;
    http.get('/api/n').subscribe((value) => (received = value));
    httpMock.expectOne('/api/n').flush([7]);

    expect(received).toEqual([7]);
  });
});
