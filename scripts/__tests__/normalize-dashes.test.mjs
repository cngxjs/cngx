import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { normalizeDashes } from '../normalize-dashes.mjs';

const EM = '\u2014';
const EN = '\u2013';

describe('normalizeDashes', () => {
  it('turns an em or en dash into a spaced hyphen', () => {
    expect(normalizeDashes(`gap${EM}between`)).toBe('gap - between');
    expect(normalizeDashes(`gap ${EN} between`)).toBe('gap - between');
  });

  it('collapses the whitespace around a dash, line breaks included', () => {
    expect(normalizeDashes(`gap  ${EM}\n  between`)).toBe('gap - between');
  });

  it('replaces every dash and leaves a plain hyphen alone', () => {
    expect(normalizeDashes(`a ${EM} b ${EN} c - d`)).toBe('a - b - c - d');
  });
});

const PROJECTS = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'projects');

function walkStyles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkStyles(full));
    } else if (/\.s?css$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('stylesheets under projects/', () => {
  it('carry no em dash, comments included', () => {
    const offenders = walkStyles(PROJECTS)
      .filter((full) => readFileSync(full, 'utf8').includes(EM))
      .map((full) => relative(PROJECTS, full).replaceAll('\\', '/'));
    expect(offenders).toEqual([]);
  });
});
