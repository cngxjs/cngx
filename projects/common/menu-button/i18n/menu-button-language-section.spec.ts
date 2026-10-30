import { describe, expect, it } from 'vitest';
import type { CngxLanguagePack } from '@cngx/core/i18n';

import type { CngxMenuButtonI18n } from './menu-button-i18n';
import type { CngxMenuButtonLanguageSection } from './menu-button-language-section';

// Compile-checked: the spec builder does not type-check `expectTypeOf`, so
// equality is a `true` assigned to a type that is `false` on a mismatch.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

describe('CngxMenuButtonLanguageSection', () => {
  it('adds the menu-button section to the language pack', () => {
    const augmented: Equal<CngxLanguagePack['menuButton'], CngxMenuButtonLanguageSection> = true;
    expect(augmented).toBe(true);
  });

  it('carries the same keys as the menu-button i18n token', () => {
    const sameKeys: Equal<keyof CngxMenuButtonLanguageSection, keyof CngxMenuButtonI18n> = true;
    expect(sameKeys).toBe(true);
  });
});
