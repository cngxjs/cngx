/// <reference types="@vitest/browser-playwright" />

import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { ANCHOR_AREA_PROPERTY } from './anchor-positioning';
import { CngxPopover } from './popover.directive';
import type { CngxPopoverPresentationRequest } from './popover-sheet.directive';
import { CngxPopoverSheet } from './popover-sheet.directive';
import {
  CngxPopoverSheetHandle,
  CngxPopoverSheetHeader,
  CngxPopoverSheetTitle,
} from './popover-sheet-parts';
import { CngxPopoverTrigger } from './popover-trigger.directive';

// Runs in a real Chromium (the `test-geometry` target) against the shipped
// sheet stylesheet. Reduced motion is emulated so the slide transition does
// not leave the panel mid-flight when a rect is read; the settling test turns
// it back on.

const HARNESS_STYLES = [
  '../../core/theming/reset.css',
  '../../core/theming/system-tokens.css',
  '../theming/components/cngx-popover.css',
  '../theming/components/cngx-popover-sheet.css',
];

@Component({
  selector: 'cngx-popover-sheet-geometry-host',
  standalone: true,
  imports: [
    CngxPopover,
    CngxPopoverTrigger,
    CngxPopoverSheet,
    CngxPopoverSheetHeader,
    CngxPopoverSheetTitle,
    CngxPopoverSheetHandle,
  ],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.dir]="dir()">
      <button type="button" class="trigger" [cngxPopoverTrigger]="pop" style="margin: 40px">
        Open
      </button>
      <div cngxPopover #pop="cngxPopover" class="panel" [cngxPopoverSheet]="request()">
        <header class="header" cngxPopoverSheetHeader>
          <span cngxPopoverSheetHandle></span>
          <h2 cngxPopoverSheetTitle style="margin: 0; font-size: 1rem">Cities</h2>
        </header>
        <div class="content">
          @for (row of rows(); track $index) {
            <p style="margin: 0; block-size: 40px">Row {{ $index }}</p>
          }
        </div>
      </div>
    </div>
  `,
})
class SheetGeometryHost {
  readonly request = signal<CngxPopoverPresentationRequest>('sheet');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly rows = signal<readonly number[]>(Array.from({ length: 3 }, (_, i) => i));
  readonly popover = viewChild.required(CngxPopover);
}

let mountedRoot: HTMLElement | null = null;

const frames = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

async function emulate(features: { name: string; value: string }[]): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', { features });
}

async function open(configure?: (host: SheetGeometryHost) => void) {
  const fixture = TestBed.createComponent(SheetGeometryHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  configure?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.componentInstance;
  const panel = host.popover().elementRef.nativeElement;
  host.popover().show();
  fixture.detectChanges();
  await frames(6);
  return { fixture, host, panel };
}

// The fixed containing block: the viewport minus any scrollbar gutter the
// scroll lock keeps (desktop only; phones have overlay scrollbars).
const viewport = () => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position: fixed; inset: 0; visibility: hidden';
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
};

beforeEach(async () => {
  await emulate([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
});

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.body.removeAttribute('style');
  document.documentElement.removeAttribute('style');
  await emulate([]);
});

describe('CngxPopoverSheet geometry', () => {
  it.each(['ltr', 'rtl'] as const)(
    'lays the sheet bottom-flush at full inline size (%s)',
    async (dir) => {
      const { panel } = await open((h) => h.dir.set(dir));
      const rect = panel.getBoundingClientRect();
      const vp = viewport();
      expect(Math.round(rect.bottom)).toBe(vp.height);
      expect(Math.round(rect.left)).toBe(0);
      expect(Math.round(rect.width)).toBe(vp.width);
      expect(rect.height).toBeLessThan(vp.height * 0.7);
    },
  );

  it('caps the sheet block size and scrolls the content, not the host', async () => {
    const { panel } = await open((h) => h.rows.set(Array.from({ length: 60 }, (_, i) => i)));
    const rect = panel.getBoundingClientRect();
    const content = panel.querySelector<HTMLElement>('.content')!;
    const header = panel.querySelector<HTMLElement>('.header')!;
    expect(Math.abs(rect.height - window.innerHeight * 0.7)).toBeLessThanOrEqual(1);
    expect(computedValue(panel, 'overflow-y')).toBe('hidden');
    expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    expect(computedValue(content, 'overflow-y')).toBe('auto');
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
    expect(computedValue(header, 'flex-shrink')).toBe('0');
    expect(Math.round(header.getBoundingClientRect().top)).toBe(Math.round(rect.top));
  });

  it('fills the viewport in the fullscreen presentation', async () => {
    const { panel } = await open((h) => h.request.set('fullscreen'));
    const rect = panel.getBoundingClientRect();
    const vp = viewport();
    expect(Math.round(rect.top)).toBe(0);
    expect(Math.round(rect.height)).toBe(vp.height);
    expect(Math.round(rect.width)).toBe(vp.width);
  });

  it('renders nothing once a sheet or fullscreen panel is closed', async () => {
    for (const request of ['sheet', 'fullscreen'] as const) {
      const { host, panel } = await open((h) => h.request.set(request));
      expect(computedValue(panel, 'display')).toBe('flex');
      host.popover().hide();
      await frames(2);
      expect(computedValue(panel, 'display')).toBe('none');
      mountedRoot?.remove();
    }
  });

  it('writes no anchor, margin or floating inline styles while not anchored', async () => {
    const { panel } = await open();
    expect(panel.style.getPropertyValue(ANCHOR_AREA_PROPERTY)).toBe('');
    expect(panel.style.getPropertyValue('position-anchor')).toBe('');
    expect(panel.style.getPropertyValue('margin')).toBe('');
    expect(panel.style.left).toBe('');
    expect(panel.style.top).toBe('');
  });

  it('removes position-area on a live anchored -> sheet flip', async () => {
    const { fixture, host, panel } = await open((h) => h.request.set('anchored'));
    expect(panel.style.getPropertyValue(ANCHOR_AREA_PROPERTY)).not.toBe('');
    host.request.set('sheet');
    fixture.detectChanges();
    await frames(6);
    expect(panel.style.getPropertyValue(ANCHOR_AREA_PROPERTY)).toBe('');
    expect(Math.round(panel.getBoundingClientRect().bottom)).toBe(window.innerHeight);
  });

  it('keeps the anchored rect for an anchored request', async () => {
    const { panel } = await open((h) => h.request.set('anchored'));
    const trigger = mountedRoot!.querySelector<HTMLElement>('.trigger')!;
    const rect = panel.getBoundingClientRect();
    expect(rect.width).toBeLessThan(viewport().width / 2);
    expect(rect.top).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().bottom - 1);
    expect(panel.getAttribute('role')).toBeNull();
  });

  it('holds the panel transparent at the slide start while settling, then releases it', async () => {
    await emulate([]);
    const fixture = TestBed.createComponent(SheetGeometryHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = fixture.componentInstance.popover().elementRef.nativeElement;
    fixture.componentInstance.popover().show();

    expect(panel.hasAttribute('data-cngx-sheet-settling')).toBe(true);
    expect(computedValue(panel, 'opacity')).toBe('0');
    expect(computedValue(panel, 'transition-property')).toBe('none');
    expect(computedValue(panel, 'translate')).not.toBe('none');
    const first = panel.getBoundingClientRect();
    await frames(1);
    if (panel.hasAttribute('data-cngx-sheet-settling')) {
      expect(panel.getBoundingClientRect().top).toBe(first.top);
    }
    await frames(5);
    expect(panel.hasAttribute('data-cngx-sheet-settling')).toBe(false);
  });

  it('paints a CanvasText top edge under forced colors', async () => {
    await emulate([{ name: 'forced-colors', value: 'active' }]);
    const { panel } = await open();
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    document.body.appendChild(probe);
    expect(computedValue(panel, 'border-top-style')).toBe('solid');
    expect(computedValue(panel, 'border-top-color')).toBe(computedValue(probe, 'color'));
    probe.remove();
  });
});
