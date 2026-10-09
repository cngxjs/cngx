import { computed, signal } from '@angular/core';
import { SIGNAL, type ReactiveNode } from '@angular/core/primitives/signals';
import { describe, expect, it } from 'vitest';

import { CNGX_DEV_DESCRIPTORS, resolveOverrideProvenance } from './dev-descriptors';
import {
  createDefaultsFill,
  createNestedOverrideMerge,
  createOverrideMerge,
} from './override-merge';

interface Labels {
  readonly open: string | null | undefined;
  readonly close: string | null | undefined;
}

interface StatusLabels {
  readonly title: string;
  readonly status: { readonly busy: string | undefined; readonly idle: string | undefined };
}

const SYMBOL_LABELS: unique symbol = Symbol('labels');

interface SymbolKeyed {
  readonly title: string;
  readonly [SYMBOL_LABELS]: { readonly busy: string };
}

describe('override-merge provenance', () => {
  it('resolves an overridden key as override and the rest as default', () => {
    const merged = createOverrideMerge<Labels>({ open: 'Open', close: 'Close' }, { open: 'Go' });

    expect(resolveOverrideProvenance(merged)).toEqual({ open: 'override', close: 'default' });
  });

  it('resolves a key present as undefined in the overrides as override (spread rule)', () => {
    const merged = createOverrideMerge<Labels>(
      { open: 'Open', close: 'Close' },
      { close: undefined },
    );

    expect(resolveOverrideProvenance(merged)).toEqual({ open: 'default', close: 'override' });
  });

  it('resolves the nested record of a nested merge key by key', () => {
    const merged = createNestedOverrideMerge<StatusLabels, 'status'>(
      { title: 'Status', status: { busy: 'Busy', idle: 'Idle' } },
      { title: 'State', status: { idle: 'Waiting' } },
      'status',
    );

    expect(resolveOverrideProvenance(merged)).toEqual({
      title: 'override',
      status: { busy: 'default', idle: 'override' },
    });
  });

  it('resolves a defaults fill: filled from undefined and null, else the inner merge source', () => {
    const defaults: Labels = { open: 'Open', close: 'Close' };
    const fromUndefined = createDefaultsFill(
      createOverrideMerge<Labels>(defaults, { open: undefined }),
      defaults,
    );
    const fromNull = createDefaultsFill(
      createOverrideMerge<Labels>(defaults, { open: null, close: 'Shut' }),
      defaults,
    );

    expect(resolveOverrideProvenance(fromUndefined)).toEqual({ open: 'filled', close: 'default' });
    expect(resolveOverrideProvenance(fromNull)).toEqual({ open: 'filled', close: 'override' });
  });

  it('resolves filled over a nullish default, since the fill writes the default value', () => {
    const defaults: Labels = { open: null, close: 'Close' };
    const filled = createDefaultsFill(
      createOverrideMerge<Labels>(defaults, { open: undefined }),
      defaults,
    );

    expect(filled().open).toBeNull();
    expect(resolveOverrideProvenance(filled)).toEqual({ open: 'filled', close: 'default' });
  });

  it('resolves a nested defaults fill key by key, chaining to the nested merge', () => {
    const defaults: StatusLabels = { title: 'Status', status: { busy: 'Busy', idle: 'Idle' } };
    const inner = createNestedOverrideMerge<StatusLabels, 'status'>(
      defaults,
      { status: { busy: undefined, idle: 'Waiting' } },
      'status',
    );
    const filled = createDefaultsFill<StatusLabels, 'status'>(inner, defaults, 'status');

    expect(resolveOverrideProvenance(filled)).toEqual({
      title: 'default',
      status: { busy: 'filled', idle: 'override' },
    });
  });

  it('lists no entry for a symbol key on a nested merge or fill', () => {
    const defaults: SymbolKeyed = { title: 'Status', [SYMBOL_LABELS]: { busy: 'Busy' } };
    const merged = createNestedOverrideMerge<SymbolKeyed, typeof SYMBOL_LABELS>(
      defaults,
      { title: 'State' },
      SYMBOL_LABELS,
    );
    const filled = createDefaultsFill<SymbolKeyed, typeof SYMBOL_LABELS>(
      merged,
      defaults,
      SYMBOL_LABELS,
    );

    for (const provenance of [
      resolveOverrideProvenance(merged),
      resolveOverrideProvenance(filled),
    ]) {
      expect(provenance).toEqual({ title: expect.any(String) });
      expect(Object.getOwnPropertySymbols(provenance)).toEqual([]);
    }
  });

  it('keeps the inner merge descriptor intact after a fill is created over it', () => {
    const defaults: Labels = { open: 'Open', close: 'Close' };
    const inner = createOverrideMerge<Labels>(defaults, { open: undefined });
    const before = CNGX_DEV_DESCRIPTORS.read(inner);

    const filled = createDefaultsFill(inner, defaults);

    expect(CNGX_DEV_DESCRIPTORS.read(inner)).toBe(before);
    expect(CNGX_DEV_DESCRIPTORS.read(inner)?.kind).toBe('cngx-dev:override-merge');
    expect(CNGX_DEV_DESCRIPTORS.read(filled)?.kind).toBe('cngx-dev:defaults-fill');
  });

  it('follows the current value of a Signal overrides side', () => {
    const overrides = signal<Partial<Labels>>({});
    const merged = createOverrideMerge<Labels>({ open: 'Open', close: 'Close' }, overrides);

    expect(resolveOverrideProvenance(merged)).toEqual({ open: 'default', close: 'default' });

    overrides.set({ close: 'Shut' });
    expect(resolveOverrideProvenance(merged)).toEqual({ open: 'default', close: 'override' });
  });

  it('still resolves through a memoized cache hit', () => {
    const defaults: Labels = { open: 'Open', close: 'Close' };
    const overrides: Partial<Labels> = { open: 'Go' };

    const first = createOverrideMerge(defaults, overrides);
    const second = createOverrideMerge(defaults, overrides);

    expect(second).toBe(first);
    expect(resolveOverrideProvenance(second)).toEqual({ open: 'override', close: 'default' });
  });

  it('resolves undefined instead of throwing when a side cannot be read', () => {
    const overrides = computed<Partial<Labels>>(() => {
      throw new Error('NG0950: input is required but no value is available yet');
    });
    const merged = createOverrideMerge<Labels>({ open: 'Open', close: 'Close' }, overrides);

    expect(() => resolveOverrideProvenance(merged)).not.toThrow();
    expect(resolveOverrideProvenance(merged)).toBeUndefined();
  });

  it('resolves undefined for a signal no merge created', () => {
    expect(resolveOverrideProvenance(signal({ open: 'Open' }))).toBeUndefined();
  });

  it('does not subscribe a calling computed to the merge it resolves', () => {
    const overrides = signal<Partial<Labels>>({});
    const merged = createOverrideMerge<Labels>({ open: 'Open', close: 'Close' }, overrides);
    let runs = 0;
    const panel = computed(() => {
      runs++;
      return resolveOverrideProvenance(merged);
    });

    panel();
    overrides.set({ open: 'Go' });
    panel();

    expect(runs).toBe(1);
  });

  it('names both shapes of the defaults fill for the signal graph', () => {
    const defaults: StatusLabels = { title: 'Status', status: { busy: 'Busy', idle: 'Idle' } };
    const flat = createDefaultsFill(createOverrideMerge<StatusLabels>(defaults, {}), defaults);
    const nested = createDefaultsFill<StatusLabels, 'status'>(
      createNestedOverrideMerge<StatusLabels, 'status'>(defaults, {}, 'status'),
      defaults,
      'status',
    );
    const nameOf = (s: object): string | undefined =>
      (s as unknown as Record<symbol, ReactiveNode>)[SIGNAL].debugName;

    expect(nameOf(flat)).toBe('defaultsFill.filled');
    expect(nameOf(nested)).toBe('defaultsFill.filled');
  });
});
