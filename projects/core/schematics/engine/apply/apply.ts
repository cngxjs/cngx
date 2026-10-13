import { chain, noop, type Rule, SchematicsException, type Tree } from '@angular-devkit/schematics';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {
  addDependency,
  addRootProvider,
  DependencyType,
  ExistingBehavior,
  InstallBehavior,
  updateWorkspace,
} from '@schematics/angular/utility';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { applyToUpdateRecorder } from '@schematics/angular/utility/change';
import { JSONFile } from '@schematics/angular/utility/json-file';

import { insertStyleImport } from '../edit/style-edit';
import { addLockstepDependency } from '../manifest/lockstep';
import {
  type AddImport,
  type AddStyleEntry,
  type AddStyleImport,
  type Change,
  type CreateFile,
  type EditFile,
  type ProviderArg,
  type WriteJson,
} from '../plan/change';
import { type ChangePlan } from '../plan/plan';

// HostTree.create only fails for a file already on disk when the sink
// commits, after every rule ran; check up front so the run stops here.
function createFile(change: CreateFile): Rule {
  return (tree: Tree) => {
    if (tree.exists(change.path)) {
      throw new SchematicsException(`${change.path} already exists; cngx does not overwrite it.`);
    }
    tree.create(change.path, change.content);
  };
}

function editFile(change: EditFile): Rule {
  return (tree: Tree) => {
    const content = tree.readText(change.path);
    const next = change.edit(content);
    if (next !== content) {
      tree.overwrite(change.path, next);
    }
  };
}

function addImport(change: AddImport): Rule {
  return (tree: Tree) => {
    const source = ts.createSourceFile(change.path, tree.readText(change.path), ts.ScriptTarget.Latest, true);
    const recorder = tree.beginUpdate(change.path);
    applyToUpdateRecorder(recorder, [insertImport(source, change.path, change.symbol, change.module)]);
    tree.commitUpdate(recorder);
  };
}

function renderCall(call: ProviderArg, external: (symbol: string, module: string) => string): string {
  if ('literal' in call) {
    return call.literal;
  }
  if ('array' in call) {
    return `[${call.array.map((item) => renderCall(item, external)).join(', ')}]`;
  }
  if (call.reference === true) {
    return external(call.symbol, call.module);
  }
  const args = (call.args ?? []).map((arg) => renderCall(arg, external)).join(', ');
  return `${external(call.symbol, call.module)}(${args})`;
}

function addStyleImport(change: AddStyleImport): Rule {
  return (tree: Tree) => {
    const content = tree.readText(change.path);
    const next = insertStyleImport(content, change.statement);
    if (next !== content) {
      tree.overwrite(change.path, next);
    }
  };
}

function styleInput(entry: unknown): unknown {
  return typeof entry === 'object' && entry !== null && 'input' in entry ? entry.input : entry;
}

// Inserted the way `ng add @angular/material` adds its theme file, through
// the workspace API, so the user's formatting of angular.json survives.
function addStyleEntry(change: AddStyleEntry): Rule {
  return updateWorkspace((workspace) => {
    const options = workspace.projects.get(change.project)?.targets.get('build')?.options;
    if (options === undefined) {
      throw new SchematicsException(`Project "${change.project}" has no build target to add ${change.path} to.`);
    }
    const styles = Array.isArray(options['styles']) ? [...options['styles']] : [];
    const inputs = styles.map(styleInput);
    if (inputs.includes(change.path)) {
      return;
    }
    const after = change.after === undefined ? -1 : inputs.indexOf(change.after);
    styles.splice(after === -1 ? styles.length : after + 1, 0, change.path);
    options['styles'] = styles;
  });
}

function writeJson(change: WriteJson): Rule {
  return (tree: Tree) => {
    if (!tree.exists(change.path)) {
      tree.create(change.path, '{}\n');
    }
    const file = new JSONFile(tree, change.path);
    for (const [path, value] of change.entries) {
      // `false` appends new keys instead of sorting them into the user's order.
      file.modify([...path], value, false);
    }
  };
}

function toRule(change: Change): Rule {
  switch (change.kind) {
    case 'create-file':
      return createFile(change);
    case 'edit-file':
      return editFile(change);
    case 'add-import':
      return addImport(change);
    case 'add-dependency':
      return change.dev === true
        ? addDependency(change.name, change.version, {
            type: DependencyType.Dev,
            install: InstallBehavior.None,
            existing: ExistingBehavior.Skip,
          })
        : addLockstepDependency(change.name, change.version);
    case 'add-provider':
      return addRootProvider(change.project, ({ code, external }) => code`${renderCall(change.call, external)}`);
    case 'add-style-import':
      return addStyleImport(change);
    case 'add-style-entry':
      return addStyleEntry(change);
    case 'write-json':
      return writeJson(change);
    case 'note':
      return noop();
    default: {
      const unmapped: never = change;
      throw new Error(`No apply mapping for change ${JSON.stringify(unmapped)}.`);
    }
  }
}

// `addDependency` rewrites package.json through `JSON.stringify`, which drops
// the trailing newline npm and every editor leave behind.
function keepTrailingNewline(path: string, rules: readonly Rule[]): Rule {
  return (tree: Tree) => {
    const ended = tree.exists(path) && tree.readText(path).endsWith('\n');
    return chain([
      ...rules,
      (after: Tree) => {
        if (!ended || !after.exists(path)) {
          return;
        }
        const content = after.readText(path);
        if (!content.endsWith('\n')) {
          after.overwrite(path, `${content}\n`);
        }
      },
    ]);
  };
}

/**
 * The one effectful step: turns the plan into a Rule, one Rule per change in
 * plan order. Nothing reports back; what changed is `plan.changes`, what was
 * already in place is `plan.skipped`. `create-file` never overwrites, so a
 * step that misses an existing file fails loudly instead of clobbering it.
 */
export function applyChangePlan(plan: ChangePlan): Rule {
  return keepTrailingNewline('package.json', plan.changes.map(toRule));
}
