// Snapshot loader + schemaVersion guard. Every tool queries the `DocsIndex` this
// module produces; nothing else reads the raw JSON. The guard is the day-one
// contract: the server refuses a snapshot whose schema it was not built against,
// rather than silently answering from a shape it does not understand.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DocEntry, DocFunction, DocToken, DocumentationJson } from './types.js';

/** The single `documentation.json` schema version this server supports. */
export const SUPPORTED_SCHEMA_VERSION = 2;

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

/** Thrown when a snapshot's `schemaVersion` is one the server cannot read. */
export class SchemaVersionError extends Error {
  constructor(
    readonly found: number,
    readonly supported: number,
  ) {
    super(
      `Unsupported documentation.json schemaVersion ${found}; @cngx/mcp supports ${supported}. ` +
        `Regenerate the snapshot with a matching compodocx.`,
    );
    this.name = 'SchemaVersionError';
  }
}

/**
 * Validate a parsed snapshot and project it to the tool-facing `DocsIndex`.
 * Throws {@link SchemaVersionError} on a schema mismatch - the guard the loader
 * spec pins in both directions.
 */
export function createDocsIndex(doc: DocumentationJson): DocsIndex {
  if (doc.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    throw new SchemaVersionError(doc.schemaVersion, SUPPORTED_SCHEMA_VERSION);
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
  return createDocsIndex(JSON.parse(raw) as DocumentationJson);
}

// The bundled snapshot ships at `<package>/data/documentation.json`. From the
// compiled `dist/data/loader.js`, two levels up reach the package root.
const BUNDLED_DATA_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'documentation.json');

/** Load the snapshot bundled into the published package. */
export function loadBundledDocs(): DocsIndex {
  return loadDocsFromFile(BUNDLED_DATA_PATH);
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

// Ships alongside `documentation.json` at `<package>/data/llm-context.md`,
// mirroring BUNDLED_DATA_PATH. Optional: a checkout that has not run `docs:llm`
// bundles no dump, and the resource then degrades to an empty read.
const BUNDLED_LLM_DUMP_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'llm-context.md');

/** Load the llm-md dump bundled into the published package; `null` when absent. */
export function loadBundledLlmDump(): string | null {
  return loadLlmDumpFromFile(BUNDLED_LLM_DUMP_PATH);
}
