import { expect, test, type Page } from '@playwright/test';

// The bare-control rule in core/theming/base.css (padding, hairline border,
// radius, transparent fill, the coarse-pointer touch floor) is meant for
// text-like fields. Checkbox, radio and the button-like input types must keep
// the user-agent rendering. The reference is the same control inside a shadow
// root: document stylesheets do not reach it, so it renders as the UA draws
// it. Coarse pointer on purpose: that is where the touch floor lifts
// `min-height` to 44px and stretches a 13px radio into a tall box.

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test.skip(
  ({ browserName }) => browserName === 'firefox',
  'isMobile context is unsupported in Firefox',
);

const NATIVE_TYPES = ['checkbox', 'radio', 'submit'] as const;

interface ControlBox {
  width: number;
  height: number;
  paddingInlineStart: string;
  borderTopStyle: string;
  borderTopWidth: string;
  backgroundColor: string;
}

async function measure(page: Page, type: string): Promise<{ bare: ControlBox; ua: ControlBox }> {
  return page.evaluate((inputType) => {
    const read = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        paddingInlineStart: s.paddingInlineStart,
        borderTopStyle: s.borderTopStyle,
        borderTopWidth: s.borderTopWidth,
        backgroundColor: s.backgroundColor,
      };
    };
    const make = () => {
      const input = document.createElement('input');
      input.type = inputType;
      input.value = 'Go';
      return input;
    };
    const bare = make();
    document.body.append(bare);
    const host = document.createElement('div');
    document.body.append(host);
    const ua = make();
    host.attachShadow({ mode: 'open' }).append(ua);
    const result = { bare: read(bare), ua: read(ua) };
    bare.remove();
    host.remove();
    return result;
  }, type);
}

test.describe('css-contract: bare controls under a coarse pointer', () => {
  for (const type of NATIVE_TYPES) {
    test(`a bare type=${type} input keeps the user-agent rendering`, async ({ page }) => {
      await page.goto('/#/');
      const { bare, ua } = await measure(page, type);
      expect(bare).toEqual(ua);
    });
  }

  test('a bare text input still gets the touch floor', async ({ page }) => {
    await page.goto('/#/');
    const { bare } = await measure(page, 'text');
    expect(bare.height).toBeGreaterThanOrEqual(44);
  });
});
