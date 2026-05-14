import { expect, test, type Locator, type Page } from '@playwright/test';

const ROUTE = '/#/forms/filter-builder';
const BRIDGE_ROUTE = '/#/forms/filter-builder-bridge';

function card(page: Page, title: string): Locator {
  return page.locator('app-example-card').filter({ hasText: title });
}

test.describe('CngxFilterBuilder demo — golden path', () => {
  test('empty state surfaces Add filter / Add group buttons', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — two-way binding');
    const builder = section.locator('cngx-filter-builder').first();
    await expect(builder).toBeVisible();
    await expect(builder.getByRole('button', { name: 'Add filter' })).toBeVisible();
    await expect(builder.getByRole('button', { name: 'Add group' })).toBeVisible();
  });

  test('Add filter appends an expression and surfaces it in the [(value)] JSON', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — two-way binding');
    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add filter' }).first().click();

    const expression = builder.locator('.cngx-filter-builder__expression').first();
    await expect(expression).toBeVisible();
    await expect(expression).toHaveAttribute('role', 'group');

    const jsonPanel = section.locator('pre.code-block').first();
    await expect(jsonPanel).toContainText('"type": "expression"');
    await expect(jsonPanel).toContainText('"field": "name"');
  });

  test('switching field + operator + value writes through the model', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — two-way binding');
    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add filter' }).first().click();

    const expression = builder.locator('.cngx-filter-builder__expression').first();
    const fieldTrigger = expression.locator('cngx-select.cngx-filter-builder__field-select [role="combobox"]');
    await fieldTrigger.click();
    await page.getByRole('option', { name: 'Age' }).click();
    const operatorTrigger = expression.locator('cngx-select.cngx-filter-builder__operator-select [role="combobox"]');
    await operatorTrigger.click();
    await page.getByRole('option', { name: 'Greater than', exact: true }).click();
    const numberInput = expression.locator('input[type="number"]');
    await numberInput.fill('30');

    const jsonPanel = section.locator('pre.code-block').first();
    await expect(jsonPanel).toContainText('"field": "age"');
    await expect(jsonPanel).toContainText('"operator": "gt"');
    await expect(jsonPanel).toContainText('"value": 30');
  });

  test('typing into a value input keeps focus and cursor across keystrokes', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — two-way binding');
    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add filter' }).first().click();

    const expression = builder.locator('.cngx-filter-builder__expression').first();
    const input = expression.locator('input[type="text"]');
    await input.click();
    await input.pressSequentially('foobar', { delay: 20 });

    await expect(input).toBeFocused();
    const selectionStart = await input.evaluate((el) => (el as HTMLInputElement).selectionStart);
    expect(selectionStart).toBe(6);
    await expect(input).toHaveValue('foobar');
  });

  test('Add group nests a child group with its own Add filter button', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — two-way binding');
    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add group' }).first().click();

    const nestedGroups = builder.locator('.cngx-filter-builder__group');
    await expect(nestedGroups).toHaveCount(2);

    const jsonPanel = section.locator('pre.code-block').first();
    await expect(jsonPanel).toContainText('"type": "group"');
    await expect(jsonPanel).toContainText('"filters"');
  });

  test('seeded section ships two expressions joined by and', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Seeded tree');
    const builder = section.locator('cngx-filter-builder').first();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(2);

    const jsonPanel = section.locator('pre.code-block').first();
    await expect(jsonPanel).toContainText('"logic": "and"');
    await expect(jsonPanel).toContainText('"field": "role"');
    await expect(jsonPanel).toContainText('"field": "active"');
  });

  test('Reset to empty restores the empty-state branch', async ({ page }) => {
    await page.goto(ROUTE);
    const section = card(page, 'Basic — two-way binding');
    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add filter' }).first().click();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(1);

    await section.getByRole('button', { name: 'Reset to empty' }).click();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(0);
    await expect(builder.getByRole('button', { name: 'Add filter' })).toBeVisible();
  });
});

test.describe('CngxFilterBuilder bridge — toFilterPredicate integration', () => {
  test('builder updates flow into CngxFilter and shrink the table', async ({ page }) => {
    await page.goto(BRIDGE_ROUTE);
    const section = card(page, 'Builder + filtered table');

    const tableRows = section.locator('table.demo-table tbody tr');
    const initialCount = await tableRows.count();
    expect(initialCount).toBeGreaterThan(0);

    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add filter' }).first().click();

    const expression = builder.locator('.cngx-filter-builder__expression').first();
    const fieldTrigger = expression.locator('cngx-select.cngx-filter-builder__field-select [role="combobox"]');
    await fieldTrigger.click();
    await page.getByRole('option', { name: 'Role' }).click();
    const operatorTrigger = expression.locator('cngx-select.cngx-filter-builder__operator-select [role="combobox"]');
    await operatorTrigger.click();
    await page.getByRole('option', { name: 'Equals', exact: true }).click();
    await expression.locator('input[type="text"]').fill('Engineer');

    await expect(section.locator('.status-badge', { hasText: 'Active filters: 1' })).toBeVisible();
    const filteredCount = await tableRows.count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);

    for (let i = 0; i < filteredCount; i++) {
      await expect(tableRows.nth(i)).toContainText('Engineer');
    }
  });
});
