import {
  Component,
  Directive,
  InjectionToken,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import { injectLazySelf } from './lazy-self';

const TOKEN = new InjectionToken<{ readonly id: string }>('LazySelfSpecToken');

function inEnv(providers: { provide: unknown; useValue: unknown }[]) {
  const injector = Injector.create({ providers: providers as never });
  const spy = vi.spyOn(injector, 'get');
  const lookups = () => spy.mock.calls.filter(([token]) => token === TOKEN).length;
  return { injector, lookups };
}

describe('injectLazySelf', () => {
  it('does not look up at construction', () => {
    const { injector, lookups } = inEnv([{ provide: TOKEN, useValue: { id: 'a' } }]);

    runInInjectionContext(injector, () => injectLazySelf(TOKEN));

    expect(lookups()).toBe(0);
  });

  it('looks up a present token once across repeated reads', () => {
    const value = { id: 'a' };
    const { injector, lookups } = inEnv([{ provide: TOKEN, useValue: value }]);
    const read = runInInjectionContext(injector, () => injectLazySelf(TOKEN));

    expect(read()).toBe(value);
    expect(read()).toBe(value);
    expect(read()).toBe(value);
    expect(lookups()).toBe(1);
  });

  it('caches null for an absent optional token after one lookup', () => {
    const { injector, lookups } = inEnv([]);
    const read = runInInjectionContext(injector, () => injectLazySelf(TOKEN, { optional: true }));

    expect(read()).toBeNull();
    expect(read()).toBeNull();
    expect(read()).toBeNull();
    expect(lookups()).toBe(1);
  });

  it('throws like injector.get for an absent required token', () => {
    const { injector } = inEnv([]);
    const read = runInInjectionContext(injector, () => injectLazySelf(TOKEN));

    expect(() => read()).toThrow(
      expect.objectContaining({ message: expect.stringMatching(/NG0201/) }),
    );
  });

  describe('on an element', () => {
    @Directive({
      selector: '[lazySelfProvider]',
      providers: [{ provide: TOKEN, useValue: { id: 'self' } }],
    })
    class Provider {}

    @Component({
      selector: 'lazy-self-reader',
      template: '',
      host: { '[attr.data-found]': 'read()?.id ?? "none"' },
    })
    class Reader {
      readonly read = injectLazySelf(TOKEN, { optional: true });
    }

    @Component({
      template: `
        <lazy-self-reader id="self" lazySelfProvider />
        <div lazySelfProvider><lazy-self-reader id="child" /></div>
      `,
      imports: [Reader, Provider],
    })
    class Host {}

    it('finds a provider declared after the reader on the same element in the first CD', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();

      const self = fixture.debugElement.query(By.css('#self'));
      expect((self.nativeElement as HTMLElement).getAttribute('data-found')).toBe('self');
    });

    it('ignores a provider on an ancestor', () => {
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();

      const child = fixture.debugElement.query(By.css('#child'));
      expect((child.nativeElement as HTMLElement).getAttribute('data-found')).toBe('none');
    });
  });
});
