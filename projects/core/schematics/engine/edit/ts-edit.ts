import * as ts from 'typescript';

import { newlineOf } from '../plan/text';

/**
 * Which array literal to edit: the default export (`export default [...]`,
 * `module.exports = [...]`, or the first array argument of a wrapper call
 * such as `defineConfig([...])`), the initializer of a named variable, the
 * `providers` array of a root config (an object typed `ApplicationConfig`,
 * the `@NgModule` argument, or the inline config of `bootstrapApplication`),
 * the `imports` array of the `@Component` or `@NgModule` decorator on a
 * class, or the `providers` or `imports` array of the object passed to
 * `TestBed.configureTestingModule`.
 */
export type ArraySelector =
  | { readonly kind: 'default-export' }
  | { readonly kind: 'variable'; readonly name: string }
  | { readonly kind: 'root-providers' }
  | { readonly kind: 'decorator-imports'; readonly className: string }
  | { readonly kind: 'testbed-providers' }
  | { readonly kind: 'testbed-imports' };

/** The selectors that name a property of one object literal, which `ensureArrayProperty` can add. */
export type PropertyArraySelector = Extract<
  ArraySelector,
  { readonly kind: 'decorator-imports' | 'testbed-providers' | 'testbed-imports' }
>;

function unwrap(expression: ts.Expression): ts.ArrayLiteralExpression | undefined {
  if (ts.isArrayLiteralExpression(expression)) {
    return expression;
  }
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return unwrap(expression.expression);
  }
  if (ts.isCallExpression(expression)) {
    return expression.arguments.find(ts.isArrayLiteralExpression);
  }
  return undefined;
}

function isModuleExports(expression: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'module' &&
    expression.name.text === 'exports'
  );
}

function defaultExport(statement: ts.Statement): ts.Expression | undefined {
  if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
    return statement.expression;
  }
  if (
    ts.isExpressionStatement(statement) &&
    ts.isBinaryExpression(statement.expression) &&
    statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    isModuleExports(statement.expression.left)
  ) {
    return statement.expression.right;
  }
  return undefined;
}

function variableInitializer(statement: ts.Statement, name: string): ts.Expression | undefined {
  if (!ts.isVariableStatement(statement)) {
    return undefined;
  }
  const declaration = statement.declarationList.declarations.find(
    (candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === name,
  );
  return declaration?.initializer;
}

function isApplicationConfigType(type: ts.TypeNode | undefined): boolean {
  return (
    type !== undefined &&
    ts.isTypeReferenceNode(type) &&
    ts.isIdentifier(type.typeName) &&
    type.typeName.text === 'ApplicationConfig'
  );
}

// The object literal behind `x: ApplicationConfig = {...}`, `{...} satisfies
// ApplicationConfig` or `{...} as ApplicationConfig`.
function applicationConfigLiteral(expression: ts.Expression, typed: boolean): ts.ObjectLiteralExpression | undefined {
  if (ts.isParenthesizedExpression(expression)) {
    return applicationConfigLiteral(expression.expression, typed);
  }
  if (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return applicationConfigLiteral(expression.expression, typed || isApplicationConfigType(expression.type));
  }
  return typed && ts.isObjectLiteralExpression(expression) ? expression : undefined;
}

function calleeName(call: ts.CallExpression): string | undefined {
  return ts.isIdentifier(call.expression) ? call.expression.text : undefined;
}

// Which argument of these calls is a root config object.
const ROOT_CONFIG_ARGUMENT: ReadonlyMap<string, number> = new Map([
  ['NgModule', 0],
  ['bootstrapApplication', 1],
]);

function rootConfigOf(node: ts.Node): ts.ObjectLiteralExpression | undefined {
  if (ts.isVariableDeclaration(node) && node.initializer !== undefined) {
    return applicationConfigLiteral(node.initializer, isApplicationConfigType(node.type));
  }
  if (!ts.isCallExpression(node)) {
    return undefined;
  }
  const argument = ROOT_CONFIG_ARGUMENT.get(calleeName(node) ?? '');
  const config = argument === undefined ? undefined : node.arguments[argument];
  return config !== undefined && ts.isObjectLiteralExpression(config) ? config : undefined;
}

function rootConfigs(node: ts.Node): readonly ts.ObjectLiteralExpression[] {
  const own = rootConfigOf(node);
  const nested: ts.ObjectLiteralExpression[] = [];
  ts.forEachChild(node, (child) => {
    nested.push(...rootConfigs(child));
  });
  return own === undefined ? nested : [own, ...nested];
}

function rootProvidersArrays(source: ts.SourceFile): readonly ts.ArrayLiteralExpression[] {
  return rootConfigs(source).flatMap((config) =>
    config.properties.flatMap((property) =>
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === 'providers' &&
      ts.isArrayLiteralExpression(property.initializer)
        ? [property.initializer]
        : [],
    ),
  );
}

/**
 * Why the root providers of a file are out of reach of an array edit: a root
 * config whose `providers` is not an array literal (a variable, a call, a
 * shorthand property), one that spreads another object and holds no
 * `providers` array (a new key would shadow the spread one), or a config
 * variable or default export built by `mergeApplicationConfig` without
 * exactly one typed config in the file whose `providers` array can take it.
 */
export type UnfollowedRootProviders = 'not-literal' | 'spread' | 'merged';

function isMergeCall(source: ts.SourceFile, expression: ts.Expression): boolean {
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return isMergeCall(source, expression.expression);
  }
  return ts.isCallExpression(expression) && referenceOf(source, expression.expression).name === 'mergeApplicationConfig';
}

function configBlock(config: ts.ObjectLiteralExpression): UnfollowedRootProviders | undefined {
  const providers = config.properties.filter((property) => staticKey(property) === 'providers');
  if (providers.some((property) => !ts.isPropertyAssignment(property) || !ts.isArrayLiteralExpression(property.initializer))) {
    return 'not-literal';
  }
  return providers.length === 0 && config.properties.some(ts.isSpreadAssignment) ? 'spread' : undefined;
}

/**
 * Reads whether the root providers of a file cannot be edited as an array
 * literal, and why; `undefined` when every root config holds a `providers`
 * array or none at all, so a new one can be added.
 */
export function unfollowedRootProviders(content: string): UnfollowedRootProviders | undefined {
  const source = parse(content);
  const blocked = rootConfigs(source).map(configBlock).find((cause) => cause !== undefined);
  if (blocked !== undefined) {
    return blocked;
  }
  const merged = source.statements.some((statement) => {
    if (ts.isExportAssignment(statement)) {
      return isMergeCall(source, statement.expression);
    }
    return (
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some(
        (declaration) => declaration.initializer !== undefined && isMergeCall(source, declaration.initializer),
      )
    );
  });
  // One typed config with a providers array next to the merge is edited in
  // place; with none or several, `addRootProvider` would follow the merge
  // call and stop.
  return merged && rootProvidersArrays(source).length !== 1 ? 'merged' : undefined;
}

const ANGULAR_DECORATORS = new Set(['Component', 'NgModule']);

// The `@Component` / `@NgModule` calls on the top-level `class <name>`, or
// only those named in `names`.
function decoratorCalls(
  source: ts.SourceFile,
  className: string,
  names: ReadonlySet<string> = ANGULAR_DECORATORS,
): readonly ts.CallExpression[] {
  const declaration = source.statements.find(
    (statement): statement is ts.ClassDeclaration => ts.isClassDeclaration(statement) && statement.name?.text === className,
  );
  const decorators = declaration === undefined ? [] : (ts.getDecorators(declaration) ?? []);
  return decorators
    .map((decorator) => decorator.expression)
    .filter((call): call is ts.CallExpression => ts.isCallExpression(call) && names.has(calleeName(call) ?? ''));
}

function objectArgument(call: ts.CallExpression): ts.ObjectLiteralExpression | undefined {
  const [argument] = call.arguments;
  return argument !== undefined && ts.isObjectLiteralExpression(argument) ? argument : undefined;
}

// The argument of the one `@Component` / `@NgModule` decorator on `class
// <name>`; none when there are several, as `readDecorator` reads it.
function decoratorObject(source: ts.SourceFile, className: string): ts.ObjectLiteralExpression | undefined {
  const calls = decoratorCalls(source, className);
  return calls.length === 1 ? objectArgument(calls[0]) : undefined;
}

function isConfigureTestingModule(node: ts.Node): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === 'TestBed' &&
    node.expression.name.text === 'configureTestingModule'
  );
}

// The object passed to the first `TestBed.configureTestingModule(...)`.
function testBedObject(node: ts.Node): ts.ObjectLiteralExpression | undefined {
  if (isConfigureTestingModule(node)) {
    const [argument] = node.arguments;
    return argument !== undefined && ts.isObjectLiteralExpression(argument) ? argument : undefined;
  }
  return ts.forEachChild(node, testBedObject);
}

function propertyObject(source: ts.SourceFile, selector: PropertyArraySelector): ts.ObjectLiteralExpression | undefined {
  return selector.kind === 'decorator-imports' ? decoratorObject(source, selector.className) : testBedObject(source);
}

function propertyName(selector: PropertyArraySelector): string {
  return selector.kind === 'testbed-providers' ? 'providers' : 'imports';
}

// What an object literal holds under one name, read the same way by every
// reader and editor here: a key is an identifier or a string literal. A
// spread or a computed key hides what the object sets, a numeric key is
// spelled in more than one way (`1`, `1.0`, `0x1`), and a key written twice
// leaves which one counts to the compiler, so each makes the object
// unreadable and nothing reads or writes it.
type PropertyLookup =
  | { readonly kind: 'missing' }
  | { readonly kind: 'found'; readonly property: ts.ObjectLiteralElementLike }
  | { readonly kind: 'unreadable'; readonly cause: UnreadableCause };

/** Why cngx does not read an object literal: a spread, a computed or numeric key, or a key written twice. */
export type UnreadableCause = 'dynamic' | 'duplicate';

function staticKey(property: ts.ObjectLiteralElementLike): string | undefined {
  const name = property.name;
  return name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : undefined;
}

function unreadableCause(object: ts.ObjectLiteralExpression): UnreadableCause | undefined {
  const keys = object.properties.map(staticKey);
  if (keys.some((key) => key === undefined)) {
    return 'dynamic';
  }
  return new Set(keys).size === keys.length ? undefined : 'duplicate';
}

function lookupProperty(object: ts.ObjectLiteralExpression, name: string): PropertyLookup {
  const cause = unreadableCause(object);
  if (cause !== undefined) {
    return { kind: 'unreadable', cause };
  }
  const property = object.properties.find((candidate) => staticKey(candidate) === name);
  return property === undefined ? { kind: 'missing' } : { kind: 'found', property };
}

function propertyArray(source: ts.SourceFile, selector: PropertyArraySelector): ts.ArrayLiteralExpression | undefined {
  const object = propertyObject(source, selector);
  const lookup = object === undefined ? undefined : lookupProperty(object, propertyName(selector));
  const property = lookup?.kind === 'found' ? lookup.property : undefined;
  return property !== undefined && ts.isPropertyAssignment(property) && ts.isArrayLiteralExpression(property.initializer)
    ? property.initializer
    : undefined;
}

function findArray(source: ts.SourceFile, selector: ArraySelector): ts.ArrayLiteralExpression | undefined {
  if (selector.kind === 'root-providers') {
    return rootProvidersArrays(source)[0];
  }
  if (selector.kind === 'decorator-imports' || selector.kind === 'testbed-providers' || selector.kind === 'testbed-imports') {
    return propertyArray(source, selector);
  }
  for (const statement of source.statements) {
    const expression =
      selector.kind === 'default-export' ? defaultExport(statement) : variableInitializer(statement, selector.name);
    const array = expression && unwrap(expression);
    if (array) {
      return array;
    }
  }
  return undefined;
}

function parse(content: string): ts.SourceFile {
  return ts.createSourceFile('edit.ts', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

/** Whether the file parses without a syntax error, so an edit that reads back also still compiles as written. */
export function parsesCleanly(content: string): boolean {
  const { diagnostics } = ts.transpileModule(content, { reportDiagnostics: true, fileName: 'edit.ts' });
  return (diagnostics ?? []).length === 0;
}

export function hasArrayLiteral(content: string, selector: ArraySelector): boolean {
  return findArray(parse(content), selector) !== undefined;
}

/**
 * Whether `name` is an element of the selected array literal: an identifier
 * or an expression with exactly that text. `false` when there is no array.
 */
export function hasArrayElement(content: string, selector: ArraySelector, name: string): boolean {
  const source = parse(content);
  const array = findArray(source, selector);
  return array?.elements.some((element) => element.getText(source) === name.trim()) ?? false;
}

/**
 * Adds an empty `imports` (decorator or TestBed) or `providers` (TestBed) array to the
 * selected object literal when the property is missing, so
 * `addToArrayLiteral` has an array to fill. The content is returned
 * unchanged when the property exists, also as something other than an array
 * literal (`hasArrayLiteral` then stays false and the caller reports it),
 * when the object holds a spread, a computed or numeric key or a key
 * written twice, or when there is no such object. The new property goes
 * after the last one, on its own line in a multi-line object, keeping a
 * trailing comma style.
 */
export function ensureArrayProperty(content: string, selector: PropertyArraySelector): string {
  const source = parse(content);
  const object = propertyObject(source, selector);
  const name = propertyName(selector);
  if (object === undefined || lookupProperty(object, name).kind !== 'missing') {
    return content;
  }
  const property = `${name}: []`;
  const last = object.properties[object.properties.length - 1];
  const close = object.getEnd() - 1;
  if (last === undefined) {
    const open = object.getStart(source) + 1;
    return content.slice(open, close).trim() === ''
      ? `${content.slice(0, open)} ${property} ${content.slice(close)}`
      : insertBeforeBracket(content, close, property, ' ');
  }
  const multiline = content.slice(object.getStart(source), close).includes('\n');
  const trailingComma = object.properties.hasTrailingComma;
  if (!multiline) {
    return `${content.slice(0, last.getEnd())}, ${property}${content.slice(last.getEnd())}`;
  }
  // The trailing comma is read as a token, so a comma in a comment between
  // the last property and it is never taken for it.
  const comma = trailingComma ? tokenAt(content, last.getEnd()) : undefined;
  if (comma !== undefined && comma.kind !== ts.SyntaxKind.CommaToken) {
    return content;
  }
  const lineEnd = afterTrailingComments(content, comma?.end ?? last.getEnd());
  const head = trailingComma
    ? content.slice(0, lineEnd)
    : `${content.slice(0, last.getEnd())},${content.slice(last.getEnd(), lineEnd)}`;
  const line = `${newlineOf(content)}${indentOf(content, last.getStart(source))}${property}${trailingComma ? ',' : ''}`;
  return `${head}${line}${content.slice(lineEnd)}`;
}

/** A token as the scanner reads it: its kind and where it ends. */
interface ScannedToken {
  readonly kind: ts.SyntaxKind;
  readonly end: number;
}

// The first token from `position` on, comments and whitespace skipped.
function tokenAt(content: string, position: number): ScannedToken {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, content);
  scanner.resetTokenState(position);
  const kind = scanner.scan();
  return { kind, end: scanner.getTokenEnd() };
}

// Past the comments that trail `position` on its line, so a line inserted
// there never takes a comment that belongs to the line above.
function afterTrailingComments(content: string, position: number): number {
  const trailing = ts.getTrailingCommentRanges(content, position) ?? [];
  return trailing.length === 0 ? position : trailing[trailing.length - 1].end;
}

// The `type` keyword starting at `start` and the whitespace after it, as the
// scanner reads them; a comment after the keyword stays. `undefined` when no
// `type` keyword starts there.
function typeKeywordRange(content: string, start: number): readonly [number, number] | undefined {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, content);
  scanner.resetTokenState(start);
  if (scanner.scan() !== ts.SyntaxKind.TypeKeyword) {
    return undefined;
  }
  let end = scanner.getTokenEnd();
  for (let kind = scanner.scan(); kind === ts.SyntaxKind.WhitespaceTrivia || kind === ts.SyntaxKind.NewLineTrivia; kind = scanner.scan()) {
    end = scanner.getTokenEnd();
  }
  return [start, end];
}

/** How many array literals the selector matches; more than one makes it ambiguous. */
export function countArrayLiterals(content: string, selector: ArraySelector): number {
  const source = parse(content);
  if (selector.kind === 'root-providers') {
    return rootProvidersArrays(source).length;
  }
  return findArray(source, selector) === undefined ? 0 : 1;
}

/**
 * A property of a decorator object as a reader sees it: a string (a quoted
 * string or a backtick string without `${...}`) with the offsets of its raw
 * text between the quotes, a backtick string that interpolates, an array
 * literal with the source text of each element, or anything else.
 */
export type DecoratorValue =
  | { readonly kind: 'string'; readonly start: number; readonly end: number; readonly text: string; readonly quoted: boolean }
  | { readonly kind: 'interpolated' }
  | { readonly kind: 'array'; readonly elements: readonly string[] }
  | { readonly kind: 'other' };

/**
 * The `@<decorator>(...)` on the top-level `class <className>`: `absent`
 * without that class or decorator, `no-object` when its argument is not an
 * object literal, `unreadable` when the class carries more than one of
 * `@Component` / `@NgModule` or the object holds a spread, a computed or
 * numeric key or a key written twice, else the object's properties by name
 * (identifier and string-literal keys alike, a shorthand or method property
 * as `other`).
 */
export type DecoratorReading =
  | { readonly kind: 'absent' }
  | { readonly kind: 'no-object' }
  | { readonly kind: 'unreadable'; readonly cause: UnreadableCause }
  | { readonly kind: 'object'; readonly properties: ReadonlyMap<string, DecoratorValue> };

function decoratorValue(source: ts.SourceFile, property: ts.ObjectLiteralElementLike): DecoratorValue {
  const initializer = ts.isPropertyAssignment(property) ? property.initializer : undefined;
  if (initializer === undefined) {
    return { kind: 'other' };
  }
  if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
    const start = initializer.getStart(source) + 1;
    const end = initializer.getEnd() - 1;
    return { kind: 'string', start, end, text: source.text.slice(start, end), quoted: ts.isStringLiteral(initializer) };
  }
  if (ts.isTemplateExpression(initializer)) {
    return { kind: 'interpolated' };
  }
  if (ts.isArrayLiteralExpression(initializer)) {
    return { kind: 'array', elements: initializer.elements.map((element) => element.getText(source)) };
  }
  return { kind: 'other' };
}

/** Reads the `@Component` or `@NgModule` decorator of a top-level class through the TypeScript AST. */
export function readDecorator(content: string, className: string, decorator: 'Component' | 'NgModule'): DecoratorReading {
  const source = parse(content);
  const calls = decoratorCalls(source, className);
  const [call] = calls.filter((candidate) => calleeName(candidate) === decorator);
  if (call === undefined) {
    return { kind: 'absent' };
  }
  if (calls.length > 1) {
    return { kind: 'unreadable', cause: 'duplicate' };
  }
  const object = objectArgument(call);
  if (object === undefined) {
    return { kind: 'no-object' };
  }
  const cause = unreadableCause(object);
  if (cause !== undefined) {
    return { kind: 'unreadable', cause };
  }
  const properties = object.properties.flatMap((property): readonly (readonly [string, DecoratorValue])[] => {
    const key = staticKey(property);
    return key === undefined ? [] : [[key, decoratorValue(source, property)]];
  });
  return { kind: 'object', properties: new Map(properties) };
}

function boundNames(name: ts.BindingName): readonly string[] {
  if (ts.isIdentifier(name)) {
    return [name.text];
  }
  return name.elements.flatMap((element) => (ts.isBindingElement(element) ? boundNames(element.name) : []));
}

function declaredNames(statement: ts.Statement): readonly string[] {
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap((declaration) => boundNames(declaration.name));
  }
  if (ts.isImportEqualsDeclaration(statement)) {
    return [statement.name.text];
  }
  // A namespace (`namespace X {}`) binds its name too; an ambient module
  // (`declare module 'x' {}`) and `declare global {}` bind none.
  if (ts.isModuleDeclaration(statement)) {
    const global = (statement.flags & ts.NodeFlags.GlobalAugmentation) !== 0;
    return ts.isIdentifier(statement.name) && !global ? [statement.name.text] : [];
  }
  const named =
    ts.isClassDeclaration(statement) ||
    ts.isFunctionDeclaration(statement) ||
    ts.isEnumDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement);
  return named && statement.name !== undefined ? [statement.name.text] : [];
}

interface ImportedName {
  readonly name: string;
  readonly imported: string;
  readonly typeOnly: boolean;
}

function namedBindings(bindings: ts.NamedImportBindings | undefined): readonly ImportedName[] {
  if (bindings === undefined) {
    return [];
  }
  if (ts.isNamespaceImport(bindings)) {
    return [{ name: bindings.name.text, imported: '*', typeOnly: false }];
  }
  return bindings.elements.map((element) => ({
    name: element.name.text,
    imported: (element.propertyName ?? element.name).text,
    typeOnly: element.isTypeOnly,
  }));
}

function importedNames(statement: ts.ImportDeclaration): readonly (readonly [string, TopLevelBinding])[] {
  const module = ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : '';
  const clause = statement.importClause;
  if (clause === undefined) {
    return [];
  }
  const names = [
    ...(clause.name ? [{ name: clause.name.text, imported: 'default', typeOnly: false }] : []),
    ...namedBindings(clause.namedBindings),
  ];
  return names.map(
    ({ name, imported, typeOnly }) => [name, { module, imported, typeOnly: clause.isTypeOnly || typeOnly }] as const,
  );
}

/**
 * How a top-level name is bound: imported from `module` under the name the
 * module exports (`default` for a default import, `*` for a namespace
 * import), or declared in the file (`module` and `imported` undefined).
 */
export interface TopLevelBinding {
  readonly module: string | undefined;
  readonly imported: string | undefined;
  readonly typeOnly: boolean;
}

const DECLARED: TopLevelBinding = { module: undefined, imported: undefined, typeOnly: false };

/**
 * Every top-level name of the file. A caller adding `import { x } from 'm'`
 * checks that `x` is unbound or imported as `x` from `m`; a type-only import
 * from `m` needs `promoteTypeOnlyImport` first.
 */
export function topLevelBindings(content: string): ReadonlyMap<string, TopLevelBinding> {
  return new Map(
    parse(content).statements.flatMap((statement): readonly (readonly [string, TopLevelBinding])[] =>
      ts.isImportDeclaration(statement)
        ? importedNames(statement)
        : declaredNames(statement).map((name) => [name, DECLARED] as const),
    ),
  );
}

/** Whether the file declares a top-level `class <name>`; text in comments or strings never counts. */
export function declaresClass(content: string, name: string): boolean {
  return parse(content).statements.some(
    (statement) => ts.isClassDeclaration(statement) && statement.name?.text === name,
  );
}

/**
 * The module specifiers the file re-exports `name` from: the one of a named
 * `export { name } from`, else those of every `export * from`. An aliased
 * re-export (`export { Other as name }`) is not followed.
 */
export function reexportSources(content: string, name: string): readonly string[] {
  const reexports = parse(content).statements.flatMap((statement) =>
    ts.isExportDeclaration(statement) &&
    statement.moduleSpecifier !== undefined &&
    ts.isStringLiteral(statement.moduleSpecifier)
      ? [{ clause: statement.exportClause, specifier: statement.moduleSpecifier.text }]
      : [],
  );
  const named = reexports.find(
    ({ clause }) =>
      clause !== undefined &&
      ts.isNamedExports(clause) &&
      clause.elements.some((element) => element.name.text === name && element.propertyName === undefined),
  );
  if (named !== undefined) {
    return [named.specifier];
  }
  return reexports.filter(({ clause }) => clause === undefined).map(({ specifier }) => specifier);
}

function typeOnlyImport(
  source: ts.SourceFile,
  symbol: string,
  module: string,
): { readonly clause: ts.ImportClause; readonly elements: ts.NodeArray<ts.ImportSpecifier> } | undefined {
  for (const statement of source.statements) {
    const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
    const bindings = clause?.namedBindings;
    const fromModule =
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === module;
    if (clause === undefined || bindings === undefined || !fromModule || !ts.isNamedImports(bindings)) {
      continue;
    }
    if (bindings.elements.some((element) => element.name.text === symbol)) {
      return { clause, elements: bindings.elements };
    }
  }
  return undefined;
}

/**
 * Turns the type-only import of `symbol` from `module` into a value import,
 * so a call can use it. A type-only clause keeps its other names as types
 * through the inline `type` modifier. Returns the content unchanged when no
 * such import exists.
 */
export function promoteTypeOnlyImport(content: string, symbol: string, module: string): string {
  const source = parse(content);
  const found = typeOnlyImport(source, symbol, module);
  if (found === undefined) {
    return content;
  }
  const { clause, elements } = found;
  const keywords = [
    ...elements.filter((element) => element.name.text === symbol && element.isTypeOnly),
    ...(clause.isTypeOnly ? [clause] : []),
  ].map((node) => typeKeywordRange(content, node.getStart(source)));
  const edits: (readonly [number, number, string])[] = keywords.flatMap((range) => (range === undefined ? [] : [[...range, ''] as const]));
  if (edits.length < keywords.length) {
    return content;
  }
  for (const element of elements) {
    if (element.name.text !== symbol && clause.isTypeOnly && !element.isTypeOnly) {
      const start = element.getStart(source);
      edits.push([start, start, 'type ']);
    }
  }
  return edits
    .sort(([a], [b]) => b - a)
    .reduce((text, [from, to, insert]) => `${text.slice(0, from)}${insert}${text.slice(to)}`, content);
}

/**
 * Rewrites every `import type { a, b } from 'module'` as `import { type a,
 * type b } from 'module'`, so a value name added to an import of `module`
 * never lands in a type-only clause. Returns the content unchanged when
 * there is none.
 */
export function openTypeOnlyImports(content: string, module: string): string {
  const source = parse(content);
  const edits = source.statements.flatMap((statement): readonly (readonly [number, number, string])[] => {
    const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
    const bindings = clause?.namedBindings;
    const fromModule =
      ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === module;
    if (!fromModule || clause === undefined || !clause.isTypeOnly || bindings === undefined || !ts.isNamedImports(bindings)) {
      return [];
    }
    const keyword = typeKeywordRange(content, clause.getStart(source));
    if (keyword === undefined || clause.name !== undefined) {
      return [];
    }
    const types = bindings.elements.map((element) => [element.getStart(source), element.getStart(source), 'type '] as const);
    return [[...keyword, ''], ...types];
  });
  return [...edits]
    .sort(([a], [b]) => b - a)
    .reduce((text, [from, to, insert]) => `${text.slice(0, from)}${insert}${text.slice(to)}`, content);
}

/** A name a type-only import binds that the file calls or passes to a call. */
export interface TypeOnlyValueImport {
  readonly symbol: string;
  readonly module: string;
}

/**
 * The names a type-only import from a `@cngx/*` module binds that the file
 * uses as values: a callee or an identifier argument of a call. An older
 * provider edit appended such names to a type-only import of the same
 * module, which fails the build with TS1361; `promoteTypeOnlyImport`
 * repairs each.
 */
export function typeOnlyValueImports(content: string): readonly TypeOnlyValueImport[] {
  const source = parse(content);
  const bindings = topLevelBindings(content);
  const used = new Set(
    collectCalls(source, []).flatMap((call) =>
      [call.expression, ...call.arguments].flatMap((node) => (ts.isIdentifier(node) ? [node.text] : [])),
    ),
  );
  return [...bindings].flatMap(([symbol, binding]) =>
    binding.typeOnly && binding.module?.startsWith('@cngx/') === true && used.has(symbol)
      ? [{ symbol, module: binding.module }]
      : [],
  );
}

function collectCalls(node: ts.Node, calls: ts.CallExpression[]): readonly ts.CallExpression[] {
  if (ts.isCallExpression(node)) {
    calls.push(node);
  }
  ts.forEachChild(node, (child) => {
    collectCalls(child, calls);
  });
  return calls;
}

interface ImportedSymbol {
  readonly module: string;
  /** The name the module exports; `*` for a namespace import, `default` for a default import. */
  readonly name: string;
}

// What a top-level import binds `local` to.
function importOf(source: ts.SourceFile, local: string): ImportedSymbol | undefined {
  for (const statement of source.statements) {
    const clause = ts.isImportDeclaration(statement) ? statement.importClause : undefined;
    const specifier = ts.isImportDeclaration(statement) ? statement.moduleSpecifier : undefined;
    if (clause === undefined || specifier === undefined || !ts.isStringLiteral(specifier)) {
      continue;
    }
    const module = specifier.text;
    if (clause.name?.text === local) {
      return { module, name: 'default' };
    }
    const bindings = clause.namedBindings;
    if (bindings !== undefined && ts.isNamespaceImport(bindings) && bindings.name.text === local) {
      return { module, name: '*' };
    }
    const element =
      bindings !== undefined && ts.isNamedImports(bindings)
        ? bindings.elements.find((candidate) => candidate.name.text === local)
        : undefined;
    if (element !== undefined) {
      return { module, name: (element.propertyName ?? element.name).text };
    }
  }
  return undefined;
}

/** A symbol as its module exports it; `module` is undefined when the file does not import it. */
export interface SymbolReference {
  readonly name: string;
  readonly module: string | undefined;
}

// What an expression refers to: an aliased import resolves to the imported
// name, `ns.x` over a namespace import to `x` from that module.
function referenceOf(source: ts.SourceFile, expression: ts.Expression): SymbolReference {
  if (ts.isIdentifier(expression)) {
    const imported = importOf(source, expression.text);
    const named = imported !== undefined && imported.name !== '*' && imported.name !== 'default';
    return { name: named ? imported.name : expression.text, module: imported?.module };
  }
  if (ts.isPropertyAccessExpression(expression)) {
    const root = ts.isIdentifier(expression.expression) ? importOf(source, expression.expression.text) : undefined;
    return { name: expression.name.text, module: root?.name === '*' ? root.module : undefined };
  }
  return { name: expression.getText(source), module: undefined };
}

/** The pack a `provideCngxI18n(withPack(...))` call passes. */
export interface LanguagePackArgument extends SymbolReference {
  /** The argument as written, e.g. `CNGX_LANGUAGE_DE` or `lang.cngxLanguagePack`. */
  readonly text: string;
}

/** The `provideX(...)` calls of a root providers file, read from its syntax tree. */
export interface ProviderCalls {
  /**
   * Every `provideX(...)` name in source order, as its module exports it:
   * called bare, through an import alias, or through a namespace (`ns.provideX`).
   */
  readonly names: readonly string[];
  /**
   * The first `withPack(...)` argument inside a `provideCngxI18n(...)` call;
   * `undefined` when there is no such call or it passes no pack.
   */
  readonly languagePack: LanguagePackArgument | undefined;
}

/**
 * Reads the provider calls of a file in one pass over its syntax tree, so a
 * call inside a comment or a string never counts.
 */
export function readProviderCalls(content: string): ProviderCalls {
  const source = parse(content);
  const named = collectCalls(source, []).map((call) => ({ call, name: referenceOf(source, call.expression).name }));
  const pack = named
    .filter(({ name }) => name === 'provideCngxI18n')
    .flatMap(({ call }) => call.arguments.filter(ts.isCallExpression))
    .find((call) => referenceOf(source, call.expression).name === 'withPack')?.arguments[0];
  return {
    names: named.flatMap(({ name }) => (/^provide\w/.test(name) ? [name] : [])),
    languagePack: pack === undefined ? undefined : { text: pack.getText(source), ...referenceOf(source, pack) },
  };
}

/**
 * The root `main.ts` bootstraps: `bootstrapApplication(<Class>, <config>)`
 * (bare, aliased or namespaced) or `<platform>.bootstrapModule(<Module>)`.
 * A name is `undefined` when that argument is not an identifier.
 */
export type BootstrapCall =
  | { readonly kind: 'application'; readonly className: string | undefined; readonly configName: string | undefined }
  | { readonly kind: 'module'; readonly moduleName: string | undefined };

function identifierText(expression: ts.Expression | undefined): string | undefined {
  return expression !== undefined && ts.isIdentifier(expression) ? expression.text : undefined;
}

function bootstrapCallOf(source: ts.SourceFile, call: ts.CallExpression): BootstrapCall | undefined {
  const [first, second] = call.arguments;
  if (ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === 'bootstrapModule') {
    return { kind: 'module', moduleName: identifierText(first) };
  }
  if (referenceOf(source, call.expression).name === 'bootstrapApplication') {
    return { kind: 'application', className: identifierText(first), configName: identifierText(second) };
  }
  return undefined;
}

/**
 * Reads the first bootstrap call of a `main.ts` from its syntax tree, so a
 * call in a comment or a string never counts; `undefined` without one.
 */
export function readBootstrapCall(content: string): BootstrapCall | undefined {
  const source = parse(content);
  for (const call of collectCalls(source, [])) {
    const found = bootstrapCallOf(source, call);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

function isRequireCall(expression: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(expression)) {
    return isRequireCall(expression.expression);
  }
  return ts.isCallExpression(expression) && calleeName(expression) === 'require';
}

function isImportStatement(statement: ts.Statement): boolean {
  if (ts.isImportDeclaration(statement) || ts.isImportEqualsDeclaration(statement)) {
    return true;
  }
  return (
    ts.isVariableStatement(statement) &&
    statement.declarationList.declarations.some(
      (declaration) => declaration.initializer !== undefined && isRequireCall(declaration.initializer),
    )
  );
}

// `require(...)` or a dynamic `import(...)`.
function isModuleLoad(expression: ts.Expression): expression is ts.CallExpression {
  if (!ts.isCallExpression(expression)) {
    return false;
  }
  return calleeName(expression) === 'require' || expression.expression.kind === ts.SyntaxKind.ImportKeyword;
}

// The module a declaration initializer loads, through `.x`, `await` and
// parentheses: `require('m').x`, `(await import('m')).default`.
function requiredModule(expression: ts.Expression): string | undefined {
  if (ts.isPropertyAccessExpression(expression) || ts.isAwaitExpression(expression) || ts.isParenthesizedExpression(expression)) {
    return requiredModule(expression.expression);
  }
  const [argument] = isModuleLoad(expression) ? expression.arguments : [];
  return argument !== undefined && ts.isStringLiteral(argument) ? argument.text : undefined;
}

function statementModules(statement: ts.Statement): readonly string[] {
  if (ts.isImportDeclaration(statement)) {
    return ts.isStringLiteral(statement.moduleSpecifier) ? [statement.moduleSpecifier.text] : [];
  }
  if (ts.isImportEqualsDeclaration(statement)) {
    const reference = statement.moduleReference;
    return ts.isExternalModuleReference(reference) && ts.isStringLiteral(reference.expression)
      ? [reference.expression.text]
      : [];
  }
  if (!ts.isVariableStatement(statement)) {
    return [];
  }
  return statement.declarationList.declarations.flatMap((declaration) => {
    const module = declaration.initializer === undefined ? undefined : requiredModule(declaration.initializer);
    return module === undefined ? [] : [module];
  });
}

/**
 * Whether a top-level `import`, `import x = require()`, `require()` or
 * dynamic `import()` declaration loads `module`. Read from the syntax tree,
 * so a commented-out line never counts.
 */
export function importsModule(content: string, module: string): boolean {
  return parse(content).statements.some((statement) => statementModules(statement).includes(module));
}

function isDirective(statement: ts.Statement): boolean {
  return ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression);
}

interface InsertionPoint {
  readonly at: number;
  /** More code shares the line after `at`, so the insertion must end its own line too. */
  readonly codeFollows: boolean;
}

// Where a line of its own goes after the statement ending at `position`: the
// end of that line, past a trailing comment (also a block comment that runs
// onto later lines), or right after the statement and its comment when more
// code shares the line.
function insertionPoint(content: string, position: number): InsertionPoint {
  const trailing = ts.getTrailingCommentRanges(content, position) ?? [];
  const from = trailing.length === 0 ? position : trailing[trailing.length - 1].end;
  const lineBreak = content.indexOf('\n', from);
  const end = lineBreak === -1 ? content.length : lineBreak;
  const lineEnd = content[end - 1] === '\r' ? end - 1 : end;
  const codeFollows = content.slice(from, lineEnd).trim() !== '';
  return { at: codeFollows ? from : lineEnd, codeFollows };
}

// Where a statement goes in front of everything but a shebang and the
// directive prologue (`'use strict'`), which must stay first.
function headerEnd(content: string, statements: readonly ts.Statement[]): InsertionPoint | undefined {
  const firstOther = statements.findIndex((statement) => !isDirective(statement));
  const prologue = firstOther === -1 ? statements : statements.slice(0, firstOther);
  const directive = prologue[prologue.length - 1];
  if (directive !== undefined) {
    return insertionPoint(content, directive.getEnd());
  }
  const shebang = ts.getShebang(content);
  return shebang === undefined ? undefined : insertionPoint(content, shebang.length);
}

/**
 * Inserts `statement` on its own line after the last top-level import, import
 * equals, or `require(...)` declaration (also `require(...).x`), so an import
 * spanning several lines stays whole. A comment trailing that import stays
 * with it, and code sharing its line moves to the next line. Without imports
 * it goes after a shebang and the directive prologue, else at the top.
 */
export function insertAfterImports(content: string, statement: string): string {
  const newline = newlineOf(content);
  const statements = parse(content).statements;
  const last = statements.filter(isImportStatement).pop();
  const point = last === undefined ? headerEnd(content, statements) : insertionPoint(content, last.getEnd());
  if (point === undefined) {
    return `${statement}${newline}${content}`;
  }
  const rest = content.slice(point.at);
  const after = point.codeFollows ? `${newline}${rest.replace(/^[ \t]+/, '')}` : rest;
  return `${content.slice(0, point.at)}${newline}${statement}${after}`;
}

/**
 * Imports `names` from `module` as values: added to the first value import of
 * `module` with named bindings when the file has one, so the file keeps one
 * declaration per module, else as a new statement after the imports. Names
 * already in that import are left out; the content is unchanged when none is
 * left.
 */
export function addNamedImports(content: string, names: readonly string[], module: string): string {
  const source = parse(content);
  const existing = source.statements.find(
    (statement): statement is ts.ImportDeclaration & { importClause: ts.ImportClause & { namedBindings: ts.NamedImports } } =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === module &&
      statement.importClause !== undefined &&
      !statement.importClause.isTypeOnly &&
      statement.importClause.namedBindings !== undefined &&
      ts.isNamedImports(statement.importClause.namedBindings),
  );
  if (existing === undefined) {
    return names.length === 0 ? content : insertAfterImports(content, `import { ${names.join(', ')} } from '${module}';`);
  }
  const elements = existing.importClause.namedBindings.elements;
  const bound = new Set(elements.filter((element) => !element.isTypeOnly).map((element) => element.name.text));
  const missing = names.filter((name) => !bound.has(name));
  if (missing.length === 0) {
    return content;
  }
  const last = elements[elements.length - 1];
  if (last === undefined) {
    const open = existing.importClause.namedBindings.getStart(source) + 1;
    return `${content.slice(0, open)} ${missing.join(', ')} ${content.slice(open).replace(/^\s*/, '')}`;
  }
  const at = last.getEnd();
  return `${content.slice(0, at)}, ${missing.join(', ')}${content.slice(at)}`;
}

// Puts `item` right before the bracket at `close` of a list that holds only
// comments, which all stay: on a line of its own when the bracket starts its
// line, else on the bracket's line, followed by `after`.
function insertBeforeBracket(content: string, close: number, item: string, after: string): string {
  const lineStart = content.lastIndexOf('\n', close - 1) + 1;
  const indent = content.slice(lineStart, close);
  if (indent.trim() === '') {
    return `${content.slice(0, lineStart)}${indent}  ${item}${newlineOf(content)}${content.slice(lineStart)}`;
  }
  const space = /\s/.test(content[close - 1] ?? '') ? '' : ' ';
  return `${content.slice(0, close)}${space}${item}${after}${content.slice(close)}`;
}

function indentOf(content: string, position: number): string {
  const lineStart = content.lastIndexOf('\n', position - 1) + 1;
  return /^[ \t]*/.exec(content.slice(lineStart))?.[0] ?? '';
}

/**
 * Appends `item` (source text, e.g. `...cngx.configs.recommended`) to the
 * selected array literal and returns the new content. An element with the
 * same text is left alone, so the edit is idempotent. Throws when the array
 * is not found; callers that may miss it check `hasArrayLiteral` first.
 */
export function addToArrayLiteral(content: string, selector: ArraySelector, item: string): string {
  const source = parse(content);
  const array = findArray(source, selector);
  if (!array) {
    throw new Error(`No array literal found for ${JSON.stringify(selector)}.`);
  }
  const elements = array.elements;
  if (elements.some((element) => element.getText(source) === item.trim())) {
    return content;
  }
  const close = array.getEnd() - 1;
  const open = array.getStart(source);
  const multiline = content.slice(open, close).includes('\n');
  const newline = newlineOf(content);
  if (elements.length === 0 && !multiline) {
    return `${content.slice(0, close)}${item.trim()}${content.slice(close)}`;
  }
  if (elements.length === 0 && content.slice(open + 1, close).trim() !== '') {
    return insertBeforeBracket(content, close, item.trim(), '');
  }
  if (elements.length === 0) {
    // An empty array across lines that holds only whitespace is rebuilt, so
    // no whitespace-only line is left above the bracket.
    const indent = indentOf(content, close);
    return `${content.slice(0, open + 1)}${newline}${indent}  ${item.trim()}${newline}${indent}${content.slice(close)}`;
  }
  const last = elements[elements.length - 1];
  const separator = multiline ? `,${newline}${indentOf(content, last.getStart(source))}` : ', ';
  // Inserting right after the last element keeps a trailing comma behind
  // the new one.
  const insertAt = last.getEnd();
  return `${content.slice(0, insertAt)}${separator}${item.trim()}${content.slice(insertAt)}`;
}
