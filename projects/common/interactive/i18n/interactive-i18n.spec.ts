import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale } from '@cngx/core/utils';
import { stripBidiIsolates } from '@cngx/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxAsyncClick } from '../async-click/async-click.directive';
import { CngxBreadcrumb } from '../breadcrumb/breadcrumb.directive';
import { CngxCopyBlock } from '../copy/copy-block';
import { CngxRangeSlider } from '../slider/range-slider.component';
import { CngxSlider } from '../slider/slider.component';
import {
  CNGX_INTERACTIVE_I18N,
  injectInteractiveI18n,
  injectResolvedInteractiveI18n,
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

  it('derives the pre-section English phrases from the English section', () => {
    const bundle = TestBed.inject(CNGX_INTERACTIVE_I18N)();
    expect(bundle).toEqual({
      asyncClickSucceeded: 'Action succeeded',
      asyncClickFailed: 'Action failed',
      copy: 'Copy',
      copied: 'Copied!',
      copiedAnnouncement: 'Copied to clipboard',
      rangeMinimum: 'Minimum',
      rangeMaximum: 'Maximum',
      breadcrumb: 'Breadcrumb',
      unsavedChanges: 'You have unsaved changes. Leave anyway?',
      rangeValue: expect.any(Function),
    });
    expect(stripBidiIsolates(bundle.rangeValue?.('20', '80'))).toBe('20–80');
  });

  it('reads the interactive section of the pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
    });
    const bundle = TestBed.inject(CNGX_INTERACTIVE_I18N);
    expect(bundle().copy).toBe('Copy');

    pack.set({
      locale: 'de',
      interactive: { copy: 'Kopieren', rangeValue: '{start} bis {end}' },
    });
    expect(bundle().copy).toBe('Kopieren');
    expect(stripBidiIsolates(bundle().rangeValue?.('20', '80'))).toBe('20 bis 80');
    expect(bundle().copied).toBe('Copied!');
  });

  it('lets provideInteractiveI18n override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', interactive: { copy: 'Kopieren', copied: 'Kopiert' } }),
          withDocumentLanguage('off'),
        ),
        provideInteractiveI18n(withInteractiveI18nLabels({ copied: 'Erledigt' })),
      ],
    });
    const bundle = TestBed.inject(CNGX_INTERACTIVE_I18N)();
    expect(bundle.copy).toBe('Kopieren');
    expect(bundle.copied).toBe('Erledigt');
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

  it('defaults the CngxAsyncClick announcements from the bundle', async () => {
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
    expect(directive.succeededAnnouncement()).toBeUndefined();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(directive.announcement()).toBe('Erledigt');
    });
  });

  it('fills the optional keys for a directly provided bundle that predates them', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CNGX_INTERACTIVE_I18N,
          useValue: signal({ asyncClickSucceeded: 'Ok', asyncClickFailed: 'Nope' }).asReadonly(),
        },
      ],
    });
    const bundle = TestBed.runInInjectionContext(() => injectResolvedInteractiveI18n());
    expect(bundle().asyncClickFailed).toBe('Nope');
    expect(bundle().copy).toBe('Copy');
    expect(bundle().breadcrumb).toBe('Breadcrumb');
  });

  it('fills the keys a directly provided bundle leaves out from the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', interactive: { copy: 'Kopieren' } }),
          withDocumentLanguage('off'),
        ),
        {
          provide: CNGX_INTERACTIVE_I18N,
          useValue: signal({ asyncClickSucceeded: 'Ok', asyncClickFailed: 'Nope' }).asReadonly(),
        },
      ],
    });
    const bundle = TestBed.runInInjectionContext(() => injectResolvedInteractiveI18n());
    expect(bundle().asyncClickSucceeded).toBe('Ok');
    expect(bundle().copy).toBe('Kopieren');
    expect(bundle().breadcrumb).toBe('Breadcrumb');
  });

  it('defaults the copy-block, range-slider and breadcrumb inputs from the bundle', () => {
    TestBed.configureTestingModule({
      imports: [StringInputsHost],
      providers: [
        provideInteractiveI18n(
          withInteractiveI18nLabels({
            copy: 'Kopieren',
            copiedAnnouncement: 'In die Zwischenablage kopiert',
            rangeMinimum: 'Minimum (de)',
            rangeMaximum: 'Maximum (de)',
            breadcrumb: 'Brotkrumen',
          }),
        ),
      ],
    });
    const fixture = TestBed.createComponent(StringInputsHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('cngx-copy-block button')?.textContent?.trim()).toBe('Kopieren');
    const thumbs = Array.from(root.querySelectorAll('[role="slider"]'));
    expect(thumbs.map((t) => t.getAttribute('aria-label'))).toEqual([
      'Minimum (de)',
      'Maximum (de)',
    ]);
    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Brotkrumen');
  });

  it('formats the default slider aria-valuetext in the app locale, live on a flip', () => {
    const locale = signal('en-US');
    TestBed.configureTestingModule({ imports: [SliderHost], providers: [provideLocale(locale)] });
    const fixture = TestBed.createComponent(SliderHost);
    fixture.detectChanges();
    const thumb = (fixture.nativeElement as HTMLElement).querySelector('[role="slider"]')!;
    expect(thumb.getAttribute('aria-valuetext')).toBe('2.5');

    locale.set('de-DE');
    fixture.detectChanges();
    expect(thumb.getAttribute('aria-valuetext')).toBe('2,5');
  });
});

@Component({
  template: `
    <cngx-copy-block value="x" />
    <cngx-range-slider [min]="0" [max]="10" />
    <nav cngxBreadcrumb></nav>
  `,
  imports: [CngxCopyBlock, CngxRangeSlider, CngxBreadcrumb],
})
class StringInputsHost {}

@Component({
  template: `<cngx-slider [value]="2.5" [min]="0" [max]="10" [step]="0.5" />`,
  imports: [CngxSlider],
})
class SliderHost {}
