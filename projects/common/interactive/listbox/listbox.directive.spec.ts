import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListbox } from './listbox.directive';
import { CngxOption } from './option.directive';

interface Fruit {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  template: `
    <div
      cngxListbox
      [label]="label()"
      [multiple]="multiple()"
      [value]="valueIn()"
      [selectedValues]="selectedIn()"
      (valueChange)="lastValue.set($any($event))"
      (selectedValuesChange)="lastSelected.set($any($event))"
      tabindex="0"
      #lb="cngxListbox"
    >
      @for (f of fruits(); track f.value) {
        <div cngxOption [value]="f.value" [label]="f.label" [disabled]="f.disabled ?? false">
          {{ f.label }}
        </div>
      }
    </div>
  `,
  imports: [CngxListbox, CngxOption],
})
class ListboxHost {
  readonly label = signal('Fruit selection');
  readonly multiple = signal(false);
  readonly valueIn = signal<string | undefined>(undefined);
  readonly selectedIn = signal<string[]>([]);
  readonly fruits = signal<Fruit[]>([
    { value: 'a', label: 'Apple' },
    { value: 'b', label: 'Banana' },
    { value: 'c', label: 'Cherry' },
    { value: 'd', label: 'Date', disabled: true },
  ]);
  readonly lastValue = signal<string | null>(null);
  readonly lastSelected = signal<string[] | null>(null);
}

describe('CngxListbox', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ListboxHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<ListboxHost>>;
    listbox: CngxListbox;
    hostEl: HTMLElement;
  } {
    const fixture = TestBed.createComponent(ListboxHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxListbox));
    return {
      fixture,
      listbox: el.injector.get(CngxListbox),
      hostEl: el.nativeElement as HTMLElement,
    };
  }

  it('sets role="listbox" and aria-label on host', () => {
    const { hostEl } = setup();
    expect(hostEl.getAttribute('role')).toBe('listbox');
    expect(hostEl.getAttribute('aria-label')).toBe('Fruit selection');
  });

  it('does not set aria-multiselectable in single mode', () => {
    const { hostEl } = setup();
    expect(hostEl.getAttribute('aria-multiselectable')).toBeNull();
  });

  it('sets aria-multiselectable="true" in multi mode', () => {
    const { fixture, hostEl } = setup();
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(hostEl.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('collects options via contentChildren', () => {
    const { listbox } = setup();
    expect(listbox.options()).toHaveLength(4);
  });

  it('select() in single mode emits valueChange and flags the option', () => {
    const { fixture, listbox } = setup();
    listbox.select('b');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(listbox.selected()).toEqual(['b']);
    expect(fixture.componentInstance.lastValue()).toBe('b');
  });

  it('select() in single mode replaces previous value', () => {
    const { fixture, listbox } = setup();
    listbox.select('a');
    listbox.select('b');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(listbox.selected()).toEqual(['b']);
    expect(fixture.componentInstance.lastValue()).toBe('b');
  });

  it('select() in multi mode adds to selection', () => {
    const { fixture, listbox } = setup();
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    listbox.select('a');
    listbox.select('b');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(listbox.selected().sort()).toEqual(['a', 'b']);
    expect(fixture.componentInstance.lastSelected()?.sort()).toEqual(['a', 'b']);
  });

  it('deselect() removes a value in multi mode', () => {
    const { fixture, listbox } = setup();
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    listbox.select('a');
    listbox.select('b');
    listbox.deselect('a');
    TestBed.flushEffects();
    expect(listbox.selected()).toEqual(['b']);
  });

  it('toggle() flips a value', () => {
    const { fixture, listbox } = setup();
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    listbox.toggle('a');
    TestBed.flushEffects();
    expect(listbox.selected()).toEqual(['a']);
    listbox.toggle('a');
    TestBed.flushEffects();
    expect(listbox.selected()).toEqual([]);
  });

  it('clear() wipes selection', () => {
    const { fixture, listbox } = setup();
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    listbox.select('a');
    listbox.select('b');
    listbox.clear();
    TestBed.flushEffects();
    expect(listbox.selected()).toEqual([]);
  });

  it('selectAll() in multi mode selects all non-disabled options', () => {
    const { fixture, listbox } = setup();
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    listbox.selectAll();
    TestBed.flushEffects();
    expect(listbox.selected().sort()).toEqual(['a', 'b', 'c']);
    expect(listbox.isAllSelected()).toBe(true);
  });

  it('selectedLabels returns labels in the same order as selected', () => {
    const { fixture, listbox } = setup();
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    listbox.select('b');
    listbox.select('c');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(listbox.selectedLabels().sort()).toEqual(['Banana', 'Cherry']);
  });

  it('value input seeds selection (uncontrolled fallback)', () => {
    const { fixture, listbox } = setup();
    fixture.componentInstance.valueIn.set('c');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(listbox.selected()).toEqual(['c']);
    expect(listbox.isSelected('c')).toBe(true);
  });

  it('activating an option via AD toggles or sets selection', () => {
    const { fixture, listbox } = setup();
    const adHost = fixture.debugElement.query(By.directive(CngxListbox)).nativeElement as HTMLElement;
    adHost.focus();
    // Activation triggers via Enter
    adHost.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    TestBed.flushEffects();
    fixture.detectChanges();
    adHost.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(listbox.selected()).toEqual(['a']);
  });

  it('is option reflected via host class + aria-selected after select()', () => {
    const { fixture, listbox } = setup();
    listbox.select('b');
    TestBed.flushEffects();
    fixture.detectChanges();
    const optionEls = fixture.debugElement.queryAll(By.directive(CngxOption));
    const bHost = optionEls[1].nativeElement as HTMLElement;
    expect(bHost.getAttribute('aria-selected')).toBe('true');
    expect(bHost.classList.contains('cngx-option--selected')).toBe(true);
  });
});
