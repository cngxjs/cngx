import { Component, inject, Injector, runInInjectionContext, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/**
 * Runs `fn` in the element injector of a component that declares
 * `providers`, so an `inject*` call sees a subtree override such as
 * `provideLocaleAt('de')`. Configure the root through `TestBed` first.
 */
export function runInSubtree<T>(providers: Provider[], fn: () => T): T {
  @Component({ selector: 'cngx-testing-subtree', template: '', providers })
  class Subtree {
    readonly injector = inject(Injector);
  }
  const { injector } = TestBed.createComponent(Subtree).componentInstance;
  return runInInjectionContext(injector, fn);
}
