import { Component, computed, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';

import { CngxStatCard } from '../stat-card.component';
import { withStatCardAriaLabels, withStatCardLoadingTreatment } from './features';
import { injectStatCardAriaLabels, injectStatCardConfig } from './inject-stat-card-config';
import { provideStatCardConfig, provideStatCardConfigAt } from './provide-stat-card-config';
import type { CngxStatCardAriaLabels } from './stat-card.config';
import { CNGX_STAT_CARD_LANGUAGE_EN } from '../i18n/stat-card-language-section';
import { CNGX_STAT_CARD_DEFAULTS } from './stat-card.config.defaults';
import type { CngxStatCardLanguageSection } from '../i18n/stat-card-language-section';
import type { CngxStatCardAriaLabels as DeclaredOnce } from './stat-card.config';

// Compile-checked: the config copy type carries exactly the section's keys
// (all optional) plus `errorDescription`, so it is declared once in the section.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const DECLARED_ONCE: Equal<
  Exclude<keyof DeclaredOnce, 'errorDescription'>,
  keyof CngxStatCardLanguageSection
> = true;
const OPTIONAL_KEYS: Partial<CngxStatCardLanguageSection> = {} as DeclaredOnce;
void DECLARED_ONCE;
void OPTIONAL_KEYS;

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['statCard'] = CNGX_STAT_CARD_LANGUAGE_EN;

describe('CNGX_STAT_CARD_CONFIG cascade', () => {
  function read() {
    return TestBed.runInInjectionContext(() => injectStatCardConfig());
  }
  function labels() {
    return TestBed.runInInjectionContext(() => injectStatCardAriaLabels());
  }

  it('carries no copy in the defaults and resolves the English section without any provider', () => {
    expect(read()).toEqual({ loadingTreatment: 'auto' });
    expect(labels()()).toEqual({
      busy: 'Loading',
      errorFallback: 'Could not load',
      staleFallback: 'Showing last known value',
      emptyFallback: 'No data',
    });
  });

  it('reads the statCard section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const resolved = labels();
    expect(resolved().busy).toBe('Loading');
    pack.set({ locale: 'de', statCard: { busy: 'Wird geladen', emptyFallback: 'Keine Daten' } });
    expect(resolved().busy).toBe('Wird geladen');
    expect(resolved().emptyFallback).toBe('Keine Daten');
    expect(resolved().errorFallback).toBe('Could not load');
  });

  it('lets withStatCardAriaLabels win on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', statCard: { busy: 'Wird geladen' } }),
          withDocumentLanguage('off'),
        ),
        provideStatCardConfig(withStatCardAriaLabels({ busy: 'Laedt' })),
      ],
    });
    expect(labels()().busy).toBe('Laedt');
  });

  it('keeps the labels reference for the same section', () => {
    const first = labels();
    expect(Object.is(first, labels())).toBe(true);
    expect(Object.is(first(), labels()())).toBe(true);
  });

  it('keeps the defaults reference intact for an empty provider call', () => {
    TestBed.configureTestingModule({ providers: [provideStatCardConfig()] });
    expect(read()).toBe(CNGX_STAT_CARD_DEFAULTS);
  });

  it('deep-merges a partial ariaLabels override, keeping untouched keys', () => {
    TestBed.configureTestingModule({
      providers: [provideStatCardConfig(withStatCardAriaLabels({ errorFallback: 'Nicht da' }))],
    });
    expect(labels()().errorFallback).toBe('Nicht da');
    expect(labels()().busy).toBe('Loading');
    expect(read().loadingTreatment).toBe('auto');
  });

  it('overrides the flat loadingTreatment scalar', () => {
    TestBed.configureTestingModule({
      providers: [provideStatCardConfig(withStatCardLoadingTreatment('skeleton'))],
    });
    expect(read().loadingTreatment).toBe('skeleton');
    expect(labels()().busy).toBe('Loading');
  });

  it('lets a later feature win over an earlier one', () => {
    TestBed.configureTestingModule({
      providers: [
        provideStatCardConfig(
          withStatCardLoadingTreatment('spinner'),
          withStatCardLoadingTreatment('skeleton'),
        ),
      ],
    });
    expect(read().loadingTreatment).toBe('skeleton');
  });

  it('resolves plain labels to the same bundle as the eager merge did', () => {
    TestBed.configureTestingModule({
      providers: [
        provideStatCardConfig(
          withStatCardAriaLabels({ errorFallback: 'Nicht da' }),
          withStatCardAriaLabels({ errorDescription: 'Später erneut versuchen' }),
        ),
      ],
    });
    expect(labels()()).toEqual({
      ...EN_SECTION,
      errorFallback: 'Nicht da',
      errorDescription: 'Später erneut versuchen',
    });
  });

  it('falls back to the default for a label an override sets to undefined', () => {
    TestBed.configureTestingModule({
      providers: [provideStatCardConfig(withStatCardAriaLabels({ busy: undefined }))],
    });
    expect(labels()().busy).toBe('Loading');
    expect(labels()().errorDescription).toBeUndefined();
  });

  it('follows Signal labels and keeps the bundle reference on an equal recompute', () => {
    const lang = signal<'en' | 'de' | 'de-AT'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideStatCardConfig(
          withStatCardAriaLabels(
            computed<CngxStatCardAriaLabels>(() => (lang() === 'en' ? {} : { busy: 'Lädt' })),
          ),
        ),
      ],
    });
    const resolved = labels();
    expect(resolved().busy).toBe('Loading');

    lang.set('de');
    const german = resolved();
    expect(german.busy).toBe('Lädt');
    expect(german.emptyFallback).toBe('No data');

    lang.set('de-AT');
    expect(resolved()).toBe(german);
  });
});

@Component({
  standalone: true,
  imports: [CngxStatCard],
  viewProviders: [provideStatCardConfigAt(withStatCardAriaLabels({ errorFallback: 'Scoped' }))],
  template: `<cngx-stat-card />`,
})
class ScopedHost {}

@Component({
  standalone: true,
  imports: [CngxStatCard],
  viewProviders: [provideStatCardConfigAt(withStatCardAriaLabels({ errorFallback: 'Scoped' }))],
  template: `<cngx-stat-card [errorText]="override()" />`,
})
class ScopedHostWithInput {
  override = signal('Instance');
}

describe('stat-card config resolution order', () => {
  it('layers provideStatCardConfigAt on top of the root cascade', () => {
    TestBed.configureTestingModule({
      imports: [ScopedHost],
      providers: [
        provideStatCardConfig(withStatCardAriaLabels({ errorFallback: 'Root', busy: 'Root busy' })),
      ],
    });
    const fixture = TestBed.createComponent(ScopedHost);
    fixture.detectChanges();

    const cardInjector = fixture.debugElement.query(
      (node) => node.name === 'cngx-stat-card',
    ).injector;
    const resolved = runInInjectionContext(cardInjector, () => injectStatCardAriaLabels());

    // At-scope wins for the key it sets; the root value survives for the rest.
    expect(resolved().errorFallback).toBe('Scoped');
    expect(resolved().busy).toBe('Root busy');
  });

  it('gives a per-instance input precedence over both provider levels', () => {
    TestBed.configureTestingModule({
      imports: [ScopedHostWithInput],
      providers: [provideStatCardConfig(withStatCardAriaLabels({ errorFallback: 'Root' }))],
    });
    const fixture = TestBed.createComponent(ScopedHostWithInput);
    fixture.detectChanges();

    const card = fixture.debugElement.query((node) => node.name === 'cngx-stat-card')
      .componentInstance as CngxStatCard;

    expect(card.errorText()).toBe('Instance');
  });
});
