import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

/**
 * Phase 0 baseline, tightened post-Phase-B. Measures disc visibility
 * against the surrounding page surface (disc background vs first
 * opaque ancestor background) - a meaningful Pillar-2 regression
 * net. The original Phase 0 harness compared disc fg vs disc bg,
 * which silently passed white-on-white because both sides shared
 * the same `var(--cngx-step-indicator-active-color)` initial value.
 * The active-fill cascade fix lifts the active disc to primary blue
 * against the white compodocx surface; this harness verifies the
 * disc is visible as a shape, not just that the glyph is readable
 * against its own background.
 *
 * WCAG 2.1 SC 1.4.11 (Non-text Contrast) requires >=3:1 against the
 * surrounding surface for UI components. The active / completed /
 * errored discs target that floor. Resting is by design a 10%-
 * currentColor tint - effectively invisible against the page on
 * purpose; resting is exempt.
 */

const MIN_NON_TEXT_CONTRAST = 3;

type HotState = 'resting' | 'active' | 'completed' | 'errored';

const HOT_STATES: readonly HotState[] = ['resting', 'active', 'completed', 'errored'];

// Measured against /ui/stepper/stepper-horizontal/three-step-wizard
// in default Chromium at viewport 1280x720, classic skin (no
// `data-skin` attribute), no overrides applied beyond the @property
// initial-values. The polish-PR active-fill cascade fix lifts the
// active disc to primary blue (~oklch(0.55 0.18 250)) against the
// white page surface - approximately 4.7:1 by WCAG. Completed and
// errored sit at success-green and danger-red respectively; both
// clear 3:1 against white. Resting is exempt - by design a 10%
// currentColor tint that vanishes into the surface.
const CLASSIC_LOWER_BOUNDS: Record<HotState, number> = {
  resting: 1,
  active: MIN_NON_TEXT_CONTRAST,
  completed: MIN_NON_TEXT_CONTRAST,
  errored: MIN_NON_TEXT_CONTRAST,
};

function parseRgb(value: string): [number, number, number] {
  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) {
    throw new Error(`unparseable colour: ${value}`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channels = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function wcagContrast(fg: string, bg: string): number {
  const lFg = relativeLuminance(parseRgb(fg));
  const lBg = relativeLuminance(parseRgb(bg));
  const lighter = Math.max(lFg, lBg);
  const darker = Math.min(lFg, lBg);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('ui/stepper/stepper-skin-contrast', () => {
  test('classic skin: hot-state contrast meets or exceeds the recorded baseline', async ({
    page,
  }) => {
    await gotoDemo(page, 'ui/stepper/stepper-horizontal/three-step-wizard');
    await page.locator('button.cngx-stepper__step').first().waitFor({ state: 'visible' });

    // Probe the live indicator in place — the classic skin's CSS is
    // `@scope (.cngx-stepper)`-bound, so cloning the indicator out of
    // its scope loses the rules. Sequentially apply each hot state
    // to step 0, read the computed style, restore.
    const samples = await page.evaluate((states: readonly string[]) => {
      const stepper = document.querySelector('cngx-stepper');
      if (!stepper) {
        throw new Error('no <cngx-stepper> on the page');
      }
      const step = stepper.querySelector('button.cngx-stepper__step') as HTMLElement | null;
      const indicator = step?.querySelector('.cngx-stepper__indicator') as HTMLElement | null;
      if (!step || !indicator) {
        throw new Error('stepper present but step / indicator missing');
      }
      const originalAriaCurrent = step.getAttribute('aria-current');
      const originalDataState = indicator.getAttribute('data-state');

      // Modern Chromium returns oklch()-derived colors as oklab(...)
      // strings via getComputedStyle and rejects color-mix() inputs
      // on canvas.fillStyle. Route every probe through a hidden
      // element parked inside the stepper's @scope, then resolve via
      // ctx.fillStyle round-trip — Chrome normalises any color string
      // it accepts there to either rgb()/rgba() or keeps it as oklab.
      // The fallback below converts the oklab tuple analytically so
      // both code paths land in plain sRGB triples.
      const probeBg = document.createElement('div');
      probeBg.style.position = 'absolute';
      probeBg.style.inset = '-9999px auto auto -9999px';
      probeBg.style.width = '1px';
      probeBg.style.height = '1px';
      probeBg.style.visibility = 'hidden';
      stepper.appendChild(probeBg);

      const oklabToSrgb = (l: number, a: number, b: number): [number, number, number] => {
        const lp = l + 0.3963377774 * a + 0.2158037573 * b;
        const mp = l - 0.1055613458 * a - 0.0638541728 * b;
        const sp = l - 0.0894841775 * a - 1.291485548 * b;
        const lc = lp ** 3;
        const mc = mp ** 3;
        const sc = sp ** 3;
        const lr = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
        const lg = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
        const lb = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
        const gamma = (u: number): number => {
          const c = Math.max(0, Math.min(1, u));
          return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
        };
        return [Math.round(gamma(lr) * 255), Math.round(gamma(lg) * 255), Math.round(gamma(lb) * 255)];
      };

      const parseToSrgb = (cssColor: string): [number, number, number] | null => {
        const rgbMatch = cssColor.match(
          /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/,
        );
        if (rgbMatch) {
          return [Math.round(+rgbMatch[1]), Math.round(+rgbMatch[2]), Math.round(+rgbMatch[3])];
        }
        const oklabMatch = cssColor.match(
          /oklab\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/,
        );
        if (oklabMatch) {
          return oklabToSrgb(+oklabMatch[1], +oklabMatch[2], +oklabMatch[3]);
        }
        const oklchMatch = cssColor.match(
          /oklch\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/,
        );
        if (oklchMatch) {
          const lL = +oklchMatch[1];
          const c = +oklchMatch[2];
          const h = +oklchMatch[3];
          const a = c * Math.cos((h * Math.PI) / 180);
          const b = c * Math.sin((h * Math.PI) / 180);
          return oklabToSrgb(lL, a, b);
        }
        return null;
      };

      const toSrgb = (cssColor: string): string => {
        const direct = parseToSrgb(cssColor);
        if (direct) {
          return `rgb(${direct[0]}, ${direct[1]}, ${direct[2]})`;
        }
        // color-mix and named keywords: round-trip through the probe's
        // backgroundColor and re-read whatever Chromium normalises to.
        probeBg.style.backgroundColor = '';
        probeBg.style.backgroundColor = cssColor;
        const resolved = getComputedStyle(probeBg).backgroundColor;
        const viaProbe = parseToSrgb(resolved);
        if (viaProbe) {
          return `rgb(${viaProbe[0]}, ${viaProbe[1]}, ${viaProbe[2]})`;
        }
        throw new Error(`unresolvable color: ${cssColor} (round-tripped to ${resolved})`);
      };

      const resolveOpaqueAncestorBg = (el: HTMLElement): string => {
        let node: HTMLElement | null = el.parentElement;
        while (node) {
          const cs = getComputedStyle(node);
          const bg = cs.backgroundColor;
          // rgba(...,0) or transparent both pass through; keep walking.
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const parsed = parseToSrgb(bg);
            if (parsed) {
              return `rgb(${parsed[0]}, ${parsed[1]}, ${parsed[2]})`;
            }
          }
          node = node.parentElement;
        }
        // Default to white when nothing opaque sits between the disc
        // and the document root - matches typical compodocx surfaces.
        return 'rgb(255, 255, 255)';
      };

      const out: Record<string, { bg: string; fg: string; surface: string }> = {};
      for (const state of states) {
        step.removeAttribute('aria-current');
        indicator.removeAttribute('data-state');
        if (state === 'active') {
          step.setAttribute('aria-current', 'step');
        } else if (state === 'completed') {
          indicator.setAttribute('data-state', 'success');
        } else if (state === 'errored') {
          indicator.setAttribute('data-state', 'error');
        }
        // Force a layout flush so getComputedStyle reflects the
        // attribute-driven cascade.
        void indicator.offsetWidth;
        const cs = getComputedStyle(indicator);
        out[state] = {
          bg: toSrgb(cs.backgroundColor),
          fg: toSrgb(cs.color),
          surface: resolveOpaqueAncestorBg(indicator),
        };
      }

      probeBg.remove();

      if (originalAriaCurrent !== null) {
        step.setAttribute('aria-current', originalAriaCurrent);
      } else {
        step.removeAttribute('aria-current');
      }
      if (originalDataState !== null) {
        indicator.setAttribute('data-state', originalDataState);
      } else {
        indicator.removeAttribute('data-state');
      }
      return out;
    }, HOT_STATES as readonly string[]);

    const measured: Record<HotState, number> = {} as Record<HotState, number>;
    for (const state of HOT_STATES) {
      const sample = samples[state];
      expect(sample, `no sample captured for ${state}`).toBeDefined();
      // Disc vs surrounding surface - the Pillar-2 visibility check.
      // The disc glyph's own foreground colour is a downstream concern
      // captured at the unit-test level via the classic-skin snapshot.
      measured[state] = wcagContrast(sample.bg, sample.surface);
      console.log(
        `[contrast:classic] ${state}: disc=${sample.bg} surface=${sample.surface} glyph=${sample.fg} contrast=${measured[state].toFixed(2)}`,
      );
    }
    for (const state of HOT_STATES) {
      expect(
        measured[state],
        `${state}: disc-vs-surface contrast ${measured[state].toFixed(2)} regressed below baseline ${CLASSIC_LOWER_BOUNDS[state]}`,
      ).toBeGreaterThanOrEqual(CLASSIC_LOWER_BOUNDS[state]);
    }
  });
});
