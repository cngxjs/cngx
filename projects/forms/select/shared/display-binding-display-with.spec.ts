import { signal, type ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CngxListboxSearch } from '@cngx/common/interactive';

import { createDisplayBinding } from './display-binding';

afterEach(() => {
  vi.restoreAllMocks();
});

// project (verify first): swapping `displayWith` while the input is unfocused
// should rewrite the display text. The value->input effect reads displayWith
// inside `untracked`, so today a displayWith change alone does not re-run it.
describe('display binding reacts to a displayWith swap while unfocused', () => {
  it('rewrites the input text when displayWith changes and the value is unchanged', () => {
    const inputElement = document.createElement('input');
    const search: CngxListboxSearch = {
      hasValue: () => false,
      clear: () => undefined,
    } as unknown as CngxListboxSearch;

    const value = signal<string | undefined>('red');
    const displayWith = signal<(v: string) => string>((v) => v.toUpperCase());
    const focused = signal(false);
    const searchTerm = signal('');

    TestBed.runInInjectionContext(() => {
      createDisplayBinding<string>({
        value,
        displayWith,
        focused,
        inputEl: signal({ nativeElement: inputElement } as ElementRef<HTMLInputElement>),
        searchRef: signal(search),
        searchTerm,
        skipInitial: signal(true),
        onUserSearchTerm: () => undefined,
      });
    });

    TestBed.flushEffects();
    expect(inputElement.value).toBe('RED');

    displayWith.set((v) => `[${v}]`);
    TestBed.flushEffects();
    expect(inputElement.value).toBe('[red]');
  });
});
