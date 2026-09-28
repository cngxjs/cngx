import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAsyncClick } from '../async-click/async-click.directive';
import {
  CNGX_INTERACTIVE_I18N,
  injectInteractiveI18n,
  provideInteractiveI18n,
  withInteractiveI18nLabels,
  type CngxInteractiveI18n,
} from './interactive-i18n';

@Component({
  template: `<button [cngxAsyncClick]="action">Go</button>`,
  imports: [CngxAsyncClick],
})
class Host {
  readonly directive = viewChild.required(CngxAsyncClick);
  readonly action = (): Promise<void> => Promise.resolve();
}

describe('CNGX_INTERACTIVE_I18N', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('ships the English phrases without a provider', () => {
    expect(TestBed.inject(CNGX_INTERACTIVE_I18N)()).toEqual({
      asyncClickSucceeded: 'Action succeeded',
      asyncClickFailed: 'Action failed',
    });
  });

  it('keeps unset keys English on a static partial override', () => {
    TestBed.configureTestingModule({
      providers: [
        provideInteractiveI18n(withInteractiveI18nLabels({ asyncClickSucceeded: 'Erledigt' })),
      ],
    });
    const bundle = TestBed.runInInjectionContext(() => injectInteractiveI18n());
    expect(bundle().asyncClickSucceeded).toBe('Erledigt');
    expect(bundle().asyncClickFailed).toBe('Action failed');
  });

  it('flips live through a Signal override', () => {
    const overrides = signal<Partial<CngxInteractiveI18n>>({});
    TestBed.configureTestingModule({
      providers: [provideInteractiveI18n(withInteractiveI18nLabels(overrides))],
    });
    const bundle = TestBed.runInInjectionContext(() => injectInteractiveI18n());
    expect(bundle().asyncClickFailed).toBe('Action failed');
    overrides.set({ asyncClickFailed: 'Fehlgeschlagen' });
    expect(bundle().asyncClickFailed).toBe('Fehlgeschlagen');
  });

  it('shares one Signal across readers under one injector', () => {
    TestBed.configureTestingModule({
      providers: [provideInteractiveI18n(withInteractiveI18nLabels({ asyncClickFailed: 'Nein' }))],
    });
    const first = TestBed.runInInjectionContext(() => injectInteractiveI18n());
    const second = TestBed.runInInjectionContext(() => injectInteractiveI18n());
    expect(first).toBe(second);
  });

  it('defaults the CngxAsyncClick announcements from the bundle', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideInteractiveI18n(
          withInteractiveI18nLabels({
            asyncClickSucceeded: 'Erledigt',
            asyncClickFailed: 'Fehler',
          }),
        ),
      ],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const directive = fixture.componentInstance.directive();
    expect(directive.succeededAnnouncement()).toBe('Erledigt');
    expect(directive.failedAnnouncement()).toBe('Fehler');
  });
});
