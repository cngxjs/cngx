// Structural types for the slices of compodocx's `documentation.json` the tools
// read. This is a minimal projection - not the full compodocx schema - covering
// only the component/directive/token keys the five query tools ground against.
// Grounded on the shape emitted by `compodocx -e json`, schemaVersion 2 and 6.
// Schema 6 drops `category` and `factoryKind`; `schema-v6.ts` derives both from
// the schema-6 `feature` and `di` fields at load time.

/** Schema 6: the public entry point and feature group an artifact belongs to. */
export interface DocFeature {
  entryPoint: string;
  key: string;
}

/** Schema 6: DI metadata on a function. Only `role` is read. */
export interface DocDi {
  role?: string;
}

/**
 * How a member is declared: `'input-signal'`, `'model'` or `'output-signal'`.
 * Absent on decorator-based members.
 */
export type DocSignalKind = string;

/**
 * A named API input on a component/directive. `name` is the class field;
 * `alias` is the binding name when it differs (schema 6 emits it, the schema-2
 * projection lifts it out of `defaultValue`).
 */
export interface DocInput {
  name: string;
  alias?: string;
  type?: string;
  defaultValue?: string;
  description?: string;
  signalKind?: DocSignalKind;
  required?: boolean;
}

/** A named API output on a component/directive. */
export interface DocOutput {
  name: string;
  alias?: string;
  type?: string;
  description?: string;
  signalKind?: DocSignalKind;
}

/** A public method on the class. */
export interface DocMethod {
  name: string;
  args?: unknown[];
  returnType?: string;
  description?: string;
  rawdescription?: string;
}

/** A host binding entry. */
export interface DocHostBinding {
  name: string;
  type?: string;
  defaultValue?: string;
  description?: string;
}

/**
 * A projected template slot. Each carries exactly the slot directive selector
 * name plus its one-line doc - there is no `selector`/`context` key in the data.
 */
export interface DocSlot {
  name: string;
  description: string;
}

/** A theming token lifted from the component's SCSS/CSS by compodocx. */
export interface DocThemeToken {
  name: string;
  kind?: string;
  type?: string;
  defaultValue?: string;
  description?: string;
}

/**
 * A playground pointer. `fileRef`/`line` resolve only inside the cngx repo, so
 * these are source references, not openable links.
 */
export interface DocPlayground {
  title: string;
  fileRef: string;
  line: number;
}

/**
 * A component, directive, or injectable-service entry. Injectables carry no
 * selector and no input/output sets; their methods land under `methods` (not
 * `methodsClass`), so both keys are declared and `get_api` reads whichever is set.
 */
export interface DocEntry {
  name: string;
  selector?: string;
  category?: string;
  file?: string;
  description?: string;
  signal?: boolean;
  // cngx declares its API with signal `input()`/`output()`/`model()`, which
  // compodocx records in `inputsClass`/`outputsClass` (the legacy decorator
  // `inputs`/`outputs` arrays are empty across the surface, so they are not read).
  inputsClass?: DocInput[];
  outputsClass?: DocOutput[];
  hostBindings?: DocHostBinding[];
  methodsClass?: DocMethod[];
  methods?: DocMethod[];
  slots?: DocSlot[];
  themeTokens?: DocThemeToken[];
  themeOverview?: string;
  playgrounds?: DocPlayground[];
  exampleUrls?: string[];
  stackblitzUrl?: string;
  entryPoint?: string;
  feature?: DocFeature;
}

/** A top-level DI token entry (`tokens[]`). */
export interface DocToken {
  name: string;
  file?: string;
  type?: string;
  description?: string;
}

/**
 * A `miscellaneous.functions[]` entry. `factoryKind` (`'provider' | 'feature' |
 * 'inject' | 'factory'`) and `file` drive the config-cascade join; `returnType`
 * labels the config-feature group. `returnType` is optional: nearly every
 * function carries it, a few do not (`withCngxAsyncState`, `provideRecyclerI18n`
 * among them) - none is a config-cascade feature, but the type must not require it.
 */
export interface DocFunction {
  name: string;
  file?: string;
  factoryKind?: 'provider' | 'feature' | 'inject' | 'factory';
  returnType?: string;
  description?: string;
  entryPoint?: string;
  feature?: DocFeature;
  di?: DocDi;
}

/**
 * The subset of the `documentation.json` root the loader reads. `cngxVersion`
 * is absent in the raw compodocx output - the snapshot step stamps it - so it
 * is optional here and the loader normalises a missing value to `null`.
 */
export interface DocumentationJson {
  schemaVersion: number;
  generatedAt?: string;
  compodocxVersion?: string;
  cngxVersion?: string;
  components?: DocEntry[];
  directives?: DocEntry[];
  injectables?: DocEntry[];
  tokens?: DocToken[];
  miscellaneous?: { functions?: DocFunction[] };
}
