import { expect, test, type Locator, type Page } from '@playwright/test';

// Per-example leaf routes (one story = one example page).
const BASIC_ROUTE = '/#/forms/filter-builder/basic-two-way-binding-json-inspection';
const SEEDED_ROUTE = '/#/forms/filter-builder/seeded-tree-and-or-composition';

// UNRESOLVED: no example demonstrates the predicate-signal bridge
// (a builder whose updates shrink a live filtered table). Route left as the
// original dead path so the failure is honest rather than silently weakened.
const BRIDGE_ROUTE = '/#/forms/filter-builder-bridge';

// The example is a single naked page; scope to its <main> (artifact + chrome).
function main(page: Page): Locator {
  return page.locator('main');
}

// Scopes to a named region on the form-field-bridge example page, which ships
// two aria-labelled <section>s: "Signal Forms" and "Reactive Forms".
function card(page: Page, title: string): Locator {
  return page.getByRole('region', { name: title });
}

test.describe('CngxFilterBuilder demo — golden path', () => {
  test('empty state surfaces Add filter / Add group buttons', async ({ page }) => {
    await page.goto(BASIC_ROUTE);
    const section = main(page);
    const builder = section.locator('cngx-filter-builder').first();
    await expect(builder).toBeVisible();
    await expect(builder.getByRole('button', { name: 'Add filter' })).toBeVisible();
    await expect(builder.getByRole('button', { name: 'Add group' })).toBeVisible();
  });

  test('Add filter appends an expression and surfaces it in the [(value)] JSON', async ({ page }) => {
    await page.goto(BASIC_ROUTE);
    const section = main(page);
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
    await page.goto(BASIC_ROUTE);
    const section = main(page);
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
    await page.goto(BASIC_ROUTE);
    const section = main(page);
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
    await page.goto(BASIC_ROUTE);
    const section = main(page);
    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add group' }).first().click();

    const nestedGroups = builder.locator('.cngx-filter-builder__group');
    await expect(nestedGroups).toHaveCount(2);

    const jsonPanel = section.locator('pre.code-block').first();
    await expect(jsonPanel).toContainText('"type": "group"');
    await expect(jsonPanel).toContainText('"filters"');
  });

  test('seeded section ships two expressions joined by and', async ({ page }) => {
    await page.goto(SEEDED_ROUTE);
    const section = main(page);
    const builder = section.locator('cngx-filter-builder').first();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(2);

    const jsonPanel = section.locator('pre.code-block').first();
    await expect(jsonPanel).toContainText('"logic": "and"');
    await expect(jsonPanel).toContainText('"field": "role"');
    await expect(jsonPanel).toContainText('"field": "active"');
  });

  test('Reset to empty restores the empty-state branch', async ({ page }) => {
    await page.goto(BASIC_ROUTE);
    const section = main(page);
    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add filter' }).first().click();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(1);

    await section.getByRole('button', { name: 'Reset to empty' }).click();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(0);
    await expect(builder.getByRole('button', { name: 'Add filter' })).toBeVisible();
  });
});

test.describe('CngxFilterBuilder bridge — predicate-signal integration', () => {
  // QUARANTINE: no example demonstrates a predicate-signal-driven filtered table
  // with an "Active filters" status badge. Assertions preserved; unfixme once a
  // forms/filter-builder predicate-table bridge story ships. See register.
  test.beforeEach(() => {
    test.fixme(true, 'no predicate-signal bridge (filtered table) example migrated to the examples app');
  });

  test('build: builder updates flow through presenter.predicate() and shrink the table', async ({ page }) => {
    await page.goto(BRIDGE_ROUTE);
    const section = card(page, 'Builder + filtered table');

    const tableRows = section.locator('table.demo-table tbody tr');
    await expect.poll(() => tableRows.count(), { timeout: 5000 }).toBeGreaterThan(0);
    const initialCount = await tableRows.count();

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
    await expect.poll(() => tableRows.count(), { timeout: 5000 }).toBeLessThan(initialCount);
    const filteredCount = await tableRows.count();
    expect(filteredCount).toBeGreaterThan(0);

    for (let i = 0; i < filteredCount; i++) {
      await expect(tableRows.nth(i)).toContainText('Engineer');
    }
  });

  test('clear: removing the root expression returns the table to the unfiltered length', async ({ page }) => {
    await page.goto(BRIDGE_ROUTE);
    const section = card(page, 'Builder + filtered table');
    const tableRows = section.locator('table.demo-table tbody tr');
    await expect.poll(() => tableRows.count(), { timeout: 5000 }).toBeGreaterThan(0);
    const initialCount = await tableRows.count();

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

    await expression.getByRole('button', { name: 'Remove filter' }).click();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(0);
    await expect(section.locator('.status-badge', { hasText: 'Active filters: 0' })).toBeVisible();
    await expect.poll(() => tableRows.count(), { timeout: 5000 }).toBe(initialCount);
  });

  test('reuse: build → clear → build again, predicate signal toggles each cycle', async ({ page }) => {
    await page.goto(BRIDGE_ROUTE);
    const section = card(page, 'Builder + filtered table');
    const tableRows = section.locator('table.demo-table tbody tr');
    await expect.poll(() => tableRows.count(), { timeout: 5000 }).toBeGreaterThan(0);
    const initialCount = await tableRows.count();
    const builder = section.locator('cngx-filter-builder').first();

    async function buildRoleEquals(value: string): Promise<void> {
      await builder.getByRole('button', { name: 'Add filter' }).first().click();
      const row = builder.locator('.cngx-filter-builder__expression').first();
      const fieldTrigger = row.locator('cngx-select.cngx-filter-builder__field-select [role="combobox"]');
      await fieldTrigger.click();
      await page.getByRole('option', { name: 'Role' }).click();
      const operatorTrigger = row.locator('cngx-select.cngx-filter-builder__operator-select [role="combobox"]');
      await operatorTrigger.click();
      await page.getByRole('option', { name: 'Equals', exact: true }).click();
      await row.locator('input[type="text"]').fill(value);
    }

    await buildRoleEquals('Engineer');
    await expect(section.locator('.status-badge', { hasText: 'Active filters: 1' })).toBeVisible();
    await expect.poll(() => tableRows.count(), { timeout: 5000 }).toBeLessThan(initialCount);

    await builder.locator('.cngx-filter-builder__expression').first()
      .getByRole('button', { name: 'Remove filter' }).click();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(0);
    await expect.poll(() => tableRows.count(), { timeout: 5000 }).toBe(initialCount);

    await buildRoleEquals('Designer');
    await expect(section.locator('.status-badge', { hasText: 'Active filters: 1' })).toBeVisible();
    await expect.poll(() => tableRows.count(), { timeout: 5000 }).toBeLessThan(initialCount);
    const secondFiltered = await tableRows.count();
    for (let i = 0; i < secondFiltered; i++) {
      await expect(tableRows.nth(i)).toContainText('Designer');
    }
  });
});

test.describe('CngxFilterBuilder — reset journey', () => {
  test('reset (value.set(EMPTY_ROOT) from the harness) restores the empty-state branch', async ({ page }) => {
    await page.goto(BASIC_ROUTE);
    const section = main(page);
    const builder = section.locator('cngx-filter-builder').first();
    await builder.getByRole('button', { name: 'Add filter' }).first().click();
    const expression = builder.locator('.cngx-filter-builder__expression').first();
    const fieldTrigger = expression.locator('cngx-select.cngx-filter-builder__field-select [role="combobox"]');
    await fieldTrigger.click();
    await page.getByRole('option', { name: 'Age' }).click();
    await expression.locator('input[type="number"]').fill('25');
    const jsonPanel = section.locator('pre.code-block').first();
    await expect(jsonPanel).toContainText('"value": 25');

    await section.getByRole('button', { name: 'Reset to empty' }).click();
    await expect(builder.locator('.cngx-filter-builder__expression')).toHaveCount(0);
    await expect(jsonPanel).toContainText('"id": "cngx-filter-root-empty"');
    await expect(builder.getByRole('button', { name: 'Add filter' })).toBeVisible();
  });
});

test.describe('CngxFilterBuilder — form-field bridge browser flow', () => {
  const FORM_FIELD_ROUTE =
    '/#/forms/filter-builder/form-field-bridge/signal-and-reactive-forms-disabled-touched';

  // The CngxSelect+form-field auto-sync corruption these tests once tripped
  // (`logic.toUpperCase is not a function`, issue #98 - a descendant logic
  // <cngx-select> syncing the ambient FilterGroup into its own scalar value) is
  // fixed: cngxFilterBuilderFormFieldControl provides CNGX_SELECT_DISABLE_FIELD_SYNC
  // (see filter-builder-form-field.spec.ts). These two verify the bridge surface
  // on the migrated example - initial state in Signal Forms, disabled propagation
  // in Reactive Forms.
  test('Signal Forms — static bridge surface mounts and exposes the contract', async ({ page }) => {
    await page.goto(FORM_FIELD_ROUTE);
    const section = card(page, 'Signal Forms');
    const badges = section.locator('.status-badge');

    await expect(badges.filter({ hasText: 'touched: false' })).toHaveCount(1);
    await expect(badges.filter({ hasText: 'errorState: false' })).toHaveCount(1);
    await expect(badges.filter({ hasText: 'focused: false' })).toHaveCount(1);
    await expect(badges.filter({ hasText: 'disabled: false' })).toHaveCount(1);
  });

  test('Reactive Forms — toggle disabled propagates to presenter.disabled', async ({ page }) => {
    await page.goto(FORM_FIELD_ROUTE);
    const section = card(page, 'Reactive Forms');
    const badges = section.locator('.status-badge');

    await expect(badges.filter({ hasText: 'control.disabled: false' })).toHaveCount(1);
    await expect(badges.filter({ hasText: 'presenter.disabled: false' })).toHaveCount(1);

    await section.getByRole('button', { name: 'Toggle disabled' }).click();
    await expect(badges.filter({ hasText: 'control.disabled: true' })).toHaveCount(1);
    await expect(badges.filter({ hasText: 'presenter.disabled: true' })).toHaveCount(1);
  });
});
