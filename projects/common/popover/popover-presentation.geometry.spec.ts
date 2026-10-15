import { Component, Directive, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { ANCHOR_AREA_PROPERTY } from './anchor-positioning';
import { CngxPopover } from './popover.directive';
import {
  CNGX_POPOVER_PRESENTATION,
  type CngxPopoverPresentation,
  type CngxPopoverPresentationSeam,
} from './popover-presentation';
import { CngxPopoverTrigger } from './popover-trigger.directive';

// Runs in a real Chromium (`test-geometry`), where `SUPPORTS_ANCHOR` is true:
// the anchor, margin and position-area writes only exist there.

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
  selector: 'cngx-popover-presentation-host',
  standalone: true,
  imports: [CngxPopover, CngxPopoverTrigger, SeamStub],
  template: `
    <button type="button" [cngxPopoverTrigger]="pop">Open</button>
    <div
      cngxPopover
      seamStub
      #pop="cngxPopover"
      placement="bottom-start"
      [positionTryFallbacks]="['flip-block']"
    >
      Content
    </div>
  `,
})
class PresentationHost {
  readonly popover = viewChild.required(CngxPopover);
  readonly seam = viewChild.required(SeamStub);
}

describe('CngxPopover presentation gate (geometry)', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function setup() {
    const fixture = TestBed.createComponent(PresentationHost);
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;
    const panel = host.popover().elementRef.nativeElement;
    const flip = (value: CngxPopoverPresentation) => {
      host.seam().presentation.set(value);
      fixture.detectChanges();
      TestBed.flushEffects();
    };
    return { fixture, host, panel, flip };
  }

  function anchorWrites(panel: HTMLElement) {
    return {
      anchor: panel.style.getPropertyValue('position-anchor'),
      margin: panel.style.getPropertyValue('margin'),
      tryFallbacks: panel.style.getPropertyValue('position-try-fallbacks'),
      area: panel.style.getPropertyValue(ANCHOR_AREA_PROPERTY),
    };
  }

  it('writes the anchor, margin, fallbacks and position-area while anchored', () => {
    const { panel } = setup();
    const writes = anchorWrites(panel);
    expect(writes.anchor).toMatch(/^--cngx-pop-/);
    expect(writes.margin).not.toBe('');
    expect(writes.tryFallbacks).toBe('flip-block');
    expect(writes.area).not.toBe('');
  });

  it('drops every anchor write while not anchored and restores them after', () => {
    const { panel, flip } = setup();
    const anchoredWrites = anchorWrites(panel);

    flip('sheet');
    expect(anchorWrites(panel)).toEqual({ anchor: '', margin: '', tryFallbacks: '', area: '' });

    flip('fullscreen');
    expect(anchorWrites(panel)).toEqual({ anchor: '', margin: '', tryFallbacks: '', area: '' });

    flip('anchored');
    expect(anchorWrites(panel)).toEqual(anchoredWrites);
  });

  it('removes a previously written position-area on a flip while open', () => {
    const { host, panel, flip } = setup();
    host.popover().show();
    expect(panel.style.getPropertyValue(ANCHOR_AREA_PROPERTY)).not.toBe('');

    flip('sheet');
    expect(panel.style.getPropertyValue(ANCHOR_AREA_PROPERTY)).toBe('');
    expect(panel.style.getPropertyValue('position-anchor')).toBe('');

    flip('anchored');
    expect(panel.style.getPropertyValue(ANCHOR_AREA_PROPERTY)).not.toBe('');
    host.popover().hide();
  });
});
