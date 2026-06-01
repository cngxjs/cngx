import { expect, test } from '@playwright/test';

// Confirms the recent examples follow-ups:
//   - data.title gets wired into the document title via TitleStrategy
//   - all story-template <button> tags carry an explicit type="button"
//   - narrow viewports don't trigger horizontal scroll on the demo body

const SAMPLE_STORIES = [
  {
    path: '#/common/display/badge/colors-and-dot-mode',
    titleFragment: 'CngxBadge',
  },
  {
    path: '#/forms/input/numeric/basic-numeric-input',
    titleFragment: 'CngxNumericInput',
  },
  {
    path: '#/common/dialog/template-directives',
    titleFragment: 'CngxDialog',
  },
];

test.describe('examples followup', () => {
  test.describe('document title per route', () => {
    for (const story of SAMPLE_STORIES) {
      test(`route ${story.path} sets document.title from data.title`, async ({ page }) => {
        await page.goto(`/${story.path}`);
        await expect(page).toHaveTitle(new RegExp(`${story.titleFragment}.*cngx examples`));
      });
    }

    test('root path falls back to a stable title', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/cngx examples/);
    });
  });

  test.describe('button type discipline', () => {
    test('story template buttons all carry type="button"', async ({ page }) => {
      await page.goto('/#/common/dialog/template-directives');
      // Wait for the demo iframe content to render.
      await page.waitForSelector('button');
      const bareButtons = await page.evaluate(() => {
        const all = Array.from(document.querySelectorAll('button'));
        return all
          .filter((b) => !b.hasAttribute('type'))
          .map((b) => ({
            text: (b.textContent ?? '').trim().slice(0, 40),
            cls: b.className,
          }));
      });
      expect(bareButtons).toEqual([]);
    });
  });

  test.describe('mobile layout', () => {
    test.use({ viewport: { width: 375, height: 720 } });

    test('demo body does not trigger horizontal scroll at 375px', async ({ page }) => {
      await page.goto('/#/common/display/badge/colors-and-dot-mode');
      await page.waitForSelector('.cngx-ex-artifact, .cngx-ex-intro');
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });

    test('code disclosure panels are hidden at 375px', async ({ page }) => {
      await page.goto('/#/common/display/badge/colors-and-dot-mode');
      await page.waitForLoadState('networkidle');
      const visible = await page
        .locator('.cngx-ex-code')
        .first()
        .isVisible()
        .catch(() => false);
      expect(visible).toBe(false);
    });
  });
});
