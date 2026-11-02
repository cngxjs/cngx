import { describe, expect, it } from 'vitest';

import {
  flattenSelectOptions,
  mergeLocalItems,
  type CngxSelectOptionDef,
  type CngxSelectOptionsInput,
} from './option.model';

const identityCompare = (a: unknown, b: unknown): boolean => Object.is(a, b);

describe('mergeLocalItems', () => {
  it('appends local items after provided ones when nothing overlaps', () => {
    const provided: CngxSelectOptionsInput<string> = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    const local: readonly CngxSelectOptionDef<string>[] = [
      { value: 'c', label: 'C (local)' },
    ];
    const merged = mergeLocalItems(provided, local, identityCompare);
    expect(flattenSelectOptions(merged).map((o) => o.value)).toEqual(['a', 'b', 'c']);
    // The trailing local item retains its label - the merge never mutates.
    expect(flattenSelectOptions(merged)[2].label).toBe('C (local)');
  });

  it('drops local items already present on the server side (compareWith dedup)', () => {
    const provided: CngxSelectOptionsInput<string> = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B-server' },
    ];
    const local: readonly CngxSelectOptionDef<string>[] = [
      { value: 'b', label: 'B-local' }, // server now knows B - drop.
      { value: 'c', label: 'C-local' },
    ];
    const merged = mergeLocalItems(provided, local, identityCompare);
    const flat = flattenSelectOptions(merged);
    expect(flat.map((o) => o.value)).toEqual(['a', 'b', 'c']);
    // The server's "B-server" label survives - not the local override.
    expect(flat.find((o) => o.value === 'b')?.label).toBe('B-server');
  });

  it('honours a custom compareWith when detecting duplicates', () => {
    interface Tag {
      readonly id: number;
      readonly revision: number;
    }
    const provided: CngxSelectOptionsInput<Tag> = [
      { value: { id: 1, revision: 2 }, label: 'Design v2' },
    ];
    const local: readonly CngxSelectOptionDef<Tag>[] = [
      { value: { id: 1, revision: 1 }, label: 'Design v1 (stale local)' },
      { value: { id: 2, revision: 1 }, label: 'New' },
    ];
    const byId = (a: Tag | undefined, b: Tag | undefined): boolean =>
      (a?.id ?? null) === (b?.id ?? null);
    const merged = mergeLocalItems(provided, local, byId);
    // id=1 shows up once (server's revision wins); id=2 is appended.
    const flat = flattenSelectOptions(merged);
    expect(flat.map((o) => o.label)).toEqual(['Design v2', 'New']);
  });

  it('returns the provided reference unchanged when the local buffer is empty', () => {
    const provided: CngxSelectOptionsInput<string> = [{ value: 'a', label: 'A' }];
    const merged = mergeLocalItems(provided, [], identityCompare);
    // Identity stability lets downstream equal-fn short-circuits hold.
    expect(merged).toBe(provided);
  });

  it('preserves group structure - locals append flat after the groups', () => {
    const provided: CngxSelectOptionsInput<string> = [
      {
        label: 'Group',
        children: [
          { value: 'g1', label: 'G1' },
          { value: 'g2', label: 'G2' },
        ],
      },
      { value: 'flat', label: 'Flat' },
    ];
    const local: readonly CngxSelectOptionDef<string>[] = [
      { value: 'g2', label: 'already in group - dropped' },
      { value: 'n', label: 'new' },
    ];
    const merged = mergeLocalItems(provided, local, identityCompare);
    // First two entries keep their original shape.
    expect(merged.length).toBe(3);
    expect('children' in merged[0]).toBe(true);
    // Flat list shows server g1/g2/flat then the new local 'n'.
    expect(flattenSelectOptions(merged).map((o) => o.value)).toEqual([
      'g1',
      'g2',
      'flat',
      'n',
    ]);
  });
});

describe('flattenSelectOptions', () => {
  it('marks the children of a disabled group disabled', () => {
    const input: CngxSelectOptionsInput<string> = [
      {
        label: 'Off',
        disabled: true,
        children: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
        ],
      },
      { label: 'On', children: [{ value: 'c', label: 'C' }] },
      { value: 'd', label: 'D' },
    ];
    const flat = flattenSelectOptions(input);
    expect(flat.map((o) => [o.value, o.disabled === true])).toEqual([
      ['a', true],
      ['b', true],
      ['c', false],
      ['d', false],
    ]);
  });

  it('keeps the child references that need no change', () => {
    const b: CngxSelectOptionDef<string> = { value: 'b', label: 'B', disabled: true };
    const c: CngxSelectOptionDef<string> = { value: 'c', label: 'C' };
    const flat = flattenSelectOptions<string>([
      { label: 'Off', disabled: true, children: [b] },
      { label: 'On', children: [c] },
    ]);
    expect(flat[0]).toBe(b);
    expect(flat[1]).toBe(c);
  });
});
