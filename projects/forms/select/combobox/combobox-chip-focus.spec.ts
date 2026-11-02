import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { CngxSelectOptionDef } from '../shared/option.model';
import { CngxCombobox } from './combobox.component';

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxCombobox - keyboard chip removal focus', () => {
  @Component({
    template: `
      <cngx-combobox [label]="'Letters'" [options]="options" [(values)]="values" />
    `,
    imports: [CngxCombobox],
  })
  class ChipFocusHost {
    readonly options: CngxSelectOptionDef<string>[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ];
    readonly values = signal<string[]>(['a', 'b']);
  }

  const roots: HTMLElement[] = [];
  afterEach(() => {
    roots.splice(0).forEach((el) => el.remove());
  });

  function mount() {
    const fixture = TestBed.createComponent(ChipFocusHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    roots.push(root);
    fixture.detectChanges();
    flush(fixture);
    const input = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    return { fixture, root, input, host: fixture.componentInstance };
  }

  const backspace = (input: HTMLInputElement): void => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
  };

  it('removes the last chip on Backspace in the empty input and keeps focus there', () => {
    const { fixture, root, input, host } = mount();
    input.focus();
    backspace(input);
    flush(fixture);
    expect(host.values()).toEqual(['a']);
    expect(root.querySelectorAll('cngx-chip').length).toBe(1);
    expect(document.activeElement).toBe(input);
  });

  it('keeps focus in the control across repeated removals down to empty', () => {
    const { fixture, input, host } = mount();
    input.focus();
    backspace(input);
    flush(fixture);
    backspace(input);
    flush(fixture);
    backspace(input);
    flush(fixture);
    expect(host.values()).toEqual([]);
    expect(document.activeElement).toBe(input);
  });
});
