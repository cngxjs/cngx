/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The inner controls of
// the select family (clear buttons, chip wrap, retry, sheet Done / X, reorder
// move) draw their focus ring from the family focus tokens, so a ring set on
// an ancestor reaches every one of them. The controls are static markup under
// the shipped stylesheets; a programmatic `focus()` matches `:focus-visible`
// in this runner.

@Component({
  selector: 'cngx-select-inner-ring-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    './select-base.css',
    '../single-select/select.component.css',
    '../multi-select/multi-select.component.css',
    '../combobox/combobox.component.css',
    '../typeahead/typeahead.component.css',
    '../action-select/action-select.component.css',
    '../action-multi-select/action-multi-select.component.css',
    '../reorderable-multi-select/reorderable-multi-select.component.css',
    './internal/sheet-header/sheet-header.component.css',
    './internal/reorder-list/reorder-list.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      class="ring-scope"
      style="--cngx-select-focus-outline: 3px dotted rgb(1, 2, 3); --cngx-select-focus-offset: 5px"
    >
      <div class="cngx-select">
        <button type="button" class="cngx-select__clear r-select">x</button>
      </div>
      <div class="cngx-multi-select">
        <button type="button" class="cngx-multi-select__clear-all r-multi">x</button>
      </div>
      <div class="cngx-combobox">
        <button type="button" class="cngx-combobox__clear-all r-combobox">x</button>
      </div>
      <div class="cngx-typeahead">
        <button type="button" class="cngx-typeahead__clear r-typeahead">x</button>
      </div>
      <div class="cngx-action-select">
        <button type="button" class="cngx-action-select__clear r-action">x</button>
      </div>
      <div class="cngx-action-multi-select">
        <button type="button" class="cngx-action-multi-select__clear-all r-action-multi">x</button>
      </div>
      <div class="cngx-reorderable-multi-select">
        <button type="button" class="cngx-reorderable-multi-select__clear-all r-reorder-clear">
          x
        </button>
      </div>
      <span class="cngx-select__chip-wrap r-chip" tabindex="0">Red</span>
      <button type="button" class="cngx-select__error-retry r-retry">Retry</button>
      <div class="cngx-select-sheet-header">
        <button type="button" class="cngx-select-sheet-header__done r-done">Done</button>
        <button type="button" class="cngx-select-sheet-header__close r-close">X</button>
      </div>
      <button type="button" class="cngx-select-reorder-list__move r-move">Up</button>
    </div>
  `,
})
class InnerRingHost {}

const CONTROLS = [
  'r-select',
  'r-multi',
  'r-combobox',
  'r-typeahead',
  'r-action',
  'r-action-multi',
  'r-reorder-clear',
  'r-chip',
  'r-retry',
  'r-done',
  'r-close',
  'r-move',
];

let mountedRoot: HTMLElement | null = null;

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select-family inner focus rings', () => {
  it.each(CONTROLS)('draws the %s ring from the family focus tokens', (cls) => {
    const fixture = TestBed.createComponent(InnerRingHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();

    const el = mountedRoot.querySelector<HTMLElement>(`.${cls}`)!;
    el.focus();
    expect(el.matches(':focus-visible')).toBe(true);
    expect(computedValue(el, 'outline-style')).toBe('dotted');
    expect(computedValue(el, 'outline-color')).toBe('rgb(1, 2, 3)');
    expect(computedValue(el, 'outline-width')).toBe('3px');
    expect(computedValue(el, 'outline-offset')).toBe('5px');
  });
});
