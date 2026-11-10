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
    it(`${kind.name}: ArrowDown + Enter inside the window act on the typed filter`, () => {
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

// Blue sits between Red and Green so a key that overtakes the deferred first
// key (moving on the stale rows) lands on a different row than the ordered run.
const ORDERED_OPTIONS = [
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'grey', label: 'Grey' },
];

describe('later keys inside the debounce window run behind the deferred first key', () => {
  for (const key of INPUT_KEYS) {
    const kind = KINDS[key];

    function typeGr(m: ReturnType<typeof mount>): HTMLInputElement {
      m.open();
      const input = m.el.querySelector<HTMLInputElement>('input');
      if (!input) {
        expect.fail(`no input for ${kind.name}`);
      }
      input!.value = 'gr';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      m.settle();
      return input!;
    }

    it(`${kind.name}: two ArrowDowns without a render between them reach the second filtered row`, () => {
      vi.useFakeTimers();
      const m = mount(kind, {
        options: ORDERED_OPTIONS,
        providers: [provideSelectConfig(withSearchDebounce(300))],
      });
      const input = typeGr(m);
      // No settle between the keys: a render would run the first deferred key.
      keydown(input, 'ArrowDown');
      keydown(input, 'ArrowDown');
      m.settle();
      expect(activeLabel(m, input), `${kind.name} active option`).toBe('Grey');
    });

    it(`${kind.name}: Escape after a deferred key leaves no highlight on the closed panel`, () => {
      vi.useFakeTimers();
      const m = mount(kind, {
        options: ORDERED_OPTIONS,
        providers: [provideSelectConfig(withSearchDebounce(300))],
      });
      const input = typeGr(m);
      keydown(input, 'ArrowDown');
      keydown(input, 'Escape');
      m.settle();
      expect(m.v.panelOpen(), `${kind.name} closed`).toBe(false);
      expect(input.getAttribute('aria-activedescendant'), `${kind.name} no highlight`).toBeNull();
    });
  }
});

describe('a blur inside the debounce window does not open the panel once the term settles', () => {
  for (const key of ['combobox', 'typeahead'] as const) {
    const kind = KINDS[key];
    it(`${kind.name}: the settled term after a blur leaves the panel closed`, () => {
      vi.useFakeTimers();
      const m = mount(kind, { providers: [provideSelectConfig(withSearchDebounce(300))] });
      const input = m.el.querySelector<HTMLInputElement>('input');
      if (!input) {
        expect.fail(`no input for ${kind.name}`);
      }
      input!.focus();
      m.settle();
      input!.value = 'gr';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
      m.settle();
      expect(m.v.panelOpen(), `${kind.name} closed while typing`).toBe(false);

      // Still inside the debounce window: focus leaves the control.
      input!.blur();
      m.settle();
      vi.advanceTimersByTime(400);
      m.settle();
      expect(m.v.panelOpen(), `${kind.name} closed after the term settled`).toBe(false);
    });
  }
});
