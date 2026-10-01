/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Disabled tabs, cards,
// paginator buttons and dots, and pending popover actions fade by colour, never
// opacity: 38% text (the disabled field recipe), a dashed card border, a filled
// popover action filled with the disabled colour. Quiet copy (paginator caret,
// popover empty state) takes the hint colour instead of opacity. Under forced
// colors the disabled ones read GrayText.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-surface-disabled-host',
  standalone: true,
  styleUrls: [
    '../core/theming/system-tokens.css',
    './tabs/styles/tabs-base.css',
    './card/card.component.css',
    './data/paginate/styles/paginator-base.css',
    './popover/popover-action.component.css',
    './popover/popover-panel.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <button type="button" class="cngx-tabs__tab tab-off" aria-disabled="true">Disabled</button>
        <div class="cngx-card cngx-card--disabled card-off">
          <h3 class="cngx-card__title">Title</h3>
          <p class="cngx-card__subtitle">Subtitle</p>
          <p class="card-body">Body</p>
        </div>
        <button type="button" class="cngx-paginator__button pgn-off" aria-disabled="true">Prev</button>
        <span class="cngx-paginator__dot dot-off" aria-disabled="true"></span>
        <span class="cngx-paginator__select-caret pgn-caret">v</span>
        <button type="button" class="cngx-popover-action cngx-popover-action--secondary pa-off" aria-disabled="true">
          Cancel
        </button>
        <button type="button" class="cngx-popover-action cngx-popover-action--primary pa-primary-off" aria-disabled="true">
          Save
        </button>
        <div class="cngx-popover-panel"><p class="cngx-popover-panel__empty panel-empty">Nothing here</p></div>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class SurfaceHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SurfaceHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled surfaces, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);
  const disabledColour = (root: HTMLElement): string =>
    computedValue(at(root, '.probe-disabled'), 'color');

  it('keeps every disabled surface at full opacity', () => {
    const root = mount();
    for (const sel of [
      '.tab-off',
      '.card-off .card-body',
      '.pgn-off',
      '.dot-off',
      '.pgn-caret',
      '.pa-off',
      '.pa-primary-off',
      '.panel-empty',
    ]) {
      expect(effectiveOpacity(at(root, sel)), sel).toBe(1);
    }
  });

  it('paints disabled tabs, paginator buttons and dots with the disabled colour', () => {
    const root = mount();
    const colour = disabledColour(root);
    for (const sel of ['.tab-off', '.pgn-off', '.dot-off']) {
      expect(computedValue(at(root, sel), 'color'), sel).toBe(colour);
    }
  });

  it('paints a disabled card body, title and subtitle by colour behind a dashed border', () => {
    const root = mount();
    const colour = disabledColour(root);
    for (const sel of ['.card-off .card-body', '.card-off .cngx-card__title', '.card-off .cngx-card__subtitle']) {
      expect(computedValue(at(root, sel), 'color'), sel).toBe(colour);
    }
    expect(computedValue(at(root, '.card-off'), 'border-top-style')).toBe('dashed');
  });

  it('paints a pending popover action by colour and fills a primary one', () => {
    const root = mount();
    expect(computedValue(at(root, '.pa-off'), 'color')).toBe(disabledColour(root));
    const primary = at(root, '.pa-primary-off');
    expect(computedValue(primary, 'background-color')).toBe(disabledColour(root));
    expect(computedValue(primary, 'color')).toBe(computedValue(at(root, '.probe-surface'), 'color'));
  });

  it('quiets the paginator caret and the popover empty state with the hint colour', () => {
    const root = mount();
    const muted = computedValue(at(root, '.probe-muted'), 'color');
    expect(computedValue(at(root, '.pgn-caret'), 'color')).toBe(muted);
    expect(computedValue(at(root, '.panel-empty'), 'color')).toBe(muted);
  });

  it('reads GrayText under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    for (const sel of [
      '.tab-off',
      '.card-off .cngx-card__title',
      '.card-off .card-body',
      '.pgn-off',
      '.pa-off',
    ]) {
      expect(computedValue(at(root, sel), 'color'), sel).toBe(gray);
    }
  });
});
