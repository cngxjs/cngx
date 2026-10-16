import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CNGX_FOCUS_TRAP_DRIVER,
  CngxFocusTrap,
  type CngxFocusTrapDriver,
} from './focus-trap.directive';
import { FocusTrapFactory, InteractivityChecker } from '@angular/cdk/a11y';

let mockTrap: {
  enabled: boolean;
  hasAttached: ReturnType<typeof vi.fn>;
  attachAnchors: ReturnType<typeof vi.fn>;
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

// A composer that carries the trap as a host directive and drives it.
@Directive({
  selector: '[trapComposer]',
  standalone: true,
  hostDirectives: [{ directive: CngxFocusTrap, inputs: ['enabled'], outputs: [] }],
  providers: [{ provide: CNGX_FOCUS_TRAP_DRIVER, useExisting: TrapComposer }],
})
class TrapComposer implements CngxFocusTrapDriver {
  readonly open = signal(false);
  readonly focusTrapEnabled = this.open.asReadonly();
  readonly focusTrapAutoFocus = false;
}

@Component({
  template: `
    <div trapComposer [enabled]="inputEnabled()">
      <button class="first">First</button>
    </div>
  `,
  imports: [TrapComposer],
})
class DriverHost {
  readonly inputEnabled = signal(true);
}

describe('CngxFocusTrap', () => {
  let createSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createSpy = vi.fn(() => mockTrap);
    mockTrap = {
      enabled: false,
      hasAttached: vi.fn(() => mockTrap.attachAnchors.mock.calls.length > 0),
      attachAnchors: vi.fn(() => true),
      focusFirstTabbableElementWhenReady: vi.fn(),
      focusLastTabbableElementWhenReady: vi.fn(),
      destroy: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        {
          provide: FocusTrapFactory,
          useValue: { create: createSpy },
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

  it('does not create the trap before the first enable', () => {
    setup();
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('creates the trap with deferred anchors and attaches them on the first enable', () => {
    const { fixture, host } = setup();
    host.enabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(createSpy).toHaveBeenCalledWith(expect.any(HTMLElement), true);
    expect(mockTrap.attachAnchors).toHaveBeenCalledTimes(1);

    host.enabled.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    host.enabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(mockTrap.attachAnchors).toHaveBeenCalledTimes(1);
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
    const { fixture, host } = setup();
    host.enabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.destroy();
    expect(mockTrap.destroy).toHaveBeenCalled();
  });

  it('is safe to destroy before the first enable', () => {
    const { fixture } = setup();
    expect(() => fixture.destroy()).not.toThrow();
    expect(mockTrap.destroy).not.toHaveBeenCalled();
  });

  it('lets a composer driver win over the input and suppress auto focus', () => {
    const fixture = TestBed.createComponent(DriverHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const composer = fixture.debugElement
      .query(By.directive(TrapComposer))
      .injector.get(TrapComposer);
    const trap = fixture.debugElement
      .query(By.directive(CngxFocusTrap))
      .injector.get(CngxFocusTrap);
    expect(createSpy).not.toHaveBeenCalled();
    expect(trap.isActive()).toBe(false);

    composer.open.set(true);
    TestBed.flushEffects();
    expect(mockTrap.enabled).toBe(true);
    expect(trap.isActive()).toBe(true);
    expect(mockTrap.focusFirstTabbableElementWhenReady).not.toHaveBeenCalled();

    composer.open.set(false);
    TestBed.flushEffects();
    expect(mockTrap.enabled).toBe(false);
  });

  it('does not refocus when autoFocus flips while the trap is active', () => {
    const { fixture, host } = setup();
    host.enabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.focusFirstTabbableElementWhenReady).toHaveBeenCalledTimes(1);

    // autoFocus is a parameter, not a trigger - flipping it must not yank
    // focus back to the first tabbable element.
    host.autoFocus.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    host.autoFocus.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.focusFirstTabbableElementWhenReady).toHaveBeenCalledTimes(1);
  });
});

@Component({
  template: `
    <div class="host" cngxFocusTrap [enabled]="enabled()">
      <button class="first">First</button>
      <button class="last">Last</button>
    </div>
  `,
  imports: [CngxFocusTrap],
})
class RealTrapHost {
  enabled = signal(false);
}

describe('CngxFocusTrap with the CDK factory', () => {
  function setup() {
    // jsdom reports every element as zero-sized, so the CDK checker would
    // treat the buttons as invisible and skip them.
    TestBed.configureTestingModule({
      imports: [RealTrapHost],
      providers: [
        {
          provide: InteractivityChecker,
          useValue: {
            isFocusable: (el: Element) => el.tagName === 'BUTTON',
            isTabbable: (el: Element) => el.tagName === 'BUTTON',
            isVisible: () => true,
            isDisabled: () => false,
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(RealTrapHost);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    const dir = fixture.debugElement.query(By.directive(CngxFocusTrap)).injector.get(CngxFocusTrap);
    const sentinels = () => el.querySelectorAll('.cdk-focus-trap-anchor').length;
    return { fixture, el, dir, sentinels };
  }

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('inserts no sentinel nodes before the first enable', () => {
    const { sentinels } = setup();
    expect(sentinels()).toBe(0);
  });

  it('inserts the sentinel nodes on the first enable', () => {
    const { fixture, sentinels } = setup();
    fixture.componentInstance.enabled.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(sentinels()).toBe(2);
  });

  it('focuses the first and last tabbable element before the first enable without sentinels', async () => {
    const { el, dir, sentinels } = setup();
    dir.focusFirst();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(el.querySelector('.first'));
    dir.focusLast();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(el.querySelector('.last'));
    expect(sentinels()).toBe(0);
  });

  it('focusFirstNow() focuses synchronously and reports whether it found a target', () => {
    const { el, dir, sentinels } = setup();
    expect(dir.focusFirstNow()).toBe(true);
    expect(document.activeElement).toBe(el.querySelector('.first'));
    expect(sentinels()).toBe(0);

    el.querySelectorAll('button').forEach((b) => b.remove());
    expect(dir.focusFirstNow()).toBe(false);
  });
});
