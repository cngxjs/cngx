import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAccordionGroup } from './accordion-group.component';
import { CngxAccordionItem } from './accordion-item.component';
import { CngxAccordionItemTitle } from './accordion-item-title.directive';

// Runs in a real Chromium (the `test-geometry` target). The disclosure chevron
// is a corner-border box rotated 45deg. Its borders are logical
// (border-inline-end/-block-end) but the rotate is physical, so under dir=rtl
// the borders flip sides while the rotate does not - the down-chevron would
// point left. The component compensates with a sign-flipped rotate; this spec
// reads the computed transform matrix (jsdom reports '') to prove the chevron
// is corrected, not left mis-rotated.

@Component({
  selector: 'cngx-accordion-chevron-geometry-host',
  standalone: true,
  imports: [CngxAccordionGroup, CngxAccordionItem, CngxAccordionItemTitle],
  template: `
    <cngx-accordion-group [(openIds)]="open">
      <cngx-accordion-item panelId="collapsed">
        <span cngxAccordionItemTitle>Collapsed</span>
        Body A
      </cngx-accordion-item>
      <cngx-accordion-item panelId="expanded">
        <span cngxAccordionItemTitle>Expanded</span>
        Body B
      </cngx-accordion-item>
    </cngx-accordion-group>
  `,
})
class AccordionChevronHost {
  readonly open = signal<ReadonlySet<string>>(new Set(['expanded']));
}

// Browser-serialized rotate matrices. rotate(45deg) and its RTL sign-flip
// rotate(-45deg) for the collapsed state; rotate(225deg)/rotate(-225deg) for
// the expanded state.
const ROTATE_45 = 'matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)';
const ROTATE_NEG_45 = 'matrix(0.707107, -0.707107, 0.707107, 0.707107, 0, 0)';
const ROTATE_225 = 'matrix(-0.707107, -0.707107, 0.707107, -0.707107, 0, 0)';
const ROTATE_NEG_225 = 'matrix(-0.707107, 0.707107, -0.707107, -0.707107, 0, 0)';

let mountedRoot: HTMLElement | null = null;

function mount(): { collapsed: HTMLElement; expanded: HTMLElement } {
  const fixture = TestBed.createComponent(AccordionChevronHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const collapsed = mountedRoot.querySelector(
    '.cngx-accordion-item:not([data-expanded]) .cngx-accordion-item__chevron',
  );
  const expanded = mountedRoot.querySelector(
    '.cngx-accordion-item[data-expanded] .cngx-accordion-item__chevron',
  );
  if (!collapsed || !expanded) {
    throw new Error('cngx-accordion-item did not render both chevron states');
  }
  // The chevron animates `transform` over 150ms; without killing the transition
  // getComputedStyle returns the mid-flight (start) matrix right after the dir
  // flip, not the target rotate. We assert the resolved target, not the tween.
  (collapsed as HTMLElement).style.transition = 'none';
  (expanded as HTMLElement).style.transition = 'none';
  return { collapsed: collapsed as HTMLElement, expanded: expanded as HTMLElement };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  // isolate:false shares the browser env; reset the forced dir so a later
  // geometry read never sees a leaked RTL root.
  document.documentElement.removeAttribute('dir');
});

describe('CngxAccordionItem chevron direction', () => {
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
