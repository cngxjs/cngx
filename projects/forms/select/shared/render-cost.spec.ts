import { afterEach, describe, expect, it, vi } from 'vitest';

import { KINDS, cleanupRoots, mount } from './__test-helpers/review-probe-host';
import { provideSelectConfig, withVirtualization } from './config';

afterEach(() => {
  cleanupRoots();
  vi.restoreAllMocks();
});

const flat = (n: number): { value: string; label: string }[] =>
  Array.from({ length: n }, (_, i) => ({ value: `v${i}`, label: `Opt ${i}` }));

const grouped = (groups: number, per: number): { label: string; children: { value: string; label: string }[] }[] =>
  Array.from({ length: groups }, (_, g) => ({
    label: `Group ${g}`,
    children: Array.from({ length: per }, (_, i) => ({ value: `v${g}-${i}`, label: `Opt ${g}-${i}` })),
  }));

const BIG = flat(2000);
const MID = flat(1000);

// ── H5 / OD5: a closed panel renders no option nodes and mounts cheaply. ─────
describe('H5: a large closed panel renders no option nodes', () => {
  for (const key of ['select', 'multi', 'combobox'] as const) {
    it.fails(`${KINDS[key].name}: zero role=option nodes while the panel is closed`, () => {
      const m = mount(KINDS[key], { options: BIG });
      expect(m.v.panelOpen()).toBe(false);
      expect(m.el.querySelectorAll('[role="option"]').length).toBe(0);
    });
  }

  it.fails('CngxSelect: mounts 2000 options under a 300 ms budget', () => {
    const start = performance.now();
    mount(KINDS['select'], { options: BIG });
    expect(performance.now() - start).toBeLessThan(300);
  });
});

// ── H5 / OD5: a large open panel auto-virtualises instead of rendering all. ──
describe('OD5: a large open panel renders a bounded row count without explicit virtualization', () => {
  it.fails('CngxSelect: 1000 options open render far fewer than 1000 rows', () => {
    const m = mount(KINDS['select'], { options: MID });
    m.open();
    expect(m.rows().length).toBeLessThanOrEqual(100);
  });
});

// ── A3: grouped options under virtualization fall back and warn CNGX2028. ────
describe('A3: grouped options with virtualization render no spacer and warn once', () => {
  it.fails('CngxSelect: no virtual spacer and a single CNGX2028 dev warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const m = mount(KINDS['select'], {
      options: grouped(20, 50),
      providers: [provideSelectConfig(withVirtualization({}))],
    });
    m.open();
    expect(m.el.querySelector('.cngx-select__virtual-spacer')).toBeNull();
    const coded = warn.mock.calls.filter((c) => String(c[0]).includes('CNGX2028'));
    expect(coded.length).toBe(1);
  });
});
