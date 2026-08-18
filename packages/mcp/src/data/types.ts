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

/** A component or directive entry. */
export interface DocEntry {
  name: string;
  selector?: string;
  category?: string;
  file?: string;
  description?: string;
  signal?: boolean;
  inputs?: DocInput[];
  outputs?: DocOutput[];
  hostBindings?: DocHostBinding[];
  methodsClass?: DocMethod[];
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
  tokens?: DocToken[];
}
