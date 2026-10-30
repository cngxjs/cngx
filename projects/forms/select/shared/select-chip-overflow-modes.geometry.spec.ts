import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import type { CngxSelectOptionDef } from './option.model';

// Runs in a real Chromium (the `test-geometry` target): the strip's computed
// wrap and scroll and whether the chips break onto a second row are layout
// facts jsdom cannot produce. `'fit'` and `'truncate'` have their own
// geometry specs; the tree and reorderable strips do not honour `'fit'`
// (accepted debt), so only the three flat chip composites run here.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'ops', label: 'Operations lead' },
  { value: 'cs', label: 'Customer success' },
  { value: 'fin', label: 'Finance controller' },
  { value: 'plat', label: 'Platform engineer' },
];

type Kind = 'multi' | 'combo' | 'action-multi';
type Mode = 'wrap' | 'scroll-x';

@Component({
  selector: 'cngx-select-chip-overflow-modes-geometry-host',
  standalone: true,
  imports: [CngxMultiSelect, CngxCombobox, CngxActionMultiSelect],
  template: `
    <div style="inline-size: 260px">
      @switch (kind()) {
        @case ('multi') {
          <cngx-multi-select
            [label]="'Team'"
            [options]="options"
            [(values)]="values"
            [chipOverflow]="mode()"
          />
        }
        @case ('combo') {
          <cngx-combobox
            [label]="'Team'"
            [options]="options"
            [(values)]="values"
            [chipOverflow]="mode()"
          />
        }
        @case ('action-multi') {
          <cngx-action-multi-select
            [label]="'Team'"
            [options]="options"
            [(values)]="values"
            [chipOverflow]="mode()"
          />
        }
      }
    </div>
  `,
})
class Host {
  readonly options = OPTIONS;
  readonly kind = signal<Kind>('multi');
  readonly mode = signal<Mode>('wrap');
  readonly values = signal<string[]>(OPTIONS.map((o) => o.value));
}

const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));

let fixture: ComponentFixture<Host> | null = null;

async function mount(kind: Kind, mode: Mode): Promise<HTMLElement> {
  fixture = TestBed.createComponent(Host);
  fixture.componentInstance.kind.set(kind);
  fixture.componentInstance.mode.set(mode);
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  for (let i = 0; i < 3; i++) {
    fixture.detectChanges();
    await frame();
  }
  const strip = root.querySelector<HTMLElement>('.cngx-select__chip-list');
  if (!strip) {
    throw new Error(`${kind} rendered no chip strip`);
  }
  return strip;
}

function chipRows(strip: HTMLElement): number {
  const tops = Array.from(strip.querySelectorAll<HTMLElement>('cngx-chip')).map((chip) =>
    Math.round(chip.getBoundingClientRect().top),
  );
  return new Set(tops).size;
}

afterEach(() => {
  fixture?.nativeElement.remove();
  fixture = null;
});

for (const kind of ['multi', 'combo', 'action-multi'] as const) {
  describe(`chipOverflow wrap and scroll-x geometry - ${kind}`, () => {
    it('wrap breaks the chips onto more than one row', async () => {
      const strip = await mount(kind, 'wrap');
      const style = getComputedStyle(strip);
      expect(strip.getAttribute('data-overflow')).toBe('wrap');
      expect(style.flexWrap).toBe('wrap');
      expect(style.overflowX).toBe('visible');
      expect(strip.querySelectorAll('cngx-chip').length).toBe(OPTIONS.length);
      expect(chipRows(strip)).toBeGreaterThan(1);
    });

    it('scroll-x keeps one row and scrolls the overflow', async () => {
      const strip = await mount(kind, 'scroll-x');
      const style = getComputedStyle(strip);
      expect(strip.getAttribute('data-overflow')).toBe('scroll-x');
      expect(style.flexWrap).toBe('nowrap');
      expect(style.overflowX).toBe('auto');
      expect(chipRows(strip)).toBe(1);
      expect(strip.scrollWidth).toBeGreaterThan(strip.clientWidth);
    });
  });
}
