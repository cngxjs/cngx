// Structural types for the slices of compodocx's `documentation.json` the tools
// read. This is a minimal projection - not the full compodocx schema - covering
// only the component/directive/token keys the five query tools ground against.
// Grounded on the shape emitted by `compodocx -e json` (schemaVersion 2).

/** A named API input on a component/directive. */
export interface DocInput {
  name: string;
  type?: string;
  defaultValue?: string;
  description?: string;
}

/** A named API output on a component/directive. */
export interface DocOutput {
  name: string;
  type?: string;
  description?: string;
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
