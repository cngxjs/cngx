import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CNGX_MOTION, injectMotion, provideMotion } from './motion';

// An empty host forces the root environment injector to initialise,
// which runs the provideMotion reflector's environment initializer.
@Component({ template: '' })
class Host {}

const motionAttr = () => document.documentElement.getAttribute('data-motion');
const hasMotionAttr = () => document.documentElement.hasAttribute('data-motion');

describe('provideMotion / injectMotion', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-motion');
    vi.restoreAllMocks();
  });

  it('reflects an explicit initial value onto <html data-motion> after render', () => {
    TestBed.configureTestingModule({ providers: [provideMotion('reduced')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(motionAttr()).toBe('reduced');
  });

  it("removes the attribute for 'auto' so the OS media query drives", () => {
    TestBed.configureTestingModule({ providers: [provideMotion('auto')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(hasMotionAttr()).toBe(false);
  });

  it("sets the attribute for 'full'", () => {
    TestBed.configureTestingModule({ providers: [provideMotion('full')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(motionAttr()).toBe('full');
  });

  it('injectMotion().set(...) re-reflects the attribute reactively', () => {
    TestBed.configureTestingModule({ providers: [provideMotion('reduced')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(motionAttr()).toBe('reduced');

    const motion = TestBed.runInInjectionContext(() => injectMotion());

    motion.set('full');
    fixture.detectChanges();
    expect(motionAttr()).toBe('full');

    // Back to auto - the attribute is removed, handing control to the OS.
    motion.set('auto');
    fixture.detectChanges();
    expect(hasMotionAttr()).toBe(false);
  });

  it('is idempotent - setting the same value twice does not re-write (no loop)', () => {
    const setSpy = vi.spyOn(document.documentElement, 'setAttribute');
    TestBed.configureTestingModule({ providers: [provideMotion('reduced')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const motion = TestBed.inject(CNGX_MOTION);
    const motionWrites = () =>
      setSpy.mock.calls.filter(([attr]) => attr === 'data-motion').length;

    const afterInit = motionWrites();
    expect(afterInit).toBeGreaterThanOrEqual(1);

    motion.set('reduced'); // same value - signal equality short-circuits the effect
    fixture.detectChanges();
    expect(motionWrites()).toBe(afterInit);
  });
});
