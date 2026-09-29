import { expect, test, type Page } from '@playwright/test';

interface MeasuredField {
  readonly label: string;
  readonly height: number;
  readonly innerLabel: boolean;
  readonly labelHidden: boolean;
  readonly skin: string | null;
}

// The painted box of each field, resolved the way the box model defines it:
// a field box when there is one, else the select trigger, else the control.
async function measureFields(page: Page): Promise<MeasuredField[]> {
  await page.locator('cngx-form-field').first().waitFor();
  return page.locator('main').evaluate((main) =>
    Array.from(main.querySelectorAll('cngx-form-field'), (field) => {
      const box =
        field.querySelector<HTMLElement>('.cngx-field-box') ??
        field.querySelector<HTMLElement>('.cngx-field-trigger, input, textarea');
      const label = field.querySelector('label');
      return {
        label: label?.textContent?.trim() ?? '',
        height: Math.round(box?.getBoundingClientRect().height ?? 0),
        innerLabel: label?.parentElement?.classList.contains('cngx-field-box') ?? false,
        labelHidden: label?.classList.contains('cngx-sr-only') ?? false,
        skin: box?.getAttribute('data-skin') ?? field.getAttribute('data-skin'),
      };
    }),
  );
}

const ANATOMY = [
  { skin: 'outline', route: '/#/forms/field/skin/outline-anatomy', height: 42, placement: 'outer' },
  { skin: 'fill', route: '/#/forms/field/skin/fill-anatomy', height: 56, placement: 'inner' },
  { skin: 'bare', route: '/#/forms/field/skin/bare-anatomy', height: 42, placement: 'hidden' },
] as const;

test.describe('field skin anatomy stories', () => {
  for (const { skin, route, height, placement } of ANATOMY) {
    test(`${skin}: every single-line box measures ${height}px and the textarea one line more`, async ({ page }) => {
      await page.goto(route);
      const fields = await measureFields(page);
      expect(fields.length).toBeGreaterThanOrEqual(11);
      for (const field of fields.filter((f) => f.label !== 'Textarea')) {
        expect(field.height, field.label).toBe(height);
      }
      const textarea = fields.find((f) => f.label === 'Textarea');
      expect(textarea?.height).toBe(height + 24);
    });

    test(`${skin}: every label uses the same placement, never inner and outer mixed`, async ({ page }) => {
      await page.goto(route);
      const fields = await measureFields(page);
      for (const field of fields) {
        expect(field.innerLabel, field.label).toBe(placement === 'inner');
        expect(field.labelHidden, field.label).toBe(placement === 'hidden');
      }
    });

    test(`${skin}: the invalid field is announced as invalid at rest`, async ({ page }) => {
      await page.goto(route);
      const invalid = page.getByRole('textbox', { name: 'Invalid' });
      await expect(invalid).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('main cngx-field-errors')).toContainText('Enter a valid email address.');
    });
  }

  // The catalogue stories carry no skin of their own; the app-wide skin toggle
  // (config tier) decides, so every story renders in the skin picked there.
  const CATALOGUE = [
    { route: '/#/forms/select/single-select/signal-forms-required', host: 'cngx-select' },
    { route: '/#/forms/select/multi-select/multi-basic', host: 'cngx-multi-select' },
    { route: '/#/forms/select/combobox/combobox-basic-tag-picker-with-typeahead-filter', host: 'cngx-combobox' },
    { route: '/#/forms/select/tree-select/basic-single-level-toggle', host: 'cngx-tree-select' },
    { route: '/#/forms/field/error/basic', host: 'input' },
    { route: '/#/forms/input/utilities/input-clear', host: '.cngx-field-box' },
  ] as const;

  for (const { route, host } of CATALOGUE) {
    test(`app skin toggle reaches ${route.replace('/#/forms/', '')}`, async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('cngx_field_skin', 'fill'));
      await page.goto(route);
      await expect(page.locator(`main ${host}`).first()).toHaveAttribute('data-skin', 'fill');
    });
  }

  test('fill: every box carries the fill skin, the controls inside resolve to bare', async ({ page }) => {
    await page.goto('/#/forms/field/skin/fill-anatomy');
    const boxes = page.locator('main .cngx-field-box');
    await expect(boxes).toHaveCount(11);
    for (const box of await boxes.all()) {
      await expect(box).toHaveAttribute('data-skin', 'fill');
    }
    await expect(page.locator('main .cngx-field-box > [data-skin]:not([data-skin="bare"])')).toHaveCount(0);
  });
});
