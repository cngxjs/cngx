// The one string order of the core. Answers sort by UTF-16 code point, never by
// locale, so the same snapshot renders byte-identical output on every machine.

/** Code-point order, never locale order, so an answer is byte-stable on every machine. */
export const byCodePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
