import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { CngxSelectOptionDef } from '../../option.model';
import { CngxSelectReorderList } from './reorder-list.component';

// Runs in a real Chromium (the `test-geometry` target). Under the touch floor
// (`data-touch="on"`, the 44px a coarse pointer sets) every target of the
// sortable list - the row, its drag handle and both move buttons - meets the
// touch size, and a long label is cut instead of pushing the buttons out.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'r', label: 'Red' },
  { value: 'g', label: 'G'.repeat(200) },
  { value: 'b', label: 'Blue' },
];

@Component({
  selector: 'cngx-reorder-list-geometry-host',
  standalone: true,
  imports: [CngxSelectReorderList],
  styleUrls: [
    '../../../../../core/theming/layers.css',
    '../../../../../core/theming/system-tokens.css',
    '../../../../../core/theming/reset.css',
    '../../../../../core/theming/base.css',
    '../../../../../common/theming/components/cngx-icon-glyph.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div data-touch="on" style="display: block; width: 20rem">
      <cngx-select-reorder-list [items]="options" [label]="'Selected'" />
    </div>
  `,
})
class Host {
  readonly options = OPTIONS;
}

let root: HTMLElement | null = null;

afterEach(() => {
  root?.remove();
  root = null;
});

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe('CngxSelectReorderList under the touch floor', () => {
  it('gives every row, handle and move button a 44px target', async () => {
    const fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    await nextFrame();

    const rows = Array.from(root.querySelectorAll<HTMLElement>('li[data-reorder-index]'));
    expect(rows).toHaveLength(3);
    const list = root.querySelector('ul')!.getBoundingClientRect();
    for (const row of rows) {
      const rowRect = row.getBoundingClientRect();
      expect(rowRect.height).toBeGreaterThanOrEqual(44);
      const targets = [
        row.querySelector<HTMLElement>('[data-reorder-handle]')!,
        ...Array.from(row.querySelectorAll<HTMLElement>('[data-move]')),
      ];
      expect(targets).toHaveLength(3);
      for (const target of targets) {
        const rect = target.getBoundingClientRect();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.right).toBeLessThanOrEqual(list.right + 0.5);
      }
      expect(getComputedStyle(targets[0]).touchAction).toBe('none');
    }

    const longLabel = rows[1].querySelector<HTMLElement>('.cngx-select-reorder-list__label')!;
    expect(longLabel.scrollWidth).toBeGreaterThan(longLabel.clientWidth);
    expect(Math.round(rows[1].getBoundingClientRect().height)).toBe(
      Math.round(rows[0].getBoundingClientRect().height),
    );
  });

  // The grip pads its ink inside the 24-unit grid; the list scales its box so
  // the drawn grip keeps the size it had before. The icon svg box rounds to
  // whole pixels, so the ink lands on the rounded box.
  it('draws the grip 0.8125em tall on the rounded box', async () => {
    const fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    await nextFrame();

    const row = root.querySelector<HTMLElement>('li[data-reorder-index]')!;
    const em = parseFloat(getComputedStyle(row).fontSize);
    const inkOnRoundedBox = (inkPx: number, extent: number): number =>
      (Math.round((inkPx * 24) / extent) * extent) / 24;
    const grip = row.querySelector('[data-reorder-handle] svg .cngx-icon-svg__path')!.getBoundingClientRect();
    expect(grip.height).toBeCloseTo(inkOnRoundedBox(0.8125 * em, 15), 1);
  });

  it.each([16, 14])('lands the move arrows on the 12px micro box at a %ipx font', async (fontPx) => {
    const fixture = TestBed.createComponent(Host);
    root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    fixture.detectChanges();
    root.querySelector<HTMLElement>('[data-touch]')!.style.fontSize = `${fontPx}px`;
    await nextFrame();

    const arrows = Array.from(root.querySelectorAll<SVGSVGElement>('li[data-reorder-index] [data-move] svg'));
    expect(arrows.length).toBeGreaterThan(0);
    for (const arrow of arrows) {
      expect(arrow.getBoundingClientRect().width).toBe(12);
      expect(getComputedStyle(arrow.querySelector('.cngx-icon-svg__micro')!).display).not.toBe('none');
      expect(getComputedStyle(arrow.querySelector('.cngx-icon-svg__path')!).display).toBe('none');
    }
  });
});
