import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CNGX_TEXT_SCALE, injectTextScale, provideTextScale } from './text-scale';

// An empty host forces the root environment injector to initialise,
// which runs the provideTextScale reflector's environment initializer.
@Component({ template: '' })
class Host {}

const textSizeAttr = () => document.documentElement.getAttribute('data-text-size');

describe('provideTextScale / injectTextScale', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-text-size');
    vi.restoreAllMocks();
  });

  it('defaults to md (identity) when no provideTextScale is present', () => {
    const scale = TestBed.inject(CNGX_TEXT_SCALE);
    expect(scale()).toBe('md');
  });

  it('reflects the initial value onto <html data-text-size> after render', () => {
    TestBed.configureTestingModule({ providers: [provideTextScale('lg')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(textSizeAttr()).toBe('lg');
  });

  it('injectTextScale().set(...) re-reflects the attribute reactively', () => {
    TestBed.configureTestingModule({ providers: [provideTextScale('md')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(textSizeAttr()).toBe('md');

    const scale = TestBed.runInInjectionContext(() => injectTextScale());
    scale.set('sm');
    fixture.detectChanges();
    expect(textSizeAttr()).toBe('sm');
  });

  it('is idempotent - setting the same value twice does not re-write (no loop)', () => {
    const spy = vi.spyOn(document.documentElement, 'setAttribute');
    TestBed.configureTestingModule({ providers: [provideTextScale('lg')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const scale = TestBed.inject(CNGX_TEXT_SCALE);
    const scaleWrites = () => spy.mock.calls.filter(([attr]) => attr === 'data-text-size').length;

    const afterInit = scaleWrites();
    expect(afterInit).toBeGreaterThanOrEqual(1);

    scale.set('lg'); // same value - signal equality short-circuits the effect
    fixture.detectChanges();
    expect(scaleWrites()).toBe(afterInit);
  });
});
