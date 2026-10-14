import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';

/**
 * Which array literal to edit: the default export (`export default [...]`,
 * `module.exports = [...]`, or the first array argument of a wrapper call
 * such as `defineConfig([...])`), the initializer of a named variable, or
 * the `providers` array of a root config: an object typed `ApplicationConfig`,
 * the `@NgModule` argument, or the inline config of `bootstrapApplication`.
 */
export type ArraySelector =
  | { readonly kind: 'default-export' }
  | { readonly kind: 'variable'; readonly name: string }
  | { readonly kind: 'root-providers' };

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

function findArray(source: ts.SourceFile, selector: ArraySelector): ts.ArrayLiteralExpression | undefined {
  if (selector.kind === 'root-providers') {
    return rootProvidersArrays(source)[0];
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

export function hasArrayLiteral(content: string, selector: ArraySelector): boolean {
  return findArray(parse(content), selector) !== undefined;
}

/** How many array literals the selector matches; more than one makes it ambiguous. */
export function countArrayLiterals(content: string, selector: ArraySelector): number {
  const source = parse(content);
  if (selector.kind === 'root-providers') {
    return rootProvidersArrays(source).length;
  }
  return findArray(source, selector) === undefined ? 0 : 1;
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
  readonly typeOnly: boolean;
}

function namedBindings(bindings: ts.NamedImportBindings | undefined): readonly ImportedName[] {
  if (bindings === undefined) {
    return [];
  }
  if (ts.isNamespaceImport(bindings)) {
    return [{ name: bindings.name.text, typeOnly: false }];
  }
  return bindings.elements.map((element) => ({ name: element.name.text, typeOnly: element.isTypeOnly }));
}

function importedNames(statement: ts.ImportDeclaration): readonly (readonly [string, TopLevelBinding])[] {
  const module = ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : '';
  const clause = statement.importClause;
  if (clause === undefined) {
    return [];
  }
  const names = [
    ...(clause.name ? [{ name: clause.name.text, typeOnly: false }] : []),
    ...namedBindings(clause.namedBindings),
  ];
  return names.map(({ name, typeOnly }) => [name, { module, typeOnly: clause.isTypeOnly || typeOnly }] as const);
}

/** How a top-level name is bound: imported from `module`, or declared in the file (`module` undefined). */
export interface TopLevelBinding {
  readonly module: string | undefined;
  readonly typeOnly: boolean;
}

const DECLARED: TopLevelBinding = { module: undefined, typeOnly: false };

/**
 * Every top-level name of the file. A caller adding `import { x } from 'm'`
 * checks that `x` is unbound or imported from `m`; a type-only import from
 * `m` needs `promoteTypeOnlyImport` first.
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
  const edits: (readonly [number, number, string])[] = [];
  for (const element of elements) {
    const start = element.getStart(source);
    if (element.name.text === symbol && element.isTypeOnly) {
      const keyword = /^type\s+/.exec(content.slice(start))?.[0] ?? '';
      edits.push([start, start + keyword.length, '']);
    }
    if (element.name.text !== symbol && clause.isTypeOnly && !element.isTypeOnly) {
      edits.push([start, start, 'type ']);
    }
  }
  if (clause.isTypeOnly) {
    const start = clause.getStart(source);
    const keyword = /^type\s+/.exec(content.slice(start))?.[0] ?? '';
    edits.push([start, start + keyword.length, '']);
  }
  return edits
    .sort(([a], [b]) => b - a)
    .reduce((text, [from, to, insert]) => `${text.slice(0, from)}${insert}${text.slice(to)}`, content);
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

// `x(...)` and `ns.x(...)` both name `x`.
function calledName(call: ts.CallExpression): string | undefined {
  const callee = call.expression;
  return ts.isPropertyAccessExpression(callee) ? callee.name.text : calleeName(call);
}

/** The `provideX(...)` calls of a root providers file, read from its syntax tree. */
export interface ProviderCalls {
  /** Every `provideX(...)` name in source order, called bare or through a namespace (`ns.provideX`). */
  readonly names: readonly string[];
  /**
   * The source text of the first `withPack(...)` argument inside a
   * `provideCngxI18n(...)` call, e.g. `CNGX_LANGUAGE_DE`; `undefined` when
   * there is no such call or it passes no pack.
   */
  readonly languagePack: string | undefined;
}

/**
 * Reads the provider calls of a file in one pass over its syntax tree, so a
 * call inside a comment or a string never counts.
 */
export function readProviderCalls(content: string): ProviderCalls {
  const source = parse(content);
  const calls = collectCalls(source, []);
  const pack = calls
    .filter((call) => calledName(call) === 'provideCngxI18n')
    .flatMap((call) => call.arguments.filter(ts.isCallExpression))
    .find((call) => calledName(call) === 'withPack')?.arguments[0];
  return {
    names: calls.flatMap((call) => {
      const name = calledName(call);
      return name !== undefined && /^provide\w/.test(name) ? [name] : [];
    }),
    languagePack: pack?.getText(source),
  };
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

function isDirective(statement: ts.Statement): boolean {
  return ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression);
}

// The end of the line `position` sits on, before its line break. A comment
// trailing there counts as part of the line, also a block comment that runs
// onto later lines.
function lineEnd(content: string, position: number): number {
  const trailing = ts.getTrailingCommentRanges(content, position) ?? [];
  const from = trailing.length === 0 ? position : trailing[trailing.length - 1].end;
  const lineBreak = content.indexOf('\n', from);
  const end = lineBreak === -1 ? content.length : lineBreak;
  return content[end - 1] === '\r' ? end - 1 : end;
}

// Where a statement goes in front of everything but a shebang and the
// directive prologue (`'use strict'`), which must stay first.
function headerEnd(content: string, statements: readonly ts.Statement[]): number | undefined {
  const firstOther = statements.findIndex((statement) => !isDirective(statement));
  const prologue = firstOther === -1 ? statements : statements.slice(0, firstOther);
  const directive = prologue[prologue.length - 1];
  if (directive !== undefined) {
    return lineEnd(content, directive.getEnd());
  }
  const shebang = ts.getShebang(content);
  return shebang === undefined ? undefined : lineEnd(content, shebang.length);
}

/**
 * Inserts `statement` on its own line after the last top-level import, import
 * equals, or `require(...)` declaration (also `require(...).x`), so an import
 * spanning several lines stays whole. A comment trailing that import stays
 * with it. Without imports it goes after a shebang and the directive
 * prologue, else at the top.
 */
export function insertAfterImports(content: string, statement: string): string {
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const statements = parse(content).statements;
  const last = statements.filter(isImportStatement).pop();
  const at = last === undefined ? headerEnd(content, statements) : lineEnd(content, last.getEnd());
  if (at === undefined) {
    return `${statement}${newline}${content}`;
  }
  return `${content.slice(0, at)}${newline}${statement}${content.slice(at)}`;
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
  if (elements.length === 0) {
    return `${content.slice(0, close)}${item.trim()}${content.slice(close)}`;
  }
  const last = elements[elements.length - 1];
  const multiline = content.slice(array.getStart(source), close).includes('\n');
  const newline = content.includes('\r\n') ? '\r\n' : '\n';
  const separator = multiline ? `,${newline}${indentOf(content, last.getStart(source))}` : ', ';
  // Inserting right after the last element keeps a trailing comma behind
  // the new one.
  const insertAt = last.getEnd();
  return `${content.slice(0, insertAt)}${separator}${item.trim()}${content.slice(insertAt)}`;
}
