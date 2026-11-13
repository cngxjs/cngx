# @cngx/core/i18n

The language-pack layer: one data file per language, one provider in the app config. Every cngx area reads its copy from the active pack, so one switch changes every string, number, plural, `<html lang>` and `<html dir>`. The full guide is [Localisation](../../../core-concepts/i18n.md).

## What it is

- **`provideCngxI18n(...features)`** - sets the app's pack. Root only: call it in the application config. The pack also drives `CNGX_LOCALE` (its `locale`) and `CNGX_DIRECTION` (its `dir`, else derived from the locale).
- **`withPack(pack)`** - a complete pack, or a `Signal` of one to switch at runtime; `undefined` means English. A pack that misses a key fails to compile.
- **`withPartialPack(pack)`** - accepts gaps while a translation is in progress; every missing key reads English.
- **`withDocumentLanguage('on' | 'off')`** - whether the provider writes `<html lang>` and `<html dir>` from the pack. On by default; `'off'` leaves both to the app.
- **`CNGX_LANGUAGE_PACK`** - the active pack as a `Signal`; English with no sections when nothing is provided.
- **`formatMessage(message, args, locale)`** - formats one `CngxMessage`: `{name}` placeholders, numbers in the locale's format, a `CngxPluralMessage` picked by `Intl.PluralRules`, or a `CngxMessageFn` for what the data format cannot express.
- **`injectLanguageSection`, `createLanguageSection`, `createNestedLanguageSection`, `createSectionBundle`** - the authoring helpers a cngx area (or a custom component that follows the same pattern) uses to read its section over its English defaults and build its i18n token from it.
- **Types** - `CngxLanguagePack`, `CngxCompleteLanguagePack`, `CngxPartialLanguagePack`, `CngxActiveLanguagePack`, `CngxLanguagePackMeta`, `CngxPartialSections`, `CngxPluralMessage`, `CngxMessage`, `CngxMessageArgs`, `CngxMessageFn`, `CngxI18nFeature`, `CngxSectionBundle`, `CngxSectionBundleOptions`.

## Shipped packs

|Entry|Export|Contents|
|-|-|-|
|`@cngx/core/i18n/en`|`CNGX_LANGUAGE_EN`|Every cngx section in English, generated from the libraries' English sections. The template for a new language.|
|`@cngx/core/i18n/de`|`CNGX_LANGUAGE_DE`|Every cngx section in German.|

## Usage

```ts
import { signal } from '@angular/core';
import { provideCngxI18n, withPack, type CngxCompleteLanguagePack } from '@cngx/core/i18n';

export const languagePack = signal<CngxCompleteLanguagePack | undefined>(undefined);

bootstrapApplication(App, { providers: [provideCngxI18n(withPack(languagePack))] });

// later, switch to German at runtime
languagePack.set((await import('@cngx/core/i18n/de')).CNGX_LANGUAGE_DE);
```

An app that owns `lang` and `dir` itself adds `withDocumentLanguage('off')`; `CNGX_DIRECTION` then keeps reading `dir` from the DOM.

## When you reach for it

The app ships in more than one language, or in one language other than English. To change a few strings for one app or one subtree without a pack, use the per-token `provide*I18n` overrides of the area instead; they apply on top of the pack, key by key.

## Peer dependencies

`@angular/core`, `@angular/common`, `@cngx/utils`.
