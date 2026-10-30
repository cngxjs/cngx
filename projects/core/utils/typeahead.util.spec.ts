import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createLabelMatcher,
  createTypeaheadMatcher,
  createTypeaheadWalker,
  foldForMatching,
  matchesTypeahead,
} from './typeahead.util';

describe('matchesTypeahead', () => {
  it('matches case-insensitively in both directions', () => {
    expect(matchesTypeahead('Postgres', 'p')).toBe(true);
    expect(matchesTypeahead('postgres', 'PO')).toBe(true);
    expect(matchesTypeahead('POSTGRES', 'post')).toBe(true);
  });

  it('is a prefix match, not a substring match', () => {
    expect(matchesTypeahead('Postgres', 'g')).toBe(false);
    expect(matchesTypeahead('Postgres', 'ostgres')).toBe(false);
  });

  it('empty term matches every label (callers gate on a non-empty buffer)', () => {
    expect(matchesTypeahead('anything', '')).toBe(true);
    expect(matchesTypeahead('', '')).toBe(true);
  });

  it('non-matching and empty labels reject a non-empty term', () => {
    expect(matchesTypeahead('', 'a')).toBe(false);
    expect(matchesTypeahead('Zebra', 'a')).toBe(false);
  });

  it('ignores accents on either side', () => {
    expect(matchesTypeahead('Über', 'u')).toBe(true);
    expect(matchesTypeahead('Uber', 'ü')).toBe(true);
    expect(matchesTypeahead('Éclair', 'ecl')).toBe(true);
    expect(matchesTypeahead('Ålesund', 'A')).toBe(true);
    expect(matchesTypeahead('Ölfass', 'e')).toBe(false);
  });

  it('lowercases with the locale before folding accents', () => {
    expect(matchesTypeahead('İzmir', 'i', 'tr')).toBe(true);
    expect(matchesTypeahead('Istanbul', 'ı', 'tr')).toBe(true);
    expect(matchesTypeahead('Istanbul', 'i', 'tr')).toBe(false);
    expect(matchesTypeahead('Istanbul', 'I', 'tr')).toBe(true);
  });

  it('keeps plain lowercasing without a locale', () => {
    expect(matchesTypeahead('Istanbul', 'i')).toBe(true);
    expect(matchesTypeahead('İzmir', 'i')).toBe(true);
  });
});

describe('foldForMatching', () => {
  it('lowercases with the locale, then drops accents', () => {
    expect(foldForMatching('Über')).toBe('uber');
    expect(foldForMatching('İzmir', 'tr')).toBe('izmir');
    expect(foldForMatching('ISTANBUL', 'tr')).toBe('ıstanbul');
    expect(foldForMatching('Crème Brûlée')).toBe('creme brulee');
  });

  it('folds away bidi isolates and other format characters', () => {
    expect(matchesTypeahead('\u2068Anna\u2069 joined', 'an')).toBe(true);
    expect(matchesTypeahead('a\u200db', 'ab')).toBe(true);
  });
});

describe('createTypeaheadMatcher', () => {
  it('matches like matchesTypeahead', () => {
    const matches = createTypeaheadMatcher('İ', 'tr');
    for (const label of ['İzmir', 'Istanbul', 'ilk', 'Über']) {
      expect(matches(label)).toBe(matchesTypeahead(label, 'İ', 'tr'));
    }
  });

  it('folds a keyed label again when its text or the locale changes', () => {
    const option = { label: 'Ida' };
    expect(createTypeaheadMatcher('id')(option.label, option)).toBe(true);
    option.label = 'Über';
    expect(createTypeaheadMatcher('id')(option.label, option)).toBe(false);
    expect(createTypeaheadMatcher('ub')(option.label, option)).toBe(true);
    const city = { label: 'Istanbul' };
    expect(createTypeaheadMatcher('i')(city.label, city)).toBe(true);
    expect(createTypeaheadMatcher('i', 'tr')(city.label, city)).toBe(false);
  });
});

describe('createLabelMatcher', () => {
  it('matches a substring ignoring case and accents in the locale', () => {
    const match = createLabelMatcher(signal('en'));
    expect(match('Crème brûlée', 'BRULE')).toBe(true);
    expect(match('Über', 'ub')).toBe(true);
    expect(match('Postgres', 'gres')).toBe(true);
    expect(match('Postgres', 'mysql')).toBe(false);
    expect(match('anything', '')).toBe(true);
    const turkish = createLabelMatcher(signal('tr'));
    expect(turkish('İzmir', 'iz')).toBe(true);
  });

  it('matches through invisible format characters', () => {
    const match = createLabelMatcher(signal('en'));
    expect(match('\u2068Über\u2069', 'uber')).toBe(true);
  });

  it('re-folds a keyed label when its text or the locale changes', () => {
    const locale = signal('en');
    const match = createLabelMatcher(locale);
    const option = { label: 'Apple' };
    expect(match(option.label, 'app', option)).toBe(true);
    option.label = 'Banana';
    expect(match(option.label, 'app', option)).toBe(false);
    expect(match(option.label, 'nan', option)).toBe(true);
    // Turkish lowercases a plain capital I to dotless ı, English to i.
    const city = { label: 'IZMIR' };
    expect(match(city.label, 'izmir', city)).toBe(true);
    locale.set('tr');
    expect(match(city.label, 'izmir', city)).toBe(false);
  });
});

describe('createTypeaheadWalker', () => {
  const items = [
    { label: 'Bravo' },
    { label: 'Banana', disabled: true },
    { label: 'Blueberry' },
    { label: 'Cherry' },
    { label: 'Über' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buffers keystrokes in the locale and resets after the debounce window', () => {
    const debounce = signal(300);
    const walker = createTypeaheadWalker({ debounceMs: debounce });
    expect(walker.type('B')).toBe('b');
    expect(walker.type('l')).toBe('bl');
    expect(walker.buffer()).toBe('bl');
    vi.advanceTimersByTime(299);
    expect(walker.buffer()).toBe('bl');
    vi.advanceTimersByTime(1);
    expect(walker.buffer()).toBe('');
  });

  it('reads the debounce window on every keystroke', () => {
    const debounce = signal(300);
    const walker = createTypeaheadWalker({ debounceMs: debounce });
    debounce.set(50);
    walker.type('a');
    vi.advanceTimersByTime(50);
    expect(walker.buffer()).toBe('');
  });

  it('collapses a buffer of one repeated letter to that letter', () => {
    const walker = createTypeaheadWalker({ debounceMs: () => 300 });
    walker.type('b');
    expect(walker.type('b')).toBe('b');
    expect(walker.type('b')).toBe('b');
    expect(walker.buffer()).toBe('bbb');
  });

  it('lowercases the buffer with the locale it reads', () => {
    const locale = signal('tr');
    const walker = createTypeaheadWalker({ debounceMs: () => 300, locale });
    expect(walker.type('I')).toBe('ı');
    walker.clear();
    locale.set('en');
    expect(walker.type('I')).toBe('i');
  });

  it('starts a one-character walk after the current item and wraps, skipping disabled items', () => {
    const walker = createTypeaheadWalker({ debounceMs: () => 300 });
    expect(walker.find(items, 'b', -1)).toBe(0);
    expect(walker.find(items, 'b', 0)).toBe(2);
    expect(walker.find(items, 'b', 2)).toBe(0);
    expect(walker.find(items, 'b', 0, false)).toBe(1);
  });

  it('starts a longer term at the current item', () => {
    const walker = createTypeaheadWalker({ debounceMs: () => 300 });
    expect(walker.find(items, 'bl', 2)).toBe(2);
    expect(walker.find(items, 'br', 2)).toBe(0);
  });

  it('wraps a start outside the items, as a scrolled virtual window passes it', () => {
    const walker = createTypeaheadWalker({ debounceMs: () => 300 });
    expect(walker.find(items, 'c', -3)).toBe(3);
    expect(walker.find(items, 'b', 7)).toBe(0);
  });

  it('matches accent- and case-tolerant and returns -1 on a miss or an empty list', () => {
    const walker = createTypeaheadWalker({ debounceMs: () => 300 });
    expect(walker.find(items, 'u', -1)).toBe(4);
    expect(walker.find(items, 'z', -1)).toBe(-1);
    expect(walker.find([], 'b', -1)).toBe(-1);
  });

  it('clear() empties the buffer and cancels the pending reset', () => {
    const walker = createTypeaheadWalker({ debounceMs: () => 300 });
    walker.type('a');
    walker.clear();
    expect(walker.buffer()).toBe('');
    expect(vi.getTimerCount()).toBe(0);
    walker.clear();
    expect(walker.buffer()).toBe('');
  });
});
