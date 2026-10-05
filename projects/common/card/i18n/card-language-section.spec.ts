import { describe, expect, it } from 'vitest';
import type { CngxLanguagePack } from '@cngx/core/i18n';

import type { CngxCardI18n } from './card-i18n';
import type { CngxCardLanguageSection } from './card-language-section';

// Compile-checked: the spec builder does not type-check `expectTypeOf`, so
// equality is a `true` assigned to a type that is `false` on a mismatch.
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

describe('CngxCardLanguageSection', () => {
  it('adds the card section to the language pack', () => {
    const augmented: Equal<CngxLanguagePack['card'], CngxCardLanguageSection> = true;
    expect(augmented).toBe(true);
  });

  it('carries the same keys as the card i18n token', () => {
    const sameKeys: Equal<keyof CngxCardLanguageSection, keyof CngxCardI18n> = true;
    expect(sameKeys).toBe(true);
  });
});
