import { posix } from 'node:path';

import { SCAFFOLD_CATALOG, SCAFFOLD_NAME_PLACEHOLDER } from './scaffold-catalog.generated';
import { type Read } from './workspace';

/** Where the root component's template lives: a file next to it, or inline in the decorator. */
export type AppShellTemplate = { readonly kind: 'file'; readonly path: string } | { readonly kind: 'inline' };

/**
 * The spec next to the root component: the untouched `ng new` spec, that
 * spec with the feedback providers cngx adds, anything else, or none.
 */
export type AppShellSpec = 'stock' | 'provided' | 'custom' | 'absent';

/** The component `main.ts` bootstraps, and where its outlets and their imports go. */
export interface AppShell {
  readonly componentFile: string;
  readonly className: string;
  readonly template: AppShellTemplate;
  /** The decorator whose `imports` takes the outlets: the component, or the root NgModule. */
  readonly importsHost: { readonly file: string; readonly kind: 'component' | 'ng-module' };
  /** `<component>.spec.ts`; `undefined` when the component file has no `.ts` name. */
  readonly specPath: string | undefined;
  readonly spec: AppShellSpec;
}

/** The import the feedback providers in the root component's spec need. */
export const FEEDBACK_SPEC_IMPORT = "import { provideFeedback, withBanners, withToasts } from '@cngx/ui/feedback';";

/** The providers the outlets need in a TestBed that renders the root component. */
export const FEEDBACK_SPEC_PROVIDERS = 'provideFeedback(withToasts(), withBanners())';

const FEEDBACK_SPEC_PROVIDERS_LINE = `providers: [${FEEDBACK_SPEC_PROVIDERS}],`;

// How many `export ... from` hops a class lookup follows before giving up.
const MAX_REEXPORTS = 4;

// The file a relative specifier names: `./app` is `./app.ts` or `./app/index.ts`.
function resolveSpecifier(read: Read, from: string, specifier: string): string | undefined {
  const base = posix.join(posix.dirname(from), specifier);
  return [`${base}.ts`, posix.join(base, 'index.ts')].find((path) => read(path) !== undefined);
}

function declaresClass(content: string, name: string): boolean {
  return new RegExp(`\\bclass\\s+${name}\\b`).test(content);
}

// The file declaring `name`, starting from `file` and following named and
// star re-exports; only relative specifiers are followed.
function classFile(read: Read, file: string, name: string, hops = 0): string | undefined {
  const content = read(file);
  if (content === undefined || hops > MAX_REEXPORTS) {
    return undefined;
  }
  if (declaresClass(content, name)) {
    return file;
  }
  const named = new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"](\\.[^'"]+)['"]`).exec(content)?.[1];
  const stars = [...content.matchAll(/export\s*\*\s*from\s*['"](\.[^'"]+)['"]/g)].map((match) => match[1]);
  for (const specifier of named === undefined ? stars : [named]) {
    const target = resolveSpecifier(read, file, specifier);
    const found = target === undefined ? undefined : classFile(read, target, name, hops + 1);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

// Class names come from `\w+` captures, so they need no regex escaping.
// Where `name`, used in `file`, is declared: the file itself or the target of its relative import.
function definitionOf(read: Read, file: string, content: string, name: string): string | undefined {
  if (declaresClass(content, name)) {
    return file;
  }
  const specifier = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*['"](\\.[^'"]+)['"]`).exec(content)?.[1];
  const target = specifier === undefined ? undefined : resolveSpecifier(read, file, specifier);
  return target === undefined ? undefined : classFile(read, target, name);
}

// The `@<decorator>(...)` text right in front of `class <name>`; another
// class between them means the decorator belongs to that one.
function decoratorOf(content: string, name: string, decorator: 'Component' | 'NgModule'): string | undefined {
  const declared = new RegExp(`\\bclass\\s+${name}\\b`).exec(content);
  if (declared === null) {
    return undefined;
  }
  const before = content.slice(0, declared.index);
  const start = before.lastIndexOf(`@${decorator}(`);
  const text = start === -1 ? undefined : before.slice(start);
  return text === undefined || /\bclass\s/.test(text) ? undefined : text;
}

function templateOf(read: Read, componentFile: string, decorator: string): AppShellTemplate | undefined {
  const url = /\btemplateUrl\s*:\s*['"]([^'"]+)['"]/.exec(decorator)?.[1];
  if (url !== undefined) {
    const path = posix.join(posix.dirname(componentFile), url);
    return read(path) === undefined ? undefined : { kind: 'file', path };
  }
  return /\btemplate\s*:/.test(decorator) ? { kind: 'inline' } : undefined;
}

function normalize(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

function isStockSpec(content: string, project: string): boolean {
  return SCAFFOLD_CATALOG.some(
    (entry) => entry.file === 'app.spec.ts' && entry.body.split(SCAFFOLD_NAME_PLACEHOLDER).join(project) === content,
  );
}

// The stock spec with exactly the import line and the `providers` line the
// spec step adds; Prettier leaves both as they are, so this also reads the
// formatted form.
function withoutFeedbackProviders(content: string): string | undefined {
  const lines = content.split('\n');
  const added = [FEEDBACK_SPEC_IMPORT, FEEDBACK_SPEC_PROVIDERS_LINE];
  const indexes = added.map((line) => lines.findIndex((candidate) => candidate.trim() === line));
  const once = added.every((line) => lines.filter((candidate) => candidate.trim() === line).length === 1);
  if (!once) {
    return undefined;
  }
  return lines.filter((_, index) => !indexes.includes(index)).join('\n');
}

/**
 * Compares the spec with the standalone spec templates of the catalog, the
 * project name substituted, line endings normalised; exact, never a
 * heuristic, so one changed character makes it `custom`.
 */
export function appShellSpecOf(content: string | undefined, project: string): AppShellSpec {
  if (content === undefined) {
    return 'absent';
  }
  const normalized = normalize(content);
  if (isStockSpec(normalized, project)) {
    return 'stock';
  }
  const stripped = withoutFeedbackProviders(normalized);
  return stripped !== undefined && isStockSpec(stripped, project) ? 'provided' : 'custom';
}

interface Bootstrapped {
  readonly componentFile: string;
  readonly className: string;
  readonly importsHost: AppShell['importsHost'];
}

function standaloneRoot(read: Read, mainPath: string, main: string): Bootstrapped | undefined {
  const className = /bootstrapApplication\s*\(\s*(\w+)/.exec(main)?.[1];
  const componentFile = className === undefined ? undefined : definitionOf(read, mainPath, main, className);
  if (className === undefined || componentFile === undefined) {
    return undefined;
  }
  return { componentFile, className, importsHost: { file: componentFile, kind: 'component' } };
}

function moduleRoot(read: Read, mainPath: string, main: string): Bootstrapped | undefined {
  const moduleName = /bootstrapModule\s*\(\s*(\w+)/.exec(main)?.[1];
  const moduleFile = moduleName === undefined ? undefined : definitionOf(read, mainPath, main, moduleName);
  const moduleContent = moduleFile === undefined ? undefined : read(moduleFile);
  if (moduleName === undefined || moduleFile === undefined || moduleContent === undefined) {
    return undefined;
  }
  const decorator = decoratorOf(moduleContent, moduleName, 'NgModule');
  const className = decorator === undefined ? undefined : /\bbootstrap\s*:\s*\[\s*(\w+)/.exec(decorator)?.[1];
  const componentFile = className === undefined ? undefined : definitionOf(read, moduleFile, moduleContent, className);
  if (className === undefined || componentFile === undefined) {
    return undefined;
  }
  return { componentFile, className, importsHost: { file: moduleFile, kind: 'ng-module' } };
}

/**
 * Follows `bootstrapApplication(<Class>, ...)` or `bootstrapModule(<Module>)`
 * in `main.ts` to the root component, the same call shapes
 * `rootProvidersPath` follows. `undefined` when a step of the way does not
 * read: no such call, a non-relative import, no decorator, or a template
 * file that is missing; the outlets step then names the snippet instead.
 */
export function appShellOf(read: Read, mainPath: string, standalone: boolean, project: string): AppShell | undefined {
  const main = read(mainPath);
  if (main === undefined) {
    return undefined;
  }
  const root = standalone ? standaloneRoot(read, mainPath, main) : moduleRoot(read, mainPath, main);
  const content = root === undefined ? undefined : read(root.componentFile);
  const decorator = root === undefined || content === undefined ? undefined : decoratorOf(content, root.className, 'Component');
  const template = root === undefined || decorator === undefined ? undefined : templateOf(read, root.componentFile, decorator);
  if (root === undefined || template === undefined) {
    return undefined;
  }
  const specPath = root.componentFile.endsWith('.ts') ? root.componentFile.replace(/\.ts$/, '.spec.ts') : undefined;
  return {
    ...root,
    template,
    specPath,
    spec: specPath === undefined ? 'absent' : appShellSpecOf(read(specPath), project),
  };
}
