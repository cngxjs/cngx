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
