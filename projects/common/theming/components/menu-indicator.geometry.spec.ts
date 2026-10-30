import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CngxMenu,
  CngxMenuGroup,
  CngxMenuItemCheckbox,
  CngxMenuItemIcon,
  CngxMenuItemRadio,
} from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The base skin draws
// the checked indicator the checkbox / radio item directive inserts: the
// shared check and dot icons, sized to the text tick and dot they replaced
// and centred in the leading gutter out of flow.

@Component({
  selector: 'cngx-menu-indicator-host',
  standalone: true,
  imports: [CngxMenu, CngxMenuGroup, CngxMenuItemCheckbox, CngxMenuItemIcon, CngxMenuItemRadio],
  styleUrls: ['../../../core/theming/system-tokens.css', './cngx-menu.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ul cngxMenu [label]="'Format'" tabindex="0">
      <li cngxMenuItemCheckbox value="bold" [checked]="true" class="item-check">Bold</li>
      <li cngxMenuItemCheckbox value="italic" [(checked)]="italic" class="item-toggle">Italic</li>
      <li cngxMenuItemCheckbox value="pin" [checked]="true" class="item-icon">
        <span cngxMenuItemIcon>P</span>Pinned
      </li>
      <div cngxMenuGroup [label]="'Alignment'" name="align" selectedValue="left">
        <li cngxMenuItemRadio value="left" class="item-radio">Left</li>
      </div>
    </ul>
  `,
})
class MenuIndicatorHost {
  readonly italic = signal(false);
}

let mountedRoot: HTMLElement | null = null;

function mount(): { root: HTMLElement; host: MenuIndicatorHost; flush: () => void } {
  const fixture = TestBed.createComponent(MenuIndicatorHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  const flush = (): void => {
    fixture.detectChanges();
    TestBed.flushEffects();
  };
  flush();
  return { root: mountedRoot, host: fixture.componentInstance, flush };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

interface IndicatorParts {
  readonly item: HTMLElement;
  readonly gutter: HTMLElement;
  readonly svg: SVGSVGElement;
  readonly path: SVGPathElement;
}

function parts(root: HTMLElement, selector: string): IndicatorParts {
  const item = one(root, selector);
  const gutter = one(item, '.cngx-menu-item__indicator');
  const svg = gutter.querySelector<SVGSVGElement>('svg.cngx-menu-item__indicator-svg');
  const path = svg?.querySelector('path');
  if (!svg || !path) {
    throw new Error(`${selector} indicator renders no icon`);
  }
  return { item, gutter, svg, path };
}

function px(el: Element, property: string): number {
  return parseFloat(computedValue(el, property));
}

describe('base menu checked indicator', () => {
  // The bold text tick drew 0.72em wide; the check spans 14 units plus the
  // 2-unit stroke.
  it('draws the check 0.72em of the item font wide', () => {
    const { svg, path, item } = parts(mount().root, '.item-check');
    const stroke = (px(svg, 'stroke-width') * svg.getBoundingClientRect().width) / 24;
    expect(path.getBoundingClientRect().width + stroke).toBeCloseTo(
      0.72 * px(item, 'font-size'),
      1,
    );
  });

  it('draws the radio dot 0.7em of the item font across', () => {
    const { path, item } = parts(mount().root, '.item-radio');
    expect(path.getBoundingClientRect().width).toBeCloseTo(0.7 * px(item, 'font-size'), 1);
  });

  it.each(['.item-check', '.item-radio'])('centres the %s icon in its gutter', (selector) => {
    const { gutter, path } = parts(mount().root, selector);
    const ink = path.getBoundingClientRect();
    const box = gutter.getBoundingClientRect();
    expect(Math.abs(ink.left + ink.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(
      0.5,
    );
    expect(Math.abs(ink.top + ink.height / 2 - (box.top + box.height / 2))).toBeLessThanOrEqual(
      0.5,
    );
  });

  it('keeps the gutter at the icon min-width and the row height of an unchecked item', () => {
    const { root } = mount();
    const { gutter, item } = parts(root, '.item-radio');
    expect(gutter.getBoundingClientRect().width).toBeCloseTo(20, 1);
    expect(item.getBoundingClientRect().height).toBe(
      one(root, '.item-toggle').getBoundingClientRect().height,
    );
  });

  it('paints the check stroke and the dot fill in the checked colour', () => {
    const { root } = mount();
    const check = parts(root, '.item-check');
    const dot = parts(root, '.item-radio');
    expect(computedValue(check.svg, 'stroke')).toBe(computedValue(check.gutter, 'color'));
    expect(computedValue(check.svg, 'fill')).toBe('none');
    expect(computedValue(dot.svg, 'fill')).toBe(computedValue(dot.gutter, 'color'));
    expect(computedValue(check.gutter, 'color')).not.toBe(computedValue(check.item, 'color'));
  });

  it('hides the indicator while the item projects an icon', () => {
    const { root } = mount();
    const gutter = one(root, '.item-icon .cngx-menu-item__indicator');
    expect(computedValue(gutter, 'display')).toBe('none');
  });

  it('shows the indicator only while checked', () => {
    const { root, host, flush } = mount();
    expect(root.querySelector('.item-toggle .cngx-menu-item__indicator')).toBeNull();
    host.italic.set(true);
    flush();
    expect(parts(root, '.item-toggle').svg.getBoundingClientRect().width).toBeGreaterThan(0);
  });
});

describe('base menu checked indicator under dir=rtl', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('dir');
  });

  it('keeps the icon centred in its gutter at the inline start', () => {
    document.documentElement.dir = 'rtl';
    const { gutter, path, item } = parts(mount().root, '.item-check');
    const ink = path.getBoundingClientRect();
    const box = gutter.getBoundingClientRect();
    expect(Math.abs(ink.left + ink.width / 2 - (box.left + box.width / 2))).toBeLessThanOrEqual(0.5);
    // The gutter leads the label, so under RTL it sits at the right edge.
    expect(box.right).toBeGreaterThan(item.getBoundingClientRect().right - box.width - 16);
  });
});
