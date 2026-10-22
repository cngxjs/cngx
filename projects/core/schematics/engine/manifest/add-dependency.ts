import { chain, type Rule, type Tree } from '@angular-devkit/schematics';
import { addDependency as addAngularDependency } from '@schematics/angular/utility';

import { newlineOf } from '../plan/text';

const MANIFEST = 'package.json';

// The indentation of the first indented line; two spaces, as Angular writes,
// when there is none.
function indentationOf(content: string): string {
  return /\n([ \t]+)\S/.exec(content)?.[1] ?? '  ';
}

// JSON.stringify takes at most ten characters of a string indent, so the
// file is written with one tab per level and each leading tab widened. JSON
// escapes a tab inside a string, so every literal tab is indentation.
function reindent(content: string, indent: string): string {
  return JSON.stringify(JSON.parse(content), null, '\t').replace(/^\t+/gm, (tabs) => indent.repeat(tabs.length));
}

/**
 * `addDependency` from `@schematics/angular/utility`, keeping the
 * indentation, the line endings and the trailing newline of package.json.
 * Angular rewrites the manifest through `JSON.stringify` with two spaces,
 * which writes LF and drops the newline npm and every editor leave behind;
 * a rewritten file gets the original indentation (tabs or any number of
 * spaces) and newline back, and the trailing one only when the file had one.
 */
export function addDependency(...args: Parameters<typeof addAngularDependency>): Rule {
  return (tree: Tree) => {
    const original = tree.exists(MANIFEST) ? tree.readText(MANIFEST) : undefined;
    return chain([
      addAngularDependency(...args),
      (after: Tree) => {
        if (original === undefined || !after.exists(MANIFEST)) {
          return;
        }
        const content = after.readText(MANIFEST);
        if (content === original) {
          return;
        }
        const indent = indentationOf(original);
        const indented = indent === '  ' ? content : reindent(content, indent);
        const newline = newlineOf(original);
        const ended = original.endsWith('\n') && !indented.endsWith('\n') ? `${indented}\n` : indented;
        const restored = newline === '\n' ? ended : ended.replace(/\r?\n/g, newline);
        if (restored !== content) {
          after.overwrite(MANIFEST, restored);
        }
      },
    ]);
  };
}
