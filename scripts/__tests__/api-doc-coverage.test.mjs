import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import {
  DOC_PATH,
  missingBindingRows,
  REPO_ROOT,
  rowKey,
  scanApiDocCoverage,
  scanBindingFields,
} from '../api-doc-coverage.mjs';
import { CEILING, INTERNAL_BINDINGS, RATCHET } from './api-doc-coverage.fixtures.mjs';

/**
 * Guard for undocumented public API members, read from the compodocx JSON
 * export. A public binding, method, token or function without a description
 * renders an empty row in the API tab, in `get_api` and in the CLI.
 *
 * Counted: owners with a non-null `entryPoint`, their `inputsClass` /
 * `outputsClass` rows, and their methods minus `protected` / `private` and the
 * Angular contracts (lifecycle hooks, `ngTemplateContextGuard`,
 * `ngAcceptInputType_*`, the `ControlValueAccessor` / `Validator` methods);
 * exported tokens and functions. A tags-only JSDoc is undocumented.
 *
 * A second pass reads the binding fields in source: an `input()` / `model()` /
 * `output()` field is the binding, so `@internal` on it drops the binding from
 * the export and from this guard.
 *
 * Asserted against the repo:
 *   - every found gap is a {@link RATCHET} row and every row is still a gap
 *     (multiset on the key, so two overload rows stay two rows);
 *   - `RATCHET.length === CEILING`;
 *   - the binding fields tagged `@internal` are exactly {@link INTERNAL_BINDINGS};
 *   - every other binding field of a public owner has a row in the export;
 *   - the scans found more than 1500 bindings, 250 methods and 1500 binding
 *     fields, so a scan that silently finds nothing fails.
 *
 * Needs a fresh `.compodoc/documentation.json` (`npm run docs:json`); CI
 * builds it in the `build` job and restores it before `test:scripts`.
 */

describe('api doc coverage (repo)', () => {
  let result;

  beforeAll(() => {
    if (!existsSync(DOC_PATH)) throw new Error('run npm run docs:json first');
    const exported = JSON.parse(readFileSync(DOC_PATH, 'utf8'));
    if (exported.schemaVersion !== 6) throw new Error('schemaVersion 6 expected');
    const installed = JSON.parse(
      readFileSync(resolve(REPO_ROOT, 'node_modules/@cngxjs/compodocx/package.json'), 'utf8'),
    ).version;
    if (exported.compodocxVersion !== installed) {
      throw new Error('stale docs JSON: regenerate with npm run docs:json');
    }
    result = scanApiDocCoverage(exported);
  });

  it('finds the bindings and methods', () => {
    expect(result.totals.all.bindings).toBeGreaterThan(1500);
    expect(result.totals.all.methods).toBeGreaterThan(250);
  });

  it('lists every undocumented member in the ratchet', () => {
    expect(
      subtract(result.gaps, RATCHET),
      'add a JSDoc, or @internal when the member implements an unexported contract or only the own template / class calls it; never a row',
    ).toEqual([]);
  });

  it('lists only members that are still undocumented', () => {
    expect(
      subtract(RATCHET, result.gaps),
      'documented, tagged @internal or removed: delete the row and lower CEILING',
    ).toEqual([]);
  });

  it('pins the ratchet length to CEILING', () => {
    expect(RATCHET).toHaveLength(CEILING);
  });

  it('assigns every row a closing phase', () => {
    expect(RATCHET.filter((row) => ![2, 3, 4].includes(row.phase)).map(rowKey)).toEqual([]);
  });
});

describe('api doc coverage (binding fields)', () => {
  let fields;
  let exported;

  beforeAll(() => {
    if (!existsSync(DOC_PATH)) throw new Error('run npm run docs:json first');
    exported = JSON.parse(readFileSync(DOC_PATH, 'utf8'));
    const paths = execFileSync('git', ['ls-files', 'projects/**/*.ts'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
      .filter((path) => !isOutsideDocBuild(path));
    fields = scanBindingFields(
      paths.map((path) => ({ path, text: readFileSync(resolve(REPO_ROOT, path), 'utf8') })),
    );
  });

  it('finds the binding fields', () => {
    expect(fields.length).toBeGreaterThan(1500);
  });

  it('tags no binding field @internal outside INTERNAL_BINDINGS', () => {
    const internal = fields.filter((field) => field.internal);
    const internalKeys = internal.map(fieldKey);
    const pinned = INTERNAL_BINDINGS.map(fieldKey);
    expect(
      internal.filter((field) => !pinned.includes(fieldKey(field))).map(describeField),
      'an input / model / output field is the binding: drop @internal and document the binding',
    ).toEqual([]);
    expect(
      INTERNAL_BINDINGS.filter((row) => !internalKeys.includes(fieldKey(row))).map(describeField),
      'the field no longer carries @internal: delete its INTERNAL_BINDINGS row',
    ).toEqual([]);
  });

  it('gives every other binding field of a public owner a row in the export', () => {
    const pinned = INTERNAL_BINDINGS.map(fieldKey);
    expect(
      missingBindingRows(fields, exported)
        .filter((field) => !pinned.includes(fieldKey(field)))
        .map(describeField),
      'the binding has no compodocx row: check for @internal or a private modifier on the field',
    ).toEqual([]);
  });

  it('assigns every INTERNAL_BINDINGS row phase 3 or 4', () => {
    expect(INTERNAL_BINDINGS.filter((row) => ![3, 4].includes(row.phase)).map(fieldKey)).toEqual(
      [],
    );
  });
});

/** Rows of `from` left after removing one match per row of `remove`, by key. */
function subtract(from, remove) {
  const counts = new Map();
  for (const row of remove) counts.set(rowKey(row), (counts.get(rowKey(row)) ?? 0) + 1);
  const left = [];
  for (const row of from) {
    const key = rowKey(row);
    const count = counts.get(key) ?? 0;
    if (count > 0) counts.set(key, count - 1);
    else left.push(key);
  }
  return left;
}

function fieldKey(field) {
  return `${field.file} ${field.member}`;
}

function describeField(field) {
  return `${field.owner}.${field.member} (${field.file})`;
}

/** The `tsconfig.doc.json` exclude set, plus specs. */
function isOutsideDocBuild(path) {
  return (
    path.endsWith('.spec.ts') ||
    path.includes('/__test-helpers/') ||
    path.startsWith('projects/testing/') ||
    path.includes('/schematics/')
  );
}

const PROTECTED = 124;
const PRIVATE = 123;

const doc = (overrides = {}) => ({
  components: [],
  directives: [],
  injectables: [],
  classes: [],
  pipes: [],
  interceptors: [],
  guards: [],
  tokens: [],
  miscellaneous: { functions: [] },
  ...overrides,
});

const owner = (overrides = {}) => ({
  name: 'CngxFoo',
  file: 'projects/forms/foo/foo.component.ts',
  entryPoint: '@cngx/forms/foo',
  rawdescription: 'Foo.',
  description: '<p>Foo.</p>',
  inputsClass: [],
  outputsClass: [],
  methodsClass: [],
  ...overrides,
});

const keys = (result) => result.gaps.map((gap) => `${gap.kind} ${gap.owner}.${gap.member}`);

describe('api doc coverage (scanner fixtures)', () => {
  it('skips an owner without an entryPoint', () => {
    const result = scanApiDocCoverage(
      doc({
        components: [
          owner({
            entryPoint: null,
            rawdescription: '',
            description: '',
            inputsClass: [{ name: 'value' }],
          }),
        ],
      }),
    );
    expect(result.gaps).toEqual([]);
    expect(result.totals.all.bindings).toBe(0);
  });

  it('skips protected and private methods', () => {
    const result = scanApiDocCoverage(
      doc({
        components: [
          owner({
            methodsClass: [
              { name: 'handleClick', modifierKind: [PROTECTED] },
              { name: 'sync', modifierKind: [PRIVATE] },
            ],
          }),
        ],
      }),
    );
    expect(result.gaps).toEqual([]);
    expect(result.totals.all.methods).toBe(0);
  });

  it('skips the Angular contract methods', () => {
    const result = scanApiDocCoverage(
      doc({
        directives: [
          owner({
            methodsClass: [
              { name: 'ngOnDestroy' },
              { name: 'ngTemplateContextGuard' },
              { name: 'ngAcceptInputType_x' },
              { name: 'writeValue' },
            ],
          }),
        ],
      }),
    );
    expect(result.gaps).toEqual([]);
  });

  it('reports a public method, an input, an output and an aliased input', () => {
    const result = scanApiDocCoverage(
      doc({
        components: [
          owner({
            inputsClass: [{ name: 'placeholder' }, { name: 'disabledInput', alias: 'disabled' }],
            outputsClass: [{ name: 'opened' }],
            methodsClass: [{ name: 'open' }],
          }),
        ],
      }),
    );
    expect(keys(result)).toEqual([
      'input CngxFoo.disabledInput',
      'input CngxFoo.placeholder',
      'output CngxFoo.opened',
      'method CngxFoo.open',
    ]);
    expect(result.gaps.find((gap) => gap.member === 'disabledInput')).toMatchObject({
      entry: '@cngx/forms/foo',
      binding: 'disabled',
    });
    expect(result.gaps.find((gap) => gap.member === 'placeholder')).not.toHaveProperty('binding');
  });

  it('counts an empty paragraph with an empty rawdescription as undocumented', () => {
    const result = scanApiDocCoverage(
      doc({
        components: [
          owner({ inputsClass: [{ name: 'value', rawdescription: '', description: '<p></p>\n' }] }),
        ],
      }),
    );
    expect(keys(result)).toEqual(['input CngxFoo.value']);
  });

  it('counts a tags-only JSDoc as undocumented', () => {
    const result = scanApiDocCoverage(
      doc({
        components: [
          owner({ inputsClass: [{ name: 'value', rawdescription: '\n', description: '' }] }),
        ],
      }),
    );
    expect(keys(result)).toEqual(['input CngxFoo.value']);
  });

  it('keeps a documented member out of the gaps', () => {
    const result = scanApiDocCoverage(
      doc({
        components: [
          owner({
            inputsClass: [
              { name: 'value', rawdescription: 'The value.', description: '<p>The value.</p>' },
            ],
          }),
        ],
      }),
    );
    expect(result.gaps).toEqual([]);
    expect(result.totals.all).toMatchObject({ bindings: 1, bindingsUndoc: 0, entries: 1 });
  });

  it('yields two gaps for two undocumented overload rows of one function', () => {
    const fn = {
      name: 'createFill',
      file: 'projects/core/utils/fill.ts',
      entryPoint: '@cngx/core/utils',
    };
    const result = scanApiDocCoverage(doc({ miscellaneous: { functions: [fn, { ...fn }] } }));
    expect(keys(result)).toEqual([
      'function createFill.createFill',
      'function createFill.createFill',
    ]);
  });

  it('reports an undocumented token and function', () => {
    const result = scanApiDocCoverage(
      doc({
        tokens: [{ name: 'CNGX_FOO', file: 'projects/core/foo.ts', entryPoint: '@cngx/core' }],
        miscellaneous: {
          functions: [
            { name: 'provideFoo', file: 'projects/core/foo.ts', entryPoint: '@cngx/core' },
          ],
        },
      }),
    );
    expect(keys(result)).toEqual(['token CNGX_FOO.CNGX_FOO', 'function provideFoo.provideFoo']);
  });

  it('totals per lib and per entry point', () => {
    const result = scanApiDocCoverage(
      doc({
        components: [owner({ inputsClass: [{ name: 'a' }, { name: 'b', rawdescription: 'B.' }] })],
      }),
    );
    expect(result.totals.byLib.forms).toMatchObject({ bindings: 2, bindingsUndoc: 1 });
    expect(result.totals.byEntry['@cngx/forms/foo']).toMatchObject({
      bindings: 2,
      bindingsUndoc: 1,
    });
  });
});

describe('api doc coverage (binding field fixtures)', () => {
  const file = (body) => ({
    path: 'projects/forms/foo/foo.component.ts',
    text: `
      @Component({ selector: 'cngx-foo', template: '' })
      export class CngxFoo<T> {
        ${body}
      }
    `,
  });
  const scan = (body) => scanBindingFields([file(body)]);

  it('marks an aliased input under an @internal block as internal', () => {
    expect(
      scan(`
        /**
         * Whether the control is disabled.
         * @internal
         */
        readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
      `),
    ).toEqual([
      {
        file: 'projects/forms/foo/foo.component.ts',
        owner: 'CngxFoo',
        member: 'disabledInput',
        kind: 'input',
        alias: 'disabled',
        internal: true,
      },
    ]);
  });

  it('keeps a documented aliased input without the tag non-internal', () => {
    expect(
      scan(`
        /** Whether the control is disabled. */
        readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
      `),
    ).toMatchObject([{ member: 'disabledInput', alias: 'disabled', internal: false }]);
  });

  it('rejects a non-aliased input under @internal like an aliased one', () => {
    expect(
      scan(`
        /** @internal */
        readonly valueInput = input('');
      `),
    ).toEqual([expect.objectContaining({ member: 'valueInput', kind: 'input', internal: true })]);
    expect(scan(`/** @internal */ readonly valueInput = input('');`)[0]).not.toHaveProperty(
      'alias',
    );
  });

  it('marks an output under @internal as internal', () => {
    expect(
      scan(`
        /** @internal */
        readonly closed = output<void>();
      `),
    ).toMatchObject([{ member: 'closed', kind: 'output', internal: true }]);
  });

  it('reports an aliased model under @internal', () => {
    expect(
      scan(`
        /** @internal */
        protected readonly pageInput = model<number>(0, { alias: 'page' });
      `),
    ).toMatchObject([{ member: 'pageInput', kind: 'model', alias: 'page', internal: true }]);
  });

  it('detects input.required across two lines', () => {
    expect(
      scan(`
        /** The rows. */
        readonly dataInput = input.required<readonly T[]>({
          alias: 'data',
        });
      `),
    ).toMatchObject([{ member: 'dataInput', kind: 'input', alias: 'data', internal: false }]);
  });

  it('walks a function type in the type argument by bracket depth', () => {
    expect(
      scan(`
        /** Equality used to match options. */
        readonly compareWithInput = input<((a: T, b: T) => boolean) | undefined>(undefined, { alias: 'compareWith' });
      `),
    ).toMatchObject([{ member: 'compareWithInput', alias: 'compareWith', internal: false }]);
  });

  it('does not read a JSDoc above an earlier member as the field doc', () => {
    expect(
      scan(`
        /** @internal */
        registerTitle(id: string): void {}
        readonly label = input('');
      `),
    ).toMatchObject([{ member: 'label', internal: false }]);
  });

  it('returns a documented binding field without a row on its public owner', () => {
    const fields = scan(`
      /** Whether the control is disabled. */
      readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
      /** Emits on close. */
      readonly closed = output<void>();
    `);
    const exported = doc({
      components: [
        owner({ outputsClass: [{ name: 'closed', rawdescription: 'Emits on close.' }] }),
      ],
    });
    expect(missingBindingRows(fields, exported)).toMatchObject([{ member: 'disabledInput' }]);
    expect(missingBindingRows(fields, doc())).toEqual([]);
  });

  it('leaves internal fields to the INTERNAL_BINDINGS check', () => {
    const fields = scan(`
      /** @internal */
      readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
    `);
    expect(missingBindingRows(fields, doc({ components: [owner()] }))).toEqual([]);
  });
});
