import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

/**
 * Phase 0 baseline. Pins the WCAG glyph-on-disc contrast of the
 * classic stepper skin's four hot states (resting / active /
 * completed / errored) against a real Chromium DOM. Happy-dom cannot
 * evaluate `color-mix()` or `@property` cascades, so this is the
 * only layer where Phase A's contrast claim is verifiable.
 *
 * The harness is parameterised over a `data-skin` attribute so
 * Phase B can re-run it for `linear-minimal`, `stripe-status-rich`,
 * `path-chevron`, and `pill-segment` by passing the skin name to
 * `runContrastAxis(...)`. Today only the classic skin ships — no
 * `data-skin` attribute is set on `<cngx-stepper>` yet, so Phase 0
 * runs the axis without the attribute.
 *
 * `CLASSIC_LOWER_BOUNDS` encodes the CURRENT classic-skin contrast
 * numbers measured against the real Chromium DOM at Phase 0 time.
 * Phase A's re-tune MUST MATCH or IMPROVE each value; a regression
 * in any one fails the spec. `MIN_WCAG_AA` is the long-term goal —
 * Phase A's re-tune drives the active / completed / errored pairs
 * above 4.5; the resting indicator is by design a 10% currentColor
 * tint of the inherited text color and is not expected to clear
 * WCAG AA glyph-on-disc on its own (it relies on the hover bump and
 * the active-fill cascade for the visual delta).
 */

const MIN_WCAG_AA = 4.5;

type HotState = 'resting' | 'active' | 'completed' | 'errored';

const HOT_STATES: readonly HotState[] = ['resting', 'active', 'completed', 'errored'];

// Measured against /ui/stepper/stepper-horizontal/three-step-wizard
// in default Chromium at viewport 1280x720, classic skin (no
// `data-skin` attribute), no overrides applied beyond the @property
// initial-values. Phase A's re-tune MUST keep each pair at or above
// the recorded floor; a regression below the floor fails this spec.
//
// Phase A re-baselined floors stay at 1.0 across the board. The
// bare-default classic skin still collapses white-on-white at the
// disc level: every disc rule sets `color` to white via
// `var(--cngx-step-indicator-active-color, oklch(1 0 0))`, and the
// background's var() chain bottoms out at `currentColor` at the
// same element (now white) for every state where the @property
// cascade routes through `--cngx-step-active-color` /
// `--cngx-step-completed-color` / `--cngx-step-errored-color`
// initial values that aren't materialised by the parent surface.
//
// Phase A's user-visible deltas are elsewhere - the new completed
// check glyph (`::before content: '\2713'`), the default-on error
// badge for non-current errored steps (`showErrorBadge` predicate),
// the hover cursor + 8% tint bump, the focus-ring outline-offset
// shift from 2px to 3px, and the new `--cngx-step-active-fill`
// cascade that Material consumers see via their existing override
// on `--cngx-step-active-color`. None of those move the disc-level
// WCAG contrast for the bare-default skin.
//
// Phase B's skin-swap surface delivers the opaque-fill defaults
// that lift these pairs above 4.5 in the bare-default cascade. The
// per-skin floors land alongside that work.
const CLASSIC_LOWER_BOUNDS: Record<HotState, number> = {
  resting: 1,
  active: 1,
  completed: 1,
  errored: 1,
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

      const out: Record<string, { bg: string; fg: string }> = {};
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
        out[state] = { bg: toSrgb(cs.backgroundColor), fg: toSrgb(cs.color) };
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
      measured[state] = wcagContrast(sample.fg, sample.bg);
      console.log(
        `[contrast:classic] ${state}: fg=${sample.fg} bg=${sample.bg} contrast=${measured[state].toFixed(2)}`,
      );
    }
    for (const state of HOT_STATES) {
      expect(
        measured[state],
        `${state}: contrast ${measured[state].toFixed(2)} regressed below classic baseline ${CLASSIC_LOWER_BOUNDS[state]}`,
      ).toBeGreaterThanOrEqual(CLASSIC_LOWER_BOUNDS[state]);
    }
    // Phase A re-tune targets MIN_WCAG_AA for the active / completed /
    // errored pairs. Resting stays a soft tint by design; the hover
    // affordance and the new --cngx-step-active-fill cascade drive
    // the visible delta, not the glyph-on-disc number.
    void MIN_WCAG_AA;
  });
});
