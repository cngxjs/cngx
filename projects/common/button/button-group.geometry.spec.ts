import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxAsyncClick } from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { CngxButtonGroupAddon } from './button-group-addon.directive';
import { CngxButtonGroupSeparator } from './button-group-separator.directive';
import { CngxButtonGroup } from './button-group.directive';
import { CngxButton } from './button.component';
import { CngxIconButton } from './icon-button.component';

// Runs in a real Chromium (the `test-geometry` target). The group sheet is
// Track B (it ships in cngx.css, the directive has no styleUrl), so the host
// loads it next to the core foundation; the buttons bring their own sheets.
// jsdom reports `''` for every read.

type Density = 'comfortable' | 'compact' | 'spacious';

@Component({
  selector: 'cngx-button-group-geometry-host',
  standalone: true,
  imports: [CngxButtonGroup, CngxButtonGroupAddon, CngxButtonGroupSeparator, CngxButton, CngxIconButton, CngxAsyncClick],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    '../theming/components/cngx-button-group.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.data-density]="density()" [attr.data-touch]="touch()" [attr.dir]="dir()">
      <p>
        <span class="g-row" cngxButtonGroup variant="outline" aria-label="History"
          ><button cngxButton class="s-1">Undo</button
          ><button cngxButton class="s-2">Redo</button
          ><button cngxButton class="s-3">Repeat</button></span
        >
      </p>
      <p>
        <span class="g-col" cngxButtonGroup orientation="vertical" variant="outline" aria-label="Sort"
          ><button cngxButton class="v-1">Newest</button
          ><button cngxButton class="v-2">Oldest first</button
          ><button cngxButton class="v-3">Name</button></span
        >
      </p>
      <p>
        <span class="g-icons" cngxButtonGroup variant="outline" aria-label="Text style"
          ><button cngxIconButton class="i-1" aria-label="Bold">B</button
          ><button cngxIconButton class="i-2" aria-label="Italic">I</button></span
        >
      </p>
      <p>
        <span class="g-addon" cngxButtonGroup variant="outline" size="sm" aria-label="Assignee"
          ><span cngxButtonGroupAddon class="a-addon">3 open</span
          ><button cngxButton class="a-btn">Reassign</button></span
        >
        <button cngxButton class="sm-alone" size="sm">Alone</button>
      </p>
      <p>
        <span class="g-sep" cngxButtonGroup variant="ghost" aria-label="Clipboard"
          ><button cngxButton class="p-1">Cut</button
          ><span cngxButtonGroupSeparator class="p-sep"></span
          ><button cngxButton class="p-2">Paste</button></span
        >
      </p>
      <p>
        <span class="g-solid" cngxButtonGroup variant="solid" aria-label="Publish"
          ><button cngxButton class="o-1" tone="primary">Publish</button
          ><button cngxIconButton class="o-2" tone="primary" aria-label="More">v</button></span
        >
      </p>
      <p>
        <span class="g-async" cngxButtonGroup variant="solid" aria-label="Save"
          ><button cngxButton class="x-1" tone="primary" [cngxAsyncClick]="action">Save</button
          ><button cngxButton class="x-2" tone="primary" [cngxAsyncClick]="action">Save all</button></span
        >
      </p>
      <p>
        <span class="g-toolbar" cngxButtonGroup variant="outline" aria-label="Formatting"
          ><span class="t-1" cngxButtonGroup aria-label="Style"
            ><button cngxButton class="t-1a">B</button><button cngxButton class="t-1b">I</button></span
          ><span class="t-2" cngxButtonGroup aria-label="Align"
            ><button cngxButton class="t-2a">L</button><button cngxButton class="t-2b">R</button></span
          ></span
        >
      </p>
    </div>
  `,
})
class GeometryHost {
  readonly density = signal<Density>('comfortable');
  readonly touch = signal<'on' | null>(null);
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly action = (): Promise<void> => Promise.resolve();
}

let mountedRoot: HTMLElement | null = null;

function mount(options: { density?: Density; touch?: boolean; dir?: 'ltr' | 'rtl' } = {}): HTMLElement {
  const fixture = TestBed.createComponent(GeometryHost);
  fixture.componentInstance.density.set(options.density ?? 'comfortable');
  fixture.componentInstance.touch.set(options.touch ? 'on' : null);
  fixture.componentInstance.dir.set(options.dir ?? 'ltr');
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

function rect(root: HTMLElement, selector: string): DOMRect {
  return query(root, selector).getBoundingClientRect();
}

function px(el: HTMLElement, prop: string): number {
  return parseFloat(computedValue(el, prop));
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(['comfortable', 'compact', 'spacious'] as const)('CngxButtonGroup geometry: %s', (density) => {
  it('collapses horizontal seams to one border and keeps one row height', () => {
    const root = mount({ density });
    const [a, b, c] = ['.s-1', '.s-2', '.s-3'].map((s) => rect(root, s));
    const border = px(query(root, '.s-1'), 'border-right-width');
    expect(border).toBe(1);
    expect(b.left).toBeCloseTo(a.right - border, 1);
    expect(c.left).toBeCloseTo(b.right - border, 1);
    expect(b.top).toBeCloseTo(a.top, 1);
    expect(b.height).toBeCloseTo(a.height, 1);
    expect(c.height).toBeCloseTo(a.height, 1);
  });

  it('keeps the icon-button seam collapsed instead of spacing it apart', () => {
    const root = mount({ density, touch: true });
    const [a, b] = ['.i-1', '.i-2'].map((s) => rect(root, s));
    expect(b.left).toBeCloseTo(a.right - 1, 1);
  });

  it('stacks vertical segments with collapsed seams and one column width', () => {
    const root = mount({ density });
    const [a, b, c] = ['.v-1', '.v-2', '.v-3'].map((s) => rect(root, s));
    expect(b.top).toBeCloseTo(a.bottom - 1, 1);
    expect(c.top).toBeCloseTo(b.bottom - 1, 1);
    expect(a.left).toBeCloseTo(b.left, 1);
    expect(a.width).toBeCloseTo(b.width, 1);
    expect(c.width).toBeCloseTo(b.width, 1);
  });

  it('sizes the addon to the row of the group size', () => {
    const root = mount({ density });
    const addon = rect(root, '.a-addon');
    const btn = rect(root, '.a-btn');
    const alone = rect(root, '.sm-alone');
    expect(addon.height).toBeCloseTo(btn.height, 1);
    expect(btn.height).toBeCloseTo(alone.height, 1);
    expect(btn.left).toBeCloseTo(addon.right - 1, 1);
  });

  it('spaces the sub-groups of a toolbar by the scale gap, floored on touch', () => {
    const fine = mount({ density });
    const gap = rect(fine, '.t-2').left - rect(fine, '.t-1').right;
    const space = parseFloat(getComputedStyle(query(fine, '.g-toolbar')).getPropertyValue('--cngx-space-sm'));
    expect(gap).toBeCloseTo(space, 1);
    fine.remove();

    const coarse = mount({ density, touch: true });
    const coarseGap = rect(coarse, '.t-2').left - rect(coarse, '.t-1').right;
    expect(coarseGap).toBeGreaterThanOrEqual(8 - 0.01);
    // Inside each sub-group the seam stays collapsed.
    expect(rect(coarse, '.t-1b').left).toBeCloseTo(rect(coarse, '.t-1a').right - 1, 1);
  });
});

describe('CngxButtonGroup geometry: ends, seams and lift', () => {
  it('rounds only the two outer ends of a horizontal group', () => {
    const root = mount();
    const radius = px(query(root, '.s-1'), 'border-top-left-radius');
    expect(radius).toBeGreaterThan(0);
    const first = query(root, '.s-1');
    const middle = query(root, '.s-2');
    const last = query(root, '.s-3');
    expect(px(first, 'border-bottom-left-radius')).toBe(radius);
    expect(px(first, 'border-top-right-radius')).toBe(0);
    expect(px(first, 'border-bottom-right-radius')).toBe(0);
    for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
      expect(px(middle, `border-${corner}-radius`)).toBe(0);
    }
    expect(px(last, 'border-top-right-radius')).toBe(radius);
    expect(px(last, 'border-bottom-right-radius')).toBe(radius);
    expect(px(last, 'border-top-left-radius')).toBe(0);
  });

  it('mirrors the ends and the seam overlap under dir="rtl"', () => {
    const root = mount({ dir: 'rtl' });
    const first = query(root, '.s-1');
    const last = query(root, '.s-3');
    const a = first.getBoundingClientRect();
    const b = query(root, '.s-2').getBoundingClientRect();
    // The first segment sits on the right; the second overlaps its left border.
    expect(a.left).toBeGreaterThan(b.left);
    expect(b.right).toBeCloseTo(a.left + 1, 1);
    expect(px(first, 'border-top-right-radius')).toBeGreaterThan(0);
    expect(px(first, 'border-top-left-radius')).toBe(0);
    expect(px(last, 'border-top-left-radius')).toBeGreaterThan(0);
    expect(px(last, 'border-top-right-radius')).toBe(0);
  });

  it('rounds the top of the first and the bottom of the last vertical segment', () => {
    const root = mount();
    const first = query(root, '.v-1');
    const last = query(root, '.v-3');
    const radius = px(first, 'border-top-left-radius');
    expect(radius).toBeGreaterThan(0);
    expect(px(first, 'border-top-right-radius')).toBe(radius);
    expect(px(first, 'border-bottom-left-radius')).toBe(0);
    expect(px(last, 'border-bottom-left-radius')).toBe(radius);
    expect(px(last, 'border-bottom-right-radius')).toBe(radius);
    expect(px(last, 'border-top-left-radius')).toBe(0);
  });

  it('keeps the segments on both sides of a separator apart', () => {
    const root = mount();
    const before = rect(root, '.p-1');
    const sep = query(root, '.p-sep');
    const after = rect(root, '.p-2');
    expect(px(sep, 'border-left-width')).toBe(1);
    expect(sep.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(after.left).toBeGreaterThan(before.right);
  });

  it('draws a seam line between adjacent solid tone segments', () => {
    const root = mount();
    const second = query(root, '.o-2');
    expect(computedValue(second, 'border-left-color')).not.toBe(computedValue(second, 'border-right-color'));
  });

  it('ignores the live region cngxAsyncClick inserts: ends, seam and seam line hold', () => {
    const root = mount();
    const group = query(root, '.g-async');
    expect(group.querySelectorAll(':scope > [aria-live]').length).toBe(2);
    const first = query(root, '.x-1');
    const last = query(root, '.x-2');
    expect(px(last, 'border-top-right-radius')).toBeGreaterThan(0);
    expect(px(last, 'border-top-left-radius')).toBe(0);
    expect(px(first, 'border-top-left-radius')).toBeGreaterThan(0);
    expect(last.getBoundingClientRect().left).toBeCloseTo(first.getBoundingClientRect().right - 1, 1);
    expect(computedValue(last, 'border-left-color')).not.toBe(computedValue(last, 'border-right-color'));
  });

  it('lifts a hovered segment and a focused one above it, never clipping the ring', async () => {
    const root = mount();
    const group = query(root, '.g-row');
    expect(computedValue(group, 'overflow')).toBe('visible');
    expect(computedValue(group, 'isolation')).toBe('isolate');

    const middle = query(root, '.s-2');
    await userEvent.hover(middle);
    expect(computedValue(middle, 'z-index')).toBe('1');
    expect(computedValue(query(root, '.s-1'), 'z-index')).toBe('auto');

    query(root, '.s-1').focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(middle);
    expect(middle.matches(':focus-visible')).toBe(true);
    expect(computedValue(middle, 'z-index')).toBe('2');
    // The ring sits outside the box on both seams and paints above the neighbours.
    expect(px(middle, 'outline-width')).toBeGreaterThan(0);
    expect(px(middle, 'outline-offset')).toBeGreaterThanOrEqual(0);
    expect(computedValue(query(root, '.s-3'), 'z-index')).toBe('auto');
  });

  it('lifts the focused segment under dir="rtl" too', async () => {
    const root = mount({ dir: 'rtl' });
    query(root, '.s-1').focus();
    await userEvent.tab();
    expect(computedValue(query(root, '.s-2'), 'z-index')).toBe('2');
  });
});

// The addon reads the button's metric and type tokens, so it matches the
// sibling button at every size and in every [data-density] island. The groups
// start-align their segments so a stretched row cannot hide a mismatch.
@Component({
  selector: 'cngx-button-group-addon-row-host',
  standalone: true,
  imports: [CngxButtonGroup, CngxButtonGroupAddon, CngxButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    '../theming/components/cngx-button-group.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (density of densities; track density) {
      <div [attr.data-density]="density">
        @for (size of sizes; track size) {
          <p>
            <span cngxButtonGroup variant="outline" [size]="size" style="align-items: flex-start" aria-label="Issues"
              ><span cngxButtonGroupAddon class="addon-{{ density }}-{{ size }}">3 open</span
              ><button cngxButton class="btn-{{ density }}-{{ size }}">Show</button></span
            >
          </p>
        }
      </div>
    }
  `,
})
class AddonRowHost {
  readonly densities = ['comfortable', 'compact', 'spacious'] as const;
  readonly sizes = ['xs', 'sm', 'md', 'lg'] as const;
}

function row(el: HTMLElement): { height: number; font: string; line: string; start: string; end: string } {
  const style = getComputedStyle(el);
  return {
    height: Math.round(el.getBoundingClientRect().height * 10) / 10,
    font: style.fontSize,
    line: style.lineHeight,
    start: style.paddingInlineStart,
    end: style.paddingInlineEnd,
  };
}

describe('CngxButtonGroup geometry: addon on the button row', () => {
  it.each(['comfortable', 'compact', 'spacious'] as const)(
    'matches the sibling button height, font and inline padding at every size (%s)',
    (density) => {
      const fixture = TestBed.createComponent(AddonRowHost);
      mountedRoot = fixture.nativeElement as HTMLElement;
      document.body.appendChild(mountedRoot);
      fixture.detectChanges();
      for (const size of ['xs', 'sm', 'md', 'lg']) {
        const addon = query(mountedRoot, `.addon-${density}-${size}`);
        expect(addon.getAttribute('data-size'), size).toBe(size);
        expect(row(addon), size).toEqual(row(query(mountedRoot, `.btn-${density}-${size}`)));
      }
    },
  );

  it('keeps the inherited weight without a theme', () => {
    const fixture = TestBed.createComponent(AddonRowHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const addon = query(mountedRoot, '.addon-comfortable-md');
    expect(getComputedStyle(addon).fontWeight).toBe(getComputedStyle(addon.parentElement as HTMLElement).fontWeight);
  });
});
