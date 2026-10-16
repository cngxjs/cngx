import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

import { logging } from '@angular-devkit/core';
import { callRule, type Rule, type Schematic, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { lastValueFrom, of } from 'rxjs';

import { createMemoryTree, listFiles } from '../engine';

const FIXTURES = join(__dirname, 'fixtures');

export type FixtureName = 'standalone-app' | 'existing-tailwind-app';

function walk(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function readFiles(root: string): Readonly<Record<string, string>> {
  return Object.fromEntries(
    walk(root).map((file) => [relative(root, file).split(sep).join('/'), readFileSync(file, 'utf8')]),
  );
}

/** Every file of a fixture app, keyed by its path relative to the app root. */
export function readFixture(name: FixtureName): Readonly<Record<string, string>> {
  return readFiles(join(FIXTURES, name));
}

export interface MigrationFixture {
  /** The stock app with the `before/` files on top: the tree a migration runs on. */
  readonly before: Readonly<Record<string, string>>;
  /** The stock app with the `before/` and then the `after/` files on top: the tree it leaves. */
  readonly after: Readonly<Record<string, string>>;
}

/**
 * `fixtures/migrations/<name>/{before,after}`. Both folders hold only what
 * differs from the stock standalone app, so a pair states the migration's
 * effect and nothing else: `after/` lists every file the migration writes.
 */
export function readMigrationFixture(name: string): MigrationFixture {
  const root = join(FIXTURES, 'migrations', name);
  const before = { ...readFixture('standalone-app'), ...readFiles(join(root, 'before')) };
  return { before, after: { ...before, ...readFiles(join(root, 'after')) } };
}

/** Every file of a tree, keyed by its path without the leading slash. */
export function readTree(tree: Tree): Readonly<Record<string, string>> {
  return Object.fromEntries(listFiles(tree, '/').map((path) => [path, tree.readText(path)]));
}

/**
 * A fixture app as a `UnitTestTree`. `overrides` replace or add files, so a
 * spec states only what differs from the stock app (an eslint config, a
 * Material stylesheet, an RTL locale).
 */
export function createFixtureTree(
  name: FixtureName = 'standalone-app',
  overrides: Readonly<Record<string, string>> = {},
): UnitTestTree {
  return new UnitTestTree(createMemoryTree({ ...readFixture(name), ...overrides }));
}

let runner: SchematicTestRunner | undefined;

/**
 * A runner over `@schematics/angular`, so a rule under test can call its
 * utilities and external schematics resolve. Source collections are not
 * loadable here (their factories are TypeScript), so specs run rules
 * directly through `runRule`.
 */
function schematicRunner(): SchematicTestRunner {
  runner ??= new SchematicTestRunner(
    '@schematics/angular',
    join(dirname(require.resolve('@schematics/angular/package.json')), 'collection.json'),
  );
  return runner;
}

export interface RuleRun {
  readonly tree: UnitTestTree;
  /** Every message the rule logged, in order. */
  readonly logs: readonly string[];
  /** The name of every task the rule scheduled, in order. */
  readonly tasks: readonly string[];
}

/** A collection entry as the CLI hands it to the schematic it runs. */
export type CollectionEntry = Readonly<Record<string, unknown>>;

/**
 * Runs `rule` on `tree`; `entry` stands in for the collection entry a CLI run
 * passes, `interactive` for the execution option a programmatic caller sets.
 */
export async function runRule(
  rule: Rule,
  tree: Tree,
  entry: CollectionEntry = {},
  interactive?: boolean,
): Promise<RuleRun> {
  const logger = new logging.Logger('run-rule');
  const logs: string[] = [];
  logger.subscribe((record) => logs.push(record.message));
  // The engine names the rule's child logger after the schematic; a rule run
  // outside a collection has none, so it gets a described stand-in.
  const schematic = { description: { name: 'run-rule', ...entry } } as unknown as Schematic<
    object,
    object
  >;
  const context = schematicRunner().engine.createContext(schematic, { logger }, { interactive });
  const tasks: string[] = [];
  const recording: SchematicContext = {
    ...context,
    addTask: (task, dependencies) => {
      tasks.push(task.toConfiguration().name);
      return context.addTask(task, dependencies);
    },
  };
  const result = await lastValueFrom(callRule(rule, of(tree), recording));
  return { tree: new UnitTestTree(result), logs, tasks };
}
