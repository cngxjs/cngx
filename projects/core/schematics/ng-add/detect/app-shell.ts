import { posix } from 'node:path';

import {
  type DecoratorReading,
  declaresClass,
  ensureArrayProperty,
  hasArrayElement,
  hasArrayLiteral,
  hasElement,
  readBootstrapCall,
  readDecorator,
  reexportSources,
  topLevelBindings,
} from '../../engine';
import { SCAFFOLD_CATALOG, SCAFFOLD_NAME_PLACEHOLDER } from './scaffold-catalog.generated';
import { type Read } from './workspace';

/**
 * Where the root component's template lives: a file next to it, inline in
 * the decorator, or `unread` when the decorator does not tell (the outlets
 * are then blocked with the reason).
 */
export type AppShellTemplate =
  | { readonly kind: 'file'; readonly path: string }
  | { readonly kind: 'inline' }
  | { readonly kind: 'unread' };

/**
 * The spec next to the root component: the untouched `ng new` spec, that
 * spec with the feedback providers cngx adds, anything else, or none.
 */
export type AppShellSpec = 'stock' | 'provided' | 'custom' | 'absent';

/** The component `main.ts` bootstraps, and where its outlets and their imports go. */
export interface AppShell {
  readonly kind: 'followed';
  readonly componentFile: string;
  readonly className: string;
  readonly template: AppShellTemplate;
  /** The decorator whose `imports` takes the outlets: the component, or the root NgModule. */
  readonly importsHost: { readonly file: string; readonly kind: 'component' | 'ng-module'; readonly className: string };
  /** `<component>.spec.ts`; `undefined` when the component file has no `.ts` name. */
  readonly specPath: string | undefined;
  readonly spec: AppShellSpec;
  readonly outlets: AppShellOutlets;
}

interface BlockedAt {
  /** The class (or outlet class) the reason names; empty where it names none. */
  readonly subject: string;
  readonly file: string;
}

/**
 * Every reason cngx leaves the outlets to the user, one per way detection
 * stops, with its text; `core-concepts/install.md` lists each text with
 * `<Class>` and `<file>` for the subject and the file (a spec guards it).
 */
export const APP_SHELL_BLOCKED_REASONS = {
  'main-missing': ({ file }: BlockedAt) => `${file} does not exist`,
  'no-bootstrap-call': ({ file }: BlockedAt) =>
    `${file} has no bootstrapApplication(<Component>) or bootstrapModule(<NgModule>) call cngx can read`,
  'class-not-followed': ({ subject, file }: BlockedAt) =>
    `${subject}, bootstrapped from ${file}, is declared neither there nor in a file a relative import leads to`,
  'no-ngmodule-decorator': ({ subject, file }: BlockedAt) => `${subject} in ${file} has no @NgModule decorator`,
  'no-bootstrap-component': ({ subject, file }: BlockedAt) =>
    `the @NgModule decorator of ${subject} in ${file} lists no bootstrap component`,
  'no-component-decorator': ({ subject, file }: BlockedAt) => `${subject} in ${file} has no @Component decorator`,
  'decorator-not-object': ({ subject, file }: BlockedAt) => `the decorator of ${subject} in ${file} takes no object literal`,
  'decorator-dynamic': ({ subject, file }: BlockedAt) =>
    `the decorator of ${subject} in ${file} holds a spread or a computed key, so cngx cannot tell what it sets`,
  'duplicate-property': ({ subject, file }: BlockedAt) =>
    `the decorator of ${subject} in ${file} is written twice or sets a property more than once`,
  'no-template': ({ subject, file }: BlockedAt) =>
    `the @Component decorator of ${subject} in ${file} sets neither template nor templateUrl`,
  'two-templates': ({ subject, file }: BlockedAt) =>
    `the @Component decorator of ${subject} in ${file} sets both template and templateUrl`,
  'template-not-literal': ({ subject, file }: BlockedAt) =>
    `the template or templateUrl of ${subject} in ${file} is not a string literal`,
  'template-interpolated': ({ subject, file }: BlockedAt) =>
    `the inline template of ${subject} in ${file} interpolates \${...}, which cngx does not edit as text`,
  'template-file-missing': ({ subject, file }: BlockedAt) => `${file}, the templateUrl of ${subject}, does not exist`,
  'template-parse-error': ({ subject, file }: BlockedAt) =>
    `the template of ${subject} in ${file} does not parse as an Angular template`,
  'quoted-template': ({ subject, file }: BlockedAt) =>
    `the inline template of ${subject} in ${file} is a quoted string, which cngx does not rewrite into a multi-line template`,
  'imports-not-array': ({ subject, file }: BlockedAt) => `the imports of ${subject} in ${file} are not a plain array literal`,
  'outlet-name-bound': ({ subject, file }: BlockedAt) =>
    `${subject} in ${file} is bound to something other than @cngx/ui/feedback`,
} as const;

/** Why cngx leaves the outlets to the user: a key of `APP_SHELL_BLOCKED_REASONS`. */
export type AppShellBlockedReason = keyof typeof APP_SHELL_BLOCKED_REASONS;

/** A reason with the class and the file it names. */
export interface AppShellBlocked extends BlockedAt {
  readonly reason: AppShellBlockedReason;
}

/** The text a note gives for a blocked or unfollowed app shell. */
export function appShellBlockedText(blocked: AppShellBlocked): string {
  return APP_SHELL_BLOCKED_REASONS[blocked.reason](blocked);
}

/** `main.ts` not followed to a root component, and why. */
export interface AppShellUnfollowed extends AppShellBlocked {
  readonly kind: 'unfollowed';
}

/** The outlets the feedback services render into, in the order the outlets step places them. */
export const FEEDBACK_OUTLETS = [
  { element: 'cngx-banner-outlet', className: 'CngxBannerOutlet' },
  { element: 'cngx-toast-outlet', className: 'CngxToastOutlet' },
] as const;

/** The entry both outlets come from. */
export const FEEDBACK_MODULE = '@cngx/ui/feedback';

/**
 * What the shell holds of the outlets: the outlet elements in the template
 * and the outlet classes the imports host both lists in its `imports` and
 * imports from `@cngx/ui/feedback`; `blocked` with the reason when cngx
 * cannot edit it safely.
 */
export type AppShellOutlets =
  | {
      readonly kind: 'editable';
      readonly elements: readonly string[];
      readonly classes: readonly string[];
      /** The template holds a `<router-outlet>`; the banner outlet goes right above it. */
      readonly routerOutlet: boolean;
    }
  | ({ readonly kind: 'blocked' } & AppShellBlocked);

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

function isRelative(specifier: string): boolean {
  return specifier.startsWith('.');
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
  for (const specifier of reexportSources(content, name).filter(isRelative)) {
    const target = resolveSpecifier(read, file, specifier);
    const found = target === undefined ? undefined : classFile(read, target, name, hops + 1);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

// Where `name`, used in `file`, is declared: the file itself or the target of its relative import.
function definitionOf(read: Read, file: string, content: string, name: string): string | undefined {
  if (declaresClass(content, name)) {
    return file;
  }
  const specifier = topLevelBindings(content).get(name)?.module;
  const target = specifier === undefined || !isRelative(specifier) ? undefined : resolveSpecifier(read, file, specifier);
  return target === undefined ? undefined : classFile(read, target, name);
}

function templateOf(componentFile: string, decorator: DecoratorReading): AppShellTemplate {
  const properties = decorator.kind === 'object' ? decorator.properties : new Map<string, never>();
  const url = properties.get('templateUrl');
  if (url?.kind === 'string') {
    return { kind: 'file', path: posix.join(posix.dirname(componentFile), url.text) };
  }
  return properties.has('template') && url === undefined ? { kind: 'inline' } : { kind: 'unread' };
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

/** Where an inline template's text sits in the component file: between `start` and `end`. */
export interface InlineTemplate {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  /** A `'...'` or `"..."` string, which cannot take a raw newline. */
  readonly quoted: boolean;
}

/**
 * The text of the inline `template` of `class <className>`: a quoted or
 * backtick string. `undefined` without one, and for a backtick string that
 * interpolates (`${...}`), which is not a template cngx can edit as text.
 */
export function inlineTemplateOf(content: string, className: string): InlineTemplate | undefined {
  const decorator = readDecorator(content, className, 'Component');
  const template = decorator.kind === 'object' ? decorator.properties.get('template') : undefined;
  if (template?.kind !== 'string') {
    return undefined;
  }
  const { start, end, text, quoted } = template;
  return { start, end, text, quoted };
}

// Whether the template holds a `<router-outlet>`; `undefined` when it does not parse.
function routerOutletIn(template: string): boolean | undefined {
  try {
    return hasElement(template, 'router-outlet');
  } catch {
    return undefined;
  }
}

function blocked(reason: AppShellBlockedReason, subject: string, file: string): AppShellBlocked {
  return { reason, subject, file };
}

// Why cngx does not read a decorator, or `undefined` when it does.
function unreadDecorator(decorator: DecoratorReading, className: string, file: string): AppShellBlocked | undefined {
  if (decorator.kind === 'unreadable') {
    return blocked(decorator.cause === 'dynamic' ? 'decorator-dynamic' : 'duplicate-property', className, file);
  }
  return decorator.kind === 'object' ? undefined : blocked('decorator-not-object', className, file);
}

// Why the decorator names no template cngx can edit, or `undefined` when it does.
function unreadTemplate(decorator: DecoratorReading, className: string, file: string): AppShellBlocked | undefined {
  const properties = decorator.kind === 'object' ? decorator.properties : new Map<string, never>();
  const url = properties.get('templateUrl');
  const inline = properties.get('template');
  if (url !== undefined && inline !== undefined) {
    return blocked('two-templates', className, file);
  }
  if (url === undefined && inline === undefined) {
    return blocked('no-template', className, file);
  }
  if (inline?.kind === 'interpolated') {
    return blocked('template-interpolated', className, file);
  }
  const literal = (url ?? inline)?.kind === 'string';
  return literal ? undefined : blocked('template-not-literal', className, file);
}

// Why the imports host cannot take the outlet classes, or `undefined` when
// it can: detection calls it editable only where the edit engine finds the
// array or can add the property, through the same property lookup.
function unreadImports(host: string, importsHost: AppShell['importsHost']): AppShellBlocked | undefined {
  const { file, className, kind } = importsHost;
  const decorator = readDecorator(host, className, kind === 'component' ? 'Component' : 'NgModule');
  const unread = unreadDecorator(decorator, className, file);
  if (unread !== undefined) {
    return unread;
  }
  const selector = { kind: 'decorator-imports', className } as const;
  const editable = hasArrayLiteral(host, selector) || ensureArrayProperty(host, selector) !== host;
  return editable ? undefined : blocked('imports-not-array', className, file);
}

function blockedOutlets(at: AppShellBlocked): AppShellOutlets {
  return { kind: 'blocked', ...at };
}

function outletsOf(
  read: Read,
  shell: Pick<AppShell, 'componentFile' | 'className' | 'template' | 'importsHost'>,
  content: string,
  decorator: DecoratorReading,
): AppShellOutlets {
  const { componentFile, className } = shell;
  const unread = unreadDecorator(decorator, className, componentFile) ?? unreadTemplate(decorator, className, componentFile);
  if (unread !== undefined) {
    return blockedOutlets(unread);
  }
  const templateFile = shell.template.kind === 'file' ? shell.template.path : componentFile;
  const inline = shell.template.kind === 'inline' ? inlineTemplateOf(content, className) : undefined;
  const template = shell.template.kind === 'file' ? read(shell.template.path) : inline?.text;
  if (template === undefined) {
    return blockedOutlets(blocked('template-file-missing', className, templateFile));
  }
  const routerOutlet = routerOutletIn(template);
  if (routerOutlet === undefined) {
    return blockedOutlets(blocked('template-parse-error', className, templateFile));
  }
  const elements = FEEDBACK_OUTLETS.filter(({ element }) => hasElement(template, element)).map(({ element }) => element);
  if (inline?.quoted === true && elements.length < FEEDBACK_OUTLETS.length) {
    return blockedOutlets(blocked('quoted-template', className, componentFile));
  }
  const { file } = shell.importsHost;
  const host = read(file) ?? '';
  const importsBlocked = unreadImports(host, shell.importsHost);
  if (importsBlocked !== undefined) {
    return blockedOutlets(importsBlocked);
  }
  const selector = { kind: 'decorator-imports', className: shell.importsHost.className } as const;
  const bindings = topLevelBindings(host);
  const clash = FEEDBACK_OUTLETS.find(({ className: name }) => {
    const binding = bindings.get(name);
    return binding !== undefined && binding.module !== FEEDBACK_MODULE;
  });
  if (clash !== undefined) {
    return blockedOutlets(blocked('outlet-name-bound', clash.className, file));
  }
  return {
    kind: 'editable',
    elements,
    classes: FEEDBACK_OUTLETS.filter(
      ({ className: name }) =>
        hasArrayElement(host, selector, name) && bindings.get(name)?.module === FEEDBACK_MODULE && bindings.get(name)?.typeOnly === false,
    ).map(({ className: name }) => name),
    routerOutlet,
  };
}

interface Bootstrapped {
  readonly componentFile: string;
  readonly className: string;
  readonly importsHost: AppShell['importsHost'];
}

function standaloneRoot(read: Read, mainPath: string, main: string): Bootstrapped | AppShellBlocked {
  const call = readBootstrapCall(main);
  const className = call?.kind === 'application' ? call.className : undefined;
  if (className === undefined) {
    return blocked('no-bootstrap-call', '', mainPath);
  }
  const componentFile = definitionOf(read, mainPath, main, className);
  if (componentFile === undefined) {
    return blocked('class-not-followed', className, mainPath);
  }
  return { componentFile, className, importsHost: { file: componentFile, kind: 'component', className } };
}

function moduleRoot(read: Read, mainPath: string, main: string): Bootstrapped | AppShellBlocked {
  const call = readBootstrapCall(main);
  const moduleName = call?.kind === 'module' ? call.moduleName : undefined;
  if (moduleName === undefined) {
    return blocked('no-bootstrap-call', '', mainPath);
  }
  const moduleFile = definitionOf(read, mainPath, main, moduleName);
  const moduleContent = moduleFile === undefined ? undefined : read(moduleFile);
  if (moduleFile === undefined || moduleContent === undefined) {
    return blocked('class-not-followed', moduleName, mainPath);
  }
  const decorator = readDecorator(moduleContent, moduleName, 'NgModule');
  if (decorator.kind === 'absent') {
    return blocked('no-ngmodule-decorator', moduleName, moduleFile);
  }
  const unread = unreadDecorator(decorator, moduleName, moduleFile);
  if (unread !== undefined) {
    return unread;
  }
  const bootstrap = decorator.kind === 'object' ? decorator.properties.get('bootstrap') : undefined;
  const className = bootstrap?.kind === 'array' ? bootstrap.elements[0] : undefined;
  if (className === undefined) {
    return blocked('no-bootstrap-component', moduleName, moduleFile);
  }
  const componentFile = definitionOf(read, moduleFile, moduleContent, className);
  if (componentFile === undefined) {
    return blocked('class-not-followed', className, moduleFile);
  }
  return { componentFile, className, importsHost: { file: moduleFile, kind: 'ng-module', className: moduleName } };
}

function isBlocked(root: Bootstrapped | AppShellBlocked): root is AppShellBlocked {
  return 'reason' in root;
}

/**
 * Follows `bootstrapApplication(<Class>, ...)` or `bootstrapModule(<Module>)`
 * in `main.ts` to the root component, read through the syntax tree by the
 * same `readBootstrapCall` as `rootProvidersPath`, so a commented-out call
 * never counts. `unfollowed` with the reason when a step of
 * the way does not read: no such call, a non-relative import, no decorator;
 * the outlets step then names the snippet instead. A shell cngx follows but
 * cannot edit safely has blocked outlets with the reason.
 */
export function appShellOf(read: Read, mainPath: string, standalone: boolean, project: string): AppShell | AppShellUnfollowed {
  const main = read(mainPath);
  if (main === undefined) {
    return { kind: 'unfollowed', ...blocked('main-missing', '', mainPath) };
  }
  const root = standalone ? standaloneRoot(read, mainPath, main) : moduleRoot(read, mainPath, main);
  if (isBlocked(root)) {
    return { kind: 'unfollowed', ...root };
  }
  const content = read(root.componentFile) ?? '';
  const decorator = readDecorator(content, root.className, 'Component');
  if (decorator.kind === 'absent') {
    return { kind: 'unfollowed', ...blocked('no-component-decorator', root.className, root.componentFile) };
  }
  const template = templateOf(root.componentFile, decorator);
  const outlets = outletsOf(read, { ...root, template }, content, decorator);
  const specPath = root.componentFile.endsWith('.ts') ? root.componentFile.replace(/\.ts$/, '.spec.ts') : undefined;
  return {
    kind: 'followed',
    ...root,
    template,
    specPath,
    spec: specPath === undefined ? 'absent' : appShellSpecOf(read(specPath), project),
    outlets,
  };
}
