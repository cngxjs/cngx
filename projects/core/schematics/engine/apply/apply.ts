import { chain, noop, type Rule, SchematicsException, type Tree } from '@angular-devkit/schematics';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {
  addRootProvider,
  DependencyType,
  ExistingBehavior,
  InstallBehavior,
  updateWorkspace,
} from '@schematics/angular/utility';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { applyToUpdateRecorder } from '@schematics/angular/utility/change';
import { JSONFile } from '@schematics/angular/utility/json-file';

import { insertStyleImport, styleEntryPath } from '../edit/style-edit';
import {
  addToArrayLiteral,
  type ArraySelector,
  countArrayLiterals,
  promoteTypeOnlyImport,
  topLevelBindings,
} from '../edit/ts-edit';
import { addDependency } from '../manifest/add-dependency';
import { addLockstepDependency } from '../manifest/lockstep';
import {
  type AddProvider,
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

function insertImportInto(tree: Tree, path: string, symbol: string, module: string): void {
  const source = ts.createSourceFile(path, tree.readText(path), ts.ScriptTarget.Latest, true);
  const recorder = tree.beginUpdate(path);
  applyToUpdateRecorder(recorder, [insertImport(source, path, symbol, module)]);
  tree.commitUpdate(recorder);
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
  // The callee first: `external` imports in call order, so the provider
  // leads its own import specifiers.
  const callee = external(call.symbol, call.module);
  const args = (call.args ?? []).map((arg) => renderCall(arg, external)).join(', ');
  return `${callee}(${args})`;
}

const ROOT_PROVIDERS: ArraySelector = { kind: 'root-providers' };

// Every name the call imports is free in the file or imported from the same
// module (a type-only import of it gets promoted); anything else needs the
// aliasing `addRootProvider` does.
function importsFit(content: string, imports: readonly (readonly [string, string])[]): boolean {
  const bindings = topLevelBindings(content);
  return imports.every(([symbol, module]) => {
    const binding = bindings.get(symbol);
    return binding === undefined || binding.module === module;
  });
}

// `addRootProvider` appends `, <call>` right behind the last element, so in a
// multi-line array the provider lands on its neighbour's line. When the
// planned file holds exactly one root providers array and the imports bind
// cleanly, append there in the array's own layout; otherwise `addRootProvider`
// resolves the file from the bootstrap call and aliases a clashing name.
function addProvider(change: AddProvider): Rule {
  const fallback = addRootProvider(change.project, ({ code, external }) => code`${renderCall(change.call, external)}`);
  return (tree: Tree) => {
    const path = change.path;
    const content = path !== undefined && tree.exists(path) ? tree.readText(path) : undefined;
    if (path === undefined || content === undefined || countArrayLiterals(content, ROOT_PROVIDERS) !== 1) {
      return fallback;
    }
    const imports: (readonly [string, string])[] = [];
    const expression = renderCall(change.call, (symbol, module) => {
      imports.push([symbol, module]);
      return symbol;
    });
    if (!importsFit(content, imports)) {
      return fallback;
    }
    const added = addToArrayLiteral(content, ROOT_PROVIDERS, expression);
    if (added === content) {
      return undefined;
    }
    const next = imports.reduce((text, [symbol, module]) => promoteTypeOnlyImport(text, symbol, module), added);
    tree.overwrite(path, next);
    for (const [symbol, module] of imports) {
      insertImportInto(tree, path, symbol, module);
    }
    return undefined;
  };
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

// Inserted the way `ng add @angular/material` adds its theme file, through
// the workspace API, so the user's formatting of angular.json survives.
function addStyleEntry(change: AddStyleEntry): Rule {
  return updateWorkspace((workspace) => {
    const options = workspace.projects.get(change.project)?.targets.get('build')?.options;
    if (options === undefined) {
      throw new SchematicsException(`Project "${change.project}" has no build target to add ${change.path} to.`);
    }
    const styles = Array.isArray(options['styles']) ? [...options['styles']] : [];
    const inputs = styles.map(styleEntryPath);
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
    case 'add-dependency':
      return change.dev === true
        ? addDependency(change.name, change.version, {
            type: DependencyType.Dev,
            install: InstallBehavior.None,
            existing: ExistingBehavior.Skip,
          })
        : addLockstepDependency(change.name, change.version);
    case 'add-provider':
      return addProvider(change);
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

/**
 * The one effectful step: turns the plan into a Rule, one Rule per change in
 * plan order. Nothing reports back; what changed is `plan.changes`, what was
 * already in place is `plan.skipped`. `create-file` never overwrites, so a
 * step that misses an existing file fails loudly instead of clobbering it.
 */
export function applyChangePlan(plan: ChangePlan): Rule {
  return chain(plan.changes.map(toRule));
}
