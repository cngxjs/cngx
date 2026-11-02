import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxButton, type CngxButtonSize } from '@cngx/common/button';
import { CngxAsyncClick, CngxMenu, CngxMenuItem, type AsyncAction } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { accessibleName, computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';
import { CngxMenuButton } from './menu-button.component';

// Runs in a real Chromium (the `test-geometry` target): the menu button must
// sit on the cngxButton row at every size and keep its caret at 1em of the
// button font. jsdom reports `''` for every read.

type Density = 'comfortable' | 'compact' | 'spacious';

@Component({
  selector: 'cngx-menu-button-geometry-host',
  standalone: true,
  imports: [CngxButton, CngxMenuButton, CngxAsyncClick, CngxMenu, CngxMenuItem, CngxPopover],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.data-density]="density()" [attr.data-motion]="motion()">
      @for (size of sizes; track size) {
        <p>
          <button cngxButton class="b-{{ size }}" [size]="size">Export</button>
          <button cngxMenuButton class="m-{{ size }}" [size]="size" [menu]="menu" [popover]="pop">
            Export
          </button>
        </p>
      }
      <p>
        <button cngxMenuButton class="m-busy" [cngxAsyncClick]="action" [menu]="menu" [popover]="pop">
          Export
        </button>
      </p>
      <div cngxPopover #pop="cngxPopover">
        <ul cngxMenu [label]="'Export format'" tabindex="0" #menu="cngxMenu">
          <li cngxMenuItem value="pdf">PDF</li>
        </ul>
      </div>
    </div>
  `,
})
class GeometryHost {
  readonly sizes: readonly CngxButtonSize[] = ['xs', 'sm', 'md', 'lg'];
  readonly density = signal<Density>('comfortable');
  readonly motion = signal<'reduced' | null>(null);
  readonly action: AsyncAction = () => new Promise<void>(() => undefined);
}

@Component({
  selector: 'cngx-geometry-custom-caret',
  standalone: true,
  template: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>`,
})
class CustomCaret {}

@Component({
  selector: 'cngx-menu-button-custom-caret-host',
  standalone: true,
  imports: [CngxMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
  viewProviders: [{ provide: CNGX_BUTTON_CARET_ICON, useValue: CustomCaret }],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button cngxMenuButton class="m-custom" [menu]="menu" [popover]="pop">Sort</button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Sort by'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="name">Name</li>
      </ul>
    </div>
  `,
})
class CustomCaretHost {}

let mountedRoot: HTMLElement | null = null;

function mount(density: Density = 'comfortable', motion: 'reduced' | null = null) {
  const fixture = TestBed.createComponent(GeometryHost);
  fixture.componentInstance.density.set(density);
  fixture.componentInstance.motion.set(motion);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  return { fixture, root: mountedRoot };
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

function px(el: Element, property: string): number {
  return parseFloat(computedValue(el, property));
}

describe('CngxMenuButton geometry', () => {
  afterEach(() => {
    mountedRoot?.remove();
    mountedRoot = null;
  });

  for (const density of ['comfortable', 'compact', 'spacious'] as const) {
    it(`sits on the cngxButton row at every size (${density})`, () => {
      const { root } = mount(density);
      for (const size of ['xs', 'sm', 'md', 'lg']) {
        const plain = query(root, `.b-${size}`).getBoundingClientRect().height;
        const menu = query(root, `.m-${size}`).getBoundingClientRect().height;
        expect(menu).toBeCloseTo(plain, 1);
      }
    });
  }

  it('sizes the caret at 1em of the button font', () => {
    const { root } = mount();
    for (const size of ['xs', 'sm', 'md', 'lg']) {
      const button = query(root, `.m-${size}`);
      const caret = query(button, '.cngx-menu-button__caret');
      const rect = caret.getBoundingClientRect();
      expect(rect.width).toBeCloseTo(px(button, 'font-size'), 1);
      expect(rect.height).toBeCloseTo(px(button, 'font-size'), 1);
    }
  });

  it('sizes a CNGX_BUTTON_CARET_ICON glyph at 1em like the default caret', () => {
    const fixture = TestBed.createComponent(CustomCaretHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const button = query(mountedRoot, '.m-custom');
    const glyph = query(button, '.cngx-menu-button__caret svg').getBoundingClientRect();
    expect(glyph.width).toBeCloseTo(px(button, 'font-size'), 1);
    expect(glyph.height).toBeCloseTo(px(button, 'font-size'), 1);
  });

  it('centres a CNGX_BUTTON_CARET_ICON glyph on the button (no baseline gap from its host)', () => {
    const fixture = TestBed.createComponent(CustomCaretHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    const button = query(mountedRoot, '.m-custom').getBoundingClientRect();
    const caret = query(mountedRoot, '.m-custom .cngx-menu-button__caret').getBoundingClientRect();
    expect(caret.height).toBeCloseTo(caret.width, 1);
    expect(caret.top + caret.height / 2).toBeCloseTo(button.top + button.height / 2, 0);
  });

  it('trims the end padding like a filled end slot', () => {
    const { root } = mount();
    const button = query(root, '.m-md');
    expect(px(button, 'padding-right')).toBeCloseTo(px(button, 'padding-left') * 0.75, 1);
  });

  it('turns the caret while the menu is open, timed from the button transition', () => {
    const { fixture, root } = mount();
    const button = query(root, '.m-md');
    const caret = query(button, '.cngx-menu-button__caret');
    expect(computedValue(caret, 'transition-property')).toBe('rotate');
    expect(computedValue(caret, 'transition-duration')).toBe(
      computedValue(button, 'transition-duration').split(',')[0].trim(),
    );
    expect(computedValue(caret, 'rotate')).toBe('none');

    // Transition off so the read after the click is the end state.
    button.style.setProperty('--cngx-menu-button-caret-transition', '0s');
    button.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(button.getAttribute('data-expanded')).toBe('true');
    expect(computedValue(caret, 'rotate')).toBe('180deg');

    button.click();
    fixture.detectChanges();
  });

  it('keeps the accessible name while a co-hosted cngxAsyncClick run is pending', async () => {
    const { fixture, root } = mount();
    const button = query(root, '.m-busy');
    expect(await accessibleName('.m-busy')).toBe('Export');
    button.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(button.dataset['busy']).toBe('true');
    expect(await accessibleName('.m-busy')).toBe('Export');
    expect(computedValue(query(button, '.cngx-button__label'), 'opacity')).toBe('0');
  });

  it('drops the turn transition under reduced motion', () => {
    const { root } = mount('comfortable', 'reduced');
    const caret = query(root, '.m-md .cngx-menu-button__caret');
    expect(computedValue(caret, 'transition-duration')).toBe('0s');
  });
});
