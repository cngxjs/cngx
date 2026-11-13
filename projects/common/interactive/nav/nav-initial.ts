import { afterNextRender, computed, effect, signal } from '@angular/core';
import { injectLocale, memoize } from '@cngx/core/utils';

const graphemeSegmenterFor = memoize(
  (locale: string) => new Intl.Segmenter(locale, { granularity: 'grapheme' }),
  { cacheLimit: 8 },
);

/** @internal The first user-perceived character: `é` built from `e` + accent, a flag, an emoji. */
function firstGrapheme(text: string, locale: string): string {
  if (typeof Intl.Segmenter !== 'function') {
    return Array.from(text)[0] ?? '';
  }
  return graphemeSegmenterFor(locale).segment(text)[Symbol.iterator]().next().value?.segment ?? '';
}

/**
 * Writes `data-initial` on a nav row host: the first character of its text,
 * uppercased with the app locale. `cngx-nav.css` draws it as the letter
 * fallback in the icon box of a row without `[cngxNavIcon]`. The text is read
 * after the first render, so bound text is in place; a `data-initial` the
 * consumer set by then wins and is never overwritten.
 *
 * Call it in an injection context (a directive constructor).
 *
 * @internal
 */
export function injectNavInitial(el: HTMLElement): void {
  const locale = injectLocale();
  const source = signal<string | null>(null);
  const initial = computed(() => {
    const text = source();
    const lang = locale();
    return text ? firstGrapheme(text, lang).toLocaleUpperCase(lang) : null;
  });

  afterNextRender(() => {
    const text = el.textContent?.trim();
    if (text && !Object.hasOwn(el.dataset, 'initial')) {
      source.set(text);
    }
  });

  effect(() => {
    const value = initial();
    if (value) {
      el.dataset['initial'] = value;
    }
  });
}
