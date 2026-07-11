import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAccordion } from '@cngx/common/interactive';
import { CngxFilter, CngxSort, type SortEntry } from '@cngx/common/data';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDataGridRow } from './data-grid-row.component';
import { CngxDgCell, type CngxDgCellTrack } from './data-grid-cell.directive';
import { CNGX_DATA_GRID_ACCORDION } from './data-grid-accordion.token';
import type { CngxDataGridSkin } from './config/data-grid-accordion.config';
import { withDataGridSkin } from './config/features';
import { provideDataGridAccordionConfig } from './config/provide-data-grid-accordion-config';

@Component({
  template: `<cngx-data-grid-accordion
    [multi]="multi()"
    [headingLevel]="level()"
    [skin]="skin()"
    [columns]="columns()"
    [(openIds)]="open"
  ></cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion],
})
class Host {
  readonly multi = signal(false);
  readonly level = signal<number | string>(3);
  readonly skin = signal<CngxDataGridSkin | undefined>(undefined);
  readonly columns = signal('8ch 1fr auto');
  readonly open = signal<ReadonlySet<string>>(new Set());
}

describe('CngxDataGridAccordion', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    return {
      fixture,
      host: fixture.componentInstance,
      group: de.injector.get(CngxDataGridAccordion),
      accordion: de.injector.get(CngxAccordion),
      el: de.nativeElement as HTMLElement,
    };
  }

  it('provides CNGX_DATA_GRID_ACCORDION resolving to the group', () => {
    const { fixture } = setup();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    expect(de.injector.get(CNGX_DATA_GRID_ACCORDION)).toBe(de.injector.get(CngxDataGridAccordion));
  });

  it('defaults heading level to 3 and clamps into the ARIA 2-6 range', () => {
    const { fixture, host, group } = setup();
    expect(group.headingLevel()).toBe(3);

    host.level.set(1);
    fixture.detectChanges();
    expect(group.headingLevel()).toBe(2);

    host.level.set(9);
    fixture.detectChanges();
    expect(group.headingLevel()).toBe(6);
  });

  it('coerces a string heading level from attribute binding', () => {
    const { fixture, host, group } = setup();
    host.level.set('5');
    fixture.detectChanges();
    expect(group.headingLevel()).toBe(5);
  });

  it('renders the inner grid that owns the shared column tracks', () => {
    const { el } = setup();
    // The host is the scroll container; the inner `__grid` is the single grid the
    // header, rows, and footer subgrid onto (so `fit` columns resolve once).
    expect(el.querySelector('.cngx-data-grid-accordion__grid')).toBeTruthy();
  });

  it('reflects [columns] onto the --cngx-dga-columns host property', () => {
    const { fixture, host, el } = setup();
    expect(el.style.getPropertyValue('--cngx-dga-columns')).toBe('8ch 1fr auto');

    host.columns.set('12ch 1fr');
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--cngx-dga-columns')).toBe('12ch 1fr');
  });

  it('forwards [multi] to the hosted CngxAccordion brain', () => {
    const { fixture, host, accordion } = setup();
    expect(accordion.multi()).toBe(false);
    host.multi.set(true);
    fixture.detectChanges();
    expect(accordion.multi()).toBe(true);
  });

  it('forwards a seeded [openIds] into the hosted brain and round-trips changes', () => {
    const { fixture, host, accordion } = setup();
    host.multi.set(true);
    host.open.set(new Set(['a']));
    fixture.detectChanges();
    expect(accordion.isOpen('a')).toBe(true);

    accordion.toggle('b');
    fixture.detectChanges();
    expect([...host.open()].sort()).toEqual(['a', 'b']);
  });

  it('omits [data-skin] when no skin is bound or configured', () => {
    const { el } = setup();
    expect(el.hasAttribute('data-skin')).toBe(false);
  });

  it('reflects a bound [skin] onto the [data-skin] host attribute', () => {
    const { fixture, host, el } = setup();
    host.skin.set('ledger');
    fixture.detectChanges();
    expect(el.getAttribute('data-skin')).toBe('ledger');

    host.skin.set(undefined);
    fixture.detectChanges();
    expect(el.hasAttribute('data-skin')).toBe(false);
  });
});

describe('CngxDataGridAccordion skin cascade', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideDataGridAccordionConfig(withDataGridSkin('report'))],
    }),
  );

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    return { fixture, host: fixture.componentInstance, el: de.nativeElement as HTMLElement };
  }

  it('falls back to the configured skin when [skin] is unbound', () => {
    const { el } = setup();
    expect(el.getAttribute('data-skin')).toBe('report');
  });

  it('lets a per-instance [skin] win over the configured default', () => {
    const { fixture, host, el } = setup();
    host.skin.set('ledger');
    fixture.detectChanges();
    expect(el.getAttribute('data-skin')).toBe('ledger');
  });
});

@Component({
  template: `<cngx-data-grid-accordion
    [sortActive]="active()"
    [sortDirection]="direction()"
    [multiSort]="true"
    (sortChange)="onSort($event)"
  ></cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion],
})
class SortHost {
  readonly active = signal<string | undefined>(undefined);
  readonly direction = signal<'asc' | 'desc' | undefined>(undefined);
  readonly lastSort = signal<SortEntry | undefined>(undefined);
  onSort(entry: SortEntry | undefined): void {
    this.lastSort.set(entry);
  }
}

describe('CngxDataGridAccordion sort', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SortHost] }));

  function setup() {
    const fixture = TestBed.createComponent(SortHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    return {
      fixture,
      host: fixture.componentInstance,
      de,
      group: de.injector.get(CngxDataGridAccordion),
      sort: de.injector.get(CngxSort),
    };
  }

  it('exposes the hosted CngxSort as grid.sort on the context', () => {
    const { de, group, sort } = setup();
    expect(group.sort).toBe(sort);
    expect(de.injector.get(CNGX_DATA_GRID_ACCORDION).sort).toBe(sort);
  });

  it('forwards [sortActive]/[sortDirection] into the hosted CngxSort', () => {
    const { fixture, host, sort } = setup();
    host.active.set('name');
    host.direction.set('desc');
    fixture.detectChanges();
    expect(sort.active()).toBe('name');
    expect(sort.direction()).toBe('desc');
  });

  it('re-emits (sortChange) when the hosted sort toggles', () => {
    const { fixture, host, sort } = setup();
    sort.setSort('amount');
    fixture.detectChanges();
    expect(host.lastSort()).toEqual({ active: 'amount', direction: 'asc' });
  });

  it('forwards [multiSort] into the hosted CngxSort', () => {
    const { sort } = setup();
    expect(sort.multiSort()).toBe(true);
  });
});

@Component({
  template: `<cngx-data-grid-accordion
    [initialSort]="{ active: 'amount', direction: 'desc' }"
  ></cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion],
})
class InitialSortHost {}

describe('CngxDataGridAccordion initial sort', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [InitialSortHost] }));

  function setup() {
    const fixture = TestBed.createComponent(InitialSortHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    return { fixture, sort: de.injector.get(CngxSort) };
  }

  it('starts sorted from [initialSort]', () => {
    const { sort } = setup();
    expect(sort.active()).toBe('amount');
    expect(sort.direction()).toBe('desc');
  });

  it('hands over to a header click after seeding', () => {
    const { fixture, sort } = setup();
    sort.setSort('name');
    fixture.detectChanges();
    expect(sort.active()).toBe('name');
    expect(sort.direction()).toBe('asc');
  });
});

@Component({
  template: `<cngx-data-grid-accordion
    [filterPredicate]="predicate()"
    [(filterTerm)]="term"
  ></cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion],
})
class FilterHost {
  readonly predicate = signal<((row: unknown) => boolean) | null>(null);
  readonly term = signal('');
}

describe('CngxDataGridAccordion filter', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [FilterHost] }));

  function setup() {
    const fixture = TestBed.createComponent(FilterHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    return {
      fixture,
      host: fixture.componentInstance,
      de,
      group: de.injector.get(CngxDataGridAccordion),
      filter: de.injector.get(CngxFilter),
    };
  }

  it('exposes the hosted CngxFilter and the filterTerm model on the context', () => {
    const { de, group, filter } = setup();
    const ctx = de.injector.get(CNGX_DATA_GRID_ACCORDION);
    expect(group.filter).toBe(filter);
    expect(ctx.filter).toBe(filter);
    expect(ctx.filterTerm).toBe(group.filterTerm);
  });

  it('forwards [filterPredicate] into the hosted CngxFilter', () => {
    const { fixture, host, filter } = setup();
    expect(filter.predicate()).toBeNull();

    host.predicate.set((row) => row === 'keep');
    fixture.detectChanges();
    const predicate = filter.predicate();
    expect(predicate).not.toBeNull();
    expect(predicate?.('keep')).toBe(true);
    expect(predicate?.('drop')).toBe(false);
  });

  it('two-way binds [(filterTerm)] with the hosted model', () => {
    const { fixture, host, group } = setup();
    host.term.set('alpha');
    fixture.detectChanges();
    expect(group.filterTerm()).toBe('alpha');

    group.filterTerm.set('omega');
    fixture.detectChanges();
    expect(host.term()).toBe('omega');
  });
});

@Component({
  template: `<cngx-data-grid-accordion [columns]="cols()">
    <cngx-dga-header>
      <span cngxDgaCell [col]="c0()">ID</span>
      <span cngxDgaCell [col]="c1()">Name</span>
      <span cngxDgaCell [col]="c2()" align="end">Amount</span>
    </cngx-dga-header>
    <cngx-dga-row panelId="a">
      <span cngxDgaCell>1</span>
      <span cngxDgaCell primary>Alpha</span>
      <span cngxDgaCell align="end">120</span>
      Detail
    </cngx-dga-row>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDataGridRow, CngxDgCell],
})
class ContentHost {
  readonly cols = signal<string | undefined>(undefined);
  readonly c0 = signal<CngxDgCellTrack | undefined>(undefined);
  readonly c1 = signal<CngxDgCellTrack | undefined>(undefined);
  readonly c2 = signal<CngxDgCellTrack | undefined>(undefined);
}

@Component({
  template: `<cngx-data-grid-accordion>
    <cngx-dga-row panelId="a">
      <span cngxDgaCell>1</span>
      <span cngxDgaCell primary>Alpha</span>
      <span cngxDgaCell align="end">120</span>
      Detail
    </cngx-dga-row>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridRow, CngxDgCell],
})
class NoHeaderHost {}

describe('CngxDataGridAccordion column derivation', () => {
  function template(el: HTMLElement): string {
    return el.style.getPropertyValue('--cngx-dga-columns');
  }

  it('derives the grid template from the header col intents', () => {
    TestBed.configureTestingModule({ imports: [ContentHost] });
    const fixture = TestBed.createComponent(ContentHost);
    fixture.componentInstance.c0.set('sm');
    fixture.componentInstance.c1.set('grow');
    fixture.componentInstance.c2.set('md');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDataGridAccordion))
      .nativeElement as HTMLElement;
    expect(template(el)).toBe(
      'var(--cngx-dga-col-sm, 5rem) minmax(0, 1fr) var(--cngx-dga-col-md, 7rem)',
    );
  });

  it('lets an explicit [columns] string win over the derived template', () => {
    TestBed.configureTestingModule({ imports: [ContentHost] });
    const fixture = TestBed.createComponent(ContentHost);
    fixture.componentInstance.c0.set('sm');
    fixture.componentInstance.c1.set('grow');
    fixture.componentInstance.cols.set('9ch 1fr auto');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDataGridAccordion))
      .nativeElement as HTMLElement;
    expect(template(el)).toBe('9ch 1fr auto');
  });

  it('defaults unset columns to primary-grows / rest-fits', () => {
    TestBed.configureTestingModule({ imports: [ContentHost] });
    const fixture = TestBed.createComponent(ContentHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDataGridAccordion))
      .nativeElement as HTMLElement;
    // Primary cell is at index 1 (the row's `primary` cell); it grows, the rest fit.
    expect(template(el)).toBe('auto minmax(0, 1fr) auto');
  });

  it('falls back to the first row cells when no header exists', () => {
    TestBed.configureTestingModule({ imports: [NoHeaderHost] });
    const fixture = TestBed.createComponent(NoHeaderHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDataGridAccordion))
      .nativeElement as HTMLElement;
    expect(template(el)).toBe('auto minmax(0, 1fr) auto');
  });
});

@Component({
  template: `<cngx-data-grid-accordion [multi]="true" [(openIds)]="open">
    @for (row of rows(); track row.id) {
      <cngx-dga-row [panelId]="row.id">
        <span cngxDgaCell primary>{{ row.name }}</span>
        Detail {{ row.id }}
      </cngx-dga-row>
    }
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridRow, CngxDgCell],
})
class OpenSetHost {
  readonly rows = signal<{ id: string; name: string }[]>([
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Beta' },
    { id: 'c', name: 'Gamma' },
  ]);
  readonly open = signal<ReadonlySet<string>>(new Set());
}

describe('CngxDataGridAccordion open-set survives sort + filter', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [OpenSetHost] }));

  function expandedCount(fixture: { nativeElement: HTMLElement }): number {
    return fixture.nativeElement.querySelectorAll('.cngx-dga-row[data-expanded]').length;
  }

  it('keeps rows open by panelId through a reorder and a filter that removes them', () => {
    const fixture = TestBed.createComponent(OpenSetHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    host.open.set(new Set(['a', 'c']));
    fixture.detectChanges();
    expect(expandedCount(fixture)).toBe(2);

    // Reorder (reverse) and filter out 'b'. The open-set is keyed by panelId, not by
    // position or DOM presence, so 'a' and 'c' stay open through the move.
    host.rows.set([
      { id: 'c', name: 'Gamma' },
      { id: 'a', name: 'Alpha' },
    ]);
    fixture.detectChanges();
    expect(expandedCount(fixture)).toBe(2);
    expect([...host.open()].sort()).toEqual(['a', 'c']);

    // Filter 'c' out of the DOM entirely; its open state is retained in the set even
    // while the row is unmounted (unregisterHeader does not prune openIds).
    host.rows.set([{ id: 'a', name: 'Alpha' }]);
    fixture.detectChanges();
    expect(expandedCount(fixture)).toBe(1);
    expect([...host.open()].sort()).toEqual(['a', 'c']);

    // Bring 'c' back; it renders expanded again - the open state survived the filter.
    host.rows.set([
      { id: 'c', name: 'Gamma' },
      { id: 'a', name: 'Alpha' },
    ]);
    fixture.detectChanges();
    expect(expandedCount(fixture)).toBe(2);
  });
});
