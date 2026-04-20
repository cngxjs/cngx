import {
  Component,
  computed,
  ElementRef,
  signal,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListboxSearch } from '@cngx/common/interactive';

import { createDisplayBinding, type DisplayBinding } from './display-binding';

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
}

@Component({
  selector: 'binding-host',
  template: '<input cngxListboxSearch #searchInput="cngxListboxSearch" #inputEl />',
  standalone: true,
  imports: [CngxListboxSearch],
})
class BindingHost {
  readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  readonly searchRef = viewChild(CngxListboxSearch);
  readonly value: WritableSignal<string | undefined> = signal(undefined);
  readonly focused: WritableSignal<boolean> = signal(false);
  readonly skipInitial: WritableSignal<boolean> = signal(false);
  readonly displayWith = signal<(v: string) => string>((v) => v.toUpperCase());
  readonly termLog: string[] = [];
  readonly binding: DisplayBinding<string>;

  constructor() {
    const searchTerm = computed<string>(() => this.searchRef()?.term() ?? '');
    this.binding = createDisplayBinding<string>({
      value: this.value,
      displayWith: this.displayWith,
      focused: this.focused,
      inputEl: this.inputEl,
      searchRef: this.searchRef,
      searchTerm,
      skipInitial: this.skipInitial,
      onUserSearchTerm: (t) => this.termLog.push(t),
    });
  }
}

describe('createDisplayBinding', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BindingHost] });
  });

  it('writes displayWith(value) into the input when value changes and field is not focused', () => {
    const fixture = TestBed.createComponent(BindingHost);
    flush(fixture);
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    host.value.set('alice');
    flush(fixture);

    expect(input.value).toBe('ALICE');
  });

  it('clears the input when value goes to undefined', () => {
    const fixture = TestBed.createComponent(BindingHost);
    flush(fixture);
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    host.value.set('bob');
    flush(fixture);
    expect(input.value).toBe('BOB');

    host.value.set(undefined);
    flush(fixture);

    expect(input.value).toBe('');
  });

  it('does not overwrite the input while focused=true', () => {
    const fixture = TestBed.createComponent(BindingHost);
    flush(fixture);
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    host.focused.set(true);
    host.value.set('carol');
    flush(fixture);

    expect(input.value).toBe('');
  });

  it('writeFromValue is imperative and idempotent', () => {
    const fixture = TestBed.createComponent(BindingHost);
    flush(fixture);
    const host = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    host.binding.writeFromValue('dave');
    expect(input.value).toBe('DAVE');

    // Second call with same value is a no-op — input stays as-is.
    host.binding.writeFromValue('dave');
    expect(input.value).toBe('DAVE');
  });

  it('isWritingFromValue flips true during a write', () => {
    const fixture = TestBed.createComponent(BindingHost);
    flush(fixture);
    const host = fixture.componentInstance;
    host.binding.writeFromValue('eve');
    expect(host.binding.isWritingFromValue()).toBe(true);
  });
});
