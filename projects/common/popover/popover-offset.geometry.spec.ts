import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideDirection } from '@cngx/core';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxPopover } from './popover.directive';
import type { PopoverPlacement, PopoverPositionTryFallback } from './popover.types';
import { CngxPopoverTrigger } from './popover-trigger.directive';
import { CngxTooltip } from './tooltip.directive';

// Runs in a real Chromium (the `test-geometry` target), where
// `SUPPORTS_ANCHOR` is true and the offset is written as a CSS margin. The
// offset belongs on the placement's main axis only, so a cross-aligned panel
// sits flush with the anchor edge, the same geometry the floating-ui
// `makeOffsetMiddleware` produces.

const HARNESS_STYLES = [
  '../../core/theming/reset.css',
  '../theming/components/cngx-popover.css',
  '../theming/components/cngx-tooltip.css',
];

const ANCHOR_SIZE = 40;
const GAP = 8;

interface StageConfig {
  readonly placement: PopoverPlacement;
  readonly fallbacks?: readonly PopoverPositionTryFallback[];
  readonly top: number;
  readonly left: number;
  readonly panelWidth?: number;
  readonly panelHeight?: number;
}

@Component({
  selector: 'cngx-popover-offset-host',
  standalone: true,
  imports: [CngxPopover, CngxPopoverTrigger, CngxTooltip],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      type="button"
      class="anchor"
      [cngxPopoverTrigger]="pop"
      [style.position]="'fixed'"
      [style.top.px]="config().top"
      [style.left.px]="config().left"
      [style.width.px]="anchorSize"
      [style.height.px]="anchorSize"
    >
      A
    </button>
    <button
      type="button"
      class="tip-anchor"
      [cngxTooltip]="'Hint'"
      tooltipPlacement="bottom-start"
      [style.position]="'fixed'"
      [style.top.px]="config().top"
      [style.left.px]="config().left"
      [style.width.px]="anchorSize"
      [style.height.px]="anchorSize"
    >
      T
    </button>
    <div
      cngxPopover
      #pop="cngxPopover"
      class="panel"
      [placement]="config().placement"
      [positionTryFallbacks]="config().fallbacks ?? []"
      [style.width.px]="config().panelWidth ?? 160"
      [style.height.px]="config().panelHeight ?? 60"
    >
      Content
    </div>
  `,
})
class OffsetHost {
  readonly anchorSize = ANCHOR_SIZE;
  readonly config = signal<StageConfig>({ placement: 'bottom', top: 200, left: 400 });
  readonly popover = viewChild.required(CngxPopover);
  readonly tooltip = viewChild.required(CngxTooltip);
}

let fixture: ComponentFixture<OffsetHost> | null = null;

function mount(config: StageConfig): ComponentFixture<OffsetHost> {
  fixture = TestBed.createComponent(OffsetHost);
  fixture.componentInstance.config.set(config);
  document.body.appendChild(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return fixture;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function openAndMeasure(config: StageConfig): Promise<{ anchor: DOMRect; panel: DOMRect }> {
  const f = mount(config);
  f.componentInstance.popover().show();
  f.detectChanges();
  await nextFrame();
  const root = f.nativeElement as HTMLElement;
  return {
    anchor: (root.querySelector('.anchor') as HTMLElement).getBoundingClientRect(),
    panel: (root.querySelector('.panel') as HTMLElement).getBoundingClientRect(),
  };
}

afterEach(() => {
  const root = fixture?.nativeElement as HTMLElement | undefined;
  fixture?.destroy();
  root?.remove();
  fixture = null;
  document.documentElement.removeAttribute('dir');
});

describe('CngxPopover main-axis offset geometry', () => {
  it('bottom-start: flush start edge, gap below', async () => {
    const { anchor, panel } = await openAndMeasure({
      placement: 'bottom-start',
      top: 200,
      left: 400,
    });
    expect(Math.abs(panel.left - anchor.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.top - anchor.bottom - GAP)).toBeLessThanOrEqual(1);
  });

  it('bottom-end: flush end edge', async () => {
    const { anchor, panel } = await openAndMeasure({
      placement: 'bottom-end',
      top: 200,
      left: 400,
    });
    expect(Math.abs(panel.right - anchor.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.top - anchor.bottom - GAP)).toBeLessThanOrEqual(1);
  });

  it('right-start: flush top edge, gap to the right', async () => {
    const { anchor, panel } = await openAndMeasure({
      placement: 'right-start',
      top: 200,
      left: 400,
    });
    expect(Math.abs(panel.top - anchor.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.left - anchor.right - GAP)).toBeLessThanOrEqual(1);
  });

  it('bottom: centred on the anchor, gap below', async () => {
    const { anchor, panel } = await openAndMeasure({ placement: 'bottom', top: 200, left: 400 });
    const anchorCentre = anchor.left + anchor.width / 2;
    const panelCentre = panel.left + panel.width / 2;
    expect(Math.abs(panelCentre - anchorCentre)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.top - anchor.bottom - GAP)).toBeLessThanOrEqual(1);
  });

  it('flip-block keeps the gap when the panel moves above the anchor', async () => {
    const { anchor, panel } = await openAndMeasure({
      placement: 'bottom-start',
      fallbacks: ['flip-block'],
      top: window.innerHeight - ANCHOR_SIZE - 20,
      left: 400,
      panelHeight: 120,
    });
    expect(panel.bottom).toBeLessThanOrEqual(anchor.top);
    expect(Math.abs(anchor.top - panel.bottom - GAP)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.left - anchor.left)).toBeLessThanOrEqual(1);
  });

  it('flip-inline keeps the gap when a right-start panel moves left of the anchor', async () => {
    const { anchor, panel } = await openAndMeasure({
      placement: 'right-start',
      fallbacks: ['flip-inline'],
      top: 200,
      left: window.innerWidth - ANCHOR_SIZE - 60,
      panelWidth: 200,
    });
    expect(panel.right).toBeLessThanOrEqual(anchor.left);
    expect(Math.abs(anchor.left - panel.right - GAP)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.top - anchor.top)).toBeLessThanOrEqual(1);
  });

  it('flip-start transposes the gap onto the inline axis', async () => {
    // flip-start transposes width / height along with the area. Below the
    // anchor 160px of height needs 176px with the gap but gets 160px; beside
    // it the transposed 150px height fits the 200px from the anchor's top.
    const { anchor, panel } = await openAndMeasure({
      placement: 'bottom-start',
      fallbacks: ['flip-start'],
      top: window.innerHeight - 200,
      left: 600,
      panelWidth: 150,
      panelHeight: 160,
    });
    expect(Math.abs(panel.left - anchor.right - GAP)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.top - anchor.top)).toBeLessThanOrEqual(1);
  });

  it('bottom-start in RTL: flush with the anchor end edge', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    TestBed.configureTestingModule({ providers: [provideDirection('rtl')] });
    const { anchor, panel } = await openAndMeasure({
      placement: 'bottom-start',
      top: 200,
      left: 400,
    });
    expect(Math.abs(panel.right - anchor.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(panel.top - anchor.bottom - GAP)).toBeLessThanOrEqual(1);
  });

  it('tooltip bottom-start matches the popover geometry', async () => {
    const f = mount({ placement: 'bottom-start', top: 200, left: 400 });
    f.componentInstance.tooltip().show();
    f.detectChanges();
    await nextFrame();
    const anchor = (
      (f.nativeElement as HTMLElement).querySelector('.tip-anchor') as HTMLElement
    ).getBoundingClientRect();
    const tip = (document.querySelector('.cngx-tooltip') as HTMLElement).getBoundingClientRect();
    expect(Math.abs(tip.left - anchor.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(tip.top - anchor.bottom - GAP)).toBeLessThanOrEqual(1);
  });
});
