// Source JSDoc may carry em or en dashes (U+2014, U+2013). A generated file
// that lands in a consumer app or a shipped pack gets a plain ASCII hyphen.

const DASHES = /\s*[\u2014\u2013]\s*/g;

/** Every em or en dash, with the spaces around it, as ` - `. */
export function normalizeDashes(text) {
  return text.replace(DASHES, ' - ');
}
