import { type Change, createNote, createProvenance, skipChange, type StepResult } from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { HTML_START_TAG, htmlCarriesDir, type IndexHtmlFacts } from '../detect/scaffold';
import { type OnboardingAnswers, type Versions } from './model';
import { isRtl } from './providers';

const ID = 'document:dir';
const PACK_ID = 'document:dir-pack';

// A tag that already has `dir`, or a file without an `<html` tag, stays as it is.
function withRtlDirection(content: string): string {
  const match = HTML_START_TAG.exec(content);
  if (match === null || htmlCarriesDir(content)) {
    return content;
  }
  const tag = match[0];
  const end = match.index + tag.length - 1;
  return `${content.slice(0, end)} dir="rtl"${content.slice(end)}`;
}

// No index.html: the note; a set `dir`: skipped as the app's; else the edit.
function directionOf(index: IndexHtmlFacts, edit: Change, absent: Change): StepResult {
  if (index.state === 'absent') {
    return { changes: [absent], skipped: [] };
  }
  if (index.dir) {
    return { changes: [], skipped: [skipChange(edit, 'already set')] };
  }
  return { changes: [edit], skipped: [] };
}

/**
 * Plans the document direction for an RTL source locale: ` dir="rtl"` on the
 * `<html>` tag of the build's `index.html`, which `CNGX_DIRECTION` reads live.
 * An existing `dir` is the app's and stays: the step skips the edit as
 * already set, so a re-run plans no change. Without an `index.html` the run
 * names the edit. When the language pack is provided, a note says it
 * rewrites `dir` at runtime.
 */
export function planDocumentDirection(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  if (!isRtl(facts.sourceLocale)) {
    return { changes: [], skipped: [] };
  }
  const provenance = createProvenance('ng-add', versions.cngx);
  const index = facts.indexHtml;
  const edit: Change = {
    kind: 'edit-file',
    id: ID,
    label: `Write the rtl direction into <html> of ${index.path}`,
    reason: `the source locale ${facts.sourceLocale} is written right to left; an existing dir stays as the app set it`,
    provenance,
    path: index.path,
    edit: withRtlDirection,
  };
  const absent = createNote({
    id: ID,
    label: 'Set the rtl direction on the document',
    reason: 'set dir="rtl" on <html> in your index.html',
    provenance,
  });
  const direction = directionOf(index, edit, absent);
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
  return { changes: [...direction.changes, ...pack], skipped: direction.skipped };
}
