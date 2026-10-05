import { Component, signal, viewChild, viewChildren } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { __resetFloatingMiddlewareWarnings, CngxPopover } from './popover.directive';
import { provideFloatingFallback } from './floating-fallback';
import { CngxPopoverAnchor } from './popover-anchor.directive';
import { CngxPopoverTrigger } from './popover-trigger.directive';

function stubPopoverElement(el: HTMLElement): void {
  const rec = el as unknown as Record<string, unknown>;
  rec['showPopover'] = vi.fn();
  rec['hidePopover'] = vi.fn();
  rec['togglePopover'] = vi.fn();

  vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({
    transitionDuration: '0s',
  } as unknown as CSSStyleDeclaration);
}

@Component({
  template: `
    @if (showAnchor()) {
      <div id="row" [cngxPopoverAnchor]="pop">
        <input id="trigger" [cngxPopoverTrigger]="pop" aria-label="City" />
      </div>
    } @else {
      <input id="trigger" [cngxPopoverTrigger]="pop" aria-label="City" />
    }
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger, CngxPopoverAnchor],
})
class AnchorHost {
  readonly showAnchor = signal(true);
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `
    <button id="trigger" [cngxPopoverTrigger]="pop">Open</button>
    @if (showA()) {
      <div id="a" [cngxPopoverAnchor]="pop"></div>
    }
    @if (showB()) {
      <div id="b" [cngxPopoverAnchor]="pop"></div>
    }
    <div cngxPopover #pop="cngxPopover">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger, CngxPopoverAnchor],
})
class TwoAnchorHost {
  readonly showA = signal(true);
  readonly showB = signal(false);
  readonly popover = viewChild.required(CngxPopover);
}

@Component({
  template: `
    <div id="row" [cngxPopoverAnchor]="useSecond() ? second : first"></div>
    <div cngxPopover #first="cngxPopover">First</div>
    <div cngxPopover #second="cngxPopover">Second</div>
  `,
  imports: [CngxPopover, CngxPopoverAnchor],
})
class RefSwapHost {
  readonly useSecond = signal(false);
  readonly popovers = viewChildren(CngxPopover);
}

@Component({
  template: `
    <div id="box" [cngxPopoverAnchor]="pop">Field</div>
    <button id="trigger" [cngxPopoverTrigger]="pop">Open</button>
    <div cngxPopover #pop="cngxPopover" [closeOnOutsideClick]="true">Content</div>
  `,
  imports: [CngxPopover, CngxPopoverTrigger, CngxPopoverAnchor],
})
class DetachedTriggerHost {
  readonly popover = viewChild.required(CngxPopover);
}

function setup<T>(hostType: new () => T) {
  const fixture = TestBed.createComponent(hostType);
  fixture.detectChanges();
  TestBed.flushEffects();
  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  for (const el of fixture.nativeElement.querySelectorAll('[cngxpopover]')) {
    stubPopoverElement(el as HTMLElement);
  }
  return { fixture, host: fixture.componentInstance, query };
}

describe('CngxPopoverAnchor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers its host as the explicit and resolved anchor', () => {
    const { host, query } = setup(AnchorHost);
    const row = query('#row');
    expect(host.popover().explicitAnchorElement()).toBe(row);
    expect(host.popover().anchorElement()).toBe(row);
  });

  it('releases the slot on destroy so the trigger becomes the anchor again', () => {
    const { fixture, host, query } = setup(AnchorHost);
    host.showAnchor.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.popover().explicitAnchorElement()).toBeNull();
    expect(host.popover().anchorElement()).toBe(query('#trigger'));
  });

  it('does not release a slot a later anchor claimed', () => {
    const { fixture, host, query } = setup(TwoAnchorHost);
    host.showB.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    const b = query('#b');
    expect(host.popover().explicitAnchorElement()).toBe(b);

    host.showA.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.popover().explicitAnchorElement()).toBe(b);
    expect(host.popover().anchorElement()).toBe(b);
  });

  it('unregisters from the previous popover when the bound popover changes', () => {
    const { fixture, host, query } = setup(RefSwapHost);
    const [first, second] = host.popovers();
    const row = query('#row');
    expect(first.explicitAnchorElement()).toBe(row);
    expect(second.explicitAnchorElement()).toBeNull();

    host.useSecond.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(first.explicitAnchorElement()).toBeNull();
    expect(second.explicitAnchorElement()).toBe(row);
  });

  it('ignores releaseAnchorElement from an element that does not hold the implicit slot', () => {
    const { host, query } = setup(TwoAnchorHost);
    const pop = host.popover();
    pop.releaseAnchorElement(document.createElement('button'));
    pop.unregisterAnchorElement(document.createElement('div'));
    expect(pop.explicitAnchorElement()).toBe(query('#a'));

    pop.unregisterAnchorElement(query('#a') as HTMLElement);
    expect(pop.anchorElement()).toBe(query('#trigger'));
  });

  it('passes the anchor host, not the trigger, to the floating-ui fallback', () => {
    __resetFloatingMiddlewareWarnings(document);
    const computePosition = vi
      .fn()
      .mockResolvedValue({ x: 0, y: 0, placement: 'bottom', middlewareData: {} });
    TestBed.configureTestingModule({
      providers: [provideFloatingFallback(computePosition, [{ name: 'flip' }])],
    });
    const { host, query } = setup(AnchorHost);
    host.popover().show();

    expect(computePosition).toHaveBeenCalled();
    expect(computePosition.mock.calls[0][0]).toBe(query('#row'));
    expect(computePosition.mock.calls[0][0]).not.toBe(query('#trigger'));
  });

  describe('outside click with a detached trigger', () => {
    it('stays open on pointerdown on the trigger outside the anchor', () => {
      const { fixture, host, query } = setup(DetachedTriggerHost);
      host.popover().show();
      query('#trigger')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(host.popover().state()).not.toBe('closed');
    });

    it('stays open on pointerdown on the anchor', () => {
      const { fixture, host, query } = setup(DetachedTriggerHost);
      host.popover().show();
      query('#box')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(host.popover().state()).not.toBe('closed');
    });

    it('hides on pointerdown outside anchor, trigger and panel', () => {
      const { fixture, host } = setup(DetachedTriggerHost);
      host.popover().show();
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(host.popover().state()).toBe('closed');
    });
  });
});
