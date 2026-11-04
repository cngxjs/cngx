import { describe, expect, it } from 'vitest';

import { readSpokenText } from './spoken-text';

function html(markup: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = markup;
  return el;
}

describe('readSpokenText', () => {
  it('skips an aria-hidden glyph next to the message', () => {
    expect(readSpokenText(html('<span aria-hidden="true">!</span> Permission denied'))).toBe(
      'Permission denied',
    );
  });

  it('skips hidden subtrees', () => {
    expect(readSpokenText(html('Saved <span hidden>internal</span>'))).toBe('Saved');
  });

  it('joins nested text in document order', () => {
    expect(readSpokenText(html('<b>Err:</b> <em>timeout</em> - <span>retry?</span>'))).toBe(
      'Err: timeout - retry?',
    );
  });

  it('collapses whitespace and trims', () => {
    expect(readSpokenText(html('\n   Saving\n\n   draft   '))).toBe('Saving draft');
  });

  it('reads the element itself even when it is aria-hidden', () => {
    const el = html('Failed');
    el.setAttribute('aria-hidden', 'true');
    expect(readSpokenText(el)).toBe('Failed');
  });

  it('ignores comment nodes and returns an empty string for no text', () => {
    expect(readSpokenText(html('<!-- container -->'))).toBe('');
  });
});
