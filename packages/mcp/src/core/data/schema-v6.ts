// Schema-6 projection. compodocx 0.9 dropped the per-entry `category` and the
// per-function `factoryKind` that the query core reads, and publishes `feature`
// and `di.role` instead. This module rebuilds the two schema-2 fields from them
// so everything past `createDocsIndex` keeps one model and never branches on
// `schemaVersion`.

import type { DocEntry, DocFunction, DocumentationJson } from './types.js';

/**
 * `<entryPoint without @cngx/>` plus `/<key>` when the key is non-empty. This is
 * the feature taxonomy compodocx publishes, not the retired `@category` tag, so
 * it differs from schema 2 for a part of the surface (coarser, finer, or
 * reassigned). An entry without `feature` keeps `category` undefined.
 */
function categoryOf(entry: DocEntry): string | undefined {
  if (!entry.feature) {
    return undefined;
  }
  const lib = entry.feature.entryPoint.replace(/^@cngx\//, '');
  return entry.feature.key ? `${lib}/${entry.feature.key}` : lib;
}

// `di` is missing on a handful of config functions (`withFallback`,
// `providePersistence`, ...), so the name prefix fills in. Without it those
// drop out of the `get_config` join they were part of under schema 2.
function factoryKindOf(fn: DocFunction): DocFunction['factoryKind'] {
  const role = fn.di?.role;
  if (role === 'provider' || role === 'feature') {
    return role;
  }
  if (/^provide[A-Z]/.test(fn.name)) {
    return 'provider';
  }
  if (/^with[A-Z]/.test(fn.name)) {
    return 'feature';
  }
  return undefined;
}

const withCategory = (entry: DocEntry): DocEntry => ({ ...entry, category: categoryOf(entry) });

/**
 * Project a schema-6 `documentation.json` onto the schema-2 fields the query
 * core reads: `category` on every component, directive and injectable,
 * `factoryKind` on every function. Pure; the input document is not mutated.
 */
export function projectSchemaV6(doc: DocumentationJson): DocumentationJson {
  return {
    ...doc,
    components: doc.components?.map(withCategory),
    directives: doc.directives?.map(withCategory),
    injectables: doc.injectables?.map(withCategory),
    miscellaneous: doc.miscellaneous && {
      ...doc.miscellaneous,
      functions: doc.miscellaneous.functions?.map((fn) => ({ ...fn, factoryKind: factoryKindOf(fn) })),
    },
  };
}
