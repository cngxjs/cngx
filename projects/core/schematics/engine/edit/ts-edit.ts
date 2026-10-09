import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';

/**
 * Which array literal to edit: the default export (`export default [...]`,
 * `module.exports = [...]`, or the first array argument of a wrapper call
 * such as `defineConfig([...])`), or the initializer of a named variable.
 */
export type ArraySelector = { readonly kind: 'default-export' } | { readonly kind: 'variable'; readonly name: string };

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

function findArray(source: ts.SourceFile, selector: ArraySelector): ts.ArrayLiteralExpression | undefined {
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
