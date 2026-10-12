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
  /** `exportAs` names, as template references read them: `#menu="cngxMenu"`. */
  readonly exportAs: Readonly<Record<string, string>>;
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
  exportAs: {},
  tokens: {},
  importPaths: {},
};

export function isEmptyRenameTable(table: RenameTable): boolean {
  return (
    Object.keys(table.classes).length === 0 &&
    Object.keys(table.selectors).length === 0 &&
    table.inputs.length === 0 &&
    table.outputs.length === 0 &&
    Object.keys(table.exportAs).length === 0 &&
    Object.keys(table.tokens).length === 0 &&
    Object.keys(table.importPaths).length === 0
  );
}

/** The renamed content and what the table names but no edit can reach. */
export interface RenameResult {
  readonly content: string;
  /** One line per spot the user renames by hand. */
  readonly manual: readonly string[];
}

interface TextEdit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

interface Pass {
  readonly edits: readonly TextEdit[];
  readonly manual: readonly string[];
}

// Edits come from one parse of the original content; they never overlap,
// so applying them back to front keeps every earlier offset valid. Two
// nodes can report the same span (an element under `*ngIf` and its
// template wrapper, a two-way binding's input and output); one edit stays.
function applyEdits(content: string, edits: readonly TextEdit[]): string {
  const unique = [...new Map(edits.map((edit) => [edit.start, edit])).values()];
  return unique
    .sort((a, b) => b.start - a.start)
    .reduce(
      (text, edit) => `${text.slice(0, edit.start)}${edit.text}${text.slice(edit.end)}`,
      content,
    );
}

function toResult(content: string, passes: readonly Pass[]): RenameResult {
  return {
    content: applyEdits(
      content,
      passes.flatMap((pass) => pass.edits),
    ),
    manual: [...new Set(passes.flatMap((pass) => pass.manual))],
  };
}

// A cheap pre-check, so a file that names nothing in the table is never
// parsed. A member rename only applies on its owner, so the owner, not the
// often generic member name, decides whether a template is read.
function mentionsAny(content: string, names: readonly string[]): boolean {
  return names.some((name) => content.includes(name));
}

function templateNames(table: RenameTable): readonly string[] {
  return [
    ...Object.keys(table.selectors),
    ...table.inputs.map((rename) => rename.owner),
    ...table.outputs.map((rename) => rename.owner),
    ...Object.keys(table.exportAs),
  ];
}

interface Span {
  readonly start: { readonly offset: number };
  readonly end: { readonly offset: number };
}

interface Keyed {
  readonly name: string;
  readonly keySpan: Span | undefined;
}

type TemplateHost = TmplAstElement | TmplAstTemplate;

function spanEdit(
  span: Span | undefined,
  renames: Readonly<Record<string, string>>,
  content: string,
): TextEdit[] {
  if (span === undefined) {
    return [];
  }
  const start = span.start.offset;
  const end = span.end.offset;
  const to = renames[content.slice(start, end)];
  return to === undefined ? [] : [{ start, end, text: to }];
}

function tagName(host: TemplateHost): string {
  return host instanceof TmplAstElement ? host.name : (host.tagName ?? '');
}

// The names a host matches as a selector: its tag and every attribute,
// input and output key, read from the source so `[(x)]` reads as `x`, plus
// the keys of a structural directive (`*cngxFor` matches `cngxFor`).
function hostNames(host: TemplateHost, content: string): ReadonlySet<string> {
  const templateAttrs = host instanceof TmplAstTemplate ? host.templateAttrs : [];
  const keys = [...host.attributes, ...host.inputs, ...host.outputs, ...templateAttrs]
    .map((attribute) => attribute.keySpan)
    .filter((span): span is NonNullable<typeof span> => span !== undefined)
    .map((span) => content.slice(span.start.offset, span.end.offset));
  return new Set([tagName(host), ...keys]);
}

function memberRenames(
  renames: readonly MemberRename[],
  names: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    renames.filter((rename) => names.has(rename.owner)).map((rename) => [rename.from, rename.to]),
  );
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

// A microsyntax key such as `cngxForOf` in `*cngxFor="let x of xs"` is
// spelled `of` in the source; no span carries the full name to rename.
function microsyntaxManual(
  attributes: readonly Keyed[],
  renames: Readonly<Record<string, string>>,
  content: string,
): string[] {
  return attributes
    .filter((attribute) => renames[attribute.name] !== undefined && attribute.keySpan !== undefined)
    .filter((attribute) => {
      const span = attribute.keySpan;
      return (
        span !== undefined && content.slice(span.start.offset, span.end.offset) !== attribute.name
      );
    })
    .map(
      (attribute) =>
        `structural directive input \`${attribute.name}\` is now \`${renames[attribute.name] ?? ''}\`; rename it by hand`,
    );
}

function hostPass(host: TemplateHost, table: RenameTable, content: string): Pass {
  const names = hostNames(host, content);
  const inputs = { ...table.selectors, ...memberRenames(table.inputs, names) };
  const outputs = memberRenames(table.outputs, names);
  const templateAttrs = host instanceof TmplAstTemplate ? host.templateAttrs : [];
  return {
    edits: [
      ...tagEdits(host, table, content),
      ...[...host.attributes, ...host.inputs, ...templateAttrs].flatMap((attribute) =>
        spanEdit(attribute.keySpan, inputs, content),
      ),
      ...host.outputs.flatMap((output) => spanEdit(output.keySpan, outputs, content)),
      ...host.references.flatMap((reference) =>
        spanEdit(reference.valueSpan, table.exportAs, content),
      ),
    ],
    manual: microsyntaxManual(templateAttrs, inputs, content),
  };
}

/**
 * A renamer for Angular templates: selectors, inputs, outputs and `exportAs`
 * references. A template that does not parse throws; one that names no
 * table entry is returned unparsed.
 */
export function createTemplateRenamer(table: RenameTable): (content: string) => RenameResult {
  const names = templateNames(table);
  return (content) => {
    if (!mentionsAny(content, names)) {
      return { content, manual: [] };
    }
    const hosts = walkNodes(parseTemplateContent(content)).filter(
      (node): node is TemplateHost =>
        node instanceof TmplAstElement || node instanceof TmplAstTemplate,
    );
    return toResult(
      content,
      hosts.map((host) => hostPass(host, table, content)),
    );
  };
}

function isCngxModule(specifier: string): boolean {
  return specifier.startsWith('@cngx/');
}

function stringRange(
  literal: ts.StringLiteralLike,
  source: ts.SourceFile,
): Pick<TextEdit, 'start' | 'end'> {
  return { start: literal.getStart(source) + 1, end: literal.getEnd() - 1 };
}

function moduleSpecifier(statement: ts.Statement): ts.StringLiteral | undefined {
  const isModuleStatement = ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement);
  const specifier = isModuleStatement ? statement.moduleSpecifier : undefined;
  return specifier !== undefined && ts.isStringLiteral(specifier) ? specifier : undefined;
}

function namedElements(
  statement: ts.Statement,
): readonly (ts.ImportSpecifier | ts.ExportSpecifier)[] {
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

function namespaceName(statement: ts.Statement): string | undefined {
  const bindings = ts.isImportDeclaration(statement)
    ? statement.importClause?.namedBindings
    : undefined;
  return bindings !== undefined && ts.isNamespaceImport(bindings) ? bindings.name.text : undefined;
}

interface ImportPass {
  readonly edits: readonly TextEdit[];
  /** Local names bound to a renamed cngx export, with the new name. */
  readonly locals: ReadonlyMap<string, string>;
  /** Local names of `import * as ns from '@cngx/...'`. */
  readonly namespaces: ReadonlySet<string>;
}

interface SpecifierPass {
  readonly edits: readonly TextEdit[];
  readonly local?: readonly [string, string];
}

// `import { Old }` becomes `import { New }` and binds `Old` for the
// reference pass; `import { Old as A }` keeps `A`; `export { Old } from`
// keeps the name the file exports.
function specifierPass(
  element: ts.ImportSpecifier | ts.ExportSpecifier,
  names: Readonly<Record<string, string>>,
  source: ts.SourceFile,
): SpecifierPass {
  const imported = element.propertyName ?? element.name;
  const to = ts.isIdentifier(imported) ? names[imported.text] : undefined;
  if (to === undefined) {
    return { edits: [] };
  }
  const edit = { start: imported.getStart(source), end: imported.getEnd() };
  if (element.propertyName !== undefined) {
    return { edits: [{ ...edit, text: to }] };
  }
  if (ts.isExportSpecifier(element)) {
    return { edits: [{ ...edit, text: `${to} as ${element.name.text}` }] };
  }
  return { edits: [{ ...edit, text: to }], local: [element.name.text, to] };
}

function importPass(
  source: ts.SourceFile,
  table: RenameTable,
  names: Readonly<Record<string, string>>,
): ImportPass {
  const cngxStatements = source.statements.filter((statement) => {
    const specifier = moduleSpecifier(statement);
    return specifier !== undefined && isCngxModule(specifier.text);
  });
  const pathEdits = source.statements.flatMap((statement) => {
    const specifier = moduleSpecifier(statement);
    const moved = specifier === undefined ? undefined : table.importPaths[specifier.text];
    return specifier === undefined || moved === undefined
      ? []
      : [{ ...stringRange(specifier, source), text: moved }];
  });
  const specifiers = cngxStatements.flatMap((statement) =>
    namedElements(statement).map((element) => specifierPass(element, names, source)),
  );
  return {
    edits: [...pathEdits, ...specifiers.flatMap((pass) => pass.edits)],
    locals: new Map(specifiers.flatMap((pass) => (pass.local === undefined ? [] : [pass.local]))),
    namespaces: new Set(
      cngxStatements.flatMap((statement) => {
        const name = namespaceName(statement);
        return name === undefined ? [] : [name];
      }),
    ),
  };
}

// Positions where an identifier is a name, not a reference to the import:
// a member or key name, a destructuring key or binding, an import or
// export alias.
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
      ts.isSetAccessor(parent) ||
      ts.isBindingElement(parent)) &&
      parent.name === node) ||
    (ts.isBindingElement(parent) && parent.propertyName === node) ||
    (ts.isExportSpecifier(parent) &&
      (parent.parent.parent.moduleSpecifier !== undefined ||
        (parent.propertyName !== undefined && parent.name === node))) ||
    ts.isImportSpecifier(parent) ||
    ts.isImportClause(parent)
  );
}

// The text that replaces a reference. A shorthand property and a local
// `export { Old }` keep the old name on the outside.
function referenceText(node: ts.Identifier, to: string): string {
  const parent = node.parent;
  if (ts.isShorthandPropertyAssignment(parent)) {
    return `${node.text}: ${to}`;
  }
  if (ts.isExportSpecifier(parent) && parent.propertyName === undefined) {
    return `${to} as ${node.text}`;
  }
  return to;
}

// `ns.Old` in an expression or a type, where `ns` is a cngx namespace import.
function namespaceMember(node: ts.Identifier, namespaces: ReadonlySet<string>): boolean {
  const parent = node.parent;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return ts.isIdentifier(parent.expression) && namespaces.has(parent.expression.text);
  }
  if (ts.isQualifiedName(parent) && parent.right === node) {
    return ts.isIdentifier(parent.left) && namespaces.has(parent.left.text);
  }
  return false;
}

function referenceEdits(
  source: ts.SourceFile,
  imports: ImportPass,
  names: Readonly<Record<string, string>>,
): TextEdit[] {
  const edits: TextEdit[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) {
      const local = imports.locals.get(node.text);
      const member = namespaceMember(node, imports.namespaces) ? names[node.text] : undefined;
      const to = local !== undefined && !isNameOnly(node) ? referenceText(node, local) : member;
      if (to !== undefined) {
        edits.push({ start: node.getStart(source), end: node.getEnd(), text: to });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return edits;
}

function isDynamicCngxImport(node: ts.Node): node is ts.CallExpression {
  const argument = ts.isCallExpression(node) ? node.arguments[0] : undefined;
  return (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    argument !== undefined &&
    ts.isStringLiteralLike(argument) &&
    isCngxModule(argument.text)
  );
}

function hostDirectiveStrings(node: ts.Node): readonly string[] {
  if (
    !ts.isPropertyAssignment(node) ||
    !ts.isIdentifier(node.name) ||
    node.name.text !== 'hostDirectives'
  ) {
    return [];
  }
  const strings: string[] = [];
  const visit = (child: ts.Node): void => {
    if (ts.isStringLiteralLike(child)) {
      strings.push(child.text.split(':')[0]?.trim() ?? '');
    }
    ts.forEachChild(child, visit);
  };
  visit(node.initializer);
  return strings;
}

// What the AST passes cannot rename safely: members of a dynamic
// `import('@cngx/...')` and input or output names written as strings in
// `hostDirectives`. Both are named, so the user finishes them by hand.
function sourceManual(
  source: ts.SourceFile,
  content: string,
  table: RenameTable,
  names: Readonly<Record<string, string>>,
): string[] {
  const members = new Set([...table.inputs, ...table.outputs].map((rename) => rename.from));
  const manual: string[] = [];
  const visit = (node: ts.Node): void => {
    if (isDynamicCngxImport(node) && Object.keys(names).some((name) => content.includes(name))) {
      manual.push(
        `dynamic import of ${node.arguments[0]?.getText(source) ?? ''}: rename its members by hand`,
      );
    }
    for (const value of hostDirectiveStrings(node)) {
      if (members.has(value)) {
        manual.push(
          `hostDirectives names \`${value}\`, which a cngx directive renamed; check it by hand`,
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return manual;
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

function templatePass(source: ts.SourceFile, content: string, table: RenameTable): Pass {
  const rename = createTemplateRenamer(table);
  const passes = inlineTemplates(source).map((literal): Pass => {
    const range = stringRange(literal, source);
    const before = content.slice(range.start, range.end);
    const after = rename(before);
    return {
      edits: after.content === before ? [] : [{ ...range, text: after.content }],
      manual: after.manual,
    };
  });
  return {
    edits: passes.flatMap((pass) => pass.edits),
    manual: passes.flatMap((pass) => pass.manual),
  };
}

/**
 * A renamer for TypeScript files: cngx classes, tokens and module
 * specifiers, members of a cngx namespace import, and selectors, inputs,
 * outputs and `exportAs` names in inline templates. Only names imported
 * from an `@cngx/*` module are renamed, so a local class that shares an old
 * name stays.
 */
export function createSourceRenamer(table: RenameTable): (content: string) => RenameResult {
  const names = { ...table.classes, ...table.tokens };
  const mentioned = [
    ...templateNames(table),
    ...Object.keys(names),
    ...Object.keys(table.importPaths),
  ];
  const members = [...table.inputs, ...table.outputs].map((rename) => rename.from);
  return (content) => {
    const namesHostDirective = content.includes('hostDirectives') && mentionsAny(content, members);
    if (!mentionsAny(content, mentioned) && !namesHostDirective) {
      return { content, manual: [] };
    }
    const source = ts.createSourceFile(
      'rename.ts',
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const imports = importPass(source, table, names);
    return toResult(content, [
      { edits: imports.edits, manual: [] },
      {
        edits: referenceEdits(source, imports, names),
        manual: sourceManual(source, content, table, names),
      },
      templatePass(source, content, table),
    ]);
  };
}
