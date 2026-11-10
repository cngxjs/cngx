/// <reference types="@vitest/browser-playwright" />

import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { By } from '@angular/platform-browser';

import { CngxSelectAutoRecycler } from './internal/auto-recycler.directive';
import { CngxSelect } from '../single-select/select.component';

// Real browser, default config: the panel owns the recycler from its template,
// so what is asserted here is what a consumer without any virtualization
// config gets.

const HARNESS_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  '../../../core/theming/reset.css',
  '../../../core/theming/base.css',
  '../../../common/theming/components/cngx-popover.css',
  './select-base.css',
];

const optionsOf = (count: number): { value: string; label: string }[] =>
  Array.from({ length: count }, (_, i) => ({ value: `o${i}`, label: `Option ${i}` }));

@Component({
  selector: 'cngx-select-auto-virtualize-host',
  standalone: true,
  imports: [CngxSelect],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `<cngx-select #s [label]="'Colour'" [options]="options()" />`,
})
class Host {
  readonly options = signal(optionsOf(3));
  readonly select = viewChild.required<CngxSelect<string>>('s');
}

const frames = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

// The directive sits on an ng-container, which queryAll (elements only) misses.
const mounted = (fixture: ComponentFixture<Host>): number =>
  fixture.debugElement.queryAllNodes(By.directive(CngxSelectAutoRecycler)).length;

let root: HTMLElement | null = null;

async function mountOpen() {
  const fixture = TestBed.createComponent(Host);
  root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.componentInstance.select().open();
  const settle = async (): Promise<void> => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    await frames(4);
    fixture.detectChanges();
  };
  await settle();
  const rows = () => root!.querySelectorAll('.cngx-select__option').length;
  return { fixture, host: fixture.componentInstance, settle, rows };
}

afterEach(() => {
  root?.remove();
  root = null;
  vi.restoreAllMocks();
});

describe('select auto virtualization, default config', () => {
  it('creates no recycler for 3 options', async () => {
    const { fixture, host, rows } = await mountOpen();
    expect(rows()).toBe(3);
    expect(mounted(fixture)).toBe(0);
    expect(host.select().autoRecycler?.slot.current()).toBeNull();
    expect(root!.querySelector('.cngx-select__virtual-spacer')).toBeNull();
  });

  it('windows a list that grows to 1000 while open and renders it in full after it shrinks', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, host, settle, rows } = await mountOpen();

    host.options.set(optionsOf(1000));
    await settle();
    expect(rows()).toBeGreaterThan(0);
    expect(rows()).toBeLessThan(100);
    expect(mounted(fixture)).toBe(1);
    expect(host.select().autoRecycler?.slot.current()).not.toBeNull();
    expect(root!.querySelector('.cngx-select__virtual-spacer')).not.toBeNull();

    host.options.set(optionsOf(50));
    await settle();
    expect(rows()).toBe(50);
    expect(root!.querySelector('.cngx-select__virtual-spacer')).toBeNull();

    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps the window size on a jump to the end, so the extent does not shrink', async () => {
    const { host, settle, rows } = await mountOpen();
    host.options.set(optionsOf(1000));
    await settle();

    const scroller = root!.querySelector<HTMLElement>('.cngx-select__panel')!;
    scroller.scrollTop = 3000;
    await settle();
    const inMiddle = rows();

    scroller.scrollTop = scroller.scrollHeight;
    await settle();

    expect(rows()).toBeGreaterThanOrEqual(inMiddle);
    const rendered = root!.querySelectorAll('.cngx-select__option');
    expect(rendered[rendered.length - 1].textContent).toContain('Option 999');
    expect(scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop).toBeLessThanOrEqual(1);
  });
});

// Coarse-pointer rows: the touch-target floor makes every option 44px while
// the old fixed estimate assumed 32px, so the unrendered rest under-counted.
describe('select auto virtualization at 44px rows', () => {
  async function mountTall(value?: string) {
    const fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement as HTMLElement;
    root.style.setProperty('--cngx-target-min', '44px');
    document.body.appendChild(root);
    fixture.componentInstance.options.set(optionsOf(1000));
    fixture.detectChanges();
    await fixture.whenStable();
    if (value !== undefined) {
      fixture.componentInstance.select().value.set(value);
    }
    fixture.componentInstance.select().open();
    const settle = async (): Promise<void> => {
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      await frames(4);
      fixture.detectChanges();
    };
    await settle();
    const scroller = root.querySelector<HTMLElement>('.cngx-select__panel')!;
    const rendered = () => Array.from(root!.querySelectorAll<HTMLElement>('.cngx-select__option'));
    return { fixture, settle, scroller, rendered };
  }

  /** Whether a row sits at least partly inside the scroller's visible box. */
  const inView = (scroller: HTMLElement, row: HTMLElement): boolean => {
    const s = scroller.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    return r.bottom > s.top && r.top < s.bottom;
  };

  /** Label of the row under the scroller's top edge. */
  const topRow = (scroller: HTMLElement): string | undefined => {
    const edge = scroller.getBoundingClientRect().top + 1;
    const rows = Array.from(root!.querySelectorAll<HTMLElement>('.cngx-select__option'));
    const row = rows.find((r) => {
      const box = r.getBoundingClientRect();
      return box.top <= edge && box.bottom > edge;
    });
    return row?.textContent?.trim();
  };

  it('lands on the last option in one jump and keeps the scroll height', async () => {
    const { settle, scroller, rendered } = await mountTall();
    expect(rendered()[0].getBoundingClientRect().height).toBe(44);
    const before = scroller.scrollHeight;

    scroller.scrollTop = scroller.scrollHeight;
    await settle();

    expect(scroller.scrollHeight).toBe(before);
    const last = rendered().at(-1)!;
    expect(last.textContent).toContain('Option 999');
    expect(inView(scroller, last)).toBe(true);
  });

  it('opens on option 800 with option 800 in view', async () => {
    const { settle, scroller, rendered } = await mountTall('o800');
    await settle();
    const row = rendered().find((r) => /Option 800$/.test(r.textContent?.trim() ?? ''));
    expect(row).toBeDefined();
    expect(inView(scroller, row!)).toBe(true);
  });

  it('re-measures a row height change after the window has moved', async () => {
    const { settle, scroller } = await mountTall();
    scroller.scrollTop = 500 * 44;
    await settle();
    expect(scroller.scrollHeight).toBeGreaterThan(1000 * 44 - 44);
    const before = topRow(scroller);
    expect(before).toMatch(/^Option (499|500)$/);

    root!.style.setProperty('--cngx-target-min', '0px');
    await settle();
    await settle();

    const row = root!.querySelector<HTMLElement>('.cngx-select__option')!;
    const height = row.getBoundingClientRect().height;
    expect(height).toBeLessThan(44);
    // Panel padding and border sit on top of the rows: allow two rows of slack.
    expect(Math.abs(scroller.scrollHeight - 1000 * height)).toBeLessThanOrEqual(2 * height);
    expect(topRow(scroller)).toBe(before);
  });
});
