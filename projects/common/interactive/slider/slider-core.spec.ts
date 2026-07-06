import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createSliderCore } from './slider-core';

function makeCore(init: {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  boundedMin?: number;
  boundedMax?: number;
  valueText?: (v: number) => string;
}) {
  const value = signal(init.value ?? 0);
  const min = signal(init.min ?? 0);
  const max = signal(init.max ?? 100);
  const step = signal(init.step ?? 1);
  const boundedMin = init.boundedMin !== undefined ? signal(init.boundedMin) : undefined;
  const boundedMax = init.boundedMax !== undefined ? signal(init.boundedMax) : undefined;
  const core = createSliderCore({
    value,
    min,
    max,
    step,
    boundedMin,
    boundedMax,
    valueText: init.valueText,
  });
  return { core, value, min, max, step, boundedMin, boundedMax };
}

describe('createSliderCore', () => {
  it('derives fraction and percent from value within min/max', () => {
    const { core } = makeCore({ value: 25, min: 0, max: 100 });
    expect(core.fraction()).toBe(0.25);
    expect(core.percent()).toBe(25);
  });

  it('clamps aria-valuenow to bounds and reports atMin/atMax', () => {
    const { core } = makeCore({ value: 999, min: 0, max: 10 });
    expect(core.clampedValue()).toBe(10);
    expect(core.atMax()).toBe(true);
    expect(core.atMin()).toBe(false);
  });

  it('snaps writes to the step grid without float drift', () => {
    const { core, value } = makeCore({ value: 0, min: 0, max: 1, step: 0.1 });
    core.setValue(0.30000000000000004);
    expect(value()).toBe(0.3);
    core.stepBy(3);
    expect(value()).toBe(0.6);
  });

  it('stepBy moves by step count and clamps at the ceiling', () => {
    const { core, value } = makeCore({ value: 8, min: 0, max: 10, step: 1 });
    core.stepBy(5);
    expect(value()).toBe(10);
    core.stepToMin();
    expect(value()).toBe(0);
  });

  it('setFromFraction maps a 0..1 track position to a snapped value', () => {
    const { core, value } = makeCore({ value: 0, min: 0, max: 200, step: 10 });
    core.setFromFraction(0.5);
    expect(value()).toBe(100);
    core.setFromFraction(2);
    expect(value()).toBe(200);
  });

  it('honours boundedMin/boundedMax (sibling-thumb clamp) over min/max', () => {
    const { core, value } = makeCore({
      value: 50,
      min: 0,
      max: 100,
      step: 1,
      boundedMin: 20,
      boundedMax: 60,
    });
    core.setValue(10);
    expect(value()).toBe(20);
    core.setValue(90);
    expect(value()).toBe(60);
    expect(core.atMax()).toBe(true);
  });

  it('reflects a moving boundedMax reactively', () => {
    const { core, boundedMax } = makeCore({
      value: 80,
      min: 0,
      max: 100,
      step: 1,
      boundedMax: 100,
    });
    expect(core.clampedValue()).toBe(80);
    boundedMax!.set(40);
    expect(core.clampedValue()).toBe(40);
    expect(core.atMax()).toBe(true);
  });

  it('formats aria-valuetext via the formatter, falling back to the number', () => {
    const { core } = makeCore({ value: 3, min: 0, max: 5 });
    expect(core.ariaValueText()).toBe('3');
    const formatted = makeCore({ value: 3, min: 0, max: 5, valueText: (v) => `$${v}` });
    expect(formatted.core.ariaValueText()).toBe('$3');
  });

  it('treats step <= 0 as a continuous slider (no snapping)', () => {
    const { core, value } = makeCore({ value: 0, min: 0, max: 1, step: 0 });
    core.setValue(0.1234);
    expect(value()).toBeCloseTo(0.1234, 6);
  });
});
