import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxMediaQuery } from './media-query.directive';

@Component({
  template: `<div cngxMediaQuery="(min-width: 1024px)" #mq="cngxMediaQuery">
    {{ mq.matches() }}
  </div>`,
  imports: [CngxMediaQuery],
})
class TestHost {}

describe('CngxMediaQuery', () => {
  let changeHandler: ((e: { matches: boolean }) => void) | undefined;
  let removeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    changeHandler = undefined;
    removeSpy = vi.fn();

    // window.matchMedia may not exist in the test env; define it
    (globalThis as Record<string, unknown>)['matchMedia'] = vi
      .fn()
      .mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn((_event: string, handler: (e: { matches: boolean }) => void) => {
          changeHandler = handler;
        }),
        removeEventListener: removeSpy,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>)['matchMedia'];
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const dir = fixture.debugElement
      .query(By.directive(CngxMediaQuery))
      .injector.get(CngxMediaQuery);
    return { fixture, dir };
  }

  it('reads initial matches value', () => {
    const { dir } = setup();
    expect(dir.matches()).toBe(false);
  });

  it('registers a change listener', () => {
    setup();
    expect(changeHandler).toBeDefined();
  });

  it('updates matches when media query changes', () => {
    const { dir } = setup();
    changeHandler!({ matches: true });
    expect(dir.matches()).toBe(true);
  });

  it('cleans up listener on destroy', () => {
    const { fixture } = setup();
    fixture.destroy();
    expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
