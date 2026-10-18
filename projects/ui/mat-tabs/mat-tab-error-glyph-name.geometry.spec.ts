import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The has-errors flag of
// a Material tab is an `::after` glyph; without CSS alt text Chromium folds the
// `!` into the tab's accessible name. The error itself is spoken by the
// decoration's own screen-reader text. Static markup with Material's own
// classes; Material's stylesheet is not loaded here, except the unlayered
// strong-focus-indicator rule below, copied from
// @angular/material/core/focus-indicators/_private.scss. It owns `::before`
// on every `.mat-focus-indicator` and beats any layered cngx rule there.

@Component({
  selector: 'cngx-mat-tab-error-glyph-name-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="tablist">
      <button type="button" role="tab" class="mat-mdc-tab cngx-mat-tab--has-errors tab-flagged">
        Billing
      </button>
    </div>
  `,
})
class MatTabErrorGlyphHost {}

@Component({
  selector: 'cngx-mat-tab-error-glyph-focus-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  styles: `
    .mat-focus-indicator {
      position: relative;
    }
    .mat-focus-indicator::before {
      inset: 0;
      position: absolute;
      box-sizing: border-box;
      pointer-events: none;
      display: var(--mat-focus-indicator-display, none);
      border: 3px solid transparent;
    }
    .mat-focus-indicator:focus-visible::before {
      content: '';
    }
  `,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="tablist">
      <button
        type="button"
        role="tab"
        class="mat-mdc-tab mat-focus-indicator cngx-mat-tab--has-errors tab-flagged"
      >
        Billing
      </button>
    </div>
  `,
})
class MatTabErrorGlyphFocusHost {}

// The commit-rejection glyph rides an `aria-hidden` span the decoration
// projector inserts (both pseudo-elements are taken). Static markup in the
// shape the projector writes.
@Component({
  selector: 'cngx-mat-tab-rejection-glyph-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="tablist">
      <button
        type="button"
        role="tab"
        class="mat-mdc-tab cngx-mat-tab--error tab-refused"
        data-reason="refused"
      >
        Billing<span class="cngx-mat-tab__rejection-icon" aria-hidden="true" data-reason="refused"
          >⊘</span
        >
      </button>
      <button
        type="button"
        role="tab"
        class="mat-mdc-tab cngx-mat-tab--error tab-failed"
        data-reason="failed"
      >
        Profile<span class="cngx-mat-tab__rejection-icon" aria-hidden="true" data-reason="failed"
          >!</span
        >
      </button>
    </div>
  `,
})
class MatTabRejectionGlyphHost {}

// Placement: on its own the rejection disc takes the has-errors badge's
// corner; on a tab that also carries the badge it drops back inline after the
// label. The glyph sits on the tab itself; the label row is a positioning
// context, and the tab a centring flex row, as in Material.
@Component({
  selector: 'cngx-mat-tab-rejection-corner-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  styles: `
    .mat-mdc-tab {
      position: relative;
      display: flex;
      justify-content: center;
      box-sizing: border-box;
      width: 200px;
      height: 48px;
      padding: 0 24px;
      border: 0;
    }
    .mdc-tab__content {
      position: relative;
      display: flex;
      align-items: center;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (dir of dirs; track dir) {
      <div role="tablist" [attr.dir]="dir" [class]="'strip-' + dir">
        <button type="button" role="tab" class="mat-mdc-tab cngx-mat-tab--has-errors tab-badge">
          <span class="mdc-tab__content">Billing</span>
        </button>
        <button
          type="button"
          role="tab"
          class="mat-mdc-tab cngx-mat-tab--error tab-rejected"
          data-reason="failed"
        >
          <span class="mdc-tab__content">Profile</span
          ><span class="cngx-mat-tab__rejection-icon" aria-hidden="true" data-reason="failed"
            >!</span
          >
        </button>
        <button
          type="button"
          role="tab"
          class="mat-mdc-tab cngx-mat-tab--error cngx-mat-tab--has-errors tab-both"
          data-reason="refused"
        >
          <span class="mdc-tab__content">Account</span
          ><span class="cngx-mat-tab__rejection-icon" aria-hidden="true" data-reason="refused"
            >⊘</span
          >
        </button>
      </div>
    }
  `,
})
class MatTabRejectionCornerHost {
  protected readonly dirs = ['ltr', 'rtl'] as const;
}

let mountedRoot: HTMLElement | null = null;

function mount(
  host:
    | typeof MatTabErrorGlyphHost
    | typeof MatTabRejectionGlyphHost
    | typeof MatTabRejectionCornerHost = MatTabErrorGlyphHost,
): HTMLElement {
  const fixture = TestBed.createComponent(host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('mat-tab has-errors glyph', () => {
  it('stays visible', () => {
    const tab = mount().querySelector('.tab-flagged')!;
    expect(getComputedStyle(tab, '::after').content).toContain('!');
  });

  it('survives Material strong focus indicators, focused or not', () => {
    const tab = mount(MatTabErrorGlyphFocusHost).querySelector<HTMLElement>('.tab-flagged')!;
    const glyph = () => getComputedStyle(tab, '::after');
    expect(glyph().content).toContain('!');
    expect(glyph().display).not.toBe('none');
    tab.focus();
    expect(glyph().content).toContain('!');
    expect(glyph().display).not.toBe('none');
  });

  it('leaves the Material focus indicator its own pseudo-element', () => {
    const tab = mount(MatTabErrorGlyphFocusHost).querySelector<HTMLElement>('.tab-flagged')!;
    tab.focus();
    expect(getComputedStyle(tab, '::before').content).toBe('""');
  });

  it('stays out of the tab name', async () => {
    mount();
    expect(await accessibleName('.tab-flagged')).toBe('Billing');
  });
});

describe('mat-tab commit-rejection glyph', () => {
  // oklch(0.62 0.15 60) and oklch(0.45 0.15 25) as Chromium serialises them.
  const disc = (root: HTMLElement, sel: string) =>
    getComputedStyle(root.querySelector(`${sel} .cngx-mat-tab__rejection-icon`)!).backgroundColor;

  it('paints a refused tab amber and a failed tab red', () => {
    const root = mount(MatTabRejectionGlyphHost);
    expect(disc(root, '.tab-refused')).toBe('oklch(0.62 0.15 60)');
    expect(disc(root, '.tab-failed')).toBe('oklch(0.45 0.15 25)');
    expect(getComputedStyle(root.querySelector('.tab-refused')!).outlineColor).toBe(
      'oklch(0.62 0.15 60)',
    );
    expect(getComputedStyle(root.querySelector('.tab-failed')!).outlineColor).toBe(
      'oklch(0.45 0.15 25)',
    );
  });

  it('keeps a refused tab at its resting text colour', () => {
    const root = mount(MatTabRejectionGlyphHost);
    const tablist = root.querySelector('[role="tablist"]')!;
    expect(getComputedStyle(root.querySelector('.tab-refused')!).color).toBe(
      getComputedStyle(tablist).color,
    );
  });

  it('stays out of the tab name', async () => {
    mount(MatTabRejectionGlyphHost);
    expect(await accessibleName('.tab-refused')).toBe('Billing');
    expect(await accessibleName('.tab-failed')).toBe('Profile');
  });
});

describe('mat-tab commit-rejection glyph placement', () => {
  // Offsets of a box from the tab's top and inline-end edges.
  function insets(tab: Element, box: DOMRect, dir: 'ltr' | 'rtl') {
    const t = tab.getBoundingClientRect();
    return {
      top: box.top - t.top,
      end: dir === 'ltr' ? t.right - box.right : box.left - t.left,
      size: box.width,
    };
  }

  // `::after` has no box of its own to measure; resolve it from its used
  // `top` / physical inline-end inset and width.
  function badgeInsets(tab: Element, dir: 'ltr' | 'rtl') {
    const after = getComputedStyle(tab, '::after');
    return {
      top: parseFloat(after.top),
      end: parseFloat(dir === 'ltr' ? after.right : after.left),
      size: parseFloat(after.width),
    };
  }

  for (const dir of ['ltr', 'rtl'] as const) {
    it(`sits in the has-errors badge's corner (${dir})`, () => {
      const root = mount(MatTabRejectionCornerHost);
      const strip = root.querySelector(`.strip-${dir}`)!;
      const rejected = strip.querySelector('.tab-rejected')!;
      const disc = rejected.querySelector('.cngx-mat-tab__rejection-icon')!;
      const badge = badgeInsets(strip.querySelector('.tab-badge')!, dir);
      const got = insets(rejected, disc.getBoundingClientRect(), dir);
      expect(got.size).toBeGreaterThan(0);
      expect(got.top).toBeCloseTo(badge.top, 1);
      expect(got.end).toBeCloseTo(badge.end, 1);
      expect(got.size).toBeCloseTo(badge.size, 1);
    });

    it(`drops inline after the label beside the corner badge (${dir})`, () => {
      const root = mount(MatTabRejectionCornerHost);
      const strip = root.querySelector(`.strip-${dir}`)!;
      const both = strip.querySelector('.tab-both')!;
      const discEl = both.querySelector<HTMLElement>('.cngx-mat-tab__rejection-icon')!;
      const label = both.querySelector('.mdc-tab__content')!.getBoundingClientRect();
      const box = discEl.getBoundingClientRect();
      const disc = insets(both, box, dir);
      const badge = badgeInsets(both, dir);
      expect(getComputedStyle(discEl).position).toBe('static');
      // Inline after the label, by the gap, on the label's centre line.
      const gap = dir === 'ltr' ? box.left - label.right : label.left - box.right;
      expect(gap).toBeCloseTo(4, 1);
      expect(box.top + box.height / 2).toBeCloseTo(label.top + label.height / 2, 1);
      // The badge keeps its stacked corner inset.
      expect(badge.top).toBeCloseTo(6, 1);
      expect(badge.end).toBeCloseTo(6, 1);
      // No overlap: the disc's inline-end edge lies past the badge's inner edge,
      // or below its bottom edge.
      const clearInline = disc.end > badge.end + badge.size;
      const clearBlock = disc.top > badge.top + badge.size;
      expect(clearInline || clearBlock).toBe(true);
    });
  }
});
