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

function declaredName(statement: ts.Statement): readonly string[] {
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap((declaration) =>
      ts.isIdentifier(declaration.name) ? [declaration.name.text] : [],
    );
  }
  const named =
    ts.isClassDeclaration(statement) ||
    ts.isFunctionDeclaration(statement) ||
    ts.isEnumDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement);
  return named && statement.name !== undefined ? [statement.name.text] : [];
}

function namedBindings(bindings: ts.NamedImportBindings | undefined): readonly string[] {
  if (bindings === undefined) {
    return [];
  }
  if (ts.isNamespaceImport(bindings)) {
    return [bindings.name.text];
  }
  return bindings.elements.map((element) => element.name.text);
}

function importedNames(statement: ts.ImportDeclaration): readonly (readonly [string, string])[] {
  const module = ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : '';
  const clause = statement.importClause;
  if (clause === undefined) {
    return [];
  }
  const names = [...(clause.name ? [clause.name.text] : []), ...namedBindings(clause.namedBindings)];
  return names.map((name) => [name, module] as const);
}

/**
 * Every top-level name of the file: an imported name maps to its module, a
 * declared one to `undefined`. A caller adding `import { x } from 'm'` checks
 * that `x` is unbound or already bound to `m`.
 */
export function topLevelBindings(content: string): ReadonlyMap<string, string | undefined> {
  return new Map(
    parse(content).statements.flatMap((statement): readonly (readonly [string, string | undefined])[] =>
      ts.isImportDeclaration(statement)
        ? importedNames(statement)
        : declaredName(statement).map((name) => [name, undefined] as const),
    ),
  );
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
  const separator = multiline ? `,\n${indentOf(content, last.getStart(source))}` : ', ';
  // Inserting right after the last element keeps a trailing comma behind
  // the new one.
  const insertAt = last.getEnd();
  return `${content.slice(0, insertAt)}${separator}${item.trim()}${content.slice(insertAt)}`;
}
