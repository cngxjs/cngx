import { Component, computed, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { CngxChip } from '@cngx/common/display';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { fitChipCount } from './chip-fit';
import { CngxSelectChipFitSlot, CngxSelectChipFitStrip } from './chip-fit-strip.directive';

// Runs in a real Chromium (the `test-geometry` target) against select-base.css:
// the slot cap, the registered reserve alias and the ResizeObserver timing are
// layout facts jsdom cannot produce.

const LONG = ['Operations lead', 'Customer success', 'Finance controller', 'Platform engineer'];

@Component({
  selector: 'cngx-chip-fit-strip-geometry-host',
  standalone: true,
  imports: [CngxChip, CngxSelectChipFitStrip, CngxSelectChipFitSlot],
  styleUrls: ['../select-base.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="box" style="display: flex" [style.width.px]="width()" [style]="reserveStyle()">
      <span
        class="cngx-select__chip-list fit-strip"
        cngxSelectChipFitStrip
        [active]="mode() === 'fit'"
        [attr.data-overflow]="mode()"
      >
        @for (label of labels(); track $index) {
          <span
            class="cngx-select__chip-slot"
            cngxSelectChipFitSlot
            [class.cngx-select__chip-slot--hidden]="mode() === 'fit' && $index >= visible()"
          >
            <cngx-chip>{{ label }}</cngx-chip>
          </span>
        }
        @if (mode() === 'fit' && visible() < labels().length) {
          <span class="cngx-select__chip-overflow-slot">
            <span class="cngx-select__chip-overflow-badge">+{{ labels().length - visible() }}</span>
          </span>
        }
      </span>
      <span class="probe" style="display: inline-block; inline-size: 5ch; flex: none"></span>
    </div>
    <span class="cngx-select__chip-overflow-badge badge-probe">+99</span>
    <div style="display: flex" [style.width.px]="width()">
      <span class="cngx-select__chip-list ref-strip" [attr.data-overflow]="mode()">
        @for (label of labels(); track $index) {
          <cngx-chip>{{ label }}</cngx-chip>
        }
      </span>
    </div>
  `,
})
class Host {
  readonly width = signal(300);
  readonly reserve = signal<string | null>(null);
  readonly mode = signal<'fit' | 'wrap' | 'truncate'>('fit');
  readonly labels = signal<string[]>([...LONG]);
  readonly strip = viewChild.required(CngxSelectChipFitStrip);
  readonly count = computed(() => fitChipCount(this.strip().snapshot()));
  readonly visible = computed(() => this.count() ?? this.labels().length);
  readonly reserveStyle = computed(() => {
    const reserve = this.reserve();
    return reserve ? `--cngx-select-chip-fit-badge-reserve: ${reserve}` : '';
  });
}

const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

let fixture: ComponentFixture<Host> | null = null;
let loopErrors: string[] = [];
const onError = (event: ErrorEvent): void => {
  if (/ResizeObserver loop/.test(event.message)) {
    loopErrors.push(event.message);
  }
};

async function mount(
  init?: (host: Host) => void,
): Promise<{ host: Host; root: HTMLElement; f: ComponentFixture<Host> }> {
  fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  await settle(fixture);
  return { host: fixture.componentInstance, root, f: fixture };
}

async function settle(f: ComponentFixture<Host>): Promise<void> {
  f.detectChanges();
  await frame();
  f.detectChanges();
  await frame();
  f.detectChanges();
}

function slots(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.fit-strip > .cngx-select__chip-slot'));
}

beforeEach(() => {
  loopErrors = [];
  window.addEventListener('error', onError);
});

afterEach(() => {
  window.removeEventListener('error', onError);
  fixture?.nativeElement.remove();
  fixture = null;
});

describe('CngxSelectChipFitStrip geometry', () => {
  it('keeps the fit count stable across frames and caps every slot', async () => {
    const { host, root, f } = await mount();
    const count = host.count();
    expect(count).not.toBeNull();
    expect(count).toBeLessThan(LONG.length);
    for (let i = 0; i < 3; i++) {
      await frame();
      f.detectChanges();
      expect(host.count()).toBe(count);
    }
    const snapshot = host.strip().snapshot();
    expect(snapshot).not.toBeNull();
    for (const slot of slots(root)) {
      expect(slot.getBoundingClientRect().width).toBeLessThanOrEqual(
        snapshot!.available - snapshot!.reserve + 0.5,
      );
    }
    expect(loopErrors).toEqual([]);
  });

  it('ellipsizes a label longer than the strip inside its slot', async () => {
    const { host, root, f } = await mount();
    host.labels.set([
      'A label that is far longer than the three hundred pixel strip can hold',
      ...LONG.slice(0, 3),
    ]);
    await settle(f);
    expect(host.count()).toBe(1);
    const label = root.querySelector<HTMLElement>('.fit-strip .cngx-chip__label');
    expect(label).not.toBeNull();
    expect(label!.scrollWidth).toBeGreaterThan(label!.clientWidth);
    const snapshot = host.strip().snapshot()!;
    expect(slots(root)[0].getBoundingClientRect().width).toBeLessThanOrEqual(
      snapshot.available - snapshot.reserve + 0.5,
    );
  });

  it('reads 5ch as the reserve when the public token is unset', async () => {
    const { host, root } = await mount();
    const probe = root.querySelector<HTMLElement>('.probe')!;
    expect(host.strip().snapshot()!.reserve).toBeCloseTo(probe.getBoundingClientRect().width, 0);
  });

  it('keeps room for a two-digit badge in the default reserve', async () => {
    const { host, root } = await mount();
    const badge = root.querySelector<HTMLElement>('.badge-probe')!.getBoundingClientRect().width;
    expect(host.strip().snapshot()!.reserve).toBeGreaterThanOrEqual(badge);
  });

  it('reads a host value of the public reserve token', async () => {
    const { host, root } = await mount((h) => h.reserve.set('10ch'));
    const probe = root.querySelector<HTMLElement>('.probe')!;
    expect(host.strip().snapshot()!.reserve).toBeCloseTo(probe.getBoundingClientRect().width * 2, 0);
  });

  it('measures an added slot before the next paint', async () => {
    const { host, f } = await mount();
    host.labels.set([...LONG, 'Data steward']);
    f.detectChanges();
    expect(host.strip().snapshot()!.widths.length).toBe(LONG.length + 1);
    const expected = host.count();
    await frame();
    expect(host.count()).toBe(expected);
  });

  it('shows every slot at 800px and folds again at 300px without a loop error', async () => {
    const { host, root, f } = await mount();
    host.width.set(800);
    await settle(f);
    expect(host.count()).toBe(LONG.length);
    expect(root.querySelector('.cngx-select__chip-overflow-slot')).toBeNull();
    host.width.set(300);
    await settle(f);
    expect(host.count()).toBeLessThan(LONG.length);
    expect(root.querySelector('.cngx-select__chip-overflow-slot')).not.toBeNull();
    expect(loopErrors).toEqual([]);
  });

  it('leaves the strip layout unchanged outside fit', async () => {
    const { host, root, f } = await mount();
    for (const mode of ['wrap', 'truncate'] as const) {
      host.mode.set(mode);
      await settle(f);
      expect(host.strip().snapshot()).toBeNull();
      expect(computedValue(slots(root)[0], 'display')).toBe('contents');
      const fit = root.querySelector<HTMLElement>('.fit-strip')!;
      const ref = root.querySelector<HTMLElement>('.ref-strip')!;
      expect(fit.getBoundingClientRect().height).toBe(ref.getBoundingClientRect().height);
      const fitChips = Array.from(fit.querySelectorAll('cngx-chip')).map(
        (c) => c.getBoundingClientRect().left - fit.getBoundingClientRect().left,
      );
      const refChips = Array.from(ref.querySelectorAll('cngx-chip')).map(
        (c) => c.getBoundingClientRect().left - ref.getBoundingClientRect().left,
      );
      expect(fitChips).toEqual(refChips);
    }
  });
});
