// Snapshot loader + schemaVersion guard. Every tool queries the `DocsIndex` this
// module produces; nothing else reads the raw JSON. The guard is the day-one
// contract: the server refuses a snapshot whose schema it was not built against,
// rather than silently answering from a shape it does not understand.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { projectSchemaV6 } from './schema-v6.js';
import type { DocEntry, DocFunction, DocToken, DocumentationJson } from './types.js';

/**
 * The `documentation.json` schema versions this server reads. Schema 6 is
 * projected onto the schema-2 shape at load time (`schema-v6.ts`).
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

/** Thrown when a snapshot's `schemaVersion` is one the server cannot read. */
export class SchemaVersionError extends Error {
  constructor(
    readonly found: number,
    readonly supported: readonly number[] = SUPPORTED_SCHEMA_VERSIONS,
  ) {
    super(
      `Unsupported documentation.json schemaVersion ${found}; @cngx/mcp supports ${supported.join(' and ')}. ` +
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
export function createDocsIndex(raw: DocumentationJson): DocsIndex {
  if (!isSupportedSchemaVersion(raw.schemaVersion)) {
    throw new SchemaVersionError(raw.schemaVersion);
  }
  const doc = raw.schemaVersion === 6 ? projectSchemaV6(raw) : raw;
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
