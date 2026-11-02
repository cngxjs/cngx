/**
 * Every `CNGX_SELECT_DEFAULTS` key is honoured by every select-family
 * composite, or the composite lists it as not applicable with a reason.
 *
 * A composite "reads" a key when `config.<key>` (or `config().<key>`)
 * appears in its own `.component.ts` / `.component.html` or in any file it
 * reaches through relative imports inside `projects/forms/select` (the
 * select core, the panel shell, the template registry). Comments are
 * blanked first, so JSDoc that only mentions a key does not count.
 *
 * NOT_APPLICABLE is the explicit exemption table. A row whose key the
 * composite's own files do read is stale and fails, so the table only
 * ever holds keys the composite really ignores.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SELECT = join(ROOT, 'projects/forms/select');

const COMPOSITES = {
  CngxSelect: 'single-select/select',
  CngxMultiSelect: 'multi-select/multi-select',
  CngxCombobox: 'combobox/combobox',
  CngxTypeahead: 'typeahead/typeahead',
  CngxTreeSelect: 'tree-select/tree-select',
  CngxReorderableMultiSelect: 'reorderable-multi-select/reorderable-multi-select',
  CngxActionSelect: 'action-select/action-select',
  CngxActionMultiSelect: 'action-multi-select/action-multi-select',
  CngxSelectShell: 'select-shell/select-shell',
};

const BUTTON_TRIGGER = 'button trigger: no text input carries inputmode or enterkeyhint';
const SCALAR = 'scalar value: no chip strip';
const NO_SEARCH = 'no search input: nothing to match against';
const INPUT_OWNS_TYPING =
  'the text input owns typing, so there is no closed-trigger typeahead to toggle';
const ACTION_PLACEMENT =
  'placement comes from CNGX_ACTION_SELECT_CONFIG.popoverPlacement (withActionPopoverPlacement)';

const NOT_APPLICABLE = {
  CngxSelect: {
    inputMode: BUTTON_TRIGGER,
    enterKeyHint: BUTTON_TRIGGER,
    chipOverflow: SCALAR,
    maxVisibleChips: SCALAR,
    searchMatchFn: NO_SEARCH,
  },
  CngxMultiSelect: {
    inputMode: BUTTON_TRIGGER,
    enterKeyHint: BUTTON_TRIGGER,
    searchMatchFn: NO_SEARCH,
  },
  CngxCombobox: {
    typeaheadWhileClosed: INPUT_OWNS_TYPING,
  },
  CngxTypeahead: {
    chipOverflow: SCALAR,
    maxVisibleChips: SCALAR,
    typeaheadWhileClosed: INPUT_OWNS_TYPING,
  },
  CngxTreeSelect: {
    inputMode: BUTTON_TRIGGER,
    enterKeyHint: BUTTON_TRIGGER,
    chipOverflow: 'fixed one-line count cap (accepted-debt section 19)',
    virtualization: 'tree virtualization deferred (accepted-debt section 4)',
    typeaheadDebounceInterval:
      'the tree typeahead runs inside CngxActiveDescendant on the open panel; no closed-trigger buffer',
    typeaheadWhileClosed: 'no closed-trigger typeahead; [expandToReveal] covers the open panel',
    searchMatchFn: NO_SEARCH,
    showSelectionIndicator: 'the tree panel always renders its checkbox (accepted-debt section 7)',
    selectionIndicatorVariant: 'the tree panel ignores the variant (accepted-debt section 7)',
  },
  CngxReorderableMultiSelect: {
    inputMode: BUTTON_TRIGGER,
    enterKeyHint: BUTTON_TRIGGER,
    maxVisibleChips: "'truncate' renders as 'scroll-x', so there is no cap (accepted-debt section 19)",
    searchMatchFn: NO_SEARCH,
  },
  CngxActionSelect: {
    popoverPlacement: ACTION_PLACEMENT,
    chipOverflow: SCALAR,
    maxVisibleChips: SCALAR,
    typeaheadWhileClosed: INPUT_OWNS_TYPING,
  },
  CngxActionMultiSelect: {
    popoverPlacement: ACTION_PLACEMENT,
    typeaheadWhileClosed: INPUT_OWNS_TYPING,
  },
  CngxSelectShell: {
    inputMode: 'the projected <cngx-select-search> owns its input attributes',
    enterKeyHint: 'the projected <cngx-select-search> owns its input attributes',
    chipOverflow: SCALAR,
    maxVisibleChips: SCALAR,
  },
};

/** Source with line and block comments blanked. */
const withoutComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function defaultKeys() {
  const src = readFileSync(join(SELECT, 'shared/config.ts'), 'utf8');
  const start = src.indexOf('export const CNGX_SELECT_DEFAULTS');
  const body = src.slice(src.indexOf('= {', start) + 3);
  const keys = [];
  let depth = 0;
  for (const line of body.split('\n')) {
    const match = depth === 0 ? line.match(/^ {2}(\w+):/) : null;
    if (match) {
      keys.push(match[1]);
    }
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    if (depth < 0) {
      break;
    }
  }
  return keys;
}

function importClosure(entry) {
  const seen = new Set();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file) || !existsSync(file)) {
      continue;
    }
    seen.add(file);
    const html = file.replace(/\.ts$/, '.html');
    if (existsSync(html)) {
      seen.add(html);
    }
    for (const match of readFileSync(file, 'utf8').matchAll(/from\s+'(\.[^']+)'/g)) {
      const base = resolve(dirname(file), match[1]);
      const target = [`${base}.ts`, join(base, 'index.ts')].find((p) => existsSync(p));
      if (target) {
        stack.push(target);
      }
    }
  }
  return [...seen].filter((file) => !file.endsWith('.spec.ts'));
}

const readsKey = (src, key) => new RegExp(`config(\\(\\))?\\??\\.${key}\\b`).test(src);

const source = (files) => files.map((file) => withoutComments(readFileSync(file, 'utf8'))).join('\n');

describe('select config reader matrix', () => {
  const keys = defaultKeys();

  it('finds the CNGX_SELECT_DEFAULTS keys', () => {
    expect(keys).toContain('openOn');
    expect(keys).toContain('typeaheadDebounceInterval');
    expect(keys.length).toBeGreaterThan(20);
  });

  it.each(Object.entries(COMPOSITES))('%s reads every key or exempts it', (name, path) => {
    const entry = join(SELECT, `${path}.component.ts`);
    const all = source(importClosure(entry));
    const exempt = NOT_APPLICABLE[name] ?? {};
    const unread = keys.filter((key) => !(key in exempt) && !readsKey(all, key));
    expect(unread, `${relative(ROOT, entry)}: read the key or add a NOT_APPLICABLE row`).toEqual([]);
  });

  it.each(Object.entries(NOT_APPLICABLE))('%s exempts only keys it does not read', (name, rows) => {
    const path = COMPOSITES[name];
    expect(path).toBeDefined();
    const own = source(
      [`${path}.component.ts`, `${path}.component.html`]
        .map((file) => join(SELECT, file))
        .filter((file) => existsSync(file)),
    );
    for (const [key, reason] of Object.entries(rows)) {
      expect(keys, `${name}.${key} is not a CNGX_SELECT_DEFAULTS key`).toContain(key);
      expect(reason.length).toBeGreaterThan(0);
      expect(readsKey(own, key), `${name} reads ${key}: drop the NOT_APPLICABLE row`).toBe(false);
    }
  });
});
