import { type JsonValue } from '@angular-devkit/core';

/** Which generator planned a change and from which cngx release. */
export interface Provenance {
  readonly source: string;
  readonly version: string;
}

interface ChangeBase {
  /** Stable across runs and across the planned and the skipped channel. */
  readonly id: string;
  /** One line for the todo list, `--dry-run` output and the summary. */
  readonly label: string;
  /** Why the change is planned, shown next to the label. */
  readonly reason: string;
  readonly provenance: Provenance;
}

export interface CreateFile extends ChangeBase {
  readonly kind: 'create-file';
  readonly path: string;
  readonly content: string;
}

export interface EditFile extends ChangeBase {
  readonly kind: 'edit-file';
  readonly path: string;
  /** Pure transform of the current file content. */
  readonly edit: (content: string) => string;
}

export interface AddImport extends ChangeBase {
  readonly kind: 'add-import';
  readonly path: string;
  readonly symbol: string;
  readonly module: string;
}

export interface AddDependency extends ChangeBase {
  readonly kind: 'add-dependency';
  readonly name: string;
  readonly version: string;
}

/** A call expression such as `provideA11yPreferences(withPersistence())`. */
export interface ProviderCall {
  readonly symbol: string;
  readonly module: string;
  readonly args?: readonly ProviderCall[];
}

export interface AddProvider extends ChangeBase {
  readonly kind: 'add-provider';
  readonly project: string;
  readonly call: ProviderCall;
}

/** An `@use` / `@import` placed before the first rule of a stylesheet. */
export interface AddStyleImport extends ChangeBase {
  readonly kind: 'add-style-import';
  readonly path: string;
  readonly statement: string;
}

export type JsonPath = readonly (string | number)[];
export type JsonEntry = readonly [path: JsonPath, value: JsonValue];

export interface WriteJson extends ChangeBase {
  readonly kind: 'write-json';
  readonly path: string;
  readonly entries: readonly JsonEntry[];
}

/** Communicated only; touches no file. */
export interface Note extends ChangeBase {
  readonly kind: 'note';
}

export type Change =
  | CreateFile
  | EditFile
  | AddImport
  | AddDependency
  | AddProvider
  | AddStyleImport
  | WriteJson
  | Note;

/** A change a step did not plan because its effect is already in place. */
export interface SkippedStep {
  readonly id: string;
  readonly label: string;
  readonly reason: string;
}

/** What every `plan*` step returns. */
export interface StepResult {
  readonly changes: readonly Change[];
  readonly skipped: readonly SkippedStep[];
}

/**
 * The skipped entry for a change whose effect is already in place. It keeps
 * the change's id, so the manifest sees one id whether a step planned or
 * skipped it.
 */
export function skipChange(change: Change, reason: string): SkippedStep {
  return { id: change.id, label: change.label, reason };
}
