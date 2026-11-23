import { Component, Directive, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideDirection } from '@cngx/core';
import { afterEach, describe, expect, it } from 'vitest';

import { ANCHOR_AREA_PROPERTY, POSITION_AREA, resolveAnchorMargin } from './anchor-positioning';
import { CngxPopover } from './popover.directive';
import {
  CNGX_POPOVER_PRESENTATION,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationSeam,
} from './popover-presentation';
import { CngxPopoverTrigger } from './popover-trigger.directive';

// Runs in a real Chromium (`test-geometry`), where `SUPPORTS_ANCHOR` is true.
// Every case reads the styles and rects in the same turn as show(), with no
// change detection in between: the first painted frame must already sit at
// the placement set right before show().
//
// Side checks compare edges, never centres. The stale frame is
// `bottom span-all`, centred on the anchor, so a centre comparison can pass
// by a sub-pixel.

const HARNESS_STYLES = ['../../core/theming/reset.css', '../theming/components/cngx-popover.css'];

const FALLBACKS = ['flip-inline', 'flip-block'] as const;

// Chromium serializes `bottom span-all` back as `bottom`; compare against the
// same round trip instead of the raw table entry.
function serializedArea(value: string): string {
  const probe = document.createElement('div');
  probe.style.setProperty(ANCHOR_AREA_PROPERTY, value);
  return probe.style.getPropertyValue(ANCHOR_AREA_PROPERTY);
}

@Directive({
  selector: '[seamStub]',
  standalone: true,
  providers: [{ provide: CNGX_POPOVER_PRESENTATION, useExisting: SeamStub }],
})
class SeamStub implements CngxPopoverPresentationSeam {
  readonly presentation = signal<CngxPopoverPresentation>('anchored');
  onShown(): void {
    /* no-op */
  }
  onHide(): void {
    /* no-op */
  }
}

@Component({
  selector: 'cngx-popover-show-placement-host',
  standalone: true,
  imports: [CngxPopover, CngxPopoverTrigger, SeamStub],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      type="button"
      class="anchor"
      [cngxPopoverTrigger]="pop"
      style="position: fixed; top: 200px; left: 400px; width: 40px; height: 40px"
    >
      A
    </button>
    <div
      cngxPopover
      seamStub
      #pop="cngxPopover"
      placement="bottom"
      style="width: 160px; height: 60px"
    >
      Content
    </div>
  `,
})
class ShowPlacementHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly seam = viewChild.required(SeamStub);
}

describe('CngxPopover show() placement styles (geometry)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
    document.body.replaceChildren();
  });

  function setup() {
    const fixture = TestBed.createComponent(ShowPlacementHost);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;
    const popover = host.popover();
    const panel = popover.elementRef.nativeElement;
    const anchor = (fixture.nativeElement as HTMLElement).querySelector('.anchor') as HTMLElement;
    return { fixture, host, popover, panel, anchor };
  }

  function anchorWrites(panel: HTMLElement) {
    return {
      margin: panel.style.getPropertyValue('--cngx-popover-anchor-margin'),
      tryFallbacks: panel.style.getPropertyValue('position-try-fallbacks'),
      area: panel.style.getPropertyValue(ANCHOR_AREA_PROPERTY),
    };
  }

  it('writes an override set in the same turn before the panel shows', () => {
    const { popover, panel, anchor } = setup();

    popover.setPlacementOverride('right-start');
    popover.setPositionTryFallbacksOverride(FALLBACKS);
    popover.show();

    const writes = anchorWrites(panel);
    expect(writes.area).toBe(serializedArea(POSITION_AREA['right-start']));
    expect(writes.tryFallbacks).toBe(FALLBACKS.join(', '));
    expect(writes.margin).toBe(resolveAnchorMargin('right-start', 8));
    expect(panel.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      anchor.getBoundingClientRect().right - 1,
    );
    popover.hide();
  });

  it('mirrors the same-turn override under rtl', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    TestBed.configureTestingModule({ providers: [provideDirection('rtl')] });
    const { popover, panel, anchor } = setup();

    popover.setPlacementOverride('right-start');
    popover.setPositionTryFallbacksOverride(FALLBACKS);
    popover.show();

    expect(anchorWrites(panel).area).toBe(serializedArea(POSITION_AREA['left-start']));
    expect(panel.getBoundingClientRect().right).toBeLessThanOrEqual(
      anchor.getBoundingClientRect().left + 1,
    );
    popover.hide();
  });

  it('writes the cleared override before the next show', () => {
    const { fixture, popover, panel, anchor } = setup();
    popover.setPlacementOverride('right-start');
    popover.setPositionTryFallbacksOverride(FALLBACKS);
    popover.show();
    fixture.detectChanges();
    TestBed.flushEffects();
    popover.hide();
    expect(popover.isVisible()).toBe(false);
    expect(anchorWrites(panel).area).toBe(serializedArea(POSITION_AREA['right-start']));

    popover.setPlacementOverride(null);
    popover.setPositionTryFallbacksOverride(null);
    popover.show();

    const writes = anchorWrites(panel);
    expect(writes.area).toBe(serializedArea(POSITION_AREA['bottom']));
    expect(writes.tryFallbacks).toBe('');
    expect(panel.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      anchor.getBoundingClientRect().bottom - 1,
    );
    popover.hide();
  });

  it('removes every placement style while not anchored', () => {
    const { fixture, host, panel } = setup();
    host.popover().setPositionTryFallbacksOverride(FALLBACKS);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(anchorWrites(panel).area).not.toBe('');

    host.seam().presentation.set('sheet');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(anchorWrites(panel)).toEqual({ margin: '', tryFallbacks: '', area: '' });
  });
});
