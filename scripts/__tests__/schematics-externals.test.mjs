import { describe, expect, it } from 'vitest';

import { EXTERNAL, externalRequireViolations } from '../schematics-externals.mjs';

const bundle = (...specifiers) => specifiers.map((specifier) => `var x=require("${specifier}");`).join('');

describe('externalRequireViolations', () => {
  it('accepts Node builtins with and without the node: prefix', () => {
    expect(externalRequireViolations(bundle('crypto', 'os', 'node:fs', 'node:path', 'node:child_process'))).toEqual([]);
  });

  it('accepts every declared external, including a deep path of a /* entry', () => {
    expect(
      externalRequireViolations(
        bundle('typescript', '@angular/compiler', '@schematics/angular', '@schematics/angular/utility', '@angular-devkit/schematics', '@angular-devkit/core'),
      ),
    ).toEqual([]);
  });

  it('accepts relative requires', () => {
    expect(externalRequireViolations(bundle('./chunk.js', '../shared/index.js'))).toEqual([]);
  });

  it('names the vendored TypeScript of @schematics/angular even though @schematics/angular/* is external', () => {
    const vendored = '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';

    expect(EXTERNAL).toContain('@schematics/angular/*');
    expect(externalRequireViolations(bundle('typescript', vendored))).toEqual([vendored]);
  });

  it('names a package that is neither bundled nor declared external', () => {
    expect(externalRequireViolations(bundle('picocolors', '@angular/core', 'typescript'))).toEqual(['picocolors', '@angular/core']);
  });

  it('ignores identifiers that only end in require', () => {
    expect(externalRequireViolations('var x=__require("picocolors");')).toEqual([]);
  });
});
