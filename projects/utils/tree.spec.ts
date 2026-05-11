import { describe, expect, it } from 'vitest';
import {
  type CngxTreeNode,
  collectDescendantValues,
  filterTree,
  flattenTree,
  isNodeVisible,
  sortTree,
  walkTree,
} from './tree';

interface Row {
  readonly id: string;
  readonly name: string;
}

const tree: readonly CngxTreeNode<Row>[] = [
  {
    value: { id: 'a', name: 'Alpha' },
    children: [
      { value: { id: 'a1', name: 'Alpha-1' } },
      {
        value: { id: 'a2', name: 'Alpha-2' },
        children: [{ value: { id: 'a2a', name: 'Alpha-2-a' }, disabled: true }],
      },
    ],
  },
  { value: { id: 'b', name: 'Bravo' } },
];

const idByRow = (v: Row): string => v.id;
const idFn = (v: Row): string => idByRow(v);
const labelFn = (v: Row): string => v.name;

describe('flattenTree', () => {
  it('emits DFS order with depth, parentIds, posinset, setsize', () => {
    const flat = flattenTree(tree, idFn, labelFn);
    expect(flat.map((n) => n.id)).toEqual(['a', 'a1', 'a2', 'a2a', 'b']);

    const [a, a1, a2, a2a, b] = flat;
    expect(a!.depth).toBe(0);
    expect(a!.parentIds).toEqual([]);
    expect(a!.posinset).toBe(1);
    expect(a!.setsize).toBe(2);
    expect(a!.hasChildren).toBe(true);

    expect(a1!.depth).toBe(1);
    expect(a1!.parentIds).toEqual(['a']);
    expect(a1!.posinset).toBe(1);
    expect(a1!.setsize).toBe(2);
    expect(a1!.hasChildren).toBe(false);

    expect(a2!.posinset).toBe(2);
    expect(a2!.hasChildren).toBe(true);

    expect(a2a!.depth).toBe(2);
    expect(a2a!.parentIds).toEqual(['a', 'a2']);
    expect(a2a!.disabled).toBe(true);

    expect(b!.posinset).toBe(2);
    expect(b!.setsize).toBe(2);
  });

  it('falls back to path-based id and String(value) label when fns omitted', () => {
    const primitive: CngxTreeNode<string>[] = [
      { value: 'root', children: [{ value: 'leaf' }] },
    ];
    const flat = flattenTree(primitive);
    expect(flat[0]!.id).toBe('0');
    expect(flat[0]!.label).toBe('root');
    expect(flat[1]!.id).toBe('0.0');
    expect(flat[1]!.label).toBe('leaf');
  });

  it('returns an empty array for an empty forest', () => {
    expect(flattenTree<Row>([], idFn)).toEqual([]);
  });
});

describe('isNodeVisible', () => {
  it('root nodes are always visible', () => {
    const [a] = flattenTree(tree, idFn, labelFn);
    expect(isNodeVisible(a!, new Set())).toBe(true);
  });

  it('descendant is visible iff every ancestor is expanded', () => {
    const flat = flattenTree(tree, idFn, labelFn);
    const a2a = flat.find((n) => n.id === 'a2a')!;
    expect(isNodeVisible(a2a, new Set())).toBe(false);
    expect(isNodeVisible(a2a, new Set(['a']))).toBe(false);
    expect(isNodeVisible(a2a, new Set(['a', 'a2']))).toBe(true);
  });
});

describe('walkTree', () => {
  it('visits every node in DFS with correct depth', () => {
    const seen: Array<[string, number]> = [];
    walkTree(tree, (n, d) => seen.push([n.value.id, d]));
    expect(seen).toEqual([
      ['a', 0],
      ['a1', 1],
      ['a2', 1],
      ['a2a', 2],
      ['b', 0],
    ]);
  });
});

describe('collectDescendantValues', () => {
  it('collects DFS descendants excluding self', () => {
    const ids = collectDescendantValues(tree[0]!).map((v) => v.id);
    expect(ids).toEqual(['a1', 'a2', 'a2a']);
  });

  it('returns empty for a leaf', () => {
    expect(collectDescendantValues(tree[1]!)).toEqual([]);
  });
});

describe('filterTree', () => {
  it('preserves ancestors of matching descendants', () => {
    const result = filterTree(tree, (v) => v.id === 'a2a');
    expect(result).toHaveLength(1);
    expect(result[0]!.value.id).toBe('a');
    expect(result[0]!.children!).toHaveLength(1);
    expect(result[0]!.children![0]!.value.id).toBe('a2');
    expect(result[0]!.children![0]!.children!).toHaveLength(1);
    expect(result[0]!.children![0]!.children![0]!.value.id).toBe('a2a');
  });

  it('drops branches with zero matches', () => {
    const result = filterTree(tree, (v) => v.id === 'b');
    expect(result).toHaveLength(1);
    expect(result[0]!.value.id).toBe('b');
    expect(result[0]!.children).toBeUndefined();
  });

  it('returns empty forest when nothing matches', () => {
    expect(filterTree(tree, () => false)).toEqual([]);
  });
});

describe('sortTree', () => {
  it('sorts each level independently (asc)', () => {
    const unsorted: CngxTreeNode<Row>[] = [
      {
        value: { id: 'z', name: 'Zeta' },
        children: [
          { value: { id: 'z2', name: 'Zeta-2' } },
          { value: { id: 'z1', name: 'Zeta-1' } },
        ],
      },
      { value: { id: 'a', name: 'Alpha' } },
    ];
    const sorted = sortTree(unsorted, (v) => v.name, 'asc');
    expect(sorted.map((n) => n.value.id)).toEqual(['a', 'z']);
    expect(sorted[1]!.children!.map((n) => n.value.id)).toEqual(['z1', 'z2']);
  });

  it('sorts desc', () => {
    const data: CngxTreeNode<Row>[] = [
      { value: { id: 'a', name: 'Alpha' } },
      { value: { id: 'b', name: 'Bravo' } },
    ];
    const sorted = sortTree(data, (v) => v.name, 'desc');
    expect(sorted.map((n) => n.value.id)).toEqual(['b', 'a']);
  });

  it('leaves empty forest unchanged', () => {
    expect(sortTree<Row>([], (v) => v.name)).toEqual([]);
  });
});
