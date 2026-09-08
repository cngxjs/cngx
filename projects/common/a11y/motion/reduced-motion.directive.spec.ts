import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMatchMediaMock, type MatchMediaMock } from '@cngx/testing';
import { CngxReducedMotion } from './reduced-motion.directive';

let mmMock: MatchMediaMock;

@Component({
  template: '<div cngxReducedMotion></div>',
  imports: [CngxReducedMotion],
})
class TestHost {}

describe('CngxReducedMotion', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // restoreAllMocks does not undo stubGlobal; unstub matchMedia so it never
    // leaks into a later spec in this worker.
    vi.unstubAllGlobals();
  });

  function setup(matches = false) {
    mmMock = createMatchMediaMock(matches);
    mmMock.install(window);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxReducedMotion))
      .injector.get(CngxReducedMotion);
    return { fixture, dir };
  }

  it('reflects initial matchMedia value (false)', () => {
    const { dir } = setup(false);
    expect(dir.prefersReducedMotion()).toBe(false);
  });

  it('reflects initial matchMedia value (true)', () => {
    const { dir } = setup(true);
    expect(dir.prefersReducedMotion()).toBe(true);
  });

  it('updates when the media query changes', () => {
    const { dir } = setup(false);
    mmMock.trigger(true);
    expect(dir.prefersReducedMotion()).toBe(true);
  });

  it('adds cngx-reduced-motion class when true', () => {
    const { fixture } = setup(false);
    mmMock.trigger(true);
    fixture.detectChanges();
    const el: HTMLElement = fixture.debugElement.query(By.css('div')).nativeElement;
    expect(el.classList.contains('cngx-reduced-motion')).toBe(true);
  });

  it('removes event listener on destroy', () => {
    const { fixture, dir } = setup(false);
    fixture.destroy();
    mmMock.trigger(true);
    expect(dir.prefersReducedMotion()).toBe(false);
  });
});
