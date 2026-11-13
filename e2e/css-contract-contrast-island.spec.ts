import { expect, test, type Page } from '@playwright/test';

// Contrast boost vs colour-scheme islands (core/theming/contrast-tokens.css):
// the boost re-derives `--cngx-color-border(-strong)` and demotes
// `--cngx-color-text-muted` on the contrast host. A colour-scheme island
// (`.dark`, `.light`, `[data-color-scheme]`) re-sets those tokens on its own
// element, and an element-level set beats the inherited boosted value in any
// layer, so the island must re-apply the boost itself. The expected value is
// read from a reference element that carries the scheme and the boost on the
// same node, where the boost already wins. jsdom ignores `@property`, so the
// cascade is asserted in a browser.

const TOKENS = [
  '--cngx-color-border',
  '--cngx-color-border-strong',
  '--cngx-color-text-muted',
] as const;

type BoostVia = 'attribute' | 'os';

const ISLANDS = [
  { name: '.dark', attrs: 'class="dark"' },
  {
    name: "[data-color-scheme='light'] inside .dark",
    attrs: 'data-color-scheme="light"',
    parent: 'class="dark"',
  },
] as const;

async function mountIsland(page: Page, island: (typeof ISLANDS)[number], via: BoostVia) {
  if (via === 'os') {
    await page.emulateMedia({ contrast: 'more' });
  }
  await page.goto('/#/');
  await page.evaluate(
    ({ attrs, parent, boostOnRoot }) => {
      if (boostOnRoot) {
        document.documentElement.setAttribute('data-contrast', 'more');
      }
      const host = document.createElement('div');
      host.innerHTML = parent
        ? `<div ${parent}><div id="island" ${attrs}></div><div id="reference" ${attrs} data-contrast="more"></div></div>`
        : `<div id="island" ${attrs}></div><div id="reference" ${attrs} data-contrast="more"></div>`;
      document.body.append(host);
    },
    {
      attrs: island.attrs,
      parent: 'parent' in island ? island.parent : undefined,
      boostOnRoot: via === 'attribute',
    },
  );
}

function tokens(page: Page, id: string): Promise<Record<string, string>> {
  return page
    .locator(`#${id}`)
    .evaluate(
      (el, names) =>
        Object.fromEntries(names.map((n) => [n, getComputedStyle(el).getPropertyValue(n).trim()])),
      [...TOKENS],
    );
}

for (const via of ['attribute', 'os'] as const) {
  test.describe(`css-contract: contrast boost inside colour-scheme islands (${via})`, () => {
    for (const island of ISLANDS) {
      test(`${island.name} keeps the boosted border and muted text`, async ({ page }) => {
        await mountIsland(page, island, via);
        const expected = await tokens(page, 'reference');
        // Guard against a vacuous pass: the boost demotes muted text to the
        // full text colour, so the reference must show that demotion.
        const referenceText = await page
          .locator('#reference')
          .evaluate((el) => getComputedStyle(el).getPropertyValue('--cngx-color-text').trim());
        expect(expected['--cngx-color-text-muted']).toBe(referenceText);
        expect(await tokens(page, 'island')).toEqual(expected);
      });
    }
  });
}
