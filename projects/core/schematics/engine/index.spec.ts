import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as engine from './index';

const PROJECTS = join(__dirname, '..', '..', '..');
const ENGINE = __dirname;

function tsFiles(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || path === ENGINE ? [] : tsFiles(path);
    }
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

const OUTSIDE = readdirSync(PROJECTS, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap((entry) => {
    try {
      return tsFiles(join(PROJECTS, entry.name, 'schematics'));
    } catch {
      return [];
    }
  })
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

describe('engine barrel', () => {
  it.each(Object.keys(engine))(
    'exports %s because code outside the engine reads it',
    (name) => {
      expect(OUTSIDE).toMatch(new RegExp(`\\b${name}\\b`));
    },
  );
});
