import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { form, schema } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { time, timeRange, type TimeValidatorOptions } from './time.validator';

function check(value: unknown, options?: TimeValidatorOptions) {
  return timeRange(options)(new FormControl(value));
}

describe('timeRange', () => {
  it.each(['0000', '2359', '09:05', '1200AM', '1259PM', '01:00 AM', '0230pm'])(
    'accepts %s',
    (value) => {
      expect(check(value)).toBeNull();
    },
  );

  it.each([
    ['2400', 24],
    ['2500', 24],
    ['9999', 24],
    ['1075', 24],
    ['99:99', 24],
    ['25:00', 24],
    ['10:75', 24],
    ['1430PM', 12],
    ['14:30 PM', 12],
    ['0015AM', 12],
    ['00:15 AM', 12],
    ['1300AM', 12],
  ])('rejects %s on the %s-hour cycle', (value, cycle) => {
    expect(check(value)).toEqual({ timeRange: { cycle } });
  });

  it('judges a value without AM/PM by a pinned 12-hour cycle', () => {
    expect(check('1430', { cycle: 12 })).toEqual({ timeRange: { cycle: 12 } });
    expect(check('0930', { cycle: 12 })).toBeNull();
  });

  it('judges a value without AM/PM by a pinned 24-hour cycle', () => {
    expect(check('1430', { cycle: 24 })).toBeNull();
  });

  it('judges a value with AM/PM as 12-hour whatever cycle is pinned', () => {
    expect(check('1430PM', { cycle: 24 })).toEqual({ timeRange: { cycle: 12 } });
  });

  it('checks only the time part of a datetime value', () => {
    expect(check('123120251430')).toBeNull();
    expect(check('123120252500')).toEqual({ timeRange: { cycle: 24 } });
    expect(check('123120250230PM')).toBeNull();
    expect(check('12/31/2025 02:30 PM')).toBeNull();
    expect(check('12/31/2025 14:30 PM')).toEqual({ timeRange: { cycle: 12 } });
  });

  it('reads a suffix after the time as text, not as AM/PM', () => {
    expect(check('14:30 Uhr')).toBeNull();
    expect(check('25:00 Uhr')).toEqual({ timeRange: { cycle: 24 } });
  });

  it.each(['12:00 AM', '12:00 PM', '02:30 p.m.', '02:30 P M', ' 14:30 '])('accepts %s', (value) => {
    expect(check(value)).toBeNull();
  });

  it('rejects 24:00 in the display shape', () => {
    expect(check('24:00')).toEqual({ timeRange: { cycle: 24 } });
  });

  it.each(['14:30 Abend', '14:30 Pause', '14:30 Amsel'])(
    'reads the word in %s as suffix text, not as AM/PM',
    (value) => {
      expect(check(value)).toBeNull();
    },
  );

  it.each([
    '',
    null,
    undefined,
    1430,
    '143',
    '1430P',
    '14:30 a.',
    '14:3_',
    '14:3_ __',
    '02:30 P_',
    '1231202514',
    '12/31/2025 14:3_',
    '1:4:3:0',
    'Rm 1 430',
  ])('gives no verdict on %s', (value) => {
    expect(check(value)).toBeNull();
  });
});

describe('time', () => {
  function setup(options?: TimeValidatorOptions) {
    const injector = TestBed.inject(Injector);
    const model = signal({ at: '' });
    const f = runInInjectionContext(injector, () =>
      form(
        model,
        schema<{ at: string }>((root) => {
          time(root.at, options);
        }),
      ),
    );
    return { model, f };
  }

  it('reports the timeRange kind with the judged cycle', () => {
    const { model, f } = setup();

    model.set({ at: '2500' });
    TestBed.flushEffects();

    expect(f.at().errors()).toEqual([expect.objectContaining({ kind: 'timeRange', cycle: 24 })]);
  });

  it('clears the error once the value is a valid time', () => {
    const { model, f } = setup({ cycle: 12 });

    model.set({ at: '1430' });
    TestBed.flushEffects();
    expect(f.at().errors()).toEqual([expect.objectContaining({ kind: 'timeRange', cycle: 12 })]);

    model.set({ at: '0230' });
    TestBed.flushEffects();
    expect(f.at().errors()).toEqual([]);
  });

  it('reports nothing for an empty field', () => {
    const { f } = setup();
    TestBed.flushEffects();

    expect(f.at().errors()).toEqual([]);
  });
});
