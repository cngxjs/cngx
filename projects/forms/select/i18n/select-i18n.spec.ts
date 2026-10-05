import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import { runInSubtree, stripBidiIsolates } from '@cngx/testing';

import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { resolveActionSelectConfig } from '../shared/action-select-config';
import {
  provideSelectConfig,
  withAnnouncer,
  withAriaLabels,
  withFallbackLabels,
  type CngxSelectAnnouncerConfig,
  type CngxSelectAriaLabels,
} from '../shared/config';
import { resolveSelectConfig } from '../shared/internal/resolve-config';
import { injectSelectLabels, provideSelectConfigAt } from '../public-api';
import type { CngxSelectOptionDef } from '../shared/option.model';
import { resolveReorderableSelectConfig } from '../shared/reorderable-select-config';
import { createTypeaheadController } from '../shared/typeahead-controller';
import { injectSelectCopy, type CngxSelectAnnounceFormat } from './select-i18n';
import { CNGX_SELECT_LANGUAGE_EN } from './select-language-section';

// Compile-checked: the English section is a complete select section of a pack.
const EN_SECTION: CngxLanguagePack['select'] = CNGX_SELECT_LANGUAGE_EN;

type Resolved = ReturnType<typeof resolveSelectConfig>;

function resolve(): Resolved {
  return TestBed.runInInjectionContext(() => resolveSelectConfig());
}

function announce(config: Resolved, input: Parameters<CngxSelectAnnounceFormat>[0]): string {
  return stripBidiIsolates(config.announcer().format(input));
}

describe('select language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English copy from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const config = resolve();
    const aria = config.ariaLabels();
    expect(aria.clearButton).toBeUndefined();
    expect(aria.chipRemove).toBe('Remove');
    expect(stripBidiIsolates(aria.chipRemoveFor('Remove', 'Red'))).toBe('Remove: Red');
    expect(aria.treeExpand).toBe('Expand node');
    expect(aria.treeCollapse).toBe('Collapse node');
    expect(aria.statusLoading).toBe('Loading options');
    expect(aria.statusRefreshing).toBe('Refreshing options');
    expect(aria.fieldLabelFallback).toBe('Selection');
    expect(aria.searchInput).toBe('Search options');
    expect(aria.listboxFallback).toBe('Options');
    expect(stripBidiIsolates(aria.commitFailedMessage('Colours', 'server down'))).toBe(
      'Colours: Save failed - server down',
    );
    expect(stripBidiIsolates(aria.commitFailedMessage('Colours', undefined))).toBe(
      'Colours: Save failed',
    );

    const fallback = config.fallbackLabels();
    expect(fallback.loading).toBe('Loading…');
    expect(fallback.empty).toBe('No Options');
    expect(fallback.loadFailed).toBe('Loading failed');
    expect(fallback.loadFailedRetry).toBe('Retry');
    expect(fallback.refreshFailed).toBe('Refresh failed');
    expect(fallback.refreshFailedRetry).toBe('Try again');
    expect(fallback.searchPlaceholder).toBe('Search…');
    expect(fallback.commitFailed).toBe('Save failed');
    expect(fallback.commitFailedRetry).toBe('Try again');
    expect(fallback.chipOverflowBadge(2)).toBe('+2');

    const field = 'Color';
    expect(announce(config, { selectedLabel: 'Red', fieldLabel: field, multi: false })).toBe(
      'Color: Red selected',
    );
    expect(announce(config, { selectedLabel: null, fieldLabel: field, multi: false })).toBe(
      'Color: selection cleared',
    );
    expect(
      announce(config, { selectedLabel: 'Red', fieldLabel: field, multi: true, action: 'added' }),
    ).toBe('Color: Red added');
    expect(
      announce(config, {
        selectedLabel: 'Red',
        fieldLabel: field,
        multi: true,
        action: 'removed',
        count: 2,
      }),
    ).toBe('Color: Red removed, 2 selected');
    expect(
      announce(config, {
        selectedLabel: null,
        fieldLabel: field,
        multi: true,
        action: 'reordered',
      }),
    ).toBe('Color: moved');
    expect(
      announce(config, { selectedLabel: null, fieldLabel: field, multi: true, action: 'created' }),
    ).toBe('Color: created');
    expect(config.announcer().enabled).toBe(true);
    expect(config.announcer().politeness).toBe('polite');

    const copy = TestBed.runInInjectionContext(() => injectSelectCopy())();
    expect(copy.clearSelection).toBe('Clear selection');
    expect(copy.resetSelection).toBe('Reset selection');
    expect(TestBed.runInInjectionContext(() => resolveActionSelectConfig()).ariaLabel()).toBe(
      'Inline action',
    );
    expect(TestBed.runInInjectionContext(() => resolveReorderableSelectConfig()).ariaLabel()).toBe(
      'Reorder with Alt + arrow keys',
    );
    expect(EN_SECTION.chipRemoveFor).toBe('{action}: {label}');
  });

  it('reads the select section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const config = resolve();
    const action = TestBed.runInInjectionContext(() => resolveActionSelectConfig());
    expect(config.fallbackLabels().empty).toBe('No Options');

    pack.set({
      locale: 'de',
      select: {
        empty: 'Keine Optionen',
        chipRemove: 'Entfernen',
        chipRemoveFor: '{label} {action}',
        chipOverflowBadge: '+{count} weitere',
        announceAddedCount: '{field}: {option} hinzugefügt, {count} ausgewählt',
        actionGroup: 'Schnellaktion',
      },
    });
    expect(config.fallbackLabels().empty).toBe('Keine Optionen');
    expect(config.fallbackLabels().chipOverflowBadge(1200)).toBe('+1.200 weitere');
    expect(stripBidiIsolates(config.ariaLabels().chipRemoveFor('Entfernen', 'Rot'))).toBe(
      'Rot Entfernen',
    );
    expect(
      announce(config, {
        selectedLabel: 'Rot',
        fieldLabel: 'Farben',
        multi: true,
        action: 'added',
        count: 1200,
      }),
    ).toBe('Farben: Rot hinzugefügt, 1.200 ausgewählt');
    expect(action.ariaLabel()).toBe('Schnellaktion');
    expect(config.fallbackLabels().loadFailed).toBe('Loading failed');
  });

  it('lets provideSelectConfig override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            select: { empty: 'Keine Optionen', loading: 'Lädt…', chipRemove: 'Entfernen' },
          }),
          withDocumentLanguage('off'),
        ),
        provideSelectConfig(
          withAriaLabels({ chipRemove: 'Löschen' }),
          withFallbackLabels({ empty: 'Nichts gefunden' }),
        ),
      ],
    });
    const config = resolve();
    expect(config.ariaLabels().chipRemove).toBe('Löschen');
    expect(config.fallbackLabels().empty).toBe('Nichts gefunden');
    expect(config.fallbackLabels().loading).toBe('Lädt…');
    expect(config.fallbackLabels().refreshFailed).toBe('Refresh failed');
  });

  it('formats numbers in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = resolve();
    const german = runInSubtree([provideLocaleAt('de')], () => resolveSelectConfig());
    expect(root.fallbackLabels().chipOverflowBadge(1200)).toBe('+1,200');
    expect(german.fallbackLabels().chipOverflowBadge(1200)).toBe('+1.200');
    const moved = {
      selectedLabel: 'Admins',
      fieldLabel: 'Recipients',
      multi: true,
      action: 'reordered' as const,
      toIndex: 1499,
    };
    expect(announce(root, moved)).toBe('Recipients: Admins moved to position 1,500');
    expect(announce(german, moved)).toBe('Recipients: Admins moved to position 1.500');
  });

  it('keeps the copy reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = resolve();
    const second = resolve();
    expect(Object.is(first.ariaLabels, second.ariaLabels)).toBe(true);
    expect(Object.is(first.fallbackLabels, second.fallbackLabels)).toBe(true);
    expect(Object.is(first.announcer, second.announcer)).toBe(true);
    expect(Object.is(first.ariaLabels(), second.ariaLabels())).toBe(true);
    const copy = TestBed.runInInjectionContext(() => injectSelectCopy());
    const again = TestBed.runInInjectionContext(() => injectSelectCopy());
    expect(Object.is(copy, again)).toBe(true);
    expect(Object.is(copy(), again())).toBe(true);
  });

  it('keeps the copy reference when an equal config override recomputes', () => {
    const aria = signal<CngxSelectAriaLabels>({ chipRemove: 'Drop' });
    const announcer = signal<CngxSelectAnnouncerConfig>({ politeness: 'assertive' });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideSelectConfig(withAriaLabels(aria), withAnnouncer(announcer)),
      ],
    });
    const config = resolve();
    const labels = config.ariaLabels();
    const announce = config.announcer();
    expect(labels.chipRemove).toBe('Drop');
    aria.set({ chipRemove: 'Drop', treeExpand: undefined });
    announcer.set({ politeness: 'assertive', format: undefined });
    expect(Object.is(config.ariaLabels(), labels)).toBe(true);
    expect(Object.is(config.announcer(), announce)).toBe(true);
    expect(config.ariaLabels().treeExpand).toBe('Expand node');
    aria.set({ chipRemove: 'Remove chip' });
    expect(config.ariaLabels().chipRemove).toBe('Remove chip');
  });
});

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

@Component({
  imports: [CngxMultiSelect],
  template: `
    <cngx-multi-select
      [label]="'Colour'"
      [options]="options"
      [chipOverflow]="'truncate'"
      [maxVisibleChips]="1"
      [(values)]="values"
    />
  `,
})
class ChipHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green', 'blue']);
}

describe('select chip copy in the DOM', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(ChipHost);
    TestBed.flushEffects();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('names the chip remove button and renders the +N badge from the English section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const root = render();
    const remove = root.querySelector('.cngx-chip__remove');
    expect(stripBidiIsolates(remove?.getAttribute('aria-label'))).toBe('Remove: Red');
    const badge = root.querySelector('.cngx-select__chip-overflow-badge');
    expect(badge?.textContent?.trim()).toBe('+2');
    expect(badge?.getAttribute('aria-hidden')).toBe('true');
  });

  it('places the chip remove label and the badge through the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            select: {
              chipRemove: 'entfernen',
              chipRemoveFor: '{label} {action}',
              chipOverflowBadge: '{count} weitere',
            },
          }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    const root = render();
    const remove = root.querySelector('.cngx-chip__remove');
    expect(stripBidiIsolates(remove?.getAttribute('aria-label'))).toBe('Red entfernen');
    const badge = root.querySelector('.cngx-select__chip-overflow-badge');
    expect(badge?.textContent?.trim()).toBe('2 weitere');
  });
});

describe('injectSelectLabels', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('follows a pack switch', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const labels = TestBed.runInInjectionContext(() => injectSelectLabels());
    expect(labels.fallbackLabels().empty).toBe('No Options');
    expect(labels.ariaLabels().chipRemove).toBe('Remove');

    pack.set({
      locale: 'de',
      select: { empty: 'Keine Optionen', chipRemove: 'Entfernen', chipOverflowBadge: '+{count}' },
    });
    expect(labels.fallbackLabels().empty).toBe('Keine Optionen');
    expect(labels.ariaLabels().chipRemove).toBe('Entfernen');
    expect(labels.fallbackLabels().chipOverflowBadge(1200)).toBe('+1.200');
  });

  it('formats numbers in the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = TestBed.runInInjectionContext(() => injectSelectLabels());
    const german = runInSubtree([provideLocaleAt('de')], () => injectSelectLabels());
    expect(root.fallbackLabels().chipOverflowBadge(1200)).toBe('+1,200');
    expect(german.fallbackLabels().chipOverflowBadge(1200)).toBe('+1.200');
  });

  it('reads a provideSelectConfigAt subtree and shares the component signals', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const scoped = runInSubtree(
      [provideSelectConfigAt(withFallbackLabels({ empty: 'Nichts gefunden' }))],
      () => ({ labels: injectSelectLabels(), config: resolveSelectConfig() }),
    );
    expect(scoped.labels.fallbackLabels().empty).toBe('Nichts gefunden');
    expect(Object.is(scoped.labels.fallbackLabels, scoped.config.fallbackLabels)).toBe(true);
    expect(Object.is(scoped.labels.ariaLabels, scoped.config.ariaLabels)).toBe(true);
  });
});

describe('select label matching', () => {
  it('finds a closed-trigger typeahead match ignoring accents', () => {
    const controller = createTypeaheadController<string>({
      options: signal([
        { value: 'a', label: 'Apple' },
        { value: 'u', label: 'Über' },
      ]),
      compareWith: signal((a: string | undefined, b: string | undefined) => a === b),
      debounceMs: signal(300),
      disabled: signal(false),
      locale: signal('de'),
    });
    expect(controller.matchFromIndex('u', -1)?.value).toBe('u');
    controller.clearBuffer();
  });
});
