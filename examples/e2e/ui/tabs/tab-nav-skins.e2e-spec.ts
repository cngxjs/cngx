import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxTabNav paints all five CngxTabsSkin values (line / contained /
// segmented / pill / pill-outline). jsdom has no layout engine, so the unit
// spec only guards the [data-skin] attribute contract; THIS spec is the real
// paint guard, in a real browser. It is written colour-exact (each skin's
// active link / host equals its own resolved skin-scoped token, read from the
// host, not hardcoded) and pairwise-distinct (a skin silently rendering `line`
// - the exact bug this work fixes - turns the run red rather than green).

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

test.describe('ui/tabs/tab-nav-skins', () => {
  test('every skin paints its own colour-exact, pairwise-distinct signature', async ({ page }) => {
    await gotoDemo(page, 'ui/tabs/tab-router-nav/all-skins');
    await expect(page.locator('cngx-tab-nav[aria-label="pill skin"]')).toBeVisible();

    const data = await page.evaluate(() => {
      const nav = (label: string): HTMLElement | null =>
        document.querySelector(`cngx-tab-nav[aria-label="${label}"]`);

      // Normalise a token value through the browser: assign it to a probe
      // element under the same host and read back the computed colour, so a
      // token (oklch / color-mix) and a painted value compare as identical
      // strings (both go through the same getComputedStyle normalisation).
      const tokenColor = (host: HTMLElement, token: string): string => {
        const raw = getComputedStyle(host).getPropertyValue(token).trim();
        const probe = document.createElement('span');
        probe.style.color = raw || 'transparent';
        host.appendChild(probe);
        const rgb = getComputedStyle(probe).color;
        probe.remove();
        return rgb;
      };

      const collect = (label: string) => {
        const host = nav(label);
        if (!host) {
          return { found: false } as const;
        }
        const active = host.querySelector('.cngx-tab-nav__link--active') as HTMLElement | null;
        const inactive = host.querySelector(
          '.cngx-tab-nav__link:not(.cngx-tab-nav__link--active)',
        ) as HTMLElement | null;
        const hostCS = getComputedStyle(host);
        const activeCS = active ? getComputedStyle(active) : null;
        const afterCS = active ? getComputedStyle(active, '::after') : null;
        const beforeCS = active ? getComputedStyle(active, '::before') : null;
        const inactiveAfterCS = inactive ? getComputedStyle(inactive, '::after') : null;
        return {
          found: true as const,
          hostBg: hostCS.backgroundColor,
          activeBg: activeCS?.backgroundColor ?? null,
          activeBorderTopColor: activeCS?.borderTopColor ?? null,
          activeBoxShadow: activeCS?.boxShadow ?? null,
          afterBg: afterCS?.backgroundColor ?? null,
          afterTransform: afterCS?.transform ?? null,
          afterWidth: afterCS?.width ?? null,
          afterLeft: afterCS?.left ?? null,
          afterRight: afterCS?.right ?? null,
          beforeContent: beforeCS?.content ?? null,
          inactiveAfterTransform: inactiveAfterCS?.transform ?? null,
        };
      };

      const hostFor = (label: string) => nav(label)!;
      return {
        line: collect('line skin'),
        contained: collect('contained skin'),
        segmented: collect('segmented skin'),
        pill: collect('pill skin'),
        pillOutline: collect('pill-outline skin'),
        containedVertical: collect('contained vertical'),
        containedError: collect('contained active error'),
        tokens: {
          pillActiveBg: tokenColor(hostFor('pill skin'), '--cngx-tab-active-bg'),
          pillOutlineColor: tokenColor(hostFor('pill-outline skin'), '--cngx-tab-pill-outline-color'),
          pillOutlineBg: tokenColor(hostFor('pill-outline skin'), '--cngx-tab-pill-outline-bg'),
          segmentedTrackBg: tokenColor(hostFor('segmented skin'), '--cngx-tab-segmented-track-bg'),
          segmentedSurface: tokenColor(hostFor('segmented skin'), '--cngx-color-surface'),
          containedSurface: tokenColor(hostFor('contained skin'), '--cngx-color-surface'),
          containedAccent: tokenColor(
            hostFor('contained skin'),
            '--cngx-tab-contained-accent-color',
          ),
        },
      };
    });

    // All seven navs rendered.
    for (const [label, entry] of Object.entries(data)) {
      if (label === 'tokens') {
        continue;
      }
      expect((entry as { found: boolean }).found, `${label} nav missing`).toBe(true);
    }

    // pill: the active link takes the resolved fill token, not merely a
    // non-transparent colour - read --cngx-tab-active-bg from the pill host so
    // a future re-point does not silently pass.
    expect(data.pill.activeBg, 'pill active fill is transparent').not.toBe(TRANSPARENT);
    expect(data.pill.activeBg, 'pill active fill != resolved --cngx-tab-active-bg').toBe(
      data.tokens.pillActiveBg,
    );

    // pill-outline: the active border equals the resolved outline colour AND
    // the fill is the tint (distinct from pill's solid fill).
    expect(
      data.pillOutline.activeBorderTopColor,
      'pill-outline active border != resolved outline colour',
    ).toBe(data.tokens.pillOutlineColor);
    expect(data.pillOutline.activeBg, 'pill-outline active fill != resolved tint').toBe(
      data.tokens.pillOutlineBg,
    );
    expect(data.pillOutline.activeBg, 'pill-outline fill collapsed to pill solid').not.toBe(
      data.pill.activeBg,
    );

    // segmented: the host carries the muted track (a color-mix, so probe
    // read-back, not raw token), the active tile lifts to the plain surface
    // with a shadow.
    expect(data.segmented.hostBg, 'segmented host track is transparent').not.toBe(TRANSPARENT);
    expect(data.segmented.hostBg, 'segmented host != resolved track mix').toBe(
      data.tokens.segmentedTrackBg,
    );
    expect(data.segmented.activeBg, 'segmented active tile != resolved surface').toBe(
      data.tokens.segmentedSurface,
    );
    expect(data.segmented.activeBoxShadow, 'segmented active tile has no lift shadow').not.toBe(
      'none',
    );

    // contained: the active folder tab is the opaque surface; the accent bar
    // on the repurposed ::after is the resolved accent colour and is grown
    // (transform not the inactive collapsed matrix).
    expect(data.contained.activeBg, 'contained active tab != resolved surface').toBe(
      data.tokens.containedSurface,
    );
    expect(data.contained.afterBg, 'contained ::after accent != resolved accent colour').toBe(
      data.tokens.containedAccent,
    );
    expect(
      data.contained.afterTransform,
      'contained active accent did not grow (still collapsed)',
    ).not.toBe(data.contained.inactiveAfterTransform);

    // Collision cross-check: the active+error contained link keeps its error
    // glyph on ::before (the accent moved to ::after; ::before is untouched),
    // while the non-error contained active link generates no ::before glyph -
    // proving the accent did not erase the error glyph.
    expect(
      data.containedError.beforeContent,
      'active+error contained link lost its ::before glyph',
    ).not.toBe(data.contained.beforeContent);
    expect(
      ['none', 'normal', '', null].includes(data.containedError.beforeContent),
      'active+error contained ::before produced no glyph box',
    ).toBe(false);
    // The accent bar still rides ::after on the active+error link too.
    expect(
      data.containedError.afterBg,
      'active+error contained accent != resolved accent colour',
    ).toBe(data.tokens.containedAccent);

    // line: the active link is transparent and its indicator shows (::after
    // grown), while an inactive link's ::after stays collapsed - the pre-fix
    // bug was they did not differ.
    expect(data.line.activeBg, 'line active link is not transparent').toBe(TRANSPARENT);
    expect(
      data.line.afterTransform,
      'line active/inactive indicator do not differ (skin not painting)',
    ).not.toBe(data.line.inactiveAfterTransform);

    // Vertical contained guards the (0,3,1) specificity fix: the accent sits
    // on the inline-start (leading) edge at the 3px accent width, NOT the base
    // 2px inline-end indicator. (`right` resolves to a used pixel value on an
    // abs-positioned box, so the leading edge is proven by the offsets: the
    // small offset is `left`, i.e. the accent hugs the leading side.)
    expect(
      data.containedVertical.afterWidth,
      'vertical contained accent is not the 3px accent width',
    ).toBe('3px');
    expect(
      data.containedVertical.afterWidth,
      'vertical contained accent fell back to the base 2px indicator width',
    ).not.toBe('2px');
    const leftOffset = Math.abs(parseFloat(data.containedVertical.afterLeft ?? 'NaN'));
    const rightOffset = Math.abs(parseFloat(data.containedVertical.afterRight ?? 'NaN'));
    expect(
      leftOffset < rightOffset,
      'vertical contained accent is on the inline-end edge, not the leading edge',
    ).toBe(true);

    // Cross-skin distinctness: the five signature tuples are pairwise-distinct,
    // so a skin silently falling back to `line` (or to another skin's paint)
    // fails here even if its individual assertion somehow passed.
    const signature = (e: (typeof data)['line']): string =>
      [e.hostBg, e.activeBg, e.activeBorderTopColor, e.afterBg].join('|');
    const sigs = {
      line: signature(data.line),
      contained: signature(data.contained),
      segmented: signature(data.segmented),
      pill: signature(data.pill),
      pillOutline: signature(data.pillOutline),
    };
    const entries = Object.entries(sigs);
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        expect(
          entries[i][1],
          `${entries[i][0]} and ${entries[j][0]} paint identically`,
        ).not.toBe(entries[j][1]);
      }
    }
  });

  // The nav base `line` skin SETs its gap / padding from --cngx-space-* on
  // :scope (registered @property initials defeat the old use-site fallbacks).
  // Comfortable render must be byte-identical to the pre-fix hardcoded look
  // (gap 8px, padding 10px 16px = the anchored calc(sm + 2px) md), and a root
  // [data-density='compact'] swap must re-scale BOTH gap and padding - which
  // the dead-fallback version never did.
  test('line nav base spacing tracks the density scale', async ({ page }) => {
    await gotoDemo(page, 'ui/tabs/tab-router-nav/all-skins');
    const nav = page.locator('cngx-tab-nav[aria-label="line skin"]');
    await expect(nav).toBeVisible();

    const read = () =>
      page.evaluate(() => {
        const host = document.querySelector(
          'cngx-tab-nav[aria-label="line skin"]',
        ) as HTMLElement;
        const link = host.querySelector('.cngx-tab-nav__link') as HTMLElement;
        const hostCS = getComputedStyle(host);
        const linkCS = getComputedStyle(link);
        return {
          gap: hostCS.columnGap,
          padTop: linkCS.paddingTop,
          padLeft: linkCS.paddingLeft,
        };
      });

    // Comfortable (library default): the anchored expressions reproduce the
    // pre-fix hardcoded metrics exactly.
    const comfortable = await read();
    expect(comfortable.gap, 'line nav gap != --cngx-space-sm (8px)').toBe('8px');
    expect(comfortable.padTop, 'line nav block padding != 10px').toBe('10px');
    expect(comfortable.padLeft, 'line nav inline padding != 16px').toBe('16px');

    // Compact: sm=4, md=8, so gap 4px, padding calc(4 + 2px)=6px / 8px.
    await page.evaluate(() => document.documentElement.setAttribute('data-density', 'compact'));
    const compact = await read();
    expect(compact.gap, 'line nav gap did not shrink under [data-density=compact]').toBe('4px');
    expect(compact.padTop, 'line nav block padding did not track density').toBe('6px');
    expect(compact.padLeft, 'line nav inline padding did not track density').toBe('8px');

    await page.evaluate(() => document.documentElement.removeAttribute('data-density'));
  });
});
