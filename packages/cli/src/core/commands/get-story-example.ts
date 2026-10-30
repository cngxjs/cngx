// get_story_example - answers "show me a working example" with URLs the consumer
// can actually open. The snapshot step has already rebased exampleUrls onto the
// public GH Pages base, so they are the primary payload. `stackblitzUrl` is empty
// across the current surface, so it is surfaced as null rather than leaned on.
// `playgrounds` resolve only inside the cngx repo, so they are returned as
// labelled source references, never as openable links.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import type { DocPlayground } from '../data/types.js';
import type { AmbiguousMatch, EntryKind } from '../query.js';
import { foundUnlessAmbiguous, isAmbiguous, resolveEntry } from '../query.js';
import { ambiguousMarkdown, blocks, bullets, cell, section } from './markdown.js';

export interface StoryExampleResult {
  name: string;
  kind: EntryKind;
  exampleUrls: string[];
  stackblitzUrl: string | null;
  sourceReferences: DocPlayground[];
}

/** Pure query behind the tool - `null` when the name resolves to nothing, the ambiguity when a selector matches several entries. */
export function getStoryExample(docs: DocsIndex, name: string): StoryExampleResult | AmbiguousMatch | null {
  const match = resolveEntry(docs, name);
  if (!match || isAmbiguous(match)) {
    return match ?? null;
  }
  const { entry, kind } = match;
  const stackblitzUrl = entry.stackblitzUrl?.trim();
  return {
    name: entry.name,
    kind,
    exampleUrls: entry.exampleUrls ?? [],
    // stackblitzUrl is empty ("") across the current surface; surface a real
    // link only when non-empty, else null. Not `??` - "" is not nullish.
    stackblitzUrl: stackblitzUrl && stackblitzUrl.length > 0 ? stackblitzUrl : null,
    sourceReferences: (entry.playgrounds ?? []).map((playground) => ({
      title: playground.title,
      fileRef: playground.fileRef,
      line: playground.line,
    })),
  };
}

/** The example links, the StackBlitz link and the source references under the component name. */
export function storyExampleMarkdown(example: StoryExampleResult | AmbiguousMatch | null): string {
  if (!example) {
    return 'No component or directive by that name.\n';
  }
  if (isAmbiguous(example)) {
    return ambiguousMarkdown(example);
  }
  const refs = example.sourceReferences.map((ref) => `${cell(ref.title)}: ${cell(ref.fileRef)}:${ref.line}`);
  return blocks(
    `# ${example.name} examples`,
    section('Examples', bullets(example.exampleUrls), 'No example links.'),
    example.stackblitzUrl && `StackBlitz: ${example.stackblitzUrl}`,
    refs.length > 0 && section('Source references (repo-internal, not openable links)', bullets(refs), ''),
  );
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'Show me a working example of CngxTreeSelect.';

export const getStoryExampleCommand = defineCommand({
  name: 'get_story_example',
  title: 'Get cngx example URLs',
  description:
    "Return a component's runnable example URLs (public documentation links a consumer can open), plus a " +
    'StackBlitz URL when one exists. Playground entries are repo-internal source references, not openable ' +
    'links. `result` is null when the name matches nothing, and `{ ambiguous: true, candidates }` when a selector matches several entries.',
  cliSummary:
    'Print the runnable example links of a component, plus a StackBlitz link when one exists. Exits 1 when the name matches nothing or a selector matches several entries.',
  cliName: 'example',
  input: {
    name: z.string().min(1).describe('A component/directive class name or selector, e.g. "CngxSelect".'),
  },
  positional: 'name',
  // No `version` input: example URLs track the live docs site, so the answer always grounds on the bundled release.
  run: (ctx, { name }) => answerVersioned(ctx.resolve, undefined, (docs) => getStoryExample(docs, name)),
  found: foundUnlessAmbiguous,
  toMarkdown: (example: StoryExampleResult | AmbiguousMatch | null) => storyExampleMarkdown(example),
});
