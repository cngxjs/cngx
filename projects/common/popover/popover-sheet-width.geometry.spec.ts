/// <reference types="@vitest/browser-playwright" />

import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxPopover } from './popover.directive';
import type { CngxPopoverPresentationRequest } from './popover-sheet.directive';
import { CngxPopoverSheet } from './popover-sheet.directive';
import { CngxPopoverTrigger } from './popover-trigger.directive';

// Runs in a real Chromium (the `test-geometry` target) against the shipped
// sheet stylesheet. With classic (non-overlay) scrollbars forced, the open
// sheet must still span the full layout viewport, not inset itself by the
// scrollbar gutter the scroll lock keeps (I7: measured 379px in a 390px
// viewport). Red until Phase 2 flips it.

const HARNESS_STYLES = [
  '../../core/theming/reset.css',
  '../../core/theming/system-tokens.css',
  '../theming/components/cngx-popover.css',
  '../theming/components/cngx-popover-sheet.css',
];

@Component({
  selector: 'cngx-popover-sheet-width-host',
  standalone: true,
  imports: [CngxPopover, CngxPopoverTrigger, CngxPopoverSheet],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <button type="button" class="trigger" [cngxPopoverTrigger]="pop" style="margin: 40px">
      Open
    </button>
    <div cngxPopover #pop="cngxPopover" class="panel" [cngxPopoverSheet]="request()">
      <div class="content">
        @for (row of rows(); track $index) {
          <p style="margin: 0; block-size: 40px">Row {{ $index }}</p>
        }
      </div>
    </div>
  `,
})
class SheetWidthHost {
  readonly request = signal<CngxPopoverPresentationRequest>('sheet');
  readonly rows = signal<readonly number[]>(Array.from({ length: 80 }, (_, i) => i));
  readonly popover = viewChild.required(CngxPopover);
}

let mountedRoot: HTMLElement | null = null;
let scrollbarStyle: HTMLStyleElement | null = null;

const frames = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

// Force a classic 11px scrollbar and a document taller than the viewport, so a
// vertical scrollbar gutter exists (Chromium defaults to overlay scrollbars
// headless, which hide the bug).
function forceClassicScrollbar(): void {
  scrollbarStyle = document.createElement('style');
  scrollbarStyle.textContent = `
    html { overflow-y: scroll; }
    ::-webkit-scrollbar { width: 11px; height: 11px; }
    ::-webkit-scrollbar-thumb { background: #888; }
  `;
  document.head.appendChild(scrollbarStyle);
  document.body.style.minBlockSize = '300vh';
}

async function open() {
  const fixture = TestBed.createComponent(SheetWidthHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  const panel = fixture.componentInstance.popover().elementRef.nativeElement;
  fixture.componentInstance.popover().show();
  fixture.detectChanges();
  await frames(6);
  return { fixture, panel };
}

beforeEach(async () => {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  forceClassicScrollbar();
});

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  scrollbarStyle?.remove();
  scrollbarStyle = null;
  document.body.removeAttribute('style');
  document.documentElement.removeAttribute('style');
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('CngxPopoverSheet width with classic scrollbars', () => {
  it.fails('spans the full layout viewport despite a classic scrollbar gutter', async () => {
    const { panel } = await open();
    const rect = panel.getBoundingClientRect();
    expect(Math.round(rect.left)).toBe(0);
    expect(Math.round(rect.width)).toBe(window.innerWidth);
  });
});
