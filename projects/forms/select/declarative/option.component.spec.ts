import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListbox, CngxOption, CNGX_OPTION_FILTER_HOST } from '@cngx/common/interactive';

import { CngxSelectOption } from './option.component';

// Own unit coverage for the declarative <cngx-option> wrapper: it exposes the
// CngxOption atom's value / label / disabled surface through a native-feeling
// element and registers with the surrounding listbox. Runs under jsdom; no
// panel is opened, so no Popover API is touched.

@Component({
  standalone: true,
  imports: [CngxListbox, CngxSelectOption],
  providers: [{ provide: CNGX_OPTION_FILTER_HOST, useExisting: OptionHost }],
  template: `
    <div cngxListbox [label]="'Colour'" [(value)]="value">
      <cngx-option [value]="'red'">Red</cngx-option>
      <cngx-option [value]="'green'" [label]="'Verde'">Green</cngx-option>
      <cngx-option [value]="'blue'" [disabled]="true">Blue</cngx-option>
      @if (showExtra()) {
        <cngx-option [value]="'amber'">Amber</cngx-option>
      }
    </div>
  `,
})
class OptionHost {
  readonly value = signal<string | null>(null);
  readonly showExtra = signal(true);
  readonly searchTerm = signal('');
  matches(_value: unknown, label: string, term: string): boolean {
    return label.toLowerCase().includes(term.toLowerCase());
  }
}

function mount() {
  const fixture = TestBed.createComponent(OptionHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return fixture;
}

function optionByValue(fixture: ReturnType<typeof mount>, value: string): CngxOption {
  const match = fixture.debugElement
    .queryAll(By.directive(CngxSelectOption))
    .map((debugEl) => debugEl.injector.get(CngxOption))
    .find((option) => option.value() === value);
  if (!match) throw new Error(`no option with value ${value}`);
  return match;
}

describe('CngxSelectOption', () => {
  let fixture: ReturnType<typeof mount>;

  beforeEach(() => {
    fixture = mount();
  });

  it('renders role=option and projects its content', () => {
    const red = fixture.nativeElement.querySelector('cngx-option') as HTMLElement;
    expect(red.getAttribute('role')).toBe('option');
    expect(red.textContent?.trim()).toBe('Red');
  });

  it('exposes the bound value', () => {
    expect(optionByValue(fixture, 'red').value()).toBe('red');
    expect(optionByValue(fixture, 'green').value()).toBe('green');
  });

  it('takes its label from the projected content, and an explicit [label] wins', () => {
    expect(optionByValue(fixture, 'red').label()).toBe('Red');
    expect(optionByValue(fixture, 'green').label()).toBe('Verde');
  });

  it('reflects [disabled] on the host and the atom', () => {
    const blue = optionByValue(fixture, 'blue');
    expect(blue.disabled()).toBe(true);
    const blueHost = fixture.debugElement
      .queryAll(By.directive(CngxSelectOption))
      .map((d) => d.nativeElement as HTMLElement)
      .find((el) => el.textContent?.trim() === 'Blue')!;
    expect(blueHost.getAttribute('aria-disabled')).toBe('true');
    expect(blueHost.classList.contains('cngx-option--disabled')).toBe(true);
  });

  it('registers with the listbox so a value selects the matching option', () => {
    fixture.componentInstance.value.set('green');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(optionByValue(fixture, 'green').isSelected()).toBe(true);
    expect(optionByValue(fixture, 'red').isSelected()).toBe(false);
  });

  it('hides via the filter host when the term rejects it', () => {
    fixture.componentInstance.searchTerm.set('re');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(optionByValue(fixture, 'red').hidden()).toBe(false);
    expect(optionByValue(fixture, 'green').hidden()).toBe(true);
    const greenHost = fixture.debugElement
      .queryAll(By.directive(CngxSelectOption))
      .map((d) => d.nativeElement as HTMLElement)
      .find((el) => el.textContent?.trim() === 'Green')!;
    expect(greenHost.hasAttribute('hidden')).toBe(true);
  });

  it('unregisters on destroy so its value no longer selects anything', () => {
    fixture.componentInstance.showExtra.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.componentInstance.value.set('amber');
    fixture.detectChanges();
    TestBed.flushEffects();
    const selected = fixture.debugElement
      .queryAll(By.directive(CngxSelectOption))
      .map((d) => d.injector.get(CngxOption))
      .filter((option) => option.isSelected());
    expect(selected).toEqual([]);
  });
});
