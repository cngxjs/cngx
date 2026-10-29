/// <reference types="@vitest/browser-playwright" />

import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { accessibleName, computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxMenuGroup } from '@cngx/common/interactive';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuItem } from './context-menu-item.component';
import { CngxContextMenuItemCheckbox } from './context-menu-item-checkbox.component';
import { CngxContextMenuItemRadio } from './context-menu-item-radio.component';

// Runs in a real Chromium (the `test-geometry` target) with the real context
// menu shells and the base menu skin. The checked tick, the radio dot and the
// submenu caret are shared-icon svgs sized to the ink of the text glyphs they
// replace: tick and dot 0.73em across, caret 0.3em across. The indicators sit
// in an always-present gutter, so the label never moves with the checked
// state, and both glyphs centre on the label line.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-context-menu-glyphs-host',
  standalone: true,
  imports: [
    CngxContextMenu,
    CngxContextMenuItem,
    CngxContextMenuItemCheckbox,
    CngxContextMenuItemRadio,
    CngxMenuGroup,
  ],
  styleUrls: ['../../core/theming/system-tokens.css', '../../common/theming/components/cngx-menu.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-context-menu ariaLabel="View" class="main">
      <cngx-context-menu-item-checkbox class="item-check" value="wrap" [(checked)]="wrap">
        Word wrap
      </cngx-context-menu-item-checkbox>
      <div cngxMenuGroup label="Density" [(selectedValue)]="density">
        <cngx-context-menu-item-radio class="item-cozy" value="cozy">Cozy</cngx-context-menu-item-radio>
        <cngx-context-menu-item-radio class="item-compact" value="compact">
          Compact
        </cngx-context-menu-item-radio>
      </div>
      <cngx-context-menu-item class="item-sub" value="export" [submenu]="sub">
        Export as
      </cngx-context-menu-item>
    </cngx-context-menu>
    <cngx-context-menu ariaLabel="Export as" #sub="cngxContextMenu">
      <cngx-context-menu-item value="pdf">PDF</cngx-context-menu-item>
    </cngx-context-menu>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-highlighttext" style="color: HighlightText"></span>
  `,
})
class GlyphHost {
  readonly wrap = signal(true);
  readonly density = signal<string | undefined>('cozy');
}

let mountedRoot: HTMLElement | null = null;
let mountedFixture: ReturnType<typeof TestBed.createComponent<GlyphHost>> | null = null;

async function mount(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(GlyphHost);
  mountedFixture = fixture;
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const main = fixture.debugElement.query(By.css('cngx-context-menu.main'));
  main.injector.get(CngxContextMenu).popover.show();
  fixture.detectChanges();
  await fixture.whenStable();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function rect(root: ParentNode, selector: string): DOMRect {
  return one(root, selector).getBoundingClientRect();
}

const centreY = (r: DOMRect): number => r.top + r.height / 2;
const fontSize = (el: Element): number => parseFloat(computedValue(el, 'font-size'));

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  mountedFixture = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('context-menu glyph geometry', () => {
  it('sizes the tick to 0.73em of ink across (box 0.73em * 24 / 16)', async () => {
    const root = await mount();
    const fs = fontSize(one(root, '.item-check'));
    const box = rect(root, '.item-check .cngx-menu-item__check > svg');
    expect(box.width).toBeCloseTo((0.73 * 24 * fs) / 16, 1);
    expect(box.height).toBeCloseTo((0.73 * 24 * fs) / 16, 1);
  });

  it('sizes the dot to 0.73em across (box 0.73em * 24 / 8)', async () => {
    const root = await mount();
    const fs = fontSize(one(root, '.item-cozy'));
    const box = rect(root, '.item-cozy .cngx-menu-item__check > svg');
    expect(box.width).toBeCloseTo((0.73 * 24 * fs) / 8, 1);
  });

  it('sizes the caret to 0.3em of ink across (box 0.3em * 24 / 8)', async () => {
    const root = await mount();
    const fs = fontSize(one(root, '.item-sub'));
    const box = rect(root, '.item-sub .cngx-menu-item__suffix > svg');
    expect(box.width).toBeCloseTo((0.3 * 24 * fs) / 8, 1);
  });

  it('keeps the oversized dot box from growing the row', async () => {
    const root = await mount();
    expect(rect(root, '.item-cozy').height).toBeCloseTo(rect(root, '.item-compact').height, 1);
    expect(rect(root, '.item-cozy').height).toBeCloseTo(rect(root, '.item-sub').height, 1);
  });

  it('centres every glyph on its label line within 0.5px', async () => {
    const root = await mount();
    for (const [item, glyph] of [
      ['.item-check', '.cngx-menu-item__check > svg'],
      ['.item-cozy', '.cngx-menu-item__check > svg'],
      ['.item-sub', '.cngx-menu-item__suffix > svg'],
    ] as const) {
      const label = centreY(rect(root, `${item} .cngx-menu-item__label`));
      const icon = centreY(rect(root, `${item} ${glyph}`));
      expect(Math.abs(icon - label), item).toBeLessThanOrEqual(0.5);
    }
  });

  it('centres the indicator in a 1.25rem gutter', async () => {
    const root = await mount();
    const gutter = rect(root, '.item-check .cngx-menu-item__check');
    const icon = rect(root, '.item-check .cngx-menu-item__check > svg');
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
    expect(gutter.width).toBeCloseTo(1.25 * remPx, 1);
    expect(icon.left + icon.width / 2).toBeCloseTo(gutter.left + gutter.width / 2, 1);
  });

  it('does not move the label when an item is checked or unchecked', async () => {
    const root = await mount();
    // Measured against the row, since the panel re-centres when the checked
    // label's bolder weight changes its width.
    const labelInset = (item: string): number =>
      rect(root, `${item} .cngx-menu-item__label`).left - rect(root, item).left;
    expect(labelInset('.item-cozy')).toBeCloseTo(labelInset('.item-compact'), 1);

    const before = labelInset('.item-check');
    mountedFixture!.componentInstance.wrap.set(false);
    mountedFixture!.detectChanges();
    expect(root.querySelector('.item-check .cngx-menu-item__check > svg')).toBeNull();
    expect(labelInset('.item-check')).toBeCloseTo(before, 1);
  });

  it('paints the tick stroke and the dot fill in currentColor, the check token', async () => {
    const root = await mount();
    const tick = one(root, '.item-check .cngx-menu-item__check > svg');
    const dot = one(root, '.item-cozy .cngx-menu-item__check > svg');
    expect(computedValue(tick, 'stroke')).toBe(computedValue(tick, 'color'));
    expect(computedValue(tick, 'fill')).toBe('none');
    expect(computedValue(dot, 'fill')).toBe(computedValue(dot, 'color'));
    expect(computedValue(tick, 'color')).not.toBe(computedValue(one(root, '.item-check .cngx-menu-item__label'), 'color'));
  });

  it('paints the caret stroke in currentColor, the caret token', async () => {
    const root = await mount();
    const caret = one(root, '.item-sub .cngx-menu-item__suffix > svg');
    expect(computedValue(caret, 'stroke')).toBe(computedValue(caret, 'color'));
    expect(computedValue(caret, 'color')).toBe(computedValue(one(root, '.item-sub .cngx-menu-item__suffix'), 'color'));
  });

  it('mirrors the caret under RTL and keeps it at the inline end', async () => {
    const root = await mount();
    const suffix = one(root, '.item-sub .cngx-menu-item__suffix');
    expect(computedValue(suffix, 'transform')).toBe('none');

    one(root, 'cngx-context-menu.main').setAttribute('dir', 'rtl');
    expect(computedValue(suffix, 'transform')).toBe('matrix(-1, 0, 0, 1, 0, 0)');
    expect(rect(root, '.item-sub .cngx-menu-item__suffix').right).toBeLessThan(
      rect(root, '.item-sub .cngx-menu-item__label').left,
    );
  });

  it('keeps the glyphs out of the accessible names', async () => {
    await mount();
    expect(await accessibleName('.item-check')).toBe('Word wrap');
    expect(await accessibleName('.item-cozy')).toBe('Cozy');
    expect(await accessibleName('.item-sub')).toBe('Export as');
  });
});

describe.each(SCHEMES)('context-menu glyphs under forced colors, %s', (scheme) => {
  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  const probe = (root: HTMLElement, name: string): string =>
    computedValue(one(root, `.probe-${name}`), 'color');

  it('forces the resting tick, dot and caret to CanvasText', async () => {
    const root = await mountForced();
    const canvasText = probe(root, 'canvastext');
    expect(computedValue(one(root, '.item-check .cngx-menu-item__check > svg'), 'stroke')).toBe(canvasText);
    expect(computedValue(one(root, '.item-cozy .cngx-menu-item__check > svg'), 'fill')).toBe(canvasText);
    expect(computedValue(one(root, '.item-sub .cngx-menu-item__suffix > svg'), 'stroke')).toBe(canvasText);
  });

  it('paints the highlighted tick, dot and caret in HighlightText', async () => {
    const root = await mountForced();
    for (const item of ['.item-check', '.item-cozy', '.item-sub']) {
      one(root, item).classList.add('cngx-menu-item--highlighted');
    }
    const highlightText = probe(root, 'highlighttext');
    expect(computedValue(one(root, '.item-check .cngx-menu-item__check > svg'), 'stroke')).toBe(highlightText);
    expect(computedValue(one(root, '.item-cozy .cngx-menu-item__check > svg'), 'fill')).toBe(highlightText);
    expect(computedValue(one(root, '.item-sub .cngx-menu-item__suffix > svg'), 'stroke')).toBe(highlightText);
  });
});
