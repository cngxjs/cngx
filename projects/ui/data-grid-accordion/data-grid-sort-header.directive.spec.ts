import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxSort } from '@cngx/common/data';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDgCell } from './data-grid-cell.directive';
import { CngxDgaSortHeader } from './data-grid-sort-header.directive';

@Component({
  template: `<cngx-data-grid-accordion [multiSort]="multi()">
    <cngx-dga-header>
      <span cngxDgaCell cngxDgaSortHeader="name">Name</span>
      <span cngxDgaCell cngxDgaSortHeader="amount" align="end">Amount</span>
    </cngx-dga-header>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDgCell, CngxDgaSortHeader],
})
class Host {
  readonly multi = signal(false);
}

describe('CngxDgaSortHeader', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host, LabelHost] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const gridDe = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    const headers = fixture.debugElement.queryAll(By.directive(CngxDgaSortHeader));
    const nameDe = headers[0];
    return {
      fixture,
      host: fixture.componentInstance,
      sort: gridDe.injector.get(CngxSort),
      nameEl: nameDe.nativeElement as HTMLElement,
      nameDir: nameDe.injector.get(CngxDgaSortHeader),
      amountEl: headers[1].nativeElement as HTMLElement,
    };
  }

  it('exposes the sortable cell as an operable button', () => {
    const { nameEl } = setup();
    expect(nameEl.getAttribute('role')).toBe('button');
    expect(nameEl.getAttribute('tabindex')).toBe('0');
    expect(nameEl.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('keeps the header itself reachable (not aria-hidden)', () => {
    const { fixture } = setup();
    const header = fixture.debugElement.query(By.directive(CngxDataGridHeader))
      .nativeElement as HTMLElement;
    expect(header.hasAttribute('aria-hidden')).toBe(false);
  });

  it('cycles the sort ascending -> descending on click', () => {
    const { fixture, sort, nameEl, nameDir } = setup();
    expect(nameDir.isActive()).toBe(false);

    nameEl.click();
    fixture.detectChanges();
    expect(sort.active()).toBe('name');
    expect(sort.direction()).toBe('asc');
    expect(nameDir.isAsc()).toBe(true);

    nameEl.click();
    fixture.detectChanges();
    expect(sort.direction()).toBe('desc');
    expect(nameDir.isDesc()).toBe(true);
  });

  it('activates on Enter and on Space like a click', () => {
    const { fixture, sort, nameEl } = setup();

    nameEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(sort.active()).toBe('name');
    expect(sort.direction()).toBe('asc');

    nameEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(sort.direction()).toBe('desc');
  });

  it('adds a secondary sort on Shift+click when multiSort is enabled', () => {
    const { fixture, host, sort, nameEl, amountEl } = setup();
    host.multi.set(true);
    fixture.detectChanges();

    nameEl.click();
    fixture.detectChanges();
    amountEl.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));
    fixture.detectChanges();

    expect(sort.sorts().map((sortEntry) => sortEntry.active)).toEqual(['name', 'amount']);
  });

  it('reflects the sort state into the visually-hidden description', () => {
    const { fixture, nameEl } = setup();
    const status = nameEl.querySelector('.cngx-dga-sort-header__sr') as HTMLElement;
    expect(status.getAttribute('aria-hidden')).toBe('true');
    expect(status.textContent).toContain('not sorted');

    nameEl.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(status.textContent).toContain('sorted ascending');

    nameEl.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(status.textContent).toContain('sorted descending');
  });

  it('lets a consumer override the SR status strings for other locales', () => {
    const fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();
    const nameEl = fixture.debugElement.query(By.directive(CngxDgaSortHeader))
      .nativeElement as HTMLElement;
    const status = nameEl.querySelector('.cngx-dga-sort-header__sr') as HTMLElement;
    expect(status.textContent).toBe('nicht sortiert');

    nameEl.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(status.textContent).toBe('aufsteigend');
  });

  it('announces the sort-state change once per activation via the live announcer', () => {
    const spy = vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce').mockImplementation(() => {});
    const { fixture, nameEl } = setup();
    expect(spy).not.toHaveBeenCalled();

    nameEl.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('ascending');

    nameEl.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0]).toContain('descending');
  });

  it('does not announce on an external sort change', () => {
    const spy = vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce').mockImplementation(() => {});
    const { fixture, sort } = setup();
    sort.setSort('name');
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
  });

  it('speaks the overridden label and announcement string', () => {
    const spy = vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce').mockImplementation(() => {});
    const fixture = TestBed.createComponent(LabelHost);
    fixture.detectChanges();
    const nameEl = fixture.debugElement.query(By.directive(CngxDgaSortHeader))
      .nativeElement as HTMLElement;

    nameEl.click();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith('Betrag aufsteigend sortiert');
  });
});

@Component({
  template: `<cngx-data-grid-accordion>
    <cngx-dga-header>
      <span
        cngxDgaCell
        cngxDgaSortHeader="name"
        cngxDgaSortStatusNotSorted="nicht sortiert"
        cngxDgaSortStatusAscending="aufsteigend"
        cngxDgaSortStatusDescending="absteigend"
        cngxDgaSortLabel="Betrag"
        cngxDgaSortAnnounceAscending="{label} aufsteigend sortiert"
        >Name</span
      >
    </cngx-dga-header>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDgCell, CngxDgaSortHeader],
})
class LabelHost {}
