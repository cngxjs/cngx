import { posix } from 'node:path';

import {
  addToArrayLiteral,
  appendElements,
  type DecoratorReading,
  declaresClass,
  ensureArrayProperty,
  hasArrayElement,
  hasArrayLiteral,
  hasElement,
  hasElementOutsidePlaceholder,
  insertAfterImports,
  insertBeforeElement,
  newlineOf,
  parsesCleanly,
  promoteTypeOnlyImport,
  readBootstrapCall,
  readDecorator,
  reexportSources,
  type TopLevelBinding,
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
    `the decorator of ${subject} in ${file} holds a spread, a computed key or a numeric key, so cngx cannot tell what it sets`,
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
  'source-parse-error': ({ subject, file }: BlockedAt) =>
    `${file} does not parse as TypeScript, so cngx edits neither it nor ${subject}`,
  'outlet-name-bound': ({ subject, file }: BlockedAt) =>
    `${subject} in ${file} is bound to something other than the ${subject} class of @cngx/ui/feedback`,
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
      /**
       * The template holds a `<router-outlet>` outside the CLI placeholder
       * block; the banner outlet goes right above it, else at the end.
       */
      readonly routerOutlet: boolean;
    }
  | ({
      readonly kind: 'blocked';
      /** The outlet elements the template holds; absent when cngx stopped before it read the template. */
      readonly elements?: readonly string[];
    } & AppShellBlocked);

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

// Whether the template holds a `<router-outlet>` the banner outlet can go
// above, one outside the CLI placeholder block the user deletes; `undefined`
// when the template does not parse.
function routerOutletIn(template: string): boolean | undefined {
  try {
    return hasElementOutsidePlaceholder(template, 'router-outlet');
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

// Why cngx does not read the decorator of the imports host, or `undefined`
// when it does; whether its `imports` can take the classes is proven by
// running the edit (`verifyOutletEdits`).
function unreadImportsHost(host: string, importsHost: AppShell['importsHost']): AppShellBlocked | undefined {
  const { file, className, kind } = importsHost;
  return unreadDecorator(readDecorator(host, className, kind === 'component' ? 'Component' : 'NgModule'), className, file);
}

/** What the outlet edits start from: the outlet elements the template holds and whether the banner goes above a router outlet. */
export interface OutletPlacement {
  readonly elements: readonly string[];
  readonly routerOutlet: boolean;
}

function markup(element: string): string {
  return `<${element} />`;
}

// Places the outlets `placement` lacks: the banner right above the first
// router outlet outside the CLI's placeholder block when there is one, else
// at the end; the toast outlet at the end. Both land after the placeholder
// block, which ends before `<router-outlet />` in the stock template; a
// router outlet moved into the block takes no outlet with it. A template
// that no longer parses is returned as it is.
function placeOutlets(template: string, placement: OutletPlacement, newline = newlineOf(template)): string {
  const [banner, toast] = FEEDBACK_OUTLETS;
  const missing = (element: string): boolean => !placement.elements.includes(element);
  const aboveRouter = missing(banner.element) && placement.routerOutlet;
  try {
    const withBanner = aboveRouter ? insertBeforeElement(template, 'router-outlet', markup(banner.element), newline) : template;
    const appended = [
      ...(missing(banner.element) && !aboveRouter ? [markup(banner.element)] : []),
      ...(missing(toast.element) ? [markup(toast.element)] : []),
    ];
    return appended.length === 0 ? withBanner : appendElements(withBanner, appended, newline);
  } catch {
    return template;
  }
}

// Only a backtick template takes the outlets on lines of their own, with the
// host file's newline; a quoted one is reported in detection and left as it
// is here, also when it turned quoted between detection and apply.
function placeInlineOutlets(content: string, className: string, placement: OutletPlacement): string {
  const inline = inlineTemplateOf(content, className);
  if (inline === undefined || inline.quoted) {
    return content;
  }
  return `${content.slice(0, inline.start)}${placeOutlets(inline.text, placement, newlineOf(content))}${content.slice(inline.end)}`;
}

// Lists both outlet classes in the decorator `imports` of `class
// <className>` (adding the property when it is missing) and imports the ones
// the file does not bind yet as values; the content stays unchanged when
// there is no array to fill.
function importOutlets(content: string, className: string): string {
  const selector = { kind: 'decorator-imports', className } as const;
  const withProperty = ensureArrayProperty(content, selector);
  if (!hasArrayLiteral(withProperty, selector)) {
    return content;
  }
  const listed = FEEDBACK_OUTLETS.reduce((text, outlet) => addToArrayLiteral(text, selector, outlet.className), withProperty);
  // A class listed in `imports` is a value, so a type-only import of it becomes a value import.
  const promoted = FEEDBACK_OUTLETS.reduce(
    (text, outlet) => promoteTypeOnlyImport(text, outlet.className, FEEDBACK_MODULE),
    listed,
  );
  const bindings = topLevelBindings(promoted);
  const unbound = FEEDBACK_OUTLETS.map((outlet) => outlet.className).filter((name) => !bindings.has(name));
  return unbound.length === 0 ? promoted : insertAfterImports(promoted, `import { ${unbound.join(', ')} } from '${FEEDBACK_MODULE}';`);
}

/** One file the outlets step edits, and whether the edit places the outlet elements, imports the classes, or both. */
export interface OutletEdit {
  readonly path: string;
  readonly places: boolean;
  readonly imports: boolean;
  readonly edit: (content: string) => string;
}

type OutletShell = Pick<AppShell, 'componentFile' | 'className' | 'template' | 'importsHost'>;

function templatePathOf(shell: OutletShell): string {
  return shell.template.kind === 'file' ? shell.template.path : shell.componentFile;
}

/**
 * The edits that place the outlets: one per file, the template and the
 * imports host, or one when the inline template sits in the host itself.
 * Detection runs exactly these edits before it calls a shell editable, and
 * the outlets step plans them, so both agree by construction.
 */
export function outletEdits(shell: OutletShell, placement: OutletPlacement): readonly OutletEdit[] {
  const host = shell.importsHost;
  const path = templatePathOf(shell);
  const place =
    shell.template.kind === 'file'
      ? (content: string) => placeOutlets(content, placement)
      : (content: string) => placeInlineOutlets(content, shell.className, placement);
  const importClasses = (content: string) => importOutlets(content, host.className);
  if (path === host.file) {
    return [{ path, places: true, imports: true, edit: (content) => importClasses(place(content)) }];
  }
  return [
    { path, places: true, imports: false, edit: place },
    { path: host.file, places: false, imports: true, edit: importClasses },
  ];
}

// Whether the template holds `<element>`; `false` when it does not parse.
function holdsElement(template: string, element: string): boolean {
  try {
    return hasElement(template, element);
  } catch {
    return false;
  }
}

// Runs the outlet edits on the files they change and reads the result back
// the way detection reads a shell: both outlet elements in the template,
// both classes in the host `imports` and imported as values from
// `@cngx/ui/feedback`, every edited source free of syntax errors. The reason
// when an edit does not read back, else `undefined`.
function verifyOutletEdits(read: Read, shell: OutletShell, placement: OutletPlacement): AppShellBlocked | undefined {
  const edited = new Map(outletEdits(shell, placement).map(({ path, edit }) => [path, edit(read(path) ?? '')] as const));
  const readBack = (path: string): string => edited.get(path) ?? read(path) ?? '';
  const broken = [...edited].find(([path, content]) => path.endsWith('.ts') && !parsesCleanly(content));
  if (broken !== undefined) {
    return blocked('source-parse-error', shell.className, broken[0]);
  }
  const templatePath = templatePathOf(shell);
  const template =
    shell.template.kind === 'file' ? readBack(templatePath) : inlineTemplateOf(readBack(templatePath), shell.className)?.text;
  if (template === undefined || !FEEDBACK_OUTLETS.every(({ element }) => holdsElement(template, element))) {
    return blocked('template-parse-error', shell.className, templatePath);
  }
  const { file, className } = shell.importsHost;
  const host = readBack(file);
  const bindings = topLevelBindings(host);
  const selector = { kind: 'decorator-imports', className } as const;
  const imported = FEEDBACK_OUTLETS.every(
    ({ className: name }) =>
      hasArrayElement(host, selector, name) && importsOutlet(bindings.get(name), name) && bindings.get(name)?.typeOnly === false,
  );
  return imported ? undefined : blocked('imports-not-array', className, file);
}

// Whether a top-level binding is the outlet class `name` imported under its
// own name from `@cngx/ui/feedback`.
function importsOutlet(binding: TopLevelBinding | undefined, name: string): boolean {
  return binding?.module === FEEDBACK_MODULE && binding.imported === name;
}

// `elements`: the outlet elements of a template cngx read before it stopped.
function blockedOutlets(at: AppShellBlocked, elements?: readonly string[]): AppShellOutlets {
  return elements === undefined ? { kind: 'blocked', ...at } : { kind: 'blocked', ...at, elements };
}

function outletsOf(
  read: Read,
  shell: Pick<AppShell, 'componentFile' | 'className' | 'template' | 'importsHost'>,
  content: string,
  decorator: DecoratorReading,
): AppShellOutlets {
  const { componentFile, className } = shell;
  // A source with a syntax error reads only as far as the parser recovers,
  // so cngx edits neither it nor anything it reads from it.
  if (!parsesCleanly(content)) {
    return blockedOutlets(blocked('source-parse-error', className, componentFile));
  }
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
    return blockedOutlets(blocked('quoted-template', className, componentFile), elements);
  }
  const { file } = shell.importsHost;
  const host = read(file) ?? '';
  if (!parsesCleanly(host)) {
    return blockedOutlets(blocked('source-parse-error', className, file), elements);
  }
  const hostBlocked = unreadImportsHost(host, shell.importsHost);
  if (hostBlocked !== undefined) {
    return blockedOutlets(hostBlocked, elements);
  }
  const selector = { kind: 'decorator-imports', className: shell.importsHost.className } as const;
  const bindings = topLevelBindings(host);
  // Bound to anything but the outlet class itself, an alias of another
  // feedback export or the feedback namespace included.
  const clash = FEEDBACK_OUTLETS.find(({ className: name }) => bindings.has(name) && !importsOutlet(bindings.get(name), name));
  if (clash !== undefined) {
    return blockedOutlets(blocked('outlet-name-bound', clash.className, file), elements);
  }
  const unverified = verifyOutletEdits(read, shell, { elements, routerOutlet });
  if (unverified !== undefined) {
    return blockedOutlets(unverified, elements);
  }
  return {
    kind: 'editable',
    elements,
    classes: FEEDBACK_OUTLETS.filter(
      ({ className: name }) =>
        hasArrayElement(host, selector, name) && importsOutlet(bindings.get(name), name) && bindings.get(name)?.typeOnly === false,
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
