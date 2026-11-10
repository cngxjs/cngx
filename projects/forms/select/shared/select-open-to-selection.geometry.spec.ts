/// <reference types="@vitest/browser-playwright" />

import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSelect } from '../single-select/select.component';

// Real browser, default config: 190 options render in full, 1000 options
// window through the auto recycler. Either way the panel must open on the
// selected option, with its row inside the scroller's viewport.

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
  selector: 'cngx-select-open-to-selection-host',
  standalone: true,
  imports: [CngxSelect],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `<cngx-select #s [label]="'Colour'" [options]="options()" [(value)]="value" />`,
})
class Host {
  readonly options = signal(optionsOf(3));
  readonly value = signal<string | undefined>(undefined);
  readonly select = viewChild.required<CngxSelect<string>>('s');
}

const frames = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

let root: HTMLElement | null = null;

async function mount(count: number, selected: number) {
  const fixture = TestBed.createComponent(Host);
  root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  fixture.componentInstance.options.set(optionsOf(count));
  fixture.componentInstance.value.set(`o${selected}`);
  fixture.detectChanges();
  await fixture.whenStable();
  const settle = async (): Promise<void> => {
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    await frames(6);
    fixture.detectChanges();
  };
  return { select: fixture.componentInstance.select(), settle };
}

function expectSelectedInView(label: string): void {
  const scroller = root!.querySelector<HTMLElement>('.cngx-select__panel')!;
  const highlighted = root!.querySelector<HTMLElement>(
    '.cngx-select__option.cngx-option--highlighted',
  );
  expect(highlighted?.textContent).toContain(label);
  const row = highlighted!.getBoundingClientRect();
  const view = scroller.getBoundingClientRect();
  expect(row.top).toBeGreaterThanOrEqual(view.top - 1);
  expect(row.bottom).toBeLessThanOrEqual(view.bottom + 1);
}

afterEach(() => {
  root?.remove();
  root = null;
});

describe('select opens on the selected option, default config', () => {
  for (const [count, selected] of [
    [190, 170],
    [1000, 900],
  ] as const) {
    it(`shows and highlights option ${selected} of ${count} on the first open and on a reopen`, async () => {
      const { select, settle } = await mount(count, selected);

      select.open();
      await settle();
      expectSelectedInView(`Option ${selected}`);

      select.close();
      await settle();
      select.open();
      await settle();
      expectSelectedInView(`Option ${selected}`);
    });
  }
});
