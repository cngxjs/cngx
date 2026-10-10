import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

import { logging } from '@angular-devkit/core';
import { callRule, type Rule, type Schematic, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { lastValueFrom, of } from 'rxjs';

import { createMemoryTree } from '../engine';

const FIXTURES = join(__dirname, 'fixtures');

export type FixtureName = 'standalone-app';

function walk(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/** Every file of a fixture app, keyed by its path relative to the app root. */
export function readFixture(name: FixtureName): Readonly<Record<string, string>> {
  const root = join(FIXTURES, name);
  return Object.fromEntries(
    walk(root).map((file) => [relative(root, file).split(sep).join('/'), readFileSync(file, 'utf8')]),
  );
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
export function schematicRunner(): SchematicTestRunner {
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

export async function runRule(rule: Rule, tree: Tree): Promise<RuleRun> {
  const logger = new logging.Logger('run-rule');
  const logs: string[] = [];
  logger.subscribe((entry) => logs.push(entry.message));
  // The engine names the rule's child logger after the schematic; a rule run
  // outside a collection has none, so it gets a described stand-in.
  const schematic = { description: { name: 'run-rule' } } as unknown as Schematic<object, object>;
  const context = schematicRunner().engine.createContext(schematic, { logger });
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
