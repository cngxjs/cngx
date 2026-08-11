import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CNGX_CONTRAST, injectContrast, provideContrast } from './contrast';

// An empty host forces the root environment injector to initialise,
// which runs the provideContrast reflector's environment initializer.
@Component({ template: '' })
class Host {}

const contrastAttr = () => document.documentElement.getAttribute('data-contrast');
const hasContrastAttr = () => document.documentElement.hasAttribute('data-contrast');

describe('provideContrast / injectContrast', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-contrast');
    vi.restoreAllMocks();
  });

  it('reflects an explicit initial value onto <html data-contrast> after render', () => {
    TestBed.configureTestingModule({ providers: [provideContrast('more')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(contrastAttr()).toBe('more');
  });

  it("removes the attribute for 'auto' so the OS media query drives", () => {
    TestBed.configureTestingModule({ providers: [provideContrast('auto')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(hasContrastAttr()).toBe(false);
  });

  it("sets the attribute for 'normal'", () => {
    TestBed.configureTestingModule({ providers: [provideContrast('normal')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(contrastAttr()).toBe('normal');
  });

  it('injectContrast().set(...) re-reflects the attribute reactively', () => {
    TestBed.configureTestingModule({ providers: [provideContrast('more')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(contrastAttr()).toBe('more');

    const contrast = TestBed.runInInjectionContext(() => injectContrast());

    contrast.set('normal');
    fixture.detectChanges();
    expect(contrastAttr()).toBe('normal');

    // Back to auto - the attribute is removed, handing control to the OS.
    contrast.set('auto');
    fixture.detectChanges();
    expect(hasContrastAttr()).toBe(false);
  });

  it('is idempotent - setting the same value twice does not re-write (no loop)', () => {
    const setSpy = vi.spyOn(document.documentElement, 'setAttribute');
    TestBed.configureTestingModule({ providers: [provideContrast('more')] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const contrast = TestBed.inject(CNGX_CONTRAST);
    const contrastWrites = () =>
      setSpy.mock.calls.filter(([attr]) => attr === 'data-contrast').length;

    const afterInit = contrastWrites();
    expect(afterInit).toBeGreaterThanOrEqual(1);

    contrast.set('more'); // same value - signal equality short-circuits the effect
    fixture.detectChanges();
    expect(contrastWrites()).toBe(afterInit);
  });
});
