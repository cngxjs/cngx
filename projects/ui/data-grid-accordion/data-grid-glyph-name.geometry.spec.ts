import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDgCell } from './data-grid-cell.directive';
import { CngxDgaSortHeader } from './data-grid-sort-header.directive';

// Runs in a real Chromium (the `test-geometry` target). The sort arrow and the
// spreadsheet skin's row number and column letter are `::before` / `::after`
// content of the header and its cells. Without CSS alt text Chromium folds
// them into the sort header's accessible name ("A Name ▲"); the sort state is
// the header's description instead.

@Component({
  selector: 'cngx-dga-glyph-name-host',
  standalone: true,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDgCell, CngxDgaSortHeader],
  template: `
    <cngx-data-grid-accordion skin="spreadsheet">
      <cngx-dga-header>
        <span cngxDgaCell cngxDgaSortHeader="name" class="sort-name">Name</span>
      </cngx-dga-header>
    </cngx-data-grid-accordion>
  `,
})
class GlyphNameHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(GlyphNameHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const header = mountedRoot.querySelector<HTMLElement>('.sort-name')!;
  header.click();
  fixture.detectChanges();
  return header;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('data-grid-accordion glyphs', () => {
  it('stay visible', () => {
    const header = mount();
    expect(getComputedStyle(header, '::after').content).toContain('▲');
    expect(getComputedStyle(header, '::before').content).toContain('counter');
  });

  it('stay out of the sort header name', async () => {
    mount();
    expect(await accessibleName('.sort-name')).toBe('Name');
  });
});
