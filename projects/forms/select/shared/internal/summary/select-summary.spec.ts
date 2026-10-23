import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { stripBidiIsolates } from '@cngx/testing';

import { selectCopyFrom } from '../../../i18n/select-i18n';
import { CNGX_SELECT_LANGUAGE_EN } from '../../../i18n/select-language-section';
import type { CngxSelectOptionDef } from '../../option.model';
import { CngxSelectChipOverflow } from '../../template-slots';
import { CngxSelectSummary } from './select-summary.component';
import { createSelectSummary } from './select-summary';

function opt(value: string): CngxSelectOptionDef<string> {
  return { value, label: value.toUpperCase() };
}

function harness(values: string[], locale = 'en', active = true) {
  const copy = selectCopyFrom(CNGX_SELECT_LANGUAGE_EN, locale);
  const selectedOptions = signal(values.map(opt));
  const isActive = signal(active);
  const chipOverflow = signal<'wrap' | 'scroll-x' | 'truncate'>('wrap');
  const maxVisibleChips = signal(3);
  const summary = createSelectSummary<string>({
    selectedOptions,
    active: isActive,
    chipOverflow,
    maxVisibleChips,
    ariaLabels: signal(copy.ariaLabels),
    fallbackLabels: signal(copy.fallbackLabels),
  });
  return { summary, selectedOptions, isActive, chipOverflow, maxVisibleChips };
}

describe('createSelectSummary', () => {
  it('reads the whole selection for AT only while a truncate strip hides values', () => {
    const { summary, isActive, chipOverflow, selectedOptions } = harness(
      ['a', 'b', 'c', 'd', 'e'],
      'en',
      false,
    );
    expect(summary.hiddenSummaryText()).toBe('');
    chipOverflow.set('truncate');
    expect(stripBidiIsolates(summary.hiddenSummaryText())).toBe('5 selected: A, B, C, D, and E');
    expect(summary.accessibleText()).toBe(summary.hiddenSummaryText());
    selectedOptions.set(['a', 'b'].map(opt));
    expect(summary.hiddenSummaryText()).toBe('');
    // The summary branch owns the text while it is on.
    selectedOptions.set(['a', 'b', 'c', 'd', 'e'].map(opt));
    isActive.set(true);
    expect(summary.hiddenSummaryText()).toBe('');
    expect(summary.accessibleText()).toBe(summary.fullText());
  });

  it('follows a copy switch in the hidden summary', () => {
    const copy = selectCopyFrom(CNGX_SELECT_LANGUAGE_EN, 'en');
    const ariaLabels = signal(copy.ariaLabels);
    const summary = createSelectSummary<string>({
      selectedOptions: signal(['a', 'b', 'c', 'd'].map(opt)),
      active: signal(false),
      chipOverflow: signal<'wrap' | 'scroll-x' | 'truncate'>('truncate'),
      maxVisibleChips: signal(2),
      ariaLabels,
      fallbackLabels: signal(copy.fallbackLabels),
    });
    ariaLabels.set({
      ...copy.ariaLabels,
      selectionSummary: (labels) => `picked ${labels.join('/')}`,
    });
    expect(summary.hiddenSummaryText()).toBe('picked A/B/C/D');
  });

  it('has no label, badge or text for no value', () => {
    const { summary } = harness([]);
    expect(summary.first()).toBeNull();
    expect(summary.badgeCount()).toBe(0);
    expect(summary.badgeText()).toBe('');
    expect(summary.fullText()).toBe('');
  });

  it('shows the label of a single value and speaks the label alone', () => {
    const { summary } = harness(['a']);
    expect(summary.first()?.label).toBe('A');
    expect(summary.badgeText()).toBe('');
    expect(summary.fullText()).toBe('A');
  });

  it('shows the first label plus +1 for two values and speaks the summary copy', () => {
    const { summary } = harness(['a', 'b']);
    expect(summary.first()?.label).toBe('A');
    expect(summary.badgeCount()).toBe(1);
    expect(summary.badgeText()).toBe('+1');
    expect(summary.hidden().map((o) => o.value)).toEqual(['b']);
    expect(stripBidiIsolates(summary.fullText())).toBe('2 selected: A and B');
  });

  it('shows the first label plus +4 for five values', () => {
    const { summary } = harness(['a', 'b', 'c', 'd', 'e']);
    expect(summary.first()?.label).toBe('A');
    expect(summary.badgeText()).toBe('+4');
    expect(summary.hidden().map((o) => o.value)).toEqual(['b', 'c', 'd', 'e']);
    expect(stripBidiIsolates(summary.fullText())).toBe('5 selected: A, B, C, D, and E');
  });

  it('writes the badge count in the reading locale digits', () => {
    const { summary } = harness(['a', 'b', 'c'], 'ar-EG');
    expect(summary.badgeText()).toBe(`+${(2).toLocaleString('ar-EG')}`);
    expect(summary.badgeText()).not.toContain('2');
  });

  it('passes the own overflow inputs through to the chip strip while inactive', () => {
    const h = harness(['a', 'b', 'c', 'd'], 'en', false);
    expect(h.summary.strip.visibleSelected().map((o) => o.value)).toEqual(['a', 'b', 'c', 'd']);
    h.chipOverflow.set('truncate');
    expect(h.summary.strip.visibleSelected().map((o) => o.value)).toEqual(['a', 'b', 'c']);
    expect(h.summary.strip.overflowBadgeCount()).toBe(1);
    expect(h.summary.first()).toBeNull();
    expect(h.summary.badgeCount()).toBe(0);
    expect(h.summary.fullText()).toBe('');

    h.isActive.set(true);
    expect(h.summary.strip.visibleSelected().map((o) => o.value)).toEqual(['a']);
    expect(h.summary.badgeCount()).toBe(3);
  });

  it('keeps the hidden array identity while the hidden set is unchanged', () => {
    const h = harness(['a', 'b', 'c']);
    const before = h.summary.hidden();
    h.selectedOptions.set([...h.selectedOptions()]);
    expect(h.summary.hidden()).toBe(before);
  });
});

@Component({
  standalone: true,
  imports: [CngxSelectSummary, CngxSelectChipOverflow],
  template: `
    <ng-template cngxSelectChipOverflow let-count let-label="label" let-hidden="hidden" #tpl>
      <span class="custom-badge">{{ label }}|{{ count }}|{{ hidden.length }}</span>
    </ng-template>
    <cngx-select-summary
      [label]="label()"
      [badge]="badge()"
      [badgeTpl]="useTpl() ? tpl : null"
      [badgeContext]="{ $implicit: 2, count: 2, label: badge(), hidden: hidden }"
      [fullText]="fullText()"
      [exposeValue]="exposeValue()"
    />
  `,
})
class SummaryHost {
  readonly label = signal('Red');
  readonly badge = signal('+2');
  readonly useTpl = signal(false);
  readonly fullText = signal('3 selected: Red, Green, and Blue');
  readonly exposeValue = signal(true);
  readonly hidden = [opt('g'), opt('b')];
}

describe('CngxSelectSummary', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  function render() {
    const fixture = TestBed.createComponent(SummaryHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el };
  }

  it('renders the label and the badge aria-hidden and exposes the full text', () => {
    const { el } = render();
    const label = el.querySelector('.cngx-select-summary__label')!;
    const badge = el.querySelector('.cngx-select__chip-overflow-badge')!;
    expect(label.textContent?.trim()).toBe('Red');
    expect(label.getAttribute('aria-hidden')).toBe('true');
    expect(badge.textContent?.trim()).toBe('+2');
    expect(badge.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.cngx-sr-only')?.textContent?.trim()).toBe(
      '3 selected: Red, Green, and Blue',
    );
  });

  it('renders no badge without badge text and no sr text without exposeValue', () => {
    const { fixture, el } = render();
    fixture.componentInstance.badge.set('');
    fixture.componentInstance.exposeValue.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-select__chip-overflow-badge')).toBeNull();
    expect(el.querySelector('.cngx-sr-only')).toBeNull();
  });

  it('hands the overflow slot its context instead of the default badge', () => {
    const { fixture, el } = render();
    fixture.componentInstance.useTpl.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-select__chip-overflow-badge')).toBeNull();
    expect(el.querySelector('.custom-badge')?.textContent?.trim()).toBe('+2|2|2');
  });
});
