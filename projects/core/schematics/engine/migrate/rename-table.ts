import { TmplAstElement, TmplAstTemplate } from '@angular/compiler';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';

import { parseTemplateContent, walkNodes } from '../edit/template-edit';

/**
 * An input or output renamed on one directive or component. `owner` is the
 * old element or attribute selector, so `value` on `cngx-select` moves
 * while `value` on any other element stays.
 */
export interface MemberRename {
  readonly owner: string;
  readonly from: string;
  readonly to: string;
}

/**
 * Every rename one release ships, as data. Keys are the old names; a
 * migration states only the sections it needs on top of `EMPTY_RENAME_TABLE`.
 */
export interface RenameTable {
  /** Exported classes: directives, components, pipes, injectables. */
  readonly classes: Readonly<Record<string, string>>;
  /** Element and attribute selectors, without brackets. */
  readonly selectors: Readonly<Record<string, string>>;
  readonly inputs: readonly MemberRename[];
  readonly outputs: readonly MemberRename[];
  /** Exported constants: injection tokens, `provide*` / `with*` functions. */
  readonly tokens: Readonly<Record<string, string>>;
  /** Whole module specifiers, e.g. a moved secondary entry. */
  readonly importPaths: Readonly<Record<string, string>>;
}

export const EMPTY_RENAME_TABLE: RenameTable = {
  classes: {},
  selectors: {},
  inputs: [],
  outputs: [],
  tokens: {},
  importPaths: {},
};

export function isEmptyRenameTable(table: RenameTable): boolean {
  return (
    Object.keys(table.classes).length === 0 &&
    Object.keys(table.selectors).length === 0 &&
    table.inputs.length === 0 &&
    table.outputs.length === 0 &&
    Object.keys(table.tokens).length === 0 &&
    Object.keys(table.importPaths).length === 0
  );
}

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

// Edits come from one parse of the original content; they never overlap,
// so applying them back to front keeps every earlier offset valid. Two
// nodes can report the same span (an element under `*ngIf` and its
// template wrapper, a two-way binding's input and output); one edit stays.
function applyEdits(content: string, edits: readonly TextEdit[]): string {
  const unique = [...new Map(edits.map((edit) => [edit.start, edit])).values()];
  return unique
    .sort((a, b) => b.start - a.start)
    .reduce((text, edit) => `${text.slice(0, edit.start)}${edit.text}${text.slice(edit.end)}`, content);
}

// A cheap pre-check, so a file that names nothing in the table is never parsed.
function mentionsAny(content: string, names: readonly string[]): boolean {
  return names.some((name) => content.includes(name));
}

function templateNames(table: RenameTable): readonly string[] {
  return [
    ...Object.keys(table.selectors),
    ...table.inputs.map((rename) => rename.from),
    ...table.outputs.map((rename) => rename.from),
  ];
}

interface Span {
  readonly start: { readonly offset: number };
  readonly end: { readonly offset: number };
}

interface Keyed {
  readonly keySpan: Span | undefined;
}

type TemplateHost = TmplAstElement | TmplAstTemplate;

function keyEdit(attribute: Keyed, renames: Readonly<Record<string, string>>, content: string): TextEdit[] {
  if (attribute.keySpan === undefined) {
    return [];
  }
  const start = attribute.keySpan.start.offset;
  const end = attribute.keySpan.end.offset;
  const to = renames[content.slice(start, end)];
  return to === undefined ? [] : [{ start, end, text: to }];
}

function tagName(host: TemplateHost): string {
  return host instanceof TmplAstElement ? host.name : (host.tagName ?? '');
}

// The names a host matches as a selector: its tag and every attribute,
// input and output key, read from the source so `[(x)]` reads as `x`.
function hostNames(host: TemplateHost, content: string): ReadonlySet<string> {
  const keys = [...host.attributes, ...host.inputs, ...host.outputs]
    .map((attribute) => attribute.keySpan)
    .filter((span): span is NonNullable<typeof span> => span !== undefined)
    .map((span) => content.slice(span.start.offset, span.end.offset));
  return new Set([tagName(host), ...keys]);
}

function memberRenames(renames: readonly MemberRename[], names: ReadonlySet<string>): Readonly<Record<string, string>> {
  return Object.fromEntries(renames.filter((rename) => names.has(rename.owner)).map((rename) => [rename.from, rename.to]));
}

function tagEdits(host: TemplateHost, table: RenameTable, content: string): TextEdit[] {
  const name = tagName(host);
  const to = table.selectors[name];
  if (to === undefined) {
    return [];
  }
  const open = host.startSourceSpan.start.offset + 1;
  const close = host.endSourceSpan;
  const hasCloseTag = close !== null && close.start.offset !== host.startSourceSpan.start.offset;
  const closeEdit =
    hasCloseTag && content.startsWith(`</${name}`, close.start.offset)
      ? [{ start: close.start.offset + 2, end: close.start.offset + 2 + name.length, text: to }]
      : [];
  return [{ start: open, end: open + name.length, text: to }, ...closeEdit];
}

function hostEdits(host: TemplateHost, table: RenameTable, content: string): TextEdit[] {
  const names = hostNames(host, content);
  const inputs = { ...table.selectors, ...memberRenames(table.inputs, names) };
  const outputs = memberRenames(table.outputs, names);
  const templateAttrs = host instanceof TmplAstTemplate ? host.templateAttrs : [];
  return [
    ...tagEdits(host, table, content),
    ...[...host.attributes, ...host.inputs, ...templateAttrs].flatMap((attribute) => keyEdit(attribute, inputs, content)),
    ...host.outputs.flatMap((output) => keyEdit(output, outputs, content)),
  ];
}

/**
 * Renames selectors, inputs and outputs in an Angular template. A template
 * that does not parse throws; one that names no table entry is returned
 * unparsed.
 */
export function renameInTemplate(table: RenameTable): (content: string) => string {
  const names = templateNames(table);
  return (content) => {
    if (!mentionsAny(content, names)) {
      return content;
    }
    const hosts = walkNodes(parseTemplateContent(content)).filter(
      (node): node is TemplateHost => node instanceof TmplAstElement || node instanceof TmplAstTemplate,
    );
    return applyEdits(
      content,
      hosts.flatMap((host) => hostEdits(host, table, content)),
    );
  };
}

function isCngxModule(specifier: string): boolean {
  return specifier.startsWith('@cngx/');
}

function stringRange(literal: ts.StringLiteralLike, source: ts.SourceFile): Pick<TextEdit, 'start' | 'end'> {
  return { start: literal.getStart(source) + 1, end: literal.getEnd() - 1 };
}

function moduleSpecifier(statement: ts.Statement): ts.StringLiteral | undefined {
  const isModuleStatement = ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement);
  const specifier = isModuleStatement ? statement.moduleSpecifier : undefined;
  return specifier !== undefined && ts.isStringLiteral(specifier) ? specifier : undefined;
}

function namedElements(statement: ts.Statement): readonly (ts.ImportSpecifier | ts.ExportSpecifier)[] {
  if (ts.isImportDeclaration(statement)) {
    const bindings = statement.importClause?.namedBindings;
    return bindings !== undefined && ts.isNamedImports(bindings) ? bindings.elements : [];
  }
  if (ts.isExportDeclaration(statement)) {
    const clause = statement.exportClause;
    return clause !== undefined && ts.isNamedExports(clause) ? clause.elements : [];
  }
  return [];
}

interface ImportPass {
  readonly edits: readonly TextEdit[];
  /** Local names bound to a renamed cngx export, with the new name. */
  readonly locals: Readonly<Record<string, string>>;
}

// `import { Old }` becomes `import { New }` and binds `Old` for the
// reference pass; `import { Old as A }` keeps `A`; `export { Old } from`
// keeps the name the file exports.
function specifierEdit(
  element: ts.ImportSpecifier | ts.ExportSpecifier,
  names: Readonly<Record<string, string>>,
  source: ts.SourceFile,
): ImportPass {
  const imported = element.propertyName ?? element.name;
  const to = ts.isIdentifier(imported) ? names[imported.text] : undefined;
  if (to === undefined) {
    return { edits: [], locals: {} };
  }
  const edit = { start: imported.getStart(source), end: imported.getEnd() };
  if (element.propertyName !== undefined) {
    return { edits: [{ ...edit, text: to }], locals: {} };
  }
  if (ts.isExportSpecifier(element)) {
    return { edits: [{ ...edit, text: `${to} as ${element.name.text}` }], locals: {} };
  }
  return { edits: [{ ...edit, text: to }], locals: { [element.name.text]: to } };
}

function importPass(source: ts.SourceFile, table: RenameTable): ImportPass {
  const names = { ...table.classes, ...table.tokens };
  const passes = source.statements.flatMap((statement) => {
    const specifier = moduleSpecifier(statement);
    if (specifier === undefined) {
      return [];
    }
    const moved = table.importPaths[specifier.text];
    const pathEdit = moved === undefined ? [] : [{ ...stringRange(specifier, source), text: moved }];
    if (!isCngxModule(specifier.text)) {
      return [{ edits: pathEdit, locals: {} }];
    }
    return [{ edits: pathEdit, locals: {} }, ...namedElements(statement).map((element) => specifierEdit(element, names, source))];
  });
  return {
    edits: passes.flatMap((pass) => pass.edits),
    locals: Object.assign({}, ...passes.map((pass) => pass.locals)) as Record<string, string>,
  };
}

// Positions where an identifier is a name, not a reference to the import.
function isNameOnly(node: ts.Identifier): boolean {
  const parent = node.parent;
  return (
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isQualifiedName(parent) && parent.right === node) ||
    ((ts.isPropertyAssignment(parent) ||
      ts.isPropertyDeclaration(parent) ||
      ts.isPropertySignature(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isMethodSignature(parent) ||
      ts.isGetAccessor(parent) ||
      ts.isSetAccessor(parent)) &&
      parent.name === node) ||
    ts.isImportSpecifier(parent) ||
    ts.isExportSpecifier(parent) ||
    ts.isImportClause(parent)
  );
}

function referenceEdits(source: ts.SourceFile, locals: Readonly<Record<string, string>>): TextEdit[] {
  const edits: TextEdit[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && Object.hasOwn(locals, node.text) && !isNameOnly(node)) {
      const to = locals[node.text];
      const shorthand = ts.isShorthandPropertyAssignment(node.parent);
      edits.push({ start: node.getStart(source), end: node.getEnd(), text: shorthand ? `${node.text}: ${to}` : to });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return edits;
}

function inlineTemplates(source: ts.SourceFile): readonly ts.StringLiteralLike[] {
  const templates: ts.StringLiteralLike[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'template' &&
      ts.isStringLiteralLike(node.initializer) &&
      ts.isObjectLiteralExpression(node.parent) &&
      ts.isCallExpression(node.parent.parent) &&
      ts.isDecorator(node.parent.parent.parent)
    ) {
      templates.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return templates;
}

function templateEdits(source: ts.SourceFile, content: string, table: RenameTable): TextEdit[] {
  const rename = renameInTemplate(table);
  return inlineTemplates(source).flatMap((literal) => {
    const range = stringRange(literal, source);
    const before = content.slice(range.start, range.end);
    const after = rename(before);
    return after === before ? [] : [{ ...range, text: after }];
  });
}

/**
 * Renames cngx classes, tokens and module specifiers in a TypeScript file,
 * plus selectors, inputs and outputs in its inline templates. Only names
 * imported from an `@cngx/*` module are renamed, so a local class that
 * shares an old name stays.
 */
export function renameInSource(table: RenameTable): (content: string) => string {
  const names = [...templateNames(table), ...Object.keys(table.classes), ...Object.keys(table.tokens), ...Object.keys(table.importPaths)];
  return (content) => {
    if (!mentionsAny(content, names)) {
      return content;
    }
    const source = ts.createSourceFile('rename.ts', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const imports = importPass(source, table);
    return applyEdits(content, [
      ...imports.edits,
      ...referenceEdits(source, imports.locals),
      ...templateEdits(source, content, table),
    ]);
  };
}
