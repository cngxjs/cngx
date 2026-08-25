import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDataGridRow } from './data-grid-row.component';
import { CngxDgCell } from './data-grid-cell.directive';

// Runs in a real Chromium (the `test-geometry` target). The disclosure chevron
// is a corner-border box rotated 45deg. Its borders are logical
// (border-inline-end/-block-end) but the rotate is physical, so under dir=rtl
// the borders flip sides while the rotate does not - the down-chevron would
// point left. The component compensates with a sign-flipped rotate; this spec
// reads the computed transform matrix (jsdom reports '') to prove the chevron
// is corrected, not left mis-rotated. Mirrors the accordion chevron spec.

@Component({
  template: `<cngx-data-grid-accordion columns="8ch 1fr auto" [multi]="true">
    <cngx-dga-header>
      <span cngxDgaCell>ID</span>
      <span cngxDgaCell>Name</span>
    </cngx-dga-header>
    <cngx-dga-row panelId="collapsed">
      <span cngxDgaCell>1</span>
      <span cngxDgaCell primary>Alpha</span>
      Detail A
    </cngx-dga-row>
    <cngx-dga-row panelId="expanded">
      <span cngxDgaCell>2</span>
      <span cngxDgaCell primary>Beta</span>
      Detail B
    </cngx-dga-row>
  </cngx-data-grid-accordion>`,
  imports: [CngxDataGridAccordion, CngxDataGridRow, CngxDataGridHeader, CngxDgCell],
})
class ChevronHost {}

// Browser-serialized rotate matrices. rotate(45deg) and its RTL sign-flip
// rotate(-45deg) for the collapsed state; rotate(225deg)/rotate(-225deg) for
// the expanded state.
const ROTATE_45 = 'matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)';
const ROTATE_NEG_45 = 'matrix(0.707107, -0.707107, 0.707107, 0.707107, 0, 0)';
const ROTATE_225 = 'matrix(-0.707107, -0.707107, 0.707107, -0.707107, 0, 0)';
const ROTATE_NEG_225 = 'matrix(-0.707107, 0.707107, -0.707107, -0.707107, 0, 0)';

let mountedRoot: HTMLElement | null = null;

function mount(): { collapsed: HTMLElement; expanded: HTMLElement } {
  const fixture = TestBed.createComponent(ChevronHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  // Expand the second row so one chevron sits in each state.
  const summaries = mountedRoot.querySelectorAll<HTMLElement>('.cngx-dga-row__summary');
  summaries[1]?.click();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const collapsed = mountedRoot.querySelector(
    '.cngx-dga-row:not([data-expanded]) .cngx-dga-row__chevron',
  );
  const expanded = mountedRoot.querySelector(
    '.cngx-dga-row[data-expanded] .cngx-dga-row__chevron',
  );
  if (!collapsed || !expanded) {
    throw new Error('cngx-dga-row did not render both chevron states');
  }
  // The chevron animates `transform` over 150ms; kill it so getComputedStyle
  // returns the resolved target after a dir flip, not the tween.
  (collapsed as HTMLElement).style.transition = 'none';
  (expanded as HTMLElement).style.transition = 'none';
  return { collapsed: collapsed as HTMLElement, expanded: expanded as HTMLElement };
}

beforeEach(() => TestBed.configureTestingModule({ imports: [ChevronHost] }));

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  // isolate:false shares the browser env; reset the forced dir so a later
  // geometry read never sees a leaked RTL root.
  document.documentElement.removeAttribute('dir');
});

describe('CngxDataGridRow chevron direction', () => {
  it('sign-flips the collapsed chevron rotate under dir=rtl, LTR stable', () => {
    const { collapsed } = mount();
    expect(computedValue(collapsed, 'transform')).toBe(ROTATE_45);

    document.documentElement.dir = 'rtl';
    // Not the LTR rotate(45deg): the compensation corrects the flipped logical
    // borders so the chevron still points down.
    expect(computedValue(collapsed, 'transform')).toBe(ROTATE_NEG_45);

    document.documentElement.dir = 'ltr';
    expect(computedValue(collapsed, 'transform')).toBe(ROTATE_45);
  });

  it('sign-flips the expanded chevron rotate under dir=rtl', () => {
    const { expanded } = mount();
    expect(computedValue(expanded, 'transform')).toBe(ROTATE_225);

    document.documentElement.dir = 'rtl';
    expect(computedValue(expanded, 'transform')).toBe(ROTATE_NEG_225);
  });
});
