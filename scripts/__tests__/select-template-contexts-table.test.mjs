/**
 * The key/context/slot table in the `CngxSelectTemplateContexts` JSDoc
 * (`projects/forms/select/shared/config.ts`) is hand-written. The type itself
 * is derived from `CngxSelectConfig['templates']`, the table is not, so this
 * guard holds it in step: one row per `templates` key in declaration order,
 * the context cell naming the key's `TemplateRef<C>` context (`void` maps to
 * `Record<string, never>`, as the type does), and the slot cell naming the
 * `*slot` the key's own JSDoc names, which a `ng-template[slot]` selector in
 * `projects/forms/select` must declare.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SELECT = join(ROOT, 'projects/forms/select');
const CONFIG = readFileSync(join(SELECT, 'shared/config.ts'), 'utf8');

/** `templates` keys of `CngxSelectConfig` with their context and JSDoc slot. */
function configTemplateKeys() {
  const start = CONFIG.indexOf('  readonly templates?: {');
  expect(start, 'CngxSelectConfig.templates not found').toBeGreaterThan(-1);
  const end = CONFIG.indexOf('\n  };', start);
  const body = CONFIG.slice(start, end);
  const keys = [];
  const pattern = /\/\*\*([\s\S]*?)\*\/\s*readonly (\w+)\?: TemplateRef<([\w<>, ]+)> \| null;/g;
  for (const [, doc, key, context] of body.matchAll(pattern)) {
    keys.push({
      key,
      context: context === 'void' ? 'Record<string, never>' : context,
      slot: doc.match(/`\*(\w+)`/)?.[1] ?? null,
    });
  }
  return keys;
}

/** Rows of the table in the `CngxSelectTemplateContexts` JSDoc. */
function tableRows() {
  const typeAt = CONFIG.indexOf('export type CngxSelectTemplateContexts');
  expect(typeAt, 'CngxSelectTemplateContexts not found').toBeGreaterThan(-1);
  const docStart = CONFIG.lastIndexOf('/**', typeAt);
  const doc = CONFIG.slice(docStart, typeAt);
  const rows = [];
  for (const line of doc.split('\n')) {
    const match = line.match(/^ \* \| `(\w+)` \| `([^`]+)` \| `\*(\w+)`/);
    if (match) {
      rows.push({ key: match[1], context: match[2], slot: match[3] });
    }
  }
  return rows;
}

function declaredSlots() {
  const slots = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
        for (const [, slot] of readFileSync(path, 'utf8').matchAll(
          /selector: 'ng-template\[(\w+)\]'/g,
        )) {
          slots.add(slot);
        }
      }
    }
  };
  walk(SELECT);
  return slots;
}

describe('select template contexts table', () => {
  const keys = configTemplateKeys();
  const rows = tableRows();

  it('finds the templates keys and the table rows', () => {
    expect(keys.length).toBeGreaterThan(15);
    expect(rows.length).toBeGreaterThan(15);
  });

  it('has one row per CngxSelectConfig.templates key, in declaration order', () => {
    expect(rows.map((row) => row.key)).toEqual(keys.map((entry) => entry.key));
  });

  it('names the context type of each key', () => {
    const byKey = new Map(rows.map((row) => [row.key, row]));
    for (const { key, context } of keys) {
      expect(byKey.get(key)?.context, `table row ${key}`).toBe(context);
    }
  });

  it('names the slot the key documents, and the slot exists', () => {
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const slots = declaredSlots();
    for (const { key, slot } of keys) {
      expect(slot, `CngxSelectConfig.templates.${key} JSDoc names no *slot`).not.toBeNull();
      expect(byKey.get(key)?.slot, `table row ${key}`).toBe(slot);
      expect(slots.has(slot), `no ng-template[${slot}] selector in forms/select`).toBe(true);
    }
  });
});
