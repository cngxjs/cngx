import { type Change, createNote, createProvenance, type StepResult } from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers, type Versions } from './model';
import { isRtl } from './providers';

const ID = 'document:dir';
const PACK_ID = 'document:dir-pack';

// The first `<html` start tag, up to its closing `>`.
const HTML_START_TAG = /<html\b[^>]*>/i;
const DIR_ATTRIBUTE = /\sdir\s*=/i;

// A tag that already has `dir`, or a file without an `<html` tag, stays as it is.
function withRtlDirection(content: string): string {
  const match = HTML_START_TAG.exec(content);
  if (match === null || DIR_ATTRIBUTE.test(match[0])) {
    return content;
  }
  const tag = match[0];
  const end = match.index + tag.length - 1;
  return `${content.slice(0, end)} dir="rtl"${content.slice(end)}`;
}

/**
 * Plans the document direction for an RTL source locale: ` dir="rtl"` on the
 * `<html>` tag of the build's `index.html`, which `CNGX_DIRECTION` reads live.
 * An existing `dir` is the app's and stays, so the edit reports it as in
 * place. Without an `index.html` the run names the edit. When the language
 * pack is provided, a note says it rewrites `dir` at runtime.
 */
export function planDocumentDirection(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  if (!isRtl(facts.sourceLocale)) {
    return { changes: [], skipped: [] };
  }
  const provenance = createProvenance('ng-add', versions.cngx);
  const index = facts.indexHtml;
  const direction: Change =
    index.state === 'absent'
      ? createNote({
          id: ID,
          label: 'Set the rtl direction on the document',
          reason: 'set dir="rtl" on <html> in your index.html',
          provenance,
        })
      : {
          kind: 'edit-file',
          id: ID,
          label: `Write the rtl direction into <html> of ${index.path}`,
          reason: `the source locale ${facts.sourceLocale ?? ''} is written right to left; an existing dir stays as the app set it`,
          provenance,
          path: index.path,
          edit: withRtlDirection,
        };
  const packWrites = answers.i18n === 'de' || facts.rootProviders.includes('provideCngxI18n');
  const pack: readonly Change[] = packWrites
    ? [
        createNote({
          id: PACK_ID,
          label: 'Keep the rtl direction under the language pack',
          reason: "provideCngxI18n writes <html dir> from the language pack at runtime; pass withDocumentLanguage('off') to keep rtl",
          provenance,
        }),
      ]
    : [];
  return { changes: [direction, ...pack], skipped: [] };
}
