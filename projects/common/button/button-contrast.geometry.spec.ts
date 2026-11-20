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

// M2 and M3 themes typed dark and light, each under both schemes
// (button-contrast-m2 / -m3.spec-host.scss compile the bridge for both types).
const M2_TONES = ['primary', 'danger'] as const;
const SCHEME_MISMATCHES = [
  { theme: 'dark', scheme: 'light' },
  { theme: 'light', scheme: 'dark' },
] as const;

@Component({
  selector: 'cngx-button-contrast-geometry-host',
  standalone: true,
  imports: [CngxButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../theming/components/cngx-button.css',
    './button-contrast-m2.spec-host.scss',
    './button-contrast-m3.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (theme of schemes; track theme) {
      @for (scheme of schemes; track scheme) {
        <div [attr.data-color-scheme]="scheme">
          <p class="m3-{{ theme }} m3-{{ theme }}-{{ scheme }}" style="padding: 8px">
            <button cngxButton class="m3-neutral-{{ theme }}-{{ scheme }}">Close</button>
          </p>
        </div>
        <div [attr.data-color-scheme]="scheme">
          <p class="m2-{{ theme }} m2-{{ theme }}-{{ scheme }}" style="padding: 8px">
            @for (tone of m2Tones; track tone) {
              <button
                cngxButton="secondary"
                [tone]="tone"
                class="m2-{{ tone }}-{{ theme }}-{{ scheme }}"
              >
                Archive
              </button>
            }
          </p>
        </div>
      }
    }
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
        <button cngxButton class="n-solid-{{ scheme }}">Close</button>
        @for (tone of tones; track tone) {
          <button cngxButton="secondary" [tone]="tone" class="s-{{ tone }}-{{ scheme }}">
            Archive
          </button>
        }
        <span class="surface-{{ scheme }}" style="color: var(--cngx-color-surface)"></span>
      </p>
    }
  `,
})
class ContrastHost {
  protected readonly schemes = ['light', 'dark'] as const;
  protected readonly textVariants = TEXT_VARIANTS;
  protected readonly tones = ['neutral', 'primary', 'danger'] as const;
  protected readonly m2Tones = M2_TONES;
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

  it.each([
    ['primary', 'dark'],
    ['primary', 'light'],
    ['danger', 'light'],
    ['danger', 'dark'],
  ] as const)(title, expectClears);
});

// The secondary fill is a translucent tone wash, so the label is read against
// the wash flattened over the surface, the way the screen shows it.
async function secondaryRatio(
  tone: 'neutral' | 'primary' | 'danger',
  scheme: 'light' | 'dark',
  state: 'rest' | 'hover' | 'pressed',
): Promise<number> {
  const root = mount();
  const surface = computedValue(query(root, `.surface-${scheme}`), 'color');
  const button = query(root, `.s-${tone}-${scheme}`);
  button.style.transition = 'none';
  if (state === 'hover') {
    await userEvent.hover(button);
  }
  if (state === 'pressed') {
    button.classList.add('cngx-pressed');
  }
  const fill = flatten(computedValue(button, 'background-color'), surface);
  const ratio = contrastRatio(computedValue(button, 'color'), fill);
  button.classList.remove('cngx-pressed');
  await parkPointer();
  return ratio;
}

describe('secondary button label contrast at rest, hover and press (default palette)', () => {
  const cases = (['neutral', 'primary', 'danger'] as const).flatMap((tone) =>
    (['light', 'dark'] as const).flatMap((scheme) =>
      (['rest', 'hover', 'pressed'] as const).map((state) => [tone, scheme, state] as const),
    ),
  );

  it.each(cases)('secondary %s in the %s scheme clears 4.5:1 at %s', async (tone, scheme, state) => {
    const ratio = await secondaryRatio(tone, scheme, state);
    expect(ratio, `${tone} / ${scheme} / ${state}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

// A typed M2 theme pins its scheme knobs, so the secondary label shifts the
// way the theme's own scheme does, whatever the OS or data-color-scheme says.
async function m2Secondary(
  tone: (typeof M2_TONES)[number],
  theme: 'light' | 'dark',
  scheme: 'light' | 'dark',
  state: 'rest' | 'hover' | 'pressed',
): Promise<{ color: string; ratio: number }> {
  const root = mount();
  const page = computedValue(query(root, `.m2-${theme}-${scheme}`), 'background-color');
  const button = query(root, `.m2-${tone}-${theme}-${scheme}`);
  button.style.transition = 'none';
  if (state === 'hover') {
    await userEvent.hover(button);
  }
  if (state === 'pressed') {
    button.classList.add('cngx-pressed');
  }
  const color = computedValue(button, 'color');
  const ratio = contrastRatio(color, flatten(computedValue(button, 'background-color'), page));
  button.classList.remove('cngx-pressed');
  await parkPointer();
  mountedRoot?.remove();
  mountedRoot = null;
  return { color, ratio };
}

describe('secondary button label on an M2 theme', () => {
  const cases = (['light', 'dark'] as const).flatMap((theme) =>
    (['light', 'dark'] as const).flatMap((scheme) =>
      M2_TONES.flatMap((tone) =>
        (['rest', 'hover', 'pressed'] as const).map(
          (state) => [tone, theme, scheme, state] as const,
        ),
      ),
    ),
  );

  it.each(cases)(
    'secondary %s on M2 %s under a %s scheme clears 4.5:1 at %s',
    async (tone, theme, scheme, state) => {
      const { ratio } = await m2Secondary(tone, theme, scheme, state);
      expect(
        ratio,
        `${tone} / M2 ${theme} / ${state}: ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});

// A typed M3 theme pins its scheme knobs too: the neutral solid fill is the
// one of the theme's own scheme, whatever the OS or data-color-scheme says.
async function m3NeutralFill(
  theme: 'light' | 'dark',
  scheme: 'light' | 'dark',
  state: 'rest' | 'hover' | 'pressed',
): Promise<string> {
  const root = mount();
  const button = query(root, `.m3-neutral-${theme}-${scheme}`);
  button.style.transition = 'none';
  if (state === 'hover') {
    await userEvent.hover(button);
  }
  if (state === 'pressed') {
    button.classList.add('cngx-pressed');
  }
  const fill = computedValue(button, 'background-color');
  button.classList.remove('cngx-pressed');
  await parkPointer();
  mountedRoot?.remove();
  mountedRoot = null;
  return fill;
}

describe('neutral solid fill on a mismatched M3 theme', () => {
  const cases = SCHEME_MISMATCHES.flatMap(({ theme, scheme }) =>
    (['rest', 'hover', 'pressed'] as const).map((state) => [theme, scheme, state] as const),
  );

  it.each(cases)(
    'neutral solid on M3 %s under a %s scheme paints its own scheme fill at %s',
    async (theme, scheme, state) => {
      const mismatched = await m3NeutralFill(theme, scheme, state);
      const matched = await m3NeutralFill(theme, theme, state);
      expect(mismatched).toBe(matched);
    },
  );
});

// The secondary wash has to read as a fill, not as the page: flattened over
// the surface it clears a floor against the surface itself. The neutral solid
// fill stays the stronger neutral rung: darker in light, lighter in dark.
// 1.20, not 1.22: engine colour rounding moves the light neutral wash by a few
// hundredths (it measures 0.01 above 1.22), so 1.22 had no margin and the
// wash is the owner's chosen paint (#846).
const FILL_FLOOR = 1.2;

describe('secondary button fill against the page (default palette)', () => {
  const cases = (['neutral', 'primary', 'danger'] as const).flatMap((tone) =>
    (['light', 'dark'] as const).map((scheme) => [tone, scheme] as const),
  );

  it.each(cases)(`secondary %s in the %s scheme clears ${FILL_FLOOR}:1 at rest`, (tone, scheme) => {
    const root = mount();
    const surface = computedValue(query(root, `.surface-${scheme}`), 'color');
    const fill = flatten(
      computedValue(query(root, `.s-${tone}-${scheme}`), 'background-color'),
      surface,
    );
    const ratio = contrastRatio(fill, surface);
    expect(ratio, `${tone} / ${scheme}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(FILL_FLOOR);
  });

  it.each(['light', 'dark'] as const)(
    'neutral solid sits past neutral secondary in the %s scheme',
    (scheme) => {
      const root = mount();
      const surface = computedValue(query(root, `.surface-${scheme}`), 'color');
      const [secondary] = oklabOf(
        flatten(computedValue(query(root, `.s-neutral-${scheme}`), 'background-color'), surface),
      );
      const [solid] = oklabOf(
        flatten(computedValue(query(root, `.n-solid-${scheme}`), 'background-color'), surface),
      );
      const step = scheme === 'light' ? secondary - solid : solid - secondary;
      expect(step, `solid ${solid.toFixed(3)} / secondary ${secondary.toFixed(3)}`).toBeGreaterThan(0);
    },
  );
});
