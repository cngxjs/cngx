import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxReducedMotion } from './reduced-motion.directive';

type MQListener = (e: MediaQueryListEvent) => void;

let mockMq: {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  _listeners: MQListener[];
};

@Component({
  template: '<div cngxReducedMotion></div>',
  imports: [CngxReducedMotion],
})
class TestHost {}

describe('CngxReducedMotion', () => {
  beforeEach(() => {
    mockMq = {
      matches: false,
      addEventListener: vi.fn((event: string, cb: MQListener) => mockMq._listeners.push(cb)),
      removeEventListener: vi.fn(),
      _listeners: [],
    };

    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mockMq),
    );
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.restoreAllMocks());

  function setup(matches = false) {
    mockMq.matches = matches;
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
    mockMq._listeners.forEach((cb) => cb({ matches: true } as MediaQueryListEvent));
    expect(dir.prefersReducedMotion()).toBe(true);
  });

  it('adds cngx-reduced-motion class when true', () => {
    const { fixture } = setup(false);
    mockMq._listeners.forEach((cb) => cb({ matches: true } as MediaQueryListEvent));
    fixture.detectChanges();
    const el: HTMLElement = fixture.debugElement.query(By.css('div')).nativeElement;
    expect(el.classList.contains('cngx-reduced-motion')).toBe(true);
  });

  it('removes event listener on destroy', () => {
    const { fixture } = setup();
    fixture.destroy();
    expect(mockMq.removeEventListener).toHaveBeenCalled();
  });
});
