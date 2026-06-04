import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxFocusTrap } from './focus-trap.directive';
import { FocusTrapFactory } from '@angular/cdk/a11y';

let mockTrap: {
  enabled: boolean;
  focusFirstTabbableElementWhenReady: ReturnType<typeof vi.fn>;
  focusLastTabbableElementWhenReady: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

@Component({
  template: `
    <div cngxFocusTrap [enabled]="enabled()" [autoFocus]="autoFocus()">
      <button class="first">First</button>
      <button class="last">Last</button>
    </div>
  `,
  imports: [CngxFocusTrap],
})
class TestHost {
  enabled = signal(false);
  autoFocus = signal(true);
}

describe('CngxFocusTrap', () => {
  beforeEach(() => {
    mockTrap = {
      enabled: false,
      focusFirstTabbableElementWhenReady: vi.fn(),
      focusLastTabbableElementWhenReady: vi.fn(),
      destroy: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        {
          provide: FocusTrapFactory,
          useValue: { create: vi.fn(() => mockTrap) },
        },
      ],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const dir = fixture.debugElement.query(By.directive(CngxFocusTrap)).injector.get(CngxFocusTrap);
    return { fixture, dir, host: fixture.componentInstance };
  }

  it('trap is disabled initially', () => {
    setup();
    expect(mockTrap.enabled).toBe(false);
  });

  it('enables trap when enabled input becomes true', () => {
    const { fixture, host } = setup();
    host.enabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.enabled).toBe(true);
  });

  it('calls focusFirstTabbableElementWhenReady when enabled and autoFocus=true', () => {
    const { fixture, host } = setup();
    host.enabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.focusFirstTabbableElementWhenReady).toHaveBeenCalled();
  });

  it('does not call focusFirst when autoFocus=false', () => {
    const { fixture, host } = setup();
    host.autoFocus.set(false);
    host.enabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.focusFirstTabbableElementWhenReady).not.toHaveBeenCalled();
  });

  it('exposes focusFirst() and focusLast() methods', () => {
    const { dir } = setup();
    dir.focusFirst();
    expect(mockTrap.focusFirstTabbableElementWhenReady).toHaveBeenCalled();
    dir.focusLast();
    expect(mockTrap.focusLastTabbableElementWhenReady).toHaveBeenCalled();
  });

  it('destroys trap on component destroy', () => {
    const { fixture } = setup();
    fixture.destroy();
    expect(mockTrap.destroy).toHaveBeenCalled();
  });
});
