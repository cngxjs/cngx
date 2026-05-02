import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { CngxErrorRegistry } from './error-registry';
import { injectErrorScope } from './inject-error-scope';
import {
  provideErrorRegistry,
  withGlobalRevealOnSubmit,
  withRevealOnNavigate,
} from './provide-error-registry';

describe('provideErrorRegistry', () => {
  it('without features, registers only the registry token', () => {
    TestBed.configureTestingModule({ providers: [provideErrorRegistry()] });
    const registry = TestBed.inject(CngxErrorRegistry);
    expect(registry).toBeInstanceOf(CngxErrorRegistry);
  });

  it('the registry instance is stable per environment', () => {
    TestBed.configureTestingModule({ providers: [provideErrorRegistry()] });
    expect(TestBed.inject(CngxErrorRegistry)).toBe(TestBed.inject(CngxErrorRegistry));
  });
});

describe('withGlobalRevealOnSubmit', () => {
  function setupHost(): {
    registry: CngxErrorRegistry;
    revealCalls: () => number;
    submit: () => void;
  } {
    const reveals: number[] = [];

    @Component({ template: '', standalone: true })
    class Host {
      readonly scope = injectErrorScope('a');
    }

    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideErrorRegistry(withGlobalRevealOnSubmit())],
    });
    const registry = TestBed.inject(CngxErrorRegistry);

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const original = registry.revealAll.bind(registry);
    registry.revealAll = (): void => {
      reveals.push(reveals.length + 1);
      original();
    };

    const form = document.createElement('form');
    form.addEventListener('submit', (e) => e.preventDefault());
    document.body.appendChild(form);

    return {
      registry,
      revealCalls: () => reveals.length,
      submit: () => {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      },
    };
  }

  it('reveals every registered scope on a DOM submit event', () => {
    const { registry, revealCalls, submit } = setupHost();
    expect(registry.getScope('a')?.showErrors()).toBe(false);
    expect(revealCalls()).toBe(0);

    submit();

    expect(revealCalls()).toBe(1);
    expect(registry.getScope('a')?.showErrors()).toBe(true);
  });

  it('every subsequent submit also fires revealAll', () => {
    const { revealCalls, submit } = setupHost();
    submit();
    submit();
    submit();
    expect(revealCalls()).toBe(3);
  });

  it('listener detaches on environment teardown', () => {
    const { registry, revealCalls, submit } = setupHost();
    submit();
    expect(revealCalls()).toBe(1);

    TestBed.resetTestingModule();
    void registry;
    submit();
    expect(revealCalls()).toBe(1);
  });
});

describe('withRevealOnNavigate', () => {
  it('reveals all scopes on Router.NavigationStart', async () => {
    @Component({ template: '', standalone: true })
    class Host {
      readonly scope = injectErrorScope('a');
    }

    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([{ path: 'next', component: Host }]),
        provideErrorRegistry(withRevealOnNavigate()),
      ],
    });

    const registry = TestBed.inject(CngxErrorRegistry);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const spy = vi.spyOn(registry, 'revealAll');
    expect(registry.getScope('a')?.showErrors()).toBe(false);

    await router.navigate(['/next']);

    expect(spy).toHaveBeenCalled();
    expect(registry.getScope('a')?.showErrors()).toBe(true);
  });

  it('is a graceful no-op when no Router is provided', () => {
    expect(() => {
      TestBed.configureTestingModule({
        providers: [provideErrorRegistry(withRevealOnNavigate())],
      });
      // Forcing the env initializer to run by injecting any token from the
      // environment is enough — the registry itself is the side-effect-free
      // checkpoint.
      TestBed.inject(CngxErrorRegistry);
    }).not.toThrow();
  });
});

describe('feature composition', () => {
  it('composes withGlobalRevealOnSubmit + withRevealOnNavigate', async () => {
    @Component({ template: '', standalone: true })
    class Host {
      readonly scope = injectErrorScope('a');
    }

    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([{ path: 'next', component: Host }]),
        provideErrorRegistry(withGlobalRevealOnSubmit(), withRevealOnNavigate()),
      ],
    });
    const registry = TestBed.inject(CngxErrorRegistry);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const spy = vi.spyOn(registry, 'revealAll');

    const form = document.createElement('form');
    form.addEventListener('submit', (e) => e.preventDefault());
    document.body.appendChild(form);
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(spy).toHaveBeenCalledTimes(1);

    await router.navigate(['/next']);
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
