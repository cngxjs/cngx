// Inventories the public API members that render without a description. The
// source is the compodocx JSON export (`npm run docs:json`), the same artifact
// the API tab, `get_api`, the CLI and `docs:llm` read: aliases, `@internal`
// and `private` stripping, export resolution (`entryPoint`) and overload rows
// are already applied there, so the scan only applies the triage below.
//
//   node scripts/api-doc-coverage.mjs --report          markdown inventory per lib / entry point / owner
//   node scripts/api-doc-coverage.mjs --rows            sorted ratchet rows for api-doc-coverage.fixtures.mjs
//   node scripts/api-doc-coverage.mjs --doc=<path> ...  read another export than .compodoc/documentation.json

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DOC_PATH = resolve(REPO_ROOT, '.compodoc/documentation.json');

/**
 * Methods whose contract belongs to Angular on any owner: lifecycle hooks and
 * the template context guard. `ngAcceptInputType_*` is matched by prefix in
 * {@link isContractMethod}.
 */
export const CONTRACT_METHODS = new Set([
  'ngOnInit',
  'ngOnChanges',
  'ngDoCheck',
  'ngAfterContentInit',
  'ngAfterContentChecked',
  'ngAfterViewInit',
  'ngAfterViewChecked',
  'ngOnDestroy',
  'ngTemplateContextGuard',
]);

/**
 * The forms contracts, exempt only on an owner whose `implements` names the
 * interface: a `validate()` on any other class is cngx API like every method.
 */
const FORMS_CONTRACTS = [
  {
    interfaces: ['ControlValueAccessor'],
    methods: ['writeValue', 'registerOnChange', 'registerOnTouched', 'setDisabledState'],
  },
  {
    interfaces: ['Validator', 'AsyncValidator'],
    methods: ['validate', 'registerOnValidatorChange'],
  },
];

/** `ts.SyntaxKind` values on `modifierKind`, TypeScript 5.9. */
export const PRIVATE = 123;
export const PROTECTED = 124;

const KIND_ORDER = ['entry', 'input', 'output', 'method', 'accessor', 'token', 'function'];

export function isContractMethod(name, owner) {
  if (CONTRACT_METHODS.has(name) || name.startsWith('ngAcceptInputType_')) return true;
  const implemented = owner?.implements ?? [];
  return FORMS_CONTRACTS.some(
    (contract) =>
      contract.methods.includes(name) &&
      contract.interfaces.some((iface) => implemented.includes(iface)),
  );
}

function isHidden(row) {
  const modifiers = row?.modifierKind ?? [];
  return modifiers.includes(PROTECTED) || modifiers.includes(PRIVATE);
}

/** Empty `rawdescription` and a `description` that is empty once tags are stripped. */
export function isUndocumented(row) {
  const raw = (row.rawdescription ?? '').trim();
  const html = (row.description ?? '').replace(/<[^>]+>/g, '').trim();
  return !raw && !html;
}

export function libOf(file) {
  return /^projects\/([^/]+)\//.exec(file ?? '')?.[1] ?? '?';
}

/** The plan phase that closes gaps of an entry point: select, then common, then the rest. */
export function closingPhase(entry) {
  if (entry === '@cngx/forms/select') return 2;
  if (entry === '@cngx/common' || entry.startsWith('@cngx/common/')) return 3;
  return 4;
}

function emptyTotals() {
  return {
    entries: 0,
    entriesUndoc: 0,
    bindings: 0,
    bindingsUndoc: 0,
    methods: 0,
    methodsUndoc: 0,
    accessors: 0,
    accessorsUndoc: 0,
    tokens: 0,
    tokensUndoc: 0,
    functions: 0,
    functionsUndoc: 0,
  };
}

/**
 * Applies the triage to a compodocx export.
 *
 * Public API is a row with a non-null `entryPoint`. Counted per owner: the
 * owner's own description, every `inputsClass` / `outputsClass` row, and every
 * method that is neither `protected` nor `private` nor an Angular contract,
 * and every public accessor (documented when its getter or setter is).
 * Exported tokens and functions count on their own. Properties never count
 * (`disableProperties: true`).
 *
 * @returns {{ gaps: object[], totals: { all: object, byLib: Record<string, object>, byEntry: Record<string, object> } }}
 */
export function scanApiDocCoverage(doc) {
  const gaps = [];
  const all = emptyTotals();
  const byLib = {};
  const byEntry = {};
  const count = (row, field, undocumented) => {
    for (const bucket of [
      all,
      (byLib[libOf(row.file)] ??= emptyTotals()),
      (byEntry[row.entryPoint] ??= emptyTotals()),
    ]) {
      bucket[field]++;
      if (undocumented) bucket[`${field}Undoc`]++;
    }
  };
  const isPublic = (row) => Boolean(row.entryPoint);
  const owners = [
    ...(doc.components ?? []),
    ...(doc.directives ?? []),
    ...(doc.injectables ?? []),
    ...(doc.classes ?? []),
    ...(doc.pipes ?? []),
    ...(doc.interceptors ?? []),
    ...(doc.guards ?? []),
  ].filter(isPublic);

  for (const owner of owners) {
    const base = { entry: owner.entryPoint, owner: owner.name, file: owner.file };
    const ownerUndoc = isUndocumented(owner);
    count(owner, 'entries', ownerUndoc);
    if (ownerUndoc) gaps.push({ ...base, kind: 'entry', member: owner.name });

    for (const [kind, rows] of [
      ['input', owner.inputsClass],
      ['output', owner.outputsClass],
    ]) {
      for (const member of rows ?? []) {
        const undocumented = isUndocumented(member);
        count(owner, 'bindings', undocumented);
        if (!undocumented) continue;
        gaps.push({
          ...base,
          kind,
          member: member.name,
          ...(member.alias && member.alias !== member.name ? { binding: member.alias } : {}),
          line: member.line,
        });
      }
    }

    for (const member of owner.methodsClass ?? owner.methods ?? []) {
      if (isHidden(member) || isContractMethod(member.name, owner)) continue;
      const undocumented = isUndocumented(member);
      count(owner, 'methods', undocumented);
      if (undocumented)
        gaps.push({ ...base, kind: 'method', member: member.name, line: member.line });
    }

    for (const [name, accessor] of Object.entries(owner.accessors ?? {})) {
      const signatures = [accessor.getSignature, accessor.setSignature].filter(Boolean);
      if (signatures.length === 0 || signatures.every(isHidden)) continue;
      const undocumented = signatures.every(isUndocumented);
      count(owner, 'accessors', undocumented);
      if (undocumented) {
        gaps.push({ ...base, kind: 'accessor', member: name, line: signatures[0].line });
      }
    }
  }

  for (const [kind, field, rows] of [
    ['token', 'tokens', doc.tokens ?? []],
    ['function', 'functions', doc.miscellaneous?.functions ?? []],
  ]) {
    for (const row of rows.filter(isPublic)) {
      const undocumented = isUndocumented(row);
      count(row, field, undocumented);
      if (!undocumented) continue;
      gaps.push({
        entry: row.entryPoint,
        owner: row.name,
        kind,
        member: row.name,
        file: row.file,
        line: row.line,
      });
    }
  }

  gaps.sort(compareRows);
  return { gaps, totals: { all, byLib, byEntry } };
}

export function compareRows(a, b) {
  return (
    a.entry.localeCompare(b.entry) ||
    a.owner.localeCompare(b.owner) ||
    KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
    a.member.localeCompare(b.member)
  );
}

/** The ratchet key. Line numbers stay out so a moved member is the same gap. */
export function rowKey(row) {
  return `${row.entry} ${row.owner} ${row.kind} ${row.member}`;
}

/** A gap as a ratchet row: key fields, binding name when aliased, closing phase. */
export function toRatchetRow(gap) {
  return {
    entry: gap.entry,
    owner: gap.owner,
    kind: gap.kind,
    member: gap.member,
    ...(gap.binding ? { binding: gap.binding } : {}),
    phase: closingPhase(gap.entry),
  };
}

const FIELD_HEAD =
  /(?:(?:public|protected|private)\s+)?readonly\s+(\w+)\s*=\s*(input|model|output)(\.required)?\s*/g;

/**
 * Index just past the bracket group opening at `start`. A `=>` inside a type
 * argument is an arrow, not a closing `>`.
 */
function skipGroup(text, start, open, close) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (open === '<' && char === '=' && text[i + 1] === '>') {
      i++;
      continue;
    }
    if (char === open) depth++;
    else if (char === close && --depth === 0) return i + 1;
  }
  return -1;
}

/** Whether the `/** ... *\/` block directly above `index` carries `@internal`. */
function precededByInternal(text, index) {
  const before = text.slice(0, index).trimEnd();
  if (!before.endsWith('*/')) return false;
  const open = before.lastIndexOf('/**');
  return open >= 0 && /@internal\b/.test(before.slice(open));
}

function ownerAt(text, index) {
  let owner;
  for (const match of text.slice(0, index).matchAll(/export\s+(?:abstract\s+)?class\s+(\w+)/g)) {
    owner = match[1];
  }
  return owner;
}

/**
 * Every `readonly <field> = input|model|output(...)` in the given sources,
 * aliased or not. The type argument and the call arguments are walked by
 * bracket depth, so a function type or a nested generic does not end the match.
 *
 * @param {{ path: string, text: string }[]} files
 * @returns {{ file: string, owner: string | undefined, member: string, kind: string, alias?: string, internal: boolean }[]}
 */
export function scanBindingFields(files) {
  const fields = [];
  for (const { path, text } of files) {
    for (const match of text.matchAll(FIELD_HEAD)) {
      let cursor = match.index + match[0].length;
      if (text[cursor] === '<') {
        cursor = skipGroup(text, cursor, '<', '>');
        if (cursor < 0) continue;
        while (/\s/.test(text[cursor])) cursor++;
      }
      if (text[cursor] !== '(') continue;
      const end = skipGroup(text, cursor, '(', ')');
      if (end < 0) continue;
      const alias = /\balias\s*:\s*(['"`])([^'"`]+)\1/.exec(text.slice(cursor, end))?.[2];
      fields.push({
        file: path,
        owner: ownerAt(text, match.index),
        member: match[1],
        kind: match[2],
        ...(alias ? { alias } : {}),
        internal: precededByInternal(text, match.index),
      });
    }
  }
  return fields;
}

/**
 * Non-`@internal` binding fields whose owner is public in the export but has
 * no `inputsClass` (input, model) or `outputsClass` (output) row for the field.
 */
export function missingBindingRows(fields, doc) {
  const owners = new Map();
  for (const owner of [...(doc.components ?? []), ...(doc.directives ?? [])]) {
    if (owner.entryPoint) owners.set(`${owner.file} ${owner.name}`, owner);
  }
  return fields.filter((field) => {
    if (field.internal) return false;
    const owner = owners.get(`${field.file} ${field.owner}`);
    if (!owner) return false;
    const rows = field.kind === 'output' ? owner.outputsClass : owner.inputsClass;
    return !(rows ?? []).some((row) => row.name === field.member);
  });
}

function renderReport({ gaps, totals }) {
  const head =
    '| lib | entries | entry undoc | bindings | binding undoc | methods | method undoc | accessors | accessor undoc | tokens | token undoc | functions | fn undoc |';
  const cells = (t) =>
    [
      t.entries,
      t.entriesUndoc,
      t.bindings,
      t.bindingsUndoc,
      t.methods,
      t.methodsUndoc,
      t.accessors,
      t.accessorsUndoc,
      t.tokens,
      t.tokensUndoc,
      t.functions,
      t.functionsUndoc,
    ].join(' | ');
  const lines = ['# Public API doc coverage', '', head, '|-|-|-|-|-|-|-|-|-|-|-|-|-|'];
  for (const lib of Object.keys(totals.byLib).sort())
    lines.push(`| ${lib} | ${cells(totals.byLib[lib])} |`);
  lines.push(`| total | ${cells(totals.all)} |`, '', `Undocumented: ${gaps.length}`);

  let entry;
  let owner;
  for (const gap of gaps) {
    if (gap.entry !== entry) {
      entry = gap.entry;
      owner = undefined;
      const t = totals.byEntry[entry];
      lines.push('', `## ${entry} (bindings ${t.bindingsUndoc}, methods ${t.methodsUndoc})`);
    }
    if (gap.owner !== owner) {
      owner = gap.owner;
      lines.push('', `### ${owner}`, '', '| kind | member | binding | location |', '|-|-|-|-|');
    }
    const location = gap.line ? `${gap.file}:${gap.line}` : gap.file;
    lines.push(`| ${gap.kind} | ${gap.member} | ${gap.binding ?? ''} | ${location} |`);
  }
  return lines.join('\n');
}

function renderRows(gaps) {
  const rows = gaps.map((gap) => `  ${JSON.stringify(toRatchetRow(gap))},`);
  return [
    `export const CEILING = ${gaps.length};`,
    '',
    'export const RATCHET = [',
    ...rows,
    '];',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const docArg = args.find((arg) => arg.startsWith('--doc='));
  const doc = JSON.parse(readFileSync(docArg ? resolve(docArg.slice(6)) : DOC_PATH, 'utf8'));
  const result = scanApiDocCoverage(doc);
  if (args.includes('--rows')) console.log(renderRows(result.gaps));
  else if (args.includes('--report')) console.log(renderReport(result));
  else {
    console.error('usage: node scripts/api-doc-coverage.mjs --report | --rows [--doc=<path>]');
    process.exit(1);
  }
}
