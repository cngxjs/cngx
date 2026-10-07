import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxAccordion } from '@cngx/common/interactive';
import { CngxScrollEdges } from '@cngx/common/layout';
import { CngxFilter, CngxSort, type SortEntry } from '@cngx/common/data';
import { createResizeObserverMock, type ResizeObserverMock } from '@cngx/testing';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridFooter } from './data-grid-footer.component';
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

  it('dev-warns once when a row projects more cells than the shared template has tracks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ imports: [OverflowHost] });
    const fixture = TestBed.createComponent(OverflowHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    // The extra cells land in implicit grid tracks and misalign silently -
    // the only surface for the mistake is this warning.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('4 cells');
    expect(warn.mock.calls[0][0]).toContain('3 tracks');
    warn.mockRestore();
  });

  it('does not warn when every row matches the header tracks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({ imports: [ContentHost] });
    const fixture = TestBed.createComponent(ContentHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

@Component({
  template: `<cngx-data-grid-accordion>
    <cngx-dga-header>
      <span cngxDgaCell>ID</span>
      <span cngxDgaCell>Name</span>
      <span cngxDgaCell>Amount</span>
    </cngx-dga-header>
    <cngx-dga-row panelId="a">
      <span cngxDgaCell>1</span>
      <span cngxDgaCell primary>Alpha</span>
      <span cngxDgaCell>120</span>
      <span cngxDgaCell>extra</span>
      Detail
    </cngx-dga-row>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDataGridRow, CngxDgCell],
})
class OverflowHost {}

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

/**
 * The host is `overflow-x: auto`; unless it is also a containing block, a
 * `position: static` scroll container never clips its own absolutely positioned
 * descendants (the sort header's visually-hidden status spans), which then escape
 * and widen the document. This runner's `getComputedStyle` (jsdom) does not
 * resolve the injected cascade, so the guard asserts the compiled declaration -
 * comments stripped so it matches the property, not the prose describing it.
 */
describe('CngxDataGridAccordion - layout containment', () => {
  function dgaCss(): string {
    return Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .filter((t) => t.includes('cngx-data-grid-accordion'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '');
  }

  it('makes the scroll-container host a containing block for its own overflow', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const css = dgaCss();
    expect(css).toMatch(/\.cngx-data-grid-accordion\s*\{[^}]*position:\s*relative/);
    // The containment only matters because the same host owns the horizontal scroll.
    expect(css).toMatch(/\.cngx-data-grid-accordion\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('caps its height off the opt-in token and pins head + footer only when bounded', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const css = dgaCss();
    // The host reads the opt-in token; unset resolves to `none` (content-height).
    expect(css).toMatch(/max-block-size:\s*var\(--cngx-dga-max-block-size,\s*none\)/);
    // Head and footer are both pinned, gated behind a style query on that token, so
    // an unbounded grid gets no sticky treatment at all.
    expect(css).toMatch(/@container[^{]*style\([^)]*--cngx-dga-max-block-size[^)]*\)/);
    expect(css).toMatch(/\.cngx-dga-header\s*\{[^}]*position:\s*sticky/);
    expect(css).toMatch(/\.cngx-dga-footer\s*\{[^}]*position:\s*sticky/);
    expect(css).toMatch(/\.cngx-dga-footer\s*\{[^}]*inset-block-end:\s*0/);
  });

  it('ships a thin, tokenised scrollbar on the scroll container', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const css = dgaCss();
    expect(css).toMatch(
      /\.cngx-data-grid-accordion\s*\{[^}]*scrollbar-width:\s*var\(--cngx-dga-scrollbar-width,\s*thin\)/,
    );
    expect(css).toMatch(/\.cngx-data-grid-accordion\s*\{[^}]*scrollbar-color:/);
  });

  it('pads the scrollport block axis by the measured bands plus the focus clearance', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const css = dgaCss();
    // In the host BASE rule, never inside the bounded `@container` block: the
    // max-block-size token is the host's own inline style, so a style query could
    // never match the host itself.
    const base = css.match(/\.cngx-data-grid-accordion\s*\{[^}]*\}/)?.[0] ?? '';
    expect(base).toMatch(/scroll-padding-block:/);
    expect(base).toMatch(/var\(--cngx-dga-head-scroll-pad,\s*var\(--cngx-dga-head-block-size,\s*0px\)\)/);
    expect(base).toMatch(/var\(--cngx-dga-foot-scroll-pad,\s*var\(--cngx-dga-foot-block-size,\s*0px\)\)/);
    expect(base).toMatch(/var\(--cngx-dga-focus-clearance,\s*4px\)/);
    const bounded = css.match(/@container[^{]*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(bounded).not.toMatch(/scroll-padding/);
  });

  it('keeps the inline scroll padding in the host base rule, sized by the fade', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const base = dgaCss().match(/\.cngx-data-grid-accordion\s*\{[^}]*\}/)?.[0] ?? '';
    expect(base).toMatch(
      /scroll-padding-inline:\s*calc\(\s*var\(--cngx-dga-edge-fade-size,\s*24px\)\s*\+\s*var\(--cngx-dga-focus-clearance,\s*4px\)\s*\)/,
    );
  });

  it('gates the head / foot shadows on the block edge attributes inside the bounded block', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const bounded = dgaCss().match(/@container[^{]*\{([\s\S]*?)\n\}/)?.[1] ?? '';
    expect(bounded).toMatch(
      /\[data-scroll-block-start\][^{]*\.cngx-dga-header\s*\{[^}]*box-shadow:\s*var\(\s*--cngx-dga-head-shadow/,
    );
    expect(bounded).toMatch(
      /\[data-scroll-block-end\][^{]*\.cngx-dga-footer\s*\{[^}]*box-shadow:\s*var\(\s*--cngx-dga-foot-shadow/,
    );
  });

  it('gates the inline edge fade on the inline attributes, with an RTL twin and a forced-colors drop', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const css = dgaCss();
    expect(css).toMatch(
      /\.cngx-data-grid-accordion:is\(\[data-scroll-inline-start\],\s*\[data-scroll-inline-end\]\)\s*\{[^}]*mask-image:[^}]*var\(--_cngx-dga-fade-dir,\s*to right\)[^}]*mask-composite:\s*add,\s*exclude/,
    );
    // RTL flips only the direction carrier; the mask is declared once.
    expect(css).toMatch(
      /\.cngx-data-grid-accordion:dir\(rtl\)\s*\{\s*--_cngx-dga-fade-dir:\s*to left;?\s*\}/,
    );
    expect(css.match(/(?<!-webkit-)mask-image:\s*linear-gradient/g)).toHaveLength(1);
    expect(css).toMatch(/mask-clip:\s*padding-box,\s*padding-box,\s*border-box/);
    // The fade bottoms out at the fade-min opacity, never at full transparency.
    expect(css).toMatch(/var\(--cngx-dga-edge-fade-min,\s*0\.35\)/);
    // The build may prepend a `-webkit-` twin to each mask declaration.
    expect(css).toMatch(
      /@media\s*\(forced-colors:\s*active\)\s*\{[^{]*\{\s*(?:-webkit-mask-image:\s*none;\s*)?mask-image:\s*none/,
    );
    // The host's own focus ring paints outside the border box, where the mask is clear.
    expect(css).toMatch(/:focus-visible\s*\{\s*(?:-webkit-mask-image:\s*none;\s*)?mask-image:\s*none/);
  });
});

@Component({
  template: `<cngx-data-grid-accordion [maxBlockSize]="max()"></cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion],
})
class MaxBlockSizeHost {
  readonly max = signal<string | number | undefined>(undefined);
}

describe('CngxDataGridAccordion - [maxBlockSize] input', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [MaxBlockSizeHost] }));

  function setup() {
    const fixture = TestBed.createComponent(MaxBlockSizeHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDataGridAccordion))
      .nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('reflects a number as a px length onto --cngx-dga-max-block-size', () => {
    const { fixture, host, el } = setup();
    host.max.set(320);
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--cngx-dga-max-block-size')).toBe('320px');
  });

  it('passes a CSS length string through untouched', () => {
    const { fixture, host, el } = setup();
    host.max.set('40rem');
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--cngx-dga-max-block-size')).toBe('40rem');
  });

  it('coerces a unit-less numeric string to px', () => {
    const { fixture, host, el } = setup();
    host.max.set('480');
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--cngx-dga-max-block-size')).toBe('480px');
  });

  it('leaves the property unset when unbound, so the grid stays unbounded', () => {
    const { el } = setup();
    expect(el.style.getPropertyValue('--cngx-dga-max-block-size')).toBe('');
  });
});

@Component({
  template: `<cngx-data-grid-accordion [maxBlockSize]="320">
    @if (withHeader()) {
      <cngx-dga-header><span cngxDgaCell>Name</span></cngx-dga-header>
    }
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDgCell],
})
class BandHost {
  readonly withHeader = signal(true);
}

@Component({
  template: `<cngx-data-grid-accordion class="outer" [maxBlockSize]="320">
    <cngx-dga-header><span cngxDgaCell>Name</span></cngx-dga-header>
    <cngx-data-grid-accordion class="inner">
      <cngx-dga-footer><span cngxDgaCell>Total</span></cngx-dga-footer>
    </cngx-data-grid-accordion>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDataGridFooter, CngxDgCell],
})
class NestedBandHost {}

describe('CngxDataGridAccordion - measured head / foot bands', () => {
  let ro: ResizeObserverMock;

  beforeEach(() => {
    ro = createResizeObserverMock();
    ro.install(window);
    TestBed.configureTestingModule({ imports: [BandHost, NestedBandHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function band(blockSize: number): Partial<ResizeObserverEntry> {
    return {
      borderBoxSize: [{ blockSize, inlineSize: 300 }],
      contentRect: { height: blockSize } as DOMRectReadOnly,
    };
  }

  function grid(fixture: { nativeElement: HTMLElement }, selector = 'cngx-data-grid-accordion') {
    return fixture.nativeElement.querySelector(selector) as HTMLElement;
  }

  it('binds the measured header block size as a px length', () => {
    const fixture = TestBed.createComponent(BandHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(ro.observe).toHaveBeenCalled();

    ro.triggerResize(band(48));
    fixture.detectChanges();

    expect(grid(fixture).style.getPropertyValue('--cngx-dga-head-block-size')).toBe('48px');
    expect(grid(fixture).style.getPropertyValue('--cngx-dga-foot-block-size')).toBe('');
  });

  it('drops the binding and disconnects when the header goes away', () => {
    const fixture = TestBed.createComponent(BandHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    ro.triggerResize(band(48));
    fixture.detectChanges();
    const disconnects = ro.disconnect.mock.calls.length;

    fixture.componentInstance.withHeader.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(ro.disconnect.mock.calls.length).toBeGreaterThan(disconnects);
    expect(grid(fixture).style.getPropertyValue('--cngx-dga-head-block-size')).toBe('');
  });

  it('gives a nested headerless grid no head binding of its own', () => {
    const fixture = TestBed.createComponent(NestedBandHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(grid(fixture, '.inner').style.getPropertyValue('--cngx-dga-head-block-size')).toBe('');
  });
});

describe('CngxDataGridAccordion - scroll edges', () => {
  const KEYS = ['scrollTop', 'scrollHeight', 'clientHeight', 'scrollLeft', 'scrollWidth', 'clientWidth'] as const;
  const metrics: Record<(typeof KEYS)[number], number> = {
    scrollTop: 0,
    scrollHeight: 600,
    clientHeight: 320,
    scrollLeft: 0,
    scrollWidth: 300,
    clientWidth: 300,
  };
  const saved = new Map<string, PropertyDescriptor | undefined>();
  let frames: FrameRequestCallback[] = [];

  beforeEach(() => {
    for (const key of KEYS) {
      saved.set(key, Object.getOwnPropertyDescriptor(Element.prototype, key));
      Object.defineProperty(Element.prototype, key, { get: () => metrics[key], configurable: true });
    }
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    TestBed.configureTestingModule({ imports: [BandHost] });
  });

  afterEach(() => {
    for (const key of KEYS) {
      const descriptor = saved.get(key);
      if (descriptor) {
        Object.defineProperty(Element.prototype, key, descriptor);
      } else {
        delete (Element.prototype as unknown as Record<string, unknown>)[key];
      }
    }
    saved.clear();
    vi.unstubAllGlobals();
  });

  it('composes CngxScrollEdges on the host and reflects a hidden block end', () => {
    const fixture = TestBed.createComponent(BandHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    const edges = de.injector.get(CngxScrollEdges, null, { self: true });
    expect(edges).toBeInstanceOf(CngxScrollEdges);

    const pending = frames;
    frames = [];
    pending.forEach((callback) => callback(0));
    fixture.detectChanges();

    const el = de.nativeElement as HTMLElement;
    expect(el.getAttribute('data-scroll-block-end')).toBe('');
    expect(el.hasAttribute('data-scroll-block-start')).toBe(false);
    expect(el.hasAttribute('data-scroll-inline-end')).toBe(false);
  });
});

@Component({
  template: `<cngx-data-grid-accordion class="outer" [maxBlockSize]="320" [(openIds)]="open">
    @if (outerHeader()) {
      <cngx-dga-header class="outer-head"><span cngxDgaCell>Outer</span></cngx-dga-header>
    }
    <cngx-dga-row panelId="a">
      <span cngxDgaCell>Row</span>
      <cngx-data-grid-accordion class="inner">
        <cngx-dga-header class="inner-head">
          <span cngxDgaCell col="sm">Inner</span>
          <span cngxDgaCell col="lg">Inner 2</span>
        </cngx-dga-header>
        <cngx-dga-footer class="inner-foot"><span cngxDgaCell>Inner total</span></cngx-dga-footer>
      </cngx-data-grid-accordion>
    </cngx-dga-row>
    @if (outerFooter()) {
      <cngx-dga-footer class="outer-foot"><span cngxDgaCell>Outer total</span></cngx-dga-footer>
    }
  </cngx-data-grid-accordion>`,
  imports: [
    CngxDataGridAccordion,
    CngxDataGridHeader,
    CngxDataGridFooter,
    CngxDataGridRow,
    CngxDgCell,
  ],
})
class NestedDetailHost {
  readonly outerHeader = signal(true);
  readonly outerFooter = signal(true);
  readonly open = signal<ReadonlySet<string>>(new Set());
}

describe('CngxDataGridAccordion - band queries stay on the own grid', () => {
  // One callback per observed element, so each band can report its own size.
  const callbacks = new Map<Element, ResizeObserverCallback>();

  beforeEach(() => {
    callbacks.clear();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe(target: Element): void {
          callbacks.set(target, this.callback);
        }
        unobserve(): void {
          // unused
        }
        disconnect(): void {
          // unused
        }
      },
    );
    TestBed.configureTestingModule({ imports: [NestedDetailHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function resize(target: Element, blockSize: number): void {
    callbacks.get(target)?.(
      [
        {
          target,
          borderBoxSize: [{ blockSize, inlineSize: 300 }],
          contentRect: { height: blockSize } as DOMRectReadOnly,
        } as unknown as ResizeObserverEntry,
      ],
      null as unknown as ResizeObserver,
    );
  }

  function setup(open: boolean, outerHeader = true) {
    const fixture = TestBed.createComponent(NestedDetailHost);
    fixture.componentInstance.outerHeader.set(outerHeader);
    fixture.componentInstance.open.set(new Set(open ? ['a'] : []));
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const q = (selector: string) => root.querySelector(selector) as HTMLElement;
    for (const [selector, size] of [
      ['.outer-head', 30],
      ['.outer-foot', 40],
      ['.inner-head', 70],
      ['.inner-foot', 90],
    ] as const) {
      const el = root.querySelector(selector);
      if (el) {
        resize(el, size);
      }
    }
    fixture.detectChanges();
    return { fixture, outer: q('.outer'), inner: q('.inner') };
  }

  const head = (el: HTMLElement) => el.style.getPropertyValue('--cngx-dga-head-block-size');
  const foot = (el: HTMLElement) => el.style.getPropertyValue('--cngx-dga-foot-block-size');

  for (const open of [false, true]) {
    it(`measures the outer bands, not a nested grid's, with the row ${open ? 'expanded' : 'collapsed'}`, () => {
      const { outer, inner } = setup(open);
      expect(head(outer)).toBe('30px');
      expect(foot(outer)).toBe('40px');
      expect(head(inner)).toBe('70px');
      expect(foot(inner)).toBe('90px');
    });
  }

  it('leaves a headerless outer grid unmeasured even when a nested grid has a header', () => {
    const { outer } = setup(true, false);
    expect(head(outer)).toBe('');
    expect(foot(outer)).toBe('40px');
  });

  it('derives the outer columns from its own header, not the nested one', () => {
    const { fixture, outer } = setup(true, false);
    // Headerless outer: its own first row is the column source (one plain cell ->
    // `auto`), never the nested header's two sized tracks.
    expect(outer.style.getPropertyValue('--cngx-dga-columns')).toBe('auto');
    // The @if-wrapped outer header is still a direct child (control flow is transparent).
    fixture.componentInstance.outerHeader.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    resize(fixture.nativeElement.querySelector('.outer-head'), 32);
    fixture.detectChanges();
    expect(head(outer)).toBe('32px');
  });
});
