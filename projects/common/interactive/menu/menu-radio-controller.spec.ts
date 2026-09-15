import { signal, type ModelSignal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_MENU_RADIO_GROUP,
  createMenuRadioController,
  type CngxMenuRadioGroup,
} from './menu-radio-controller';

function makeSelected<T>(initial?: T): ModelSignal<T | undefined> {
  // The controller only needs a settable signal; model() identity is not
  // exercised, so a writable signal stands in.
  return signal<T | undefined>(initial) as unknown as ModelSignal<T | undefined>;
}

describe('createMenuRadioController', () => {
  it('passes the selectedValue and name signals through unchanged', () => {
    const selectedValue = makeSelected<string>('a');
    const name: Signal<string | undefined> = signal('group-1');
    const controller = createMenuRadioController({ selectedValue, name });
    expect(controller.selectedValue).toBe(selectedValue);
    expect(controller.name()).toBe('group-1');
    expect(controller.selectedValue()).toBe('a');
  });

  it('select(value) writes the selected value', () => {
    const selectedValue = makeSelected<string>();
    const controller = createMenuRadioController({
      selectedValue,
      name: signal<string | undefined>(undefined),
    });
    controller.select('b');
    expect(selectedValue()).toBe('b');
  });
});

describe('CNGX_MENU_RADIO_GROUP', () => {
  it('resolves to null when no group host is present (optional injection)', () => {
    const resolved = TestBed.inject(CNGX_MENU_RADIO_GROUP, null, { optional: true });
    expect(resolved).toBeNull();
  });

  it('exposes a provided controller to injectors', () => {
    const selectedValue = makeSelected<string>('x');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CNGX_MENU_RADIO_GROUP,
          useValue: createMenuRadioController({
            selectedValue,
            name: signal<string | undefined>('g'),
          }),
        },
      ],
    });
    const group = TestBed.inject<CngxMenuRadioGroup<unknown>>(CNGX_MENU_RADIO_GROUP);
    group.select('y');
    expect(selectedValue()).toBe('y');
  });
});
