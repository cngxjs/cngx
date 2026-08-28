import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CNGX_TOUCH_TARGET, injectTouchTargets, provideTouchTargets } from './touch-target';

// An empty host forces the root environment injector to initialise,
// which runs the provideTouchTargets reflector's environment initializer.
@Component({ template: '' })
class Host {}

const touchAttr = () => document.documentElement.getAttribute('data-touch');

describe('provideTouchTargets / injectTouchTargets', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-touch');
    vi.restoreAllMocks();
  });

  it('reflects the initial value onto <html data-touch> after render', () => {
    TestBed.configureTestingModule({ providers: [provideTouchTargets('on')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(touchAttr()).toBe('on');
  });

  it("leaves <html> attribute-free for 'auto' so the media query stays in control", () => {
    TestBed.configureTestingModule({ providers: [provideTouchTargets('auto')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(document.documentElement.hasAttribute('data-touch')).toBe(false);
  });

  it('injectTouchTargets().set(...) re-reflects the attribute reactively', () => {
    TestBed.configureTestingModule({ providers: [provideTouchTargets('on')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(touchAttr()).toBe('on');

    const touch = TestBed.runInInjectionContext(() => injectTouchTargets());
    touch.set('off');
    fixture.detectChanges();
    expect(touchAttr()).toBe('off');
  });

  it("set('auto') clears a previously pinned attribute", () => {
    TestBed.configureTestingModule({ providers: [provideTouchTargets('on')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(touchAttr()).toBe('on');

    const touch = TestBed.inject(CNGX_TOUCH_TARGET);
    touch.set('auto');
    fixture.detectChanges();
    expect(document.documentElement.hasAttribute('data-touch')).toBe(false);
  });

  it('is idempotent - setting the same value twice does not re-write (no loop)', () => {
    const spy = vi.spyOn(document.documentElement, 'setAttribute');
    TestBed.configureTestingModule({ providers: [provideTouchTargets('on')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const touch = TestBed.inject(CNGX_TOUCH_TARGET);
    const touchWrites = () => spy.mock.calls.filter(([attr]) => attr === 'data-touch').length;

    const afterInit = touchWrites();
    expect(afterInit).toBeGreaterThanOrEqual(1);

    touch.set('on'); // same value - signal equality short-circuits the effect
    fixture.detectChanges();
    expect(touchWrites()).toBe(afterInit);
  });
});
