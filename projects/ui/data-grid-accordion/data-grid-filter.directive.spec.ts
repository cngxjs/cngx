import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDgaFilter } from './data-grid-filter.directive';

@Component({
  template: `<cngx-data-grid-accordion>
    <cngx-dga-header>
      <input cngxDgaFilter />
    </cngx-dga-header>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDgaFilter],
})
class Host {}

describe('CngxDgaFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [Host] });
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const gridDe = fixture.debugElement.query(By.directive(CngxDataGridAccordion));
    const inputDe = fixture.debugElement.query(By.directive(CngxDgaFilter));
    return {
      fixture,
      group: gridDe.injector.get(CngxDataGridAccordion),
      input: inputDe.nativeElement as HTMLInputElement,
    };
  }

  it('marks the input as a labelled searchbox', () => {
    const { input } = setup();
    expect(input.getAttribute('role')).toBe('searchbox');
    expect(input.getAttribute('aria-label')).toBe('Filter rows');
  });

  it('writes the debounced value into the group filterTerm', () => {
    const { group, input } = setup();
    input.value = 'inv';
    input.dispatchEvent(new Event('input'));

    // Not written until the debounce elapses.
    expect(group.filterTerm()).toBe('');
    vi.advanceTimersByTime(200);
    expect(group.filterTerm()).toBe('inv');
  });

  it('collapses rapid keystrokes into a single write', () => {
    const { group, input } = setup();
    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(100);
    input.value = 'ab';
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(100);
    expect(group.filterTerm()).toBe('');
    vi.advanceTimersByTime(100);
    expect(group.filterTerm()).toBe('ab');
  });

  it('reflects an external term change back into the box when unfocused', () => {
    const { fixture, group, input } = setup();
    group.filterTerm.set('reset');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(input.value).toBe('reset');
  });

  it('defers an external term change while focused and reconciles on blur', () => {
    const { fixture, group, input } = setup();
    input.value = 'typed';
    input.focus();

    // Focused: the effect skips the write so the caret is not reset.
    group.filterTerm.set('');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(input.value).toBe('typed');

    // Blur re-runs the reconciliation - without it the deferred write is
    // dropped forever (rows unfilter, the box keeps stale text).
    input.blur();
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('');
  });

  it('flushes a pending debounced keystroke on blur instead of leaving the timer live', () => {
    const { fixture, group, input } = setup();
    group.filterTerm.set('old');
    fixture.detectChanges();
    TestBed.flushEffects();

    input.focus();
    input.value = 'new';
    input.dispatchEvent(new Event('input'));

    // Blur before the debounce elapses: the typed value commits immediately -
    // a live timer would race any external write landing after the blur.
    input.blur();
    input.dispatchEvent(new Event('blur'));
    expect(input.value).toBe('new');
    expect(group.filterTerm()).toBe('new');

    // Nothing left to fire.
    vi.advanceTimersByTime(200);
    expect(group.filterTerm()).toBe('new');
  });
});
