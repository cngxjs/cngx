import { beforeEach, describe, expect, it } from 'vitest';
import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CngxCard } from '../card.component';
import { CNGX_CARD_I18N, injectCardI18n, provideCardI18n, withCardI18nLabels } from './card-i18n';

@Component({
  template: `
    <cngx-card as="button" [selectable]="true" [loading]="loading()">body</cngx-card>
  `,
  imports: [CngxCard],
})
class Host {
  readonly loading = signal(false);
}

const setup = () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const card = fixture.nativeElement.querySelector('cngx-card') as HTMLElement;
  return {
    fixture,
    card,
    live: () => card.querySelector('[aria-live="polite"]')!.textContent!.trim(),
  };
};

describe('CNGX_CARD_I18N', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
  });

  it('ships the three English phrases without a provider', () => {
    expect(TestBed.inject(CNGX_CARD_I18N)()).toEqual({
      selected: 'Selected',
      deselected: 'Deselected',
      loading: 'Loading',
    });
  });

  it('keeps unset keys English on a partial override', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideCardI18n(withCardI18nLabels({ selected: 'Ausgewählt' }))],
    });
    const bundle = TestBed.runInInjectionContext(() => injectCardI18n());
    expect(bundle().selected).toBe('Ausgewählt');
    expect(bundle().deselected).toBe('Deselected');
  });

  it('resolves plain overrides to the same bundle as the eager merge did', () => {
    const overrides = { selected: 'Ausgewählt', loading: 'Lädt' };
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideCardI18n(withCardI18nLabels(overrides))],
    });
    expect(TestBed.inject(CNGX_CARD_I18N)()).toEqual({
      selected: 'Ausgewählt',
      deselected: 'Deselected',
      loading: 'Lädt',
    });
  });

  it('follows a Signal override and keeps its reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideCardI18n(
          withCardI18nLabels(
            computed(() => (lang() === 'en' ? {} : { selected: 'Ausgewählt' })),
          ),
        ),
      ],
    });
    const bundle = TestBed.inject(CNGX_CARD_I18N);
    expect(bundle().selected).toBe('Selected');

    lang.set('de');
    const german = bundle();
    expect(german.selected).toBe('Ausgewählt');
    expect(german.deselected).toBe('Deselected');

    lang.set('de-AT');
    expect(bundle()).toBe(german);
  });

  it('announces the overridden selection phrases on a real toggle', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideCardI18n(
          withCardI18nLabels({ selected: 'Ausgewählt', deselected: 'Abgewählt' }),
        ),
      ],
    });
    const { fixture, card, live } = setup();
    expect(live()).toBe('');

    card.click();
    fixture.detectChanges();
    expect(live()).toBe('Ausgewählt');

    card.click();
    fixture.detectChanges();
    expect(live()).toBe('Abgewählt');
  });

  it('announces the overridden loading phrase', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideCardI18n(withCardI18nLabels({ loading: 'Lädt' }))],
    });
    const { fixture, live } = setup();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(live()).toBe('Lädt');
  });
});
