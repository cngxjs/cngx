import { describe, it, expect } from 'vitest';
import { PLATFORM_ID, runInInjectionContext, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WINDOW, provideWindow, injectWindow } from './window.token';

describe('WINDOW token', () => {
  it('resolves to the global window on a browser platform', () => {
    expect(TestBed.inject(WINDOW)).toBe(window);
  });

  it('resolves to null on a server platform (SSR branch)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    expect(TestBed.inject(WINDOW)).toBeNull();
  });

  it('provideWindow overrides the factory with a custom reference', () => {
    const fakeWindow = { name: 'fake' } as unknown as Window;

    TestBed.configureTestingModule({
      providers: [provideWindow(fakeWindow)],
    });

    expect(TestBed.inject(WINDOW)).toBe(fakeWindow);
  });

  it('injectWindow reads the token inside an injection context', () => {
    const injector = TestBed.inject(Injector);

    expect(runInInjectionContext(injector, () => injectWindow())).toBe(window);
  });
});
