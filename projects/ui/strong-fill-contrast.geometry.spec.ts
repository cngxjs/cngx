import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). A solid primary fill
// that carries a label paints from the strong pair (`--cngx-color-primary-strong`
// with `--cngx-color-on-primary-strong`), like a solid primary button, so the
// label clears 4.5:1 in both default schemes with no theme bridge loaded.

const SCHEMES = ['light', 'dark'] as const;

interface FillCase {
  readonly name: string;
  readonly selector: string;
  readonly pseudo?: '::before';
}

const CASES: readonly FillCase[] = [
  { name: 'tab-nav active pill', selector: '.tab-nav-pill .cngx-tab-nav__link--active' },
  { name: 'tab-group active pill', selector: '.tab-group-pill .cngx-tabs__tab' },
  { name: 'accordion plus-minus open box', selector: '.accordion-pm .cngx-accordion-item__chevron' },
  { name: 'accordion bento open tile', selector: '.accordion-bento .cngx-accordion-item__leading' },
  {
    name: 'data-grid-accordion spreadsheet open gutter',
    selector: '.dga-sheet .cngx-dga-row__cells',
    pseudo: '::before',
  },
];

@Component({
  selector: 'cngx-strong-fill-contrast-host',
  standalone: true,
  styleUrls: [
    '../core/theming/layers.css',
    '../core/theming/system-tokens.css',
    '../common/tabs/styles/tabs-base.css',
    './tabs/tab-nav.component.css',
    './tabs/tab-group.component.css',
    './accordion/accordion-skins.css',
    './data-grid-accordion/data-grid-accordion-skins.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="background: var(--cngx-color-surface); --cngx-duration-fast: 0s"
      >
        <span class="probe-strong" style="color: var(--cngx-color-primary-strong)"></span>
        <span class="probe-on-strong" style="color: var(--cngx-color-on-primary-strong)"></span>
        <nav class="cngx-tab-nav tab-nav-pill" data-skin="pill">
          <a class="cngx-tab-nav__link cngx-tab-nav__link--active">Overview</a>
        </nav>
        <div class="cngx-tab-group tab-group-pill" data-skin="pill">
          <div role="tab" class="cngx-tabs__tab" aria-selected="true">Overview</div>
        </div>
        <div class="cngx-accordion-group accordion-pm" data-skin="plus-minus">
          <div class="cngx-accordion-item" data-expanded>
            <span class="cngx-accordion-item__chevron">+</span>
          </div>
        </div>
        <div class="cngx-accordion-group accordion-bento" data-skin="bento">
          <div class="cngx-accordion-item" data-expanded>
            <span class="cngx-accordion-item__leading">A</span>
          </div>
        </div>
        <div class="cngx-data-grid-accordion dga-sheet" data-skin="spreadsheet">
          <div class="cngx-dga-row" data-expanded>
            <div class="cngx-dga-row__cells"><span class="cngx-dga-cell">Row</span></div>
          </div>
        </div>
      </div>
    }
  `,
})
class StrongFillHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(StrongFillHost);
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

function read(el: HTMLElement, property: string, pseudo?: string): string {
  return pseudo ? getComputedStyle(el, pseudo).getPropertyValue(property) : computedValue(el, property);
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('strong primary fill under a label, %s', (scheme) => {
  it.each(CASES)('$name paints the strong pair at 4.5:1', ({ selector, pseudo }) => {
    const root = mount();
    const scope = one(root, `.scheme-${scheme}`);
    const el = one(scope, selector);
    const fill = read(el, 'background-color', pseudo);
    const label = read(el, 'color', pseudo);
    expect(contrastRatio(label, fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(fill, computedValue(one(scope, '.probe-strong'), 'color'))).toBe(1);
    expect(contrastRatio(label, computedValue(one(scope, '.probe-on-strong'), 'color'))).toBe(1);
  });
});
