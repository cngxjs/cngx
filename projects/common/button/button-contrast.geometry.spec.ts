import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio, oklabOf, parkPointer } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { CngxButton } from './button.component';

// Runs in a real Chromium (the `test-geometry` target). Pins WCAG 1.4.3 for
// the label on a solid primary / danger fill in both default schemes: the
// default palette alone, no theme bridge. The outline, ghost and link variants
// paint the tone text rung on the surface; their primary and danger text must
// clear 4.5:1 and read as two colours. jsdom reports `''` for every read.

const TEXT_VARIANTS = ['outline', 'ghost', 'link'] as const;

@Component({
  selector: 'cngx-button-contrast-geometry-host',
  standalone: true,
  imports: [CngxButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    './button.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <p [attr.data-color-scheme]="scheme" style="--cngx-button-transition: 0s">
        <button cngxButton tone="primary" class="b-primary-{{ scheme }}">Save</button>
        <button cngxButton tone="danger" class="b-danger-{{ scheme }}">Delete</button>
        @for (variant of textVariants; track variant) {
          <button
            [cngxButton]="variant"
            tone="primary"
            class="t-{{ variant }}-primary-{{ scheme }}"
          >
            Save
          </button>
          <button [cngxButton]="variant" tone="danger" class="t-{{ variant }}-danger-{{ scheme }}">
            Delete
          </button>
        }
        <button cngxButton="outline" class="o-neutral-{{ scheme }}">Cancel</button>
        <span class="surface-{{ scheme }}" style="color: var(--cngx-color-surface)"></span>
      </p>
    }
  `,
})
class ContrastHost {
  protected readonly schemes = ['light', 'dark'] as const;
  protected readonly textVariants = TEXT_VARIANTS;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ContrastHost);
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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('solid button label contrast (default palette)', () => {
  it.each([
    ['primary', 'light'],
    ['primary', 'dark'],
    ['danger', 'light'],
    ['danger', 'dark'],
  ] as const)('solid %s in the %s scheme clears 4.5:1', (tone, scheme) => {
    const button = query(mount(), `.b-${tone}-${scheme}`);
    const ratio = contrastRatio(
      computedValue(button, 'color'),
      computedValue(button, 'background-color'),
    );
    expect(ratio, `${tone} / ${scheme}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});

describe('tone text contrast (default palette)', () => {
  const cases = TEXT_VARIANTS.flatMap((variant) =>
    (['light', 'dark'] as const).map((scheme) => [variant, scheme] as const),
  );

  it.each(cases)('%s primary and danger text in the %s scheme clear 4.5:1', (variant, scheme) => {
    const root = mount();
    const surface = computedValue(query(root, `.surface-${scheme}`), 'color');
    for (const tone of ['primary', 'danger'] as const) {
      const color = computedValue(query(root, `.t-${variant}-${tone}-${scheme}`), 'color');
      const ratio = contrastRatio(color, surface);
      expect(ratio, `${tone}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(cases)(
    '%s primary and danger text in the %s scheme sit 0.08 apart',
    (variant, scheme) => {
      const root = mount();
      const [l1, a1, b1] = oklabOf(
        computedValue(query(root, `.t-${variant}-primary-${scheme}`), 'color'),
      );
      const [l2, a2, b2] = oklabOf(
        computedValue(query(root, `.t-${variant}-danger-${scheme}`), 'color'),
      );
      expect(Math.hypot(l1 - l2, a1 - a2, b1 - b2)).toBeGreaterThanOrEqual(0.08);
    },
  );
});

describe('neutral outline boundary contrast (default palette)', () => {
  it.each(['light', 'dark'] as const)(
    'clears 3:1 against the surface in the %s scheme',
    (scheme) => {
      const root = mount();
      const surface = computedValue(query(root, `.surface-${scheme}`), 'color');
      const border = computedValue(query(root, `.o-neutral-${scheme}`), 'border-top-color');
      const ratio = contrastRatio(border, surface);
      expect(ratio, `${scheme}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
    },
  );
});

// The border is a translucent tone mix, so the ratio is read over the surface
// it sits on, flattened the way the screen shows it.
function flatten(color: string, backdrop: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

async function stateRatio(
  tone: 'primary' | 'danger',
  scheme: 'light' | 'dark',
  state: 'hover' | 'pressed',
): Promise<number> {
  const button = query(mount(), `.b-${tone}-${scheme}`);
  // The host's transition token does not reach the button, and a hover read
  // mid-transition returns the rest fill.
  button.style.transition = 'none';
  if (state === 'hover') {
    await userEvent.hover(button);
  } else {
    button.classList.add('cngx-pressed');
  }
  const ratio = contrastRatio(
    computedValue(button, 'color'),
    computedValue(button, 'background-color'),
  );
  button.classList.remove('cngx-pressed');
  await parkPointer();
  return ratio;
}

describe('solid button label contrast on hover and press (default palette)', () => {
  const title = 'solid %s in the %s scheme clears 4.5:1 on %s';

  async function expectClears(
    tone: 'primary' | 'danger',
    scheme: 'light' | 'dark',
    state: 'hover' | 'pressed',
  ): Promise<void> {
    const ratio = await stateRatio(tone, scheme, state);
    expect(ratio, `${tone} / ${scheme} / ${state}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      4.5,
    );
  }

  it.each([
    ['primary', 'light', 'hover'],
    ['primary', 'light', 'pressed'],
    ['primary', 'dark', 'hover'],
    ['danger', 'light', 'hover'],
    ['danger', 'light', 'pressed'],
  ] as const)(title, expectClears);

  // E10: expected to fail until PR 8 (T6) shades the dark-scheme fill away from the dark ink (3.92, 4.22, 3.40 today).
  it.fails.each([
    ['primary', 'dark', 'pressed'],
    ['danger', 'dark', 'hover'],
    ['danger', 'dark', 'pressed'],
  ] as const)(title, expectClears);
});

describe('toned outline boundary contrast (default palette)', () => {
  const title = 'outline %s clears 3:1 against the surface in the %s scheme';

  function expectClears(tone: 'primary' | 'danger', scheme: 'light' | 'dark'): void {
    const root = mount();
    const surface = computedValue(query(root, `.surface-${scheme}`), 'color');
    const border = computedValue(query(root, `.t-outline-${tone}-${scheme}`), 'border-top-color');
    const ratio = contrastRatio(flatten(border, surface), surface);
    expect(ratio, `${tone} / ${scheme}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  }

  it.each([['primary', 'dark']] as const)(title, expectClears);

  // E7: expected to fail until PR 8 (T7) raises the 60% tone mix of the outline border (2.06, 2.37, 2.79 today).
  it.fails.each([
    ['primary', 'light'],
    ['danger', 'light'],
    ['danger', 'dark'],
  ] as const)(title, expectClears);
});
