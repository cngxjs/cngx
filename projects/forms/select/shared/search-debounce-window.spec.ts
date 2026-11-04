import { afterEach, describe, expect, it, vi } from 'vitest';

import { provideSelectConfig, withSearchDebounce } from './config';
import { KINDS, type Kind, cleanupRoots, mount } from './__test-helpers/review-probe-host';

// project-sibling-search-stale-filter (verify first): type `gr`, then
// ArrowDown + Enter while the 300 ms debounce is still pending. The host must
// settle the typed term before it navigates, so the highlighted and picked
// option match the filter (`green`), not the stale unfiltered first row.

afterEach(() => {
  cleanupRoots();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const INPUT_KEYS = ['combobox', 'typeahead', 'actionSelect', 'actionMulti'] as const;

function keydown(input: HTMLElement, key: string): void {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function activeLabel(m: ReturnType<typeof mount>, input: HTMLElement): string | null {
  const id = input.getAttribute('aria-activedescendant');
  if (!id) {
    return null;
  }
  const active = document.getElementById(id);
  return active?.textContent?.trim() ?? null;
}

function pickedGreen(m: ReturnType<typeof mount>, kind: Kind): boolean {
  const model = m.readModel();
  if (kind.model === 'value') {
    return model === 'green';
  }
  return Array.isArray(model) && model.includes('green');
}

describe('search debounce window keeps the filter in step with the keys', () => {
  for (const key of INPUT_KEYS) {
    const kind = KINDS[key];
    it.fails(`${kind.name}: ArrowDown + Enter inside the window act on the typed filter`, () => {
      vi.useFakeTimers();
      const m = mount(kind, { providers: [provideSelectConfig(withSearchDebounce(300))] });
      m.open();
      const input = m.el.querySelector<HTMLInputElement>('input');
      if (!input) {
        expect.fail(`no input for ${kind.name}`);
      }
      input!.value = 'gr';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      m.settle();

      // Still inside the debounce window - the timer has not fired.
      keydown(input!, 'ArrowDown');
      m.settle();
      expect(activeLabel(m, input!), `${kind.name} active option`).toBe('Green');

      keydown(input!, 'Enter');
      m.settle();
      expect(pickedGreen(m, kind), `${kind.name} picked green`).toBe(true);
    });
  }
});
