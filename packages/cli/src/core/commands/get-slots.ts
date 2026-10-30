// get_slots - the consumer-override surface. Given a resolved name, it returns
// the projected template slots, each carrying the slot directive selector name
// plus its one-line doc. The data has no selector/context key on a slot, so the
// payload is exactly { name, description } per slot.

import { z } from 'zod';
import { defineCommand } from '../command.js';
import { versionInput } from './version-input.js';
import { answerVersioned } from '../data/docs-resolver.js';
import type { DocsIndex } from '../data/loader.js';
import { normalizeSlots } from '../data/slots.js';
import type { DocSlot } from '../data/types.js';
import type { AmbiguousMatch, EntryKind } from '../query.js';
import { foundUnlessAmbiguous, isAmbiguous, resolveEntry } from '../query.js';
import { ambiguousMarkdown, blocks, code, table, textCell } from './markdown.js';

export interface SlotsResult {
  name: string;
  kind: EntryKind;
  slots: DocSlot[];
}

/** Pure query behind the tool - `null` when the name resolves to nothing, the ambiguity when a selector matches several entries. */
export function getSlots(docs: DocsIndex, name: string): SlotsResult | AmbiguousMatch | null {
  const match = resolveEntry(docs, name);
  if (!match || isAmbiguous(match)) {
    return match ?? null;
  }
  return {
    name: match.entry.name,
    kind: match.kind,
    slots: normalizeSlots(match.entry.slots),
  };
}

/** The slots as one table under the component name. */
export function slotsMarkdown(slots: SlotsResult | AmbiguousMatch | null): string {
  if (!slots) {
    return 'No component or directive by that name.\n';
  }
  if (isAmbiguous(slots)) {
    return ambiguousMarkdown(slots);
  }
  const rows = slots.slots.map((slot) => [code(slot.name), textCell(slot.description)]);
  return blocks(
    `# ${slots.name} slots`,
    rows.length ? table(['Slot', 'Description'], rows) : 'No overridable template slots.',
  );
}

/** A question this tool answers; the ng-add helper README lists it. */
export const example = 'Which template slots can I override on CngxSelect?';

export const getSlotsCommand = defineCommand({
  name: 'get_slots',
  title: 'Get cngx component template slots',
  description:
    "Return a component's projected template slots - each the slot directive selector name plus " +
    'its one-line doc - by class name or selector. An empty slots array means the component projects ' +
    'no overridable slots. `result` is null when the name matches nothing, and `{ ambiguous: true, candidates }` when a selector matches several entries.',
  cliSummary:
    'Print the template slots a component projects. Exits 1 when the name matches nothing or a selector matches several entries.',
  cliName: 'slots',
  input: {
    name: z.string().trim().min(1).describe('A component/directive class name or selector, e.g. "CngxSelect".'),
    version: versionInput,
  },
  positional: 'name',
  cliFlags: { version: 'cngx-version' },
  run: (ctx, { name, version }) => answerVersioned(ctx.resolve, version, (resolved) => getSlots(resolved, name)),
  found: foundUnlessAmbiguous,
  toMarkdown: (slots: SlotsResult | AmbiguousMatch | null) => slotsMarkdown(slots),
});
