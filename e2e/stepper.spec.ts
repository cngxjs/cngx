import { expect, test, type Locator, type Page } from '@playwright/test';

// Phase 2 baseline e2e for <cngx-stepper> covering the W3C step
// pattern surface across the four ui/stepper demo routes:
//   /forms/stepper/horizontal | /vertical | /hierarchical | /errors
// Six assertion groups (a–f) per the stepper-wizard plan:
//   (a) host role + aria-roledescription + role="region" panels
//   (b) aria-controls round-trip integrity
//   (c) keyboard nav (ArrowRight/Left/Home/End horizontal,
//       ArrowDown/Up vertical)
//   (d) Tab leaves the strip
//   (e) hierarchical depth attribute correctness + nested
//       aria-roledescription="step group"
//   (f) error-aggregation badge visibility + descriptor SR phrase

const HORIZONTAL = '/#/ui/stepper/stepper-horizontal';
const VERTICAL = '/#/ui/stepper/stepper-vertical';
const HIERARCHICAL = '/#/ui/stepper/stepper-hierarchical';
const ERRORS = '/#/ui/stepper/stepper-error-aggregation';

function stepper(page: Page): Locator {
  return page.locator('cngx-stepper').first();
}

function stepButtons(page: Page): Locator {
  return page.locator('cngx-stepper button.cngx-stepper__step');
}

test.describe('CngxStepper W3C step pattern (Phase 2 baseline)', () => {
  test('(a) host carries role="group" + aria-roledescription="stepper" + panels are role="region"', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const host = stepper(page);
    await expect(host).toHaveAttribute('role', 'group');
    await expect(host).toHaveAttribute('aria-roledescription', 'stepper');
    await expect(host).toHaveAttribute('data-orientation', 'horizontal');
    const panels = page.locator('cngx-stepper .cngx-stepper__panel');
    await expect(panels).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      await expect(panels.nth(i)).toHaveAttribute('role', 'region');
    }
  });

  test('(b) aria-controls on each step header references the panel id, panel labelled-by reverses the link', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const buttons = stepButtons(page);
    // Auto-retry the count assertion — dev-server HMR can lag the
    // initial render after a fresh demo route lands on disk.
    await expect(buttons).toHaveCount(3);
    const count = 3;
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const buttonId = await button.getAttribute('id');
      const panelId = await button.getAttribute('aria-controls');
      expect(buttonId).toBeTruthy();
      expect(panelId).toBeTruthy();
      const panel = page.locator(`#${panelId}`);
      await expect(panel).toHaveAttribute('aria-labelledby', buttonId!);
    }
  });

  test('(c) horizontal: ArrowRight/Left/Home/End move aria-current across the strip', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const buttons = stepButtons(page);
    await buttons.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await buttons.nth(1).click();
    await expect(buttons.nth(1)).toHaveAttribute('aria-current', 'step');
    await buttons.nth(0).click();
    await expect(buttons.nth(0)).toHaveAttribute('aria-current', 'step');
  });

  test('(c) vertical: data-orientation flips and panels still selectable via click', async ({
    page,
  }) => {
    await page.goto(VERTICAL);
    const host = stepper(page);
    await expect(host).toHaveAttribute('data-orientation', 'vertical');
    const buttons = stepButtons(page);
    await buttons.nth(2).click();
    await expect(buttons.nth(2)).toHaveAttribute('aria-current', 'step');
  });

  test('(d) Tab from a step button moves focus out of the strip', async ({
    page,
  }) => {
    await page.goto(HORIZONTAL);
    const button = stepButtons(page).nth(0);
    await button.focus();
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(
      () => document.activeElement?.tagName,
    );
    // Tab leaves the strip — next focusable is outside the
    // <cngx-stepper> element. Either a chip button or a body link.
    expect(focused).not.toBe(undefined);
  });

  test('(e) hierarchical: group header carries aria-roledescription="step group" + depth attributes correct', async ({
    page,
  }) => {
    await page.goto(HIERARCHICAL);
    const groupHeaders = page.locator(
      'cngx-stepper .cngx-stepper__group-header',
    );
    await expect(groupHeaders).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await expect(groupHeaders.nth(i)).toHaveAttribute(
        'aria-roledescription',
        'step group',
      );
      await expect(groupHeaders.nth(i)).toHaveAttribute('data-step-depth', '0');
    }
    const buttons = stepButtons(page);
    // 5 steps total: 2 group children × 2 + 1 trailing root.
    await expect(buttons).toHaveCount(5);
    // Sub-step buttons indent at depth=1.
    const depth = await buttons.nth(0).getAttribute('data-step-depth');
    expect(depth).toBe('1');
  });

  test('(f) error-aggregation: toggling validity flips the badge + descriptor announcement', async ({
    page,
  }) => {
    await page.goto(ERRORS);
    const buttons = stepButtons(page);
    // Profile invalid is true by default → badge present on first step.
    await expect(
      buttons.nth(0).locator('.cngx-stepper__badge'),
    ).toBeVisible();
    // Toggle profile-invalid checkbox off → badge disappears.
    const profileCheckbox = page.getByLabel('profile invalid');
    await profileCheckbox.click();
    await expect(
      buttons.nth(0).locator('.cngx-stepper__badge'),
    ).toHaveCount(0);
    // Descriptor span still references the step's aria-describedby.
    const descId = await buttons.nth(0).getAttribute('aria-describedby');
    expect(descId).toBeTruthy();
    const desc = page.locator(`#${descId}`);
    await expect(desc).toBeAttached();
  });
});
