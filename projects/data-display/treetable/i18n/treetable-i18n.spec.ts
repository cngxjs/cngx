import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import { runInSubtree, stripBidiIsolates } from '@cngx/testing';

import { CngxHeaderTpl } from '../column-template.directive';
import type { Node } from '../models';
import { cellFormattersFor, columnHeaderFor, formatCellValue } from '../tree.utils';
import { CngxTreetable } from '../treetable.component';
import {
  CNGX_TREETABLE_CONFIG,
  provideTreetable,
  provideTreetableAt,
  withTreetableDateFormat,
  withTreetableLabels,
} from '../treetable.token';
import { injectTreetableLabels } from './treetable-i18n';
import { CNGX_TREETABLE_LANGUAGE_EN } from './treetable-language-section';

// Compile-checked: the English section is a complete treetable section of a pack.
const EN_SECTION: CngxLanguagePack['treetable'] = CNGX_TREETABLE_LANGUAGE_EN;

const strip = stripBidiIsolates;

function labels() {
  return TestBed.runInInjectionContext(() =>
    injectTreetableLabels(TestBed.inject(CNGX_TREETABLE_CONFIG).labels),
  );
}

describe('treetable language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English labels from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = labels()();
    expect(en.loading).toBe('Loading');
    expect(en.refreshing).toBe('Refreshing');
    expect(en.errorFallback).toBe('Data failed to load');
    expect(en.emptyFallback).toBe('No data');
    expect(en.expand).toBe('Expand');
    expect(en.collapse).toBe('Collapse');
    expect(en.selectAll).toBe('Select all rows');
    expect(en.selectRow).toBe('Select row');
    expect(strip(en.rowsSelected(1))).toBe('1 row selected');
    expect(strip(en.rowsSelected(0))).toBe('0 rows selected');
    expect(strip(en.rowsSelected(3))).toBe('3 rows selected');
    expect(strip(en.rowsDeselected(1))).toBe('1 row deselected');
    expect(strip(en.rowsDeselected(3))).toBe('3 rows deselected');
    expect(en.columnLabels).toEqual({});
    expect(strip(en.unlabeledColumn(2, 'size'))).toBe('Column 2');
    expect(EN_SECTION.unlabeledColumn).toBe('Column {position}');
  });

  it('reads the treetable section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const resolved = labels();
    expect(resolved().expand).toBe('Expand');

    pack.set({
      locale: 'de',
      treetable: {
        expand: 'Aufklappen',
        rowsSelected: { one: '{count} Zeile ausgewählt', other: '{count} Zeilen ausgewählt' },
        columnLabels: { name: 'Name', size: 'Größe' },
        unlabeledColumn: 'Spalte {position}',
      },
    });
    const de = resolved();
    expect(de.expand).toBe('Aufklappen');
    expect(de.collapse).toBe('Collapse');
    expect(strip(de.rowsSelected(1))).toBe('1 Zeile ausgewählt');
    expect(strip(de.rowsSelected(1200))).toBe('1.200 Zeilen ausgewählt');
    expect(de.columnLabels).toEqual({ name: 'Name', size: 'Größe' });
    expect(strip(de.unlabeledColumn(3, 'size'))).toBe('Spalte 3');

    pack.set(undefined);
    expect(resolved().expand).toBe('Expand');
  });

  it('lets withTreetableLabels override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            treetable: {
              expand: 'Aufklappen',
              collapse: 'Zuklappen',
              columnLabels: { name: 'Name', size: 'Größe' },
            },
          }),
          withDocumentLanguage('off'),
        ),
        provideTreetable(
          withTreetableLabels({ expand: 'Ausklappen', columnLabels: { size: 'Dateigröße' } }),
        ),
      ],
    });
    const resolved = labels()();
    expect(resolved.expand).toBe('Ausklappen');
    expect(resolved.collapse).toBe('Zuklappen');
    expect(resolved.loading).toBe('Loading');
    expect(resolved.columnLabels).toEqual({ name: 'Name', size: 'Dateigröße' });
  });

  it('formats with the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideLocale('en')],
    });
    const root = labels();
    const german = runInSubtree([provideLocaleAt('de')], () =>
      injectTreetableLabels(TestBed.inject(CNGX_TREETABLE_CONFIG).labels),
    );
    expect(strip(root().rowsSelected(1200))).toBe('1,200 rows selected');
    expect(strip(german().rowsSelected(1200))).toBe('1.200 rows selected');
  });

  it('keeps the labels reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = labels();
    const second = labels();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
  });
});

describe('treetable default header', () => {
  const en = {
    columnLabels: { name: 'Full name' } as Readonly<Record<string, string>>,
    unlabeledColumn: (position: number) => `Column ${position}`,
  };

  it('reads the column label in every build', () => {
    expect(columnHeaderFor('name', 1, en, true)).toBe('Full name');
    expect(columnHeaderFor('name', 1, en, false)).toBe('Full name');
  });

  it('shows the capitalised key only in a dev build, never in production', () => {
    expect(columnHeaderFor('fileSize', 2, en, true)).toBe('FileSize');
    expect(columnHeaderFor('Size', 2, en, true)).toBe('Size');
    const production = columnHeaderFor('fileSize', 2, en, false);
    expect(production).toBe('Column 2');
    expect(production.toLowerCase()).not.toContain('filesize');
  });

  it('passes the column key to unlabeledColumn', () => {
    const seen: [number, string][] = [];
    const custom = {
      columnLabels: {},
      unlabeledColumn: (position: number, column: string) => {
        seen.push([position, column]);
        return column.toUpperCase();
      },
    };
    expect(columnHeaderFor('size', 2, custom, false)).toBe('SIZE');
    expect(seen).toEqual([[2, 'size']]);
  });
});

describe('CngxTreetable header and cell copy', () => {
  interface Row {
    name: string;
    size: number;
    modified: Date;
  }

  const modified = new Date(2026, 9, 5, 12);
  const data: Node<Row>[] = [{ value: { name: 'Report', size: 1234.5, modified } }];

  @Component({
    template: `<cngx-treetable [tree]="tree" [options]="options" />`,
    imports: [CngxTreetable],
  })
  class Host {
    readonly tree = data;
    // A Date is object-valued, so the default column scan skips it.
    readonly options = { customColumnOrder: ['name', 'size', 'modified'] as const };
  }

  function headerTexts(fixture: ReturnType<typeof TestBed.createComponent<Host>>): string[] {
    return fixture.debugElement
      .queryAll(By.css('cdk-header-cell'))
      .slice(1)
      .map((cell) => strip((cell.nativeElement as HTMLElement).textContent).trim());
  }

  function cellTexts(fixture: ReturnType<typeof TestBed.createComponent<Host>>): string[] {
    return fixture.debugElement
      .queryAll(By.css('cdk-row cdk-cell'))
      .slice(1)
      .map((cell) => (cell.nativeElement as HTMLElement).textContent?.trim() ?? '');
  }

  let warn: { mock: { calls: unknown[][] }; mockRestore: () => void };

  beforeEach(() => {
    TestBed.resetTestingModule();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
    vi.unstubAllGlobals();
  });

  it('renders column labels and warns once per unlabeled key in dev', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTreetable(withTreetableLabels({ columnLabels: { name: 'Title' } }))],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(headerTexts(fixture)).toEqual(['Title', 'Size', 'Modified']);
    const messages = warn.mock.calls.map((call: unknown[]) => String(call[0]));
    expect(messages.filter((m: string) => m.includes('"size"'))).toHaveLength(1);
    expect(messages.filter((m: string) => m.includes('"modified"'))).toHaveLength(1);
    expect(messages.some((m: string) => m.includes('"name"'))).toBe(false);

    fixture.detectChanges();
    expect(
      warn.mock.calls.filter((call: unknown[]) => String(call[0]).includes('"size"')),
    ).toHaveLength(1);
  });

  it('never renders the raw key as a header in production', () => {
    vi.stubGlobal('ngDevMode', false);
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideTreetable(withTreetableLabels({ columnLabels: { name: 'Title' } }))],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(headerTexts(fixture)).toEqual(['Title', 'Column 2', 'Column 3']);
    expect(
      warn.mock.calls.some((call: unknown[]) => String(call[0]).includes('CngxTreetable')),
    ).toBe(false);
  });

  it('passes the column key to a consumer unlabeledColumn in production', () => {
    vi.stubGlobal('ngDevMode', false);
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideTreetable(
          withTreetableLabels({
            columnLabels: { name: 'Title' },
            unlabeledColumn: (position, key) => `${key[0].toUpperCase()}${key.slice(1)} (${position})`,
          }),
        ),
      ],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(headerTexts(fixture)).toEqual(['Title', 'Size (2)', 'Modified (3)']);
  });

  it('gives a cngxHeader template the column key and the resolved default label', () => {
    vi.stubGlobal('ngDevMode', false);
    @Component({
      selector: 'cngx-header-slot-host',
      template: `
        <cngx-treetable [tree]="tree" [options]="options">
          <ng-template [cngxHeader]="'name'" let-key let-column="column" let-label="label">
            <span class="slot" [attr.data-key]="key" [attr.data-column]="column">{{ label }}</span>
          </ng-template>
          <ng-template [cngxHeader]="'size'" let-key let-column="column" let-label="label">
            <span class="slot" [attr.data-key]="key" [attr.data-column]="column">{{ label }}</span>
          </ng-template>
        </cngx-treetable>
      `,
      imports: [CngxTreetable, CngxHeaderTpl],
    })
    class SlotHost {
      readonly tree = data;
      readonly options = { customColumnOrder: ['name', 'size', 'modified'] as const };
    }

    TestBed.configureTestingModule({
      imports: [SlotHost],
      providers: [provideTreetable(withTreetableLabels({ columnLabels: { name: 'Title' } }))],
    });
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const slots = fixture.debugElement
      .queryAll(By.css('.slot'))
      .map((el) => el.nativeElement as HTMLElement);
    expect(slots.map((el) => el.getAttribute('data-key'))).toEqual(['name', 'size']);
    expect(slots.map((el) => el.getAttribute('data-column'))).toEqual(['name', 'size']);
    expect(slots.map((el) => strip(el.textContent).trim())).toEqual(['Title', 'Column 2']);
  });

  it('formats number and date cells with the locale', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideLocale('de')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(cellTexts(fixture)).toEqual(['Report', '1.234,5', '5. Okt. 2026']);
  });

  it('formats number and date cells for English with the English conventions', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideLocale('en-US')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(cellTexts(fixture)).toEqual(['Report', '1,234.5', 'Oct 5, 2026']);
  });

  it('renders a date cell date-only by default', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideLocale('en-US')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const date = cellTexts(fixture)[2];
    expect(date).toBe('Oct 5, 2026');
    expect(date).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it('withTreetableDateFormat shows the time of day', () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideLocale('en-US'),
        provideTreetable(withTreetableDateFormat({ dateStyle: 'medium', timeStyle: 'short' })),
      ],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const date = cellTexts(fixture)[2];
    expect(date).toMatch(/^Oct 5, 2026/);
    expect(date).toMatch(/12:00\sPM$/);
  });

  it('formats the configured date format per locale', () => {
    const format = withTreetableDateFormat({ dateStyle: 'medium', timeStyle: 'short' });
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideLocale('de'), provideTreetable(format)],
    });
    const german = TestBed.createComponent(Host);
    german.detectChanges();
    const de = cellTexts(german)[2];

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideLocale('en'), provideTreetable(format)],
    });
    const english = TestBed.createComponent(Host);
    english.detectChanges();
    const en = cellTexts(english)[2];

    expect(de).toBe('05.10.2026, 12:00');
    expect(en).toMatch(/^Oct 5, 2026, 12:00\sPM$/);
  });

  it('a provideTreetableAt subtree overrides the app-wide date format', () => {
    @Component({
      selector: 'cngx-scoped-date-host',
      template: `<cngx-treetable [tree]="tree" [options]="options" />`,
      imports: [CngxTreetable],
      viewProviders: [
        ...provideTreetableAt(withTreetableDateFormat({ year: 'numeric', month: '2-digit' })),
      ],
    })
    class ScopedHost {
      readonly tree = data;
      readonly options = { customColumnOrder: ['name', 'size', 'modified'] as const };
    }

    TestBed.configureTestingModule({
      imports: [Host, ScopedHost],
      providers: [
        provideLocale('en-US'),
        provideTreetable(withTreetableDateFormat({ dateStyle: 'full' })),
      ],
    });
    const app = TestBed.createComponent(Host);
    app.detectChanges();
    const scoped = TestBed.createComponent(ScopedHost);
    scoped.detectChanges();

    expect(cellTexts(app)[2]).toBe('Monday, October 5, 2026');
    const scopedDate = scoped.debugElement
      .queryAll(By.css('cdk-row cdk-cell'))
      .map((cell) => (cell.nativeElement as HTMLElement).textContent?.trim() ?? '')
      .at(-1);
    expect(scopedDate).toBe('10/2026');
  });

  it('per-instance options.dateFormat wins over the app-wide feature', () => {
    @Component({
      selector: 'cngx-instance-date-host',
      template: `<cngx-treetable [tree]="tree" [options]="options" />`,
      imports: [CngxTreetable],
    })
    class InstanceHost {
      readonly tree = data;
      readonly options = {
        customColumnOrder: ['name', 'size', 'modified'] as const,
        dateFormat: { month: 'long' } as Intl.DateTimeFormatOptions,
      };
    }

    TestBed.configureTestingModule({
      imports: [InstanceHost],
      providers: [
        provideLocale('en-US'),
        provideTreetable(withTreetableDateFormat({ dateStyle: 'full' })),
      ],
    });
    const fixture = TestBed.createComponent(InstanceHost);
    fixture.detectChanges();
    const date = fixture.debugElement
      .queryAll(By.css('cdk-row cdk-cell'))
      .map((cell) => (cell.nativeElement as HTMLElement).textContent?.trim() ?? '')
      .at(-1);
    expect(date).toBe('October');
  });

  it('renders an invalid date cell empty and leaves other values unchanged', () => {
    const en = cellFormattersFor('en');
    expect(formatCellValue(new Date(Number.NaN), en)).toBe('');
    expect(formatCellValue('text', en)).toBe('text');
    expect(formatCellValue(true, en)).toBe(true);
    expect(formatCellValue(null, en)).toBeNull();
  });

  it('reuses the cached formatters for the same locale and date format', () => {
    const first = cellFormattersFor('de', { dateStyle: 'medium' });
    const second = cellFormattersFor('de', { dateStyle: 'medium' });
    expect(second.number).toBe(first.number);
    expect(second.date).toBe(first.date);
    expect(cellFormattersFor('en').date).not.toBe(cellFormattersFor('de').date);
  });
});
