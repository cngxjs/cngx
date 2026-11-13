import { describe, expect, it } from 'vitest';

import { type Change, type EditFile } from '../../engine';
import { createAnswers, createFacts, VERSIONS } from '../../testing/onboarding';
import { planDocumentDirection } from './document-direction';

function directionEdit(changes: readonly Change[]): EditFile {
  const change = changes.find((entry) => entry.id === 'document:dir');
  if (change?.kind !== 'edit-file') {
    throw new Error('no document:dir edit planned');
  }
  return change;
}

describe('planDocumentDirection', () => {
  it('plans nothing for a left-to-right source locale', () => {
    expect(planDocumentDirection(createFacts({ sourceLocale: 'de-AT' }), createAnswers(), VERSIONS)).toEqual({
      changes: [],
      skipped: [],
    });
    expect(planDocumentDirection(createFacts(), createAnswers(), VERSIONS)).toEqual({ changes: [], skipped: [] });
  });

  it('edits the index.html of the build for every RTL source locale', () => {
    for (const locale of ['ar', 'he-IL', 'fa_IR', 'UR']) {
      const { changes } = planDocumentDirection(createFacts({ sourceLocale: locale }), createAnswers(), VERSIONS);

      expect(changes).toHaveLength(1);
      expect(directionEdit(changes)).toMatchObject({
        path: 'src/index.html',
        label: 'Write the rtl direction into <html> of src/index.html',
        reason: `the source locale ${locale} is written right to left; an existing dir stays as the app set it`,
      });
    }
  });

  it('adds dir="rtl" to the html tag and keeps an existing dir byte-identical', () => {
    const { edit } = directionEdit(
      planDocumentDirection(createFacts({ sourceLocale: 'ar' }), createAnswers(), VERSIONS).changes,
    );
    const stock = '<!doctype html>\n<html lang="en">\n<head></head>\n</html>\n';

    expect(edit(stock)).toBe('<!doctype html>\n<html lang="en" dir="rtl">\n<head></head>\n</html>\n');
    expect(edit('<html>')).toBe('<html dir="rtl">');
    for (const kept of ['<html dir="ltr">\n</html>', '<html lang="ar" dir="rtl">\n</html>', '<body></body>']) {
      expect(edit(kept)).toBe(kept);
    }
  });

  it('names the edit when the build has no index.html', () => {
    const facts = createFacts({ sourceLocale: 'ar', indexHtml: { path: 'src/index.html', state: 'absent' } });

    expect(planDocumentDirection(facts, createAnswers(), VERSIONS).changes).toEqual([
      expect.objectContaining({ kind: 'note', id: 'document:dir', reason: 'set dir="rtl" on <html> in your index.html' }),
    ]);
  });

  it('says that the language pack rewrites dir when it is provided', () => {
    const note = expect.objectContaining({
      kind: 'note',
      id: 'document:dir-pack',
      reason: "provideCngxI18n writes <html dir> from the language pack at runtime; pass withDocumentLanguage('off') to keep rtl",
    });

    expect(planDocumentDirection(createFacts({ sourceLocale: 'ar' }), createAnswers({ i18n: 'de' }), VERSIONS).changes).toContainEqual(
      note,
    );
    const provided = createFacts({ sourceLocale: 'ar', rootProviders: ['provideCngxI18n'] });
    expect(planDocumentDirection(provided, createAnswers(), VERSIONS).changes).toContainEqual(note);
    expect(planDocumentDirection(createFacts({ sourceLocale: 'ar' }), createAnswers(), VERSIONS).changes).not.toContainEqual(note);
  });
});
