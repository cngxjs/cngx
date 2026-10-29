// Snapshot loader + schemaVersion guard. Every tool queries the `DocsIndex` this
// module produces; nothing else reads the raw JSON. The guard is the day-one
// contract: the server refuses a snapshot whose schema it was not built against,
// rather than silently answering from a shape it does not understand.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { projectSchemaV2 } from './schema-v2.js';
import { projectSchemaV6 } from './schema-v6.js';
import type { DocEntry, DocFunction, DocToken, DocumentationJson } from './types.js';

/**
 * The `documentation.json` schema versions this server reads. Both are projected
 * onto one shape at load time: schema 2 gains the input `alias` (`schema-v2.ts`),
 * schema 6 the schema-2 `category` and `factoryKind` (`schema-v6.ts`).
 */
export const SUPPORTED_SCHEMA_VERSIONS = [2, 6] as const;

function isSupportedSchemaVersion(version: number): boolean {
  return (SUPPORTED_SCHEMA_VERSIONS as readonly number[]).includes(version);
}

/**
 * Provenance the server reports at connect so an agent knows which cngx release
 * the answers ground against. `cngxVersion` is the snapshot stamp; `null` when
 * querying a raw (un-stamped) compodocx export.
 */
export interface DocsMeta {
  schemaVersion: number;
  cngxVersion: string | null;
  generatedAt: string | null;
  compodocxVersion: string | null;
}

/** The typed, tool-facing view over one loaded snapshot. */
export interface DocsIndex {
  meta: DocsMeta;
  components: DocEntry[];
  directives: DocEntry[];
  injectables: DocEntry[];
  tokens: DocToken[];
  functions: DocFunction[];
}

// Both the mcp server and the cli read this snapshot and show these messages to
// their users, so the text names neither package and no build step.
const REINSTALL_HINT = 'reinstall the package that bundles this snapshot';

/** Thrown when a snapshot cannot be read as a cngx `documentation.json`. */
export class MalformedSnapshotError extends Error {
  constructor(detail: string) {
    super(`Malformed documentation.json: ${detail}; ${REINSTALL_HINT}.`);
    this.name = 'MalformedSnapshotError';
  }
}

/** Thrown when a snapshot's `schemaVersion` is one the server cannot read. */
export class SchemaVersionError extends MalformedSnapshotError {
  constructor(
    readonly found: number,
    readonly supported: readonly number[] = SUPPORTED_SCHEMA_VERSIONS,
  ) {
    super(`schemaVersion ${found}; this package reads ${supported.join(' and ')}`);
    this.name = 'SchemaVersionError';
  }
}

const LIST_FIELDS = ['components', 'directives', 'injectables', 'tokens'] as const;

/** The first top-level field whose shape the query core cannot walk, or `null`. */
function shapeDefect(raw: unknown): string | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return 'the document is not an object';
  }
  const doc = raw as Record<string, unknown>;
  for (const field of LIST_FIELDS) {
    if (doc[field] !== undefined && !Array.isArray(doc[field])) {
      return `${field} is not a list`;
    }
  }
  const misc = doc.miscellaneous as Record<string, unknown> | undefined;
  if (misc !== undefined && (misc === null || typeof misc !== 'object')) {
    return 'miscellaneous is not an object';
  }
  if (misc?.functions !== undefined && !Array.isArray(misc.functions)) {
    return 'miscellaneous.functions is not a list';
  }
  return null;
}

/**
 * Validate a parsed snapshot and project it to the tool-facing `DocsIndex`.
 * Throws {@link SchemaVersionError} on a schema mismatch - the guard the loader
 * spec pins in both directions - and {@link MalformedSnapshotError} on any other
 * shape the projection cannot read, never a raw `TypeError`.
 */
export function createDocsIndex(raw: DocumentationJson): DocsIndex {
  const defect = shapeDefect(raw);
  if (defect !== null) {
    throw new MalformedSnapshotError(defect);
  }
  if (!isSupportedSchemaVersion(raw.schemaVersion)) {
    throw new SchemaVersionError(raw.schemaVersion);
  }
  let doc: DocumentationJson;
  try {
    doc = raw.schemaVersion === 6 ? projectSchemaV6(raw) : projectSchemaV2(raw);
  } catch (error) {
    throw new MalformedSnapshotError(error instanceof Error ? error.message : String(error));
  }
  return {
    meta: {
      schemaVersion: doc.schemaVersion,
      cngxVersion: doc.cngxVersion ?? null,
      generatedAt: doc.generatedAt ?? null,
      compodocxVersion: doc.compodocxVersion ?? null,
    },
    components: doc.components ?? [],
    directives: doc.directives ?? [],
    injectables: doc.injectables ?? [],
    tokens: doc.tokens ?? [],
    functions: doc.miscellaneous?.functions ?? [],
  };
}

/** Read and validate a snapshot from an explicit path (used by tests + loader). */
export function loadDocsFromFile(path: string): DocsIndex {
  const raw = readFileSync(path, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new MalformedSnapshotError(error instanceof Error ? error.message : String(error));
  }
  return createDocsIndex(parsed as DocumentationJson);
}

// The bundled snapshot ships at `<package>/data/documentation.json`. The caller
// passes that directory: only the entry module knows its own depth below the
// package root, so no path here is relative to this file.

/** Load the snapshot bundled into the published package from its `data/` directory. */
export function loadBundledDocs(dataDir: string): DocsIndex {
  return loadDocsFromFile(join(dataDir, 'documentation.json'));
}

// The verbatim compodocx llm-md dump - the full offline API text. Deliberately a
// separate loader returning the raw string, NOT a field on `DocsIndex`: the index
// is the typed, tool-facing view, and a ~1.2 MB opaque text carrier would bloat
// every consumer that only wants the structured shape.

/** Read the llm-md dump from an explicit path; `null` when the file is absent. */
export function loadLlmDumpFromFile(path: string): string | null {
  if (!existsSync(path)) {
    return null;
  }
  return readFileSync(path, 'utf8');
}

// Ships alongside `documentation.json` at `<package>/data/llm-context.md`.
// Optional: a checkout that has not run `docs:llm` bundles no dump, and the
// resource then degrades to an empty read.

/** Load the llm-md dump bundled into the published package; `null` when absent. */
export function loadBundledLlmDump(dataDir: string): string | null {
  return loadLlmDumpFromFile(join(dataDir, 'llm-context.md'));
}
