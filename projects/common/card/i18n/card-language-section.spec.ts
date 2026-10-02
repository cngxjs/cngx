import { describe, expectTypeOf, it } from 'vitest';
import type { CngxLanguagePack } from '@cngx/core/i18n';

import type { CngxCardI18n } from './card-i18n';
import type { CngxCardLanguageSection } from './card-language-section';

describe('CngxCardLanguageSection', () => {
  it('adds the card section to the language pack', () => {
    expectTypeOf<CngxLanguagePack['card']>().toEqualTypeOf<CngxCardLanguageSection>();
  });

  it('carries the same keys as the card i18n token', () => {
    expectTypeOf<keyof CngxCardLanguageSection>().toEqualTypeOf<keyof CngxCardI18n>();
  });
});
