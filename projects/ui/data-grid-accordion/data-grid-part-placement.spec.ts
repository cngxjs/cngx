import { Component, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDgCell } from './data-grid-cell.directive';
import { CngxDgaFilter } from './data-grid-filter.directive';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDataGridRow } from './data-grid-row.component';
import { CngxDgaSortHeader } from './data-grid-sort-header.directive';

@Component({
  template: `<cngx-dga-row panelId="a"><span cngxDgaCell>1</span></cngx-dga-row>`,
  imports: [CngxDataGridRow, CngxDgCell],
})
class OrphanRow {}

@Component({
  template: `<input cngxDgaFilter />`,
  imports: [CngxDgaFilter],
})
class OrphanFilter {}

@Component({
  template: `<span cngxDgaSortHeader="name">Name</span>`,
  imports: [CngxDgaSortHeader],
})
class OrphanSortHeader {}

@Component({
  template: `<cngx-data-grid-accordion columns="1fr">
    <cngx-dga-header>
      <span cngxDgaCell cngxDgaSortHeader="name">Name</span>
      <input cngxDgaFilter />
    </cngx-dga-header>
    <cngx-dga-row panelId="a"><span cngxDgaCell>1</span></cngx-dga-row>
  </cngx-data-grid-accordion>`,
  imports: [
    CngxDataGridAccordion,
    CngxDataGridHeader,
    CngxDataGridRow,
    CngxDgCell,
    CngxDgaFilter,
    CngxDgaSortHeader,
  ],
})
class PlacedParts {}

const ORPHANS: readonly { selector: string; host: Type<unknown> }[] = [
  { selector: 'cngx-dga-row', host: OrphanRow },
  { selector: 'cngxDgaFilter', host: OrphanFilter },
  { selector: 'cngxDgaSortHeader', host: OrphanSortHeader },
];

describe('data-grid-accordion part placement (CNGX3022)', () => {
  for (const { selector, host } of ORPHANS) {
    it(`throws CNGX3022 for [${selector}] outside a data grid`, () => {
      expect(() => TestBed.createComponent(host).detectChanges()).toThrow(
        expect.objectContaining({
          name: 'CngxRuntimeError',
          code: 'CNGX3022',
          message: expect.stringMatching(
            new RegExp(
              `^CNGX3022: \\[${selector}\\] must be placed inside <cngx-data-grid-accordion>\\.`,
            ),
          ),
        }),
      );
    });
  }

  it('does not throw for the parts inside <cngx-data-grid-accordion>', () => {
    expect(() => TestBed.createComponent(PlacedParts).detectChanges()).not.toThrow();
  });
});
