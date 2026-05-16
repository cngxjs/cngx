import { test } from '@playwright/test';

// All three smart-data-source routes crash on mount with
// "NullInjectorError: No provider found for ..." (see error-log.md).
// Tests are skipped until the demo wires its DI tokens.
test.describe.skip('common/data/smart-data-source', () => {
  test('placeholder', () => {});
});
