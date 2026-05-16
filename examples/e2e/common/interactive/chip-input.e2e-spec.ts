import { expect, test } from '@playwright/test';
import { gotoDemo } from '../../_helpers';

// Story: CngxChipInput tokenises native input. Enter or a configured
// separator emits (tokenCreated). Backspace at empty input emits
// (tokenRemoved). Existing tokens are deduplicated.

test.describe('common/interactive/chip-input', () => {
  test('synchronous-tokenization: Enter creates token, Backspace pops last', async ({ page }) => {
    await gotoDemo(page, 'common/interactive/chip-input/synchronous-tokenization');

    const input = page.getByPlaceholder('Type a tag and press Enter');
    const caption = page.locator('p.caption').filter({ hasText: 'tokens:' });

    // Initial seed: ['typescript', 'angular'].
    await expect(caption).toContainText('typescript, angular');

    await input.click();
    await input.fill('rxjs');
    await input.press('Enter');
    await expect(caption).toContainText('typescript, angular, rxjs');

    // Backspace on empty input pops the most recent token.
    await input.press('Backspace');
    await expect(caption).toContainText('typescript, angular');
    await expect(caption).not.toContainText('rxjs');

  });
});
