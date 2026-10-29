import type { Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CngxSelectOptionDef } from '../option.model';

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo' },
  { value: 'c', label: 'Charlie' },
  { value: 'd', label: 'Delta' },
  { value: 'e', label: 'Echo' },
];

/** Strip width the stubbed layout reports; `0` = not measured yet. */
let stripWidth = 300;
// 90px slots: three fit a 300px strip next to any small gap and reserve
// jsdom may report, four never do.
const SLOT_WIDTH = 90;

function rect(width: number): DOMRect {
  return { width, height: 20, top: 0, left: 0, right: width, bottom: 20, x: 0, y: 0 } as DOMRect;
}

/**
 * Contract for a host that projects `*<variant>Chip` and
 * `*cngxSelectChipOverflow` templates. The chip template renders
 * `.fit-projected-chip`, the overflow template `.fit-projected-badge`.
 *
 * @internal
 */
export interface ChipFitProjectedHost {
  readonly options: CngxSelectOptionDef<string>[];
}

/**
 * Shared `chipOverflow="fit"` behaviour of the chip-rendering multi-value
 * selects, on a stubbed layout (jsdom has none): hidden slots, badge, AT
 * summary, the pre-measurement fallback and projected templates. `inert` is
 * asserted as an attribute; jsdom does not enforce it.
 *
 * @internal
 */
export function describeChipFit(
  name: string,
  component: Type<unknown>,
  opts: {
    /** Host projecting the chip and overflow templates, `chipOverflow="fit"`, values a-e. */
    readonly projectedHost: Type<ChipFitProjectedHost>;
    /** The text that carries the whole selection for AT. */
    readonly summaryText: (root: HTMLElement) => string;
  },
): void {
  describe(`${name} - chipOverflow fit`, () => {
    beforeEach(() => {
      stripWidth = 300;
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
        this: HTMLElement,
      ) {
        if (this.classList.contains('cngx-select__chip-list')) {
          return rect(stripWidth);
        }
        if (this.classList.contains('cngx-select__chip-slot')) {
          return rect(SLOT_WIDTH);
        }
        return rect(0);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    function settle(fixture: ComponentFixture<unknown>): void {
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    function render(values: string[], mode: 'fit' | 'wrap' | 'truncate' = 'fit') {
      const fixture = TestBed.createComponent(component);
      fixture.componentRef.setInput('label', 'Recipients');
      fixture.componentRef.setInput('options', OPTIONS);
      fixture.componentRef.setInput('values', values);
      fixture.componentRef.setInput('chipOverflow', mode);
      fixture.componentRef.setInput('maxVisibleChips', 2);
      settle(fixture);
      return { fixture, root: fixture.nativeElement as HTMLElement };
    }

    function slots(root: HTMLElement): HTMLElement[] {
      return Array.from(root.querySelectorAll<HTMLElement>('.cngx-select__chip-slot'));
    }

    function hiddenLabels(root: HTMLElement): string[] {
      return slots(root)
        .filter((slot) => slot.hasAttribute('inert'))
        .map(
          (slot) =>
            slot.querySelector('.cngx-chip__label, .fit-projected-chip')?.textContent?.trim() ?? '',
        );
    }

    it('hides the slots past the fit count from focus and AT', () => {
      const { root } = render(['a', 'b', 'c', 'd', 'e']);
      expect(slots(root).length).toBe(5);
      expect(hiddenLabels(root)).toEqual(['Delta', 'Echo']);
      for (const slot of slots(root)) {
        const hidden = slot.hasAttribute('inert');
        expect(slot.getAttribute('aria-hidden')).toBe(hidden ? 'true' : null);
        expect(slot.classList.contains('cngx-select__chip-slot--hidden')).toBe(hidden);
      }
      const badge = root.querySelector('.cngx-select__chip-overflow-slot .cngx-select__chip-overflow-badge');
      expect(badge?.textContent?.trim()).toBe('+2');
    });

    it('names every selected option, hidden ones included, for AT', () => {
      const { root } = render(['a', 'b', 'c', 'd', 'e']);
      const text = opts.summaryText(root);
      for (const label of ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo']) {
        expect(text).toContain(label);
      }
    });

    it('reveals the next chip when a visible one is removed', () => {
      const { fixture, root } = render(['a', 'b', 'c', 'd', 'e']);
      fixture.componentRef.setInput('values', ['b', 'c', 'd', 'e']);
      settle(fixture);
      expect(hiddenLabels(root)).toEqual(['Echo']);
    });

    it('renders the coerced maxVisibleChips layout before the first measurement', () => {
      stripWidth = 0;
      const { root } = render(['a', 'b', 'c', 'd']);
      expect(hiddenLabels(root)).toEqual(['Charlie', 'Delta']);
      expect(root.querySelector('.cngx-select__chip-overflow-badge')?.textContent?.trim()).toBe(
        '+2',
      );
    });

    it('puts projected chips and the projected badge into the slots', () => {
      const fixture = TestBed.createComponent(opts.projectedHost);
      settle(fixture);
      const root = fixture.nativeElement as HTMLElement;
      const chips = Array.from(root.querySelectorAll<HTMLElement>('.fit-projected-chip'));
      expect(chips.length).toBe(5);
      for (const chip of chips) {
        expect(chip.parentElement?.classList.contains('cngx-select__chip-slot')).toBe(true);
      }
      expect(hiddenLabels(root)).toEqual(['Delta', 'Echo']);
      const badge = root.querySelector('.fit-projected-badge');
      expect(badge?.parentElement?.classList.contains('cngx-select__chip-overflow-slot')).toBe(
        true,
      );
    });

    it('leaves every slot exposed outside fit', () => {
      for (const mode of ['wrap', 'truncate'] as const) {
        const { root } = render(['a', 'b', 'c', 'd', 'e'], mode);
        for (const slot of slots(root)) {
          expect(slot.hasAttribute('inert')).toBe(false);
          expect(slot.getAttribute('aria-hidden')).toBeNull();
        }
      }
    });
  });
}
