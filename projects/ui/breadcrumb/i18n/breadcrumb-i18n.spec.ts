import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';

import { withBreadcrumbAriaLabels } from '../config/features';
import { injectBreadcrumbAriaLabels } from '../config/inject-breadcrumb-config';
import { provideBreadcrumbConfig } from '../config/provide-breadcrumb-config';
import { routeLabelText } from './breadcrumb-i18n';
import { CNGX_BREADCRUMB_LANGUAGE_EN } from './breadcrumb-language-section';

// Compile-checked: the English section is a complete section of a pack.
const EN_SECTION: CngxLanguagePack['breadcrumb'] = CNGX_BREADCRUMB_LANGUAGE_EN;

const labels = () => TestBed.runInInjectionContext(() => injectBreadcrumbAriaLabels());

describe('breadcrumb language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English names from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    expect(labels()()).toEqual({
      bar: 'Breadcrumb',
      overflowTrigger: 'Show collapsed breadcrumbs',
      overflowMenu: 'Collapsed breadcrumbs',
      siblingsTrigger: 'Show sibling pages',
      siblingsMenu: 'Sibling pages',
    });
    expect(EN_SECTION.bar).toBe('Breadcrumb');
  });

  it('reads the section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const resolved = labels();
    expect(resolved().bar).toBe('Breadcrumb');

    pack.set({
      locale: 'de',
      breadcrumb: { bar: 'Brotkrumen' },
    });
    expect(resolved().bar).toBe('Brotkrumen');
    expect(resolved().siblingsMenu).toBe('Sibling pages');
  });

  it('lets withBreadcrumbAriaLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            breadcrumb: { bar: 'Brotkrumen', overflowMenu: 'Ausgeblendet' },
          }),
          withDocumentLanguage('off'),
        ),
        provideBreadcrumbConfig(withBreadcrumbAriaLabels({ bar: 'Pfad' })),
      ],
    });
    const resolved = labels()();
    expect(resolved.bar).toBe('Pfad');
    expect(resolved.overflowMenu).toBe('Ausgeblendet');
  });

  it('keeps the labels reference for the same section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = labels();
    const second = labels();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
  });
});

describe('routeLabelText', () => {
  it('passes a plain label through and drops an empty one', () => {
    expect(routeLabelText('Orders')).toBe('Orders');
    expect(routeLabelText('')).toBeUndefined();
  });

  it('reads a Signal label', () => {
    const label = signal('Orders');
    expect(routeLabelText(label)).toBe('Orders');
    label.set('Bestellungen');
    expect(routeLabelText(label)).toBe('Bestellungen');
  });

  it('ignores data that is no label', () => {
    expect(routeLabelText(undefined)).toBeUndefined();
    expect(routeLabelText(42)).toBeUndefined();
    expect(routeLabelText(null)).toBeUndefined();
    expect(routeLabelText({ key: 'orders', label: 'Orders' })).toBeUndefined();
    expect(routeLabelText(signal(42))).toBeUndefined();
  });
});
