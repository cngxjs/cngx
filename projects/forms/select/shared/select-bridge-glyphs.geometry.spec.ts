import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { CngxSelectOptionDef } from './option.model';
import { CngxSelect } from '../single-select/select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// select bridge (`./select-bridge-states.spec-host.scss` compiles select-theme
// into `html`) plus the global icon sheet, so the glyphs pick their tier by box.
// Under the bridge the tree twisty font is 1rem, so its 1em icon box is the exact
// 16px small box; the trigger caret keeps the mat-select ink width (10px) on a
// ~17px box, and CARET_DOWN carries no small drawing, so the 24-grid triangle
// paints there (Q3).

interface Row {
  readonly id: string;
  readonly name: string;
}

@Component({
  selector: 'cngx-select-bridge-glyphs-twisty-host',
  standalone: true,
  imports: [CngxTreeSelect],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../common/theming/components/cngx-icon-glyph.css',
    './select-bridge-states.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-tree-select
      [nodes]="nodes()"
      [nodeIdFn]="idFn"
      [labelFn]="labelFn"
      [keyFn]="keyFn"
      [(values)]="values"
    />
  `,
})
class TwistyHost {
  readonly nodes = signal([
    { value: { id: 'a', name: 'Alpha' }, children: [{ value: { id: 'a1', name: 'Alpha-1' } }] },
    { value: { id: 'b', name: 'Bravo' } },
  ]);
  readonly values = signal<Row[]>([]);
  readonly idFn = (v: Row): string => v.id;
  readonly labelFn = (v: Row): string => v.name;
  readonly keyFn = (v: Row): unknown => v.id;
}

@Component({
  selector: 'cngx-select-bridge-glyphs-caret-host',
  standalone: true,
  imports: [CngxSelect],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../common/theming/components/cngx-icon-glyph.css',
    './select-bridge-states.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `<cngx-select [label]="'Colour'" [options]="options" [value]="'red'" />`,
})
class CaretHost {
  readonly options: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
  ];
}

let mountedRoot: HTMLElement | null = null;

function visiblePath(svg: SVGSVGElement): SVGPathElement {
  const painted = Array.from(svg.querySelectorAll('path')).filter(
    (path) => getComputedStyle(path).display !== 'none',
  );
  expect(painted).toHaveLength(1);
  return painted[0];
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select bridge glyphs', () => {
  it('draws the tree twisty on the 16px small box under the bridge', () => {
    const fixture = TestBed.createComponent(TwistyHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const trigger = mountedRoot.querySelector<HTMLElement>('[role="combobox"]')!;
    trigger.click();
    fixture.detectChanges();
    const twisty = mountedRoot.querySelector<HTMLElement>('.cngx-tree-select__twisty')!;
    const svg = twisty.querySelector<SVGSVGElement>('svg')!;
    expect(svg.getBoundingClientRect().width).toBeCloseTo(16, 0);
    expect(visiblePath(svg).classList.contains('cngx-icon-svg__small')).toBe(true);
  });

  it('keeps the trigger caret on the 24-grid triangle at a ~17px box, 10px of ink', () => {
    const fixture = TestBed.createComponent(CaretHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const svg = mountedRoot.querySelector<SVGSVGElement>('[class*="__caret"] svg.cngx-icon-svg')!;
    expect(svg.getBoundingClientRect().width).toBeCloseTo(17, 0);
    // CARET_DOWN has no small drawing (Q3), so the 24-grid triangle paints even
    // though the box is in the band.
    const painted = visiblePath(svg);
    expect(painted.classList.contains('cngx-icon-svg__path')).toBe(true);
    // The triangle inks ~10px across, as wide as the mat-select arrow (#713).
    expect(painted.getBoundingClientRect().width).toBeCloseTo(10, 0);
  });
});
