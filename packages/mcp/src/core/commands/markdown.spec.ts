// The HTML inputs copy compodoc's rendering of cngx JSDoc as it lands in the
// `description` fields of `npm run docs:json` (compodocx 0.10.0): `<p>`-wrapped,
// `<code>` for backticks, entities for `<`, `>` and quotes, `<example-url>`
// anchors carrying the build-time base.

import { describe, expect, it } from 'vitest';
import { ambiguousMarkdown, docText, textCell, toPlainText } from './markdown.js';

describe('toPlainText', () => {
  it('strips nested tags and keeps code as backticks', () => {
    expect(toPlainText('<p><strong>Mobile <em>sheet</em>.</strong> Uses <code>role</code>.</p>')).toBe(
      'Mobile sheet. Uses `role`.',
    );
  });

  it('decodes named and numeric entities', () => {
    expect(toPlainText('<p>Behaves like <code>&lt;select&gt;</code>, &quot;a&quot; &amp; &#39;b&#39; &#x2713;</p>')).toBe(
      'Behaves like `<select>`, "a" & \'b\' ✓',
    );
  });

  it('keeps paragraph and line breaks as blank lines and collapses whitespace inside one', () => {
    expect(toPlainText('<p>First\nparagraph</p>\n<p>Second<br>third</p>')).toBe('First paragraph\n\nSecond\n\nthird');
  });

  it('turns list items into dash lines', () => {
    expect(toPlainText('<ul>\n<li>one</li>\n<li>two</li>\n</ul>')).toBe('- one\n\n- two');
  });

  it('removes example-url anchors with their build-time base', () => {
    const html =
      '<p>Text.</p>\n<p><example-url><a href="http://localhost:4200/#/forms/select">http://localhost:4200/#/forms/select</a></example-url></p>';

    expect(toPlainText(html)).toBe('Text.');
  });
});

describe('docText', () => {
  it('converts compodoc HTML', () => {
    expect(docText('<p>Disables the <code>select</code>.</p>')).toBe('Disables the `select`.');
  });

  it('passes markdown source through, a literal <color> included', () => {
    expect(docText('Registering as `<color>` would forbid `currentColor`.\n')).toBe(
      'Registering as `<color>` would forbid `currentColor`.',
    );
  });

  it('keeps null for a missing description', () => {
    expect(docText(undefined)).toBeNull();
  });
});

describe('textCell', () => {
  it('leaves a short description whole', () => {
    expect(textCell('<p>Short.</p>')).toBe('Short.');
  });

  it('caps a long description at a word boundary', () => {
    const capped = textCell(`<p>${'word '.repeat(200)}</p>`);

    expect(capped.length).toBeLessThanOrEqual(203);
    expect(capped).toMatch(/word\.\.\.$/);
  });
});

describe('ambiguousMarkdown', () => {
  it('asks again for the class name of one candidate, never for a selector', () => {
    const markdown = ambiguousMarkdown({
      ambiguous: true,
      candidates: [
        { name: 'CngxSyncA', kind: 'directive', selector: 'cngx-a[cngxSync]' },
        { name: 'CngxSyncB', kind: 'directive', selector: 'cngx-b[cngxSync]' },
      ],
    });

    expect(markdown).toContain('Ask again with the class name of one candidate.');
    expect(markdown).not.toContain('full selector');
  });
});
