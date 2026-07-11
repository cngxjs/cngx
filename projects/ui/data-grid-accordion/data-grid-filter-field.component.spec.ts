import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDgaFilterField } from './data-grid-filter-field.component';

@Component({
  template: `<cngx-data-grid-accordion>
    <cngx-dga-filter label="Filter invoices" placeholder="Customer or invoice number" />
    <cngx-dga-header></cngx-dga-header>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDgaFilterField],
})
class Host {}

describe('CngxDgaFilterField', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));
  afterEach(() => vi.useRealTimers());

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const fieldEl = fixture.debugElement.query(By.directive(CngxDgaFilterField))
      .nativeElement as HTMLElement;
    const grid = fixture.debugElement
      .query(By.directive(CngxDataGridAccordion))
      .injector.get(CngxDataGridAccordion);
    return { fixture, fieldEl, grid };
  }

  it('renders a visible label associated with the input', () => {
    const { fieldEl } = setup();
    const label = fieldEl.querySelector('label') as HTMLLabelElement;
    const input = fieldEl.querySelector('input') as HTMLInputElement;
    expect(label.textContent?.trim()).toBe('Filter invoices');
    expect(input.id).toBeTruthy();
    expect(label.getAttribute('for')).toBe(input.id);
    // The visible label text drives the accessible name (not the directive's default).
    expect(input.getAttribute('aria-label')).toBe('Filter invoices');
  });

  it('carries the full-width filter-field host class', () => {
    const { fieldEl } = setup();
    expect(fieldEl.classList.contains('cngx-dga-filter-field')).toBe(true);
  });

  it('writes the typed value through to the grid filterTerm after the debounce', () => {
    vi.useFakeTimers();
    const { fieldEl, grid } = setup();
    const input = fieldEl.querySelector('input') as HTMLInputElement;
    input.value = 'contoso';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(200);
    expect(grid.filterTerm()).toBe('contoso');
  });
});
