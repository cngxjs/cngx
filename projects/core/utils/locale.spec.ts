import { Component, computed, Directive, LOCALE_ID, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { injectLocale, provideLocale, provideLocaleAt } from './locale';

@Directive({ selector: '[testLocaleReader]' })
class LocaleReader {
  readonly locale = injectLocale();
}

@Component({
  selector: 'test-locale-id-host',
  imports: [LocaleReader],
  providers: [{ provide: LOCALE_ID, useValue: 'de-DE' }],
  template: '<span testLocaleReader></span>',
})
class LocaleIdHost {}

@Component({
  selector: 'test-locale-at-host',
  imports: [LocaleReader],
  viewProviders: [provideLocaleAt('fr-FR')],
  template: '<span testLocaleReader></span>',
})
class LocaleAtHost {}

@Component({
  selector: 'test-locale-pair-host',
  imports: [LocaleReader],
  template: '<span testLocaleReader></span><span testLocaleReader></span>',
})
class LocalePairHost {}

const readers = (fixture: ComponentFixture<unknown>): LocaleReader[] =>
  fixture.debugElement
    .queryAll(By.directive(LocaleReader))
    .map((el) => el.injector.get(LocaleReader));

describe('injectLocale', () => {
  it('equals the root LOCALE_ID without a provider', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'en-GB' }] });
    const locale = TestBed.runInInjectionContext(() => injectLocale());
    expect(locale()).toBe('en-GB');
  });

  it('honours a component-level LOCALE_ID in a child directive', () => {
    const fixture = TestBed.createComponent(LocaleIdHost);
    const [reader] = readers(fixture);
    expect(reader.locale()).toBe('de-DE');
  });

  it('lets provideLocale win over LOCALE_ID', () => {
    TestBed.configureTestingModule({
      providers: [provideLocale('de-DE'), { provide: LOCALE_ID, useValue: 'en-GB' }],
    });
    const locale = TestBed.runInInjectionContext(() => injectLocale());
    expect(locale()).toBe('de-DE');
  });

  it('flips a Signal source live into a dependent computed', () => {
    const source = signal('en-US');
    TestBed.configureTestingModule({ providers: [provideLocale(source)] });
    const formatted = TestBed.runInInjectionContext(() => {
      const locale = injectLocale();
      return computed(() => new Intl.NumberFormat(locale()).format(1.5));
    });
    expect(formatted()).toBe('1.5');
    source.set('de-DE');
    expect(formatted()).toBe('1,5');
  });

  it('scopes a view child through provideLocaleAt in viewProviders', () => {
    const fixture = TestBed.createComponent(LocaleAtHost);
    const [reader] = readers(fixture);
    expect(reader.locale()).toBe('fr-FR');
  });

  it('shares one Signal across instances without a CNGX_LOCALE provider', () => {
    const fixture = TestBed.createComponent(LocalePairHost);
    const [first, second] = readers(fixture);
    expect(first.locale).toBe(second.locale);
  });
});
