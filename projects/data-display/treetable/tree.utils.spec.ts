import { describe, expect, it } from 'vitest';
import type { FlatNode, Node } from './models';
import {
  capitalise,
  extractColumns,
  filterTree,
  flattenTree,
  getInitialExpandedIds,
  isNodeVisible,
  nodeMatchesSearch,
  sortTree,
} from './tree.utils';

function makeFlat(
  id: string,
  depth: number,
  hasChildren: boolean,
  parentIds: readonly string[],
): FlatNode<Record<string, never>> {
  return {
    id,
    value: {},
    label: '',
    depth,
    parentIds,
    hasChildren,
    disabled: false,
    posinset: 1,
    setsize: 1,
    node: { value: {} },
  };
}

describe('flattenTree', () => {
  it('flattens a single leaf node', () => {
    const tree: Node<{ name: string }> = { value: { name: 'root' } };
    const result = flattenTree(tree);
    expect(result).toHaveLength(1);
    expect(result[0].value.name).toBe('root');
    expect(result[0].depth).toBe(0);
    expect(result[0].hasChildren).toBe(false);
    expect(result[0].parentIds).toEqual([]);
  });

  it('assigns depth correctly for nested nodes', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [
        {
          value: { name: 'child' },
          children: [{ value: { name: 'grandchild' } }],
        },
      ],
    };
    const [root, child, grandchild] = flattenTree(tree);
    expect(root.depth).toBe(0);
    expect(child.depth).toBe(1);
    expect(grandchild.depth).toBe(2);
  });

  it('sets parentIds as ancestor chain', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [{ value: { name: 'child' } }],
    };
    const [root, child] = flattenTree(tree);
    expect(child.parentIds).toEqual([root.id]);
  });

  it('sets parentIds for deeply nested node', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [
        {
          value: { name: 'child' },
          children: [{ value: { name: 'grandchild' } }],
        },
      ],
    };
    const [root, child, grandchild] = flattenTree(tree);
    expect(grandchild.parentIds).toEqual([root.id, child.id]);
  });

  it('handles an array of root nodes', () => {
    const trees: Node<{ name: string }>[] = [{ value: { name: 'a' } }, { value: { name: 'b' } }];
    const result = flattenTree(trees);
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.depth === 0)).toBe(true);
    expect(result.every((n) => n.parentIds.length === 0)).toBe(true);
  });

  it('marks nodes with children correctly', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [{ value: { name: 'child' } }],
    };
    const [root, child] = flattenTree(tree);
    expect(root.hasChildren).toBe(true);
    expect(child.hasChildren).toBe(false);
  });

  it('assigns unique ids to all nodes', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [{ value: { name: 'a' } }, { value: { name: 'b' } }],
    };
    const ids = flattenTree(tree).map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('flattens siblings in order', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [{ value: { name: 'first' } }, { value: { name: 'second' } }],
    };
    const result = flattenTree(tree);
    expect(result[1].value.name).toBe('first');
    expect(result[2].value.name).toBe('second');
  });

  it('joins default ids with "-" per path level', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [
        {
          value: { name: 'child' },
          children: [{ value: { name: 'grandchild' } }, { value: { name: 'grandchild2' } }],
        },
      ],
    };
    const ids = flattenTree(tree).map((n) => n.id);
    expect(ids).toEqual(['0', '0-0', '0-0-0', '0-0-1']);
  });

  it('passes the custom nodeId function through to the kernel', () => {
    const tree: Node<{ key: string }> = {
      value: { key: 'r' },
      children: [{ value: { key: 'c' } }],
    };
    const result = flattenTree(tree, (node, path) => `${node.key}@${path.join('/')}`);
    expect(result.map((n) => n.id)).toEqual(['r@0', 'c@0/0']);
  });

  it('assigns posinset/setsize across a forest of roots', () => {
    const trees: Node<{ name: string }>[] = [
      { value: { name: 'a' } },
      { value: { name: 'b' } },
      { value: { name: 'c' } },
    ];
    const result = flattenTree(trees);
    expect(result.map((n) => n.posinset)).toEqual([1, 2, 3]);
    expect(result.every((n) => n.setsize === 3)).toBe(true);
  });

  it('assigns posinset/setsize per sibling level in a nested tree', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [
        { value: { name: 'first' }, children: [{ value: { name: 'only' } }] },
        { value: { name: 'second' } },
      ],
    };
    const [root, first, only, second] = flattenTree(tree);
    expect([root.posinset, root.setsize]).toEqual([1, 1]);
    expect([first.posinset, first.setsize]).toEqual([1, 2]);
    expect([second.posinset, second.setsize]).toEqual([2, 2]);
    expect([only.posinset, only.setsize]).toEqual([1, 1]);
  });

  it('fixes the label to an empty string (the treetable never consumes labels)', () => {
    const tree: Node<{ name: string }> = {
      value: { name: 'root' },
      children: [{ value: { name: 'child' } }],
    };
    expect(flattenTree(tree).every((n) => n.label === '')).toBe(true);
  });
});

describe('extractColumns', () => {
  it('extracts keys with primitive values', () => {
    const tree: Node<{ name: string; age: number; meta: object }> = {
      value: { name: 'x', age: 1, meta: {} },
    };
    expect(extractColumns(tree)).toEqual(['name', 'age']);
  });

  it('includes null values as primitive', () => {
    const tree: Node<{ name: string; ref: null }> = {
      value: { name: 'x', ref: null },
    };
    expect(extractColumns(tree)).toContain('ref');
  });

  it('uses customColumnOrder when provided', () => {
    const tree: Node<{ name: string; age: number }> = { value: { name: 'x', age: 1 } };
    expect(extractColumns(tree, { customColumnOrder: ['age', 'name'] })).toEqual(['age', 'name']);
  });

  it('works with array input using first node', () => {
    const trees: Node<{ name: string }>[] = [{ value: { name: 'a' } }, { value: { name: 'b' } }];
    expect(extractColumns(trees)).toEqual(['name']);
  });
});

describe('isNodeVisible', () => {
  it('root nodes are always visible (no parentIds)', () => {
    const node = makeFlat('1', 0, false, []);
    expect(isNodeVisible(node, new Set())).toBe(true);
  });

  it('child is visible only when parent is in expandedIds', () => {
    const node = makeFlat('2', 1, false, ['p1']);
    expect(isNodeVisible(node, new Set(['p1']))).toBe(true);
    expect(isNodeVisible(node, new Set())).toBe(false);
  });

  it('deeply nested node requires all ancestors to be expanded', () => {
    const node = makeFlat('3', 2, false, ['p1', 'p2']);
    expect(isNodeVisible(node, new Set(['p1', 'p2']))).toBe(true);
    expect(isNodeVisible(node, new Set(['p1']))).toBe(false);
    expect(isNodeVisible(node, new Set(['p2']))).toBe(false);
  });
});

describe('getInitialExpandedIds', () => {
  it('contains ids of all nodes that have children', () => {
    const nodes = [makeFlat('a', 0, true, []), makeFlat('b', 1, false, ['a'])];
    const ids = getInitialExpandedIds(nodes);
    expect(ids.has('a')).toBe(true);
    expect(ids.has('b')).toBe(false);
  });

  it('returns empty set for flat list', () => {
    const nodes = [makeFlat('a', 0, false, []), makeFlat('b', 0, false, [])];
    expect(getInitialExpandedIds(nodes).size).toBe(0);
  });
});

describe('capitalise', () => {
  it('uppercases first character', () => {
    expect(capitalise('firstName')).toBe('FirstName');
  });

  it('leaves already-uppercase string unchanged', () => {
    expect(capitalise('Name')).toBe('Name');
  });

  it('handles empty string', () => {
    expect(capitalise('')).toBe('');
  });
});

describe('filterTree', () => {
  const tree: Node<{ name: string; active: boolean }>[] = [
    {
      value: { name: 'parent', active: true },
      children: [
        { value: { name: 'match', active: false } },
        { value: { name: 'other', active: false } },
      ],
    },
    { value: { name: 'unrelated', active: false } },
  ];

  it('keeps nodes that match the predicate', () => {
    const result = filterTree(tree, (v) => v.name === 'match');
    expect(result).toHaveLength(1);
    expect(result[0].value.name).toBe('parent');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children![0].value.name).toBe('match');
  });

  it('removes parent when no descendants match', () => {
    const result = filterTree(tree, (v) => v.name === 'nonexistent');
    expect(result).toHaveLength(0);
  });

  it('keeps parent when it directly matches even if children do not', () => {
    const result = filterTree(tree, (v) => v.name === 'parent');
    expect(result).toHaveLength(1);
    // Kernel normalization: an emptied children array becomes `undefined`
    // (never `[]`) - both shapes mean "leaf".
    expect(result[0].children).toBeUndefined();
  });

  it('returns empty array for empty input', () => {
    expect(filterTree([], () => true)).toEqual([]);
  });
});

describe('sortTree', () => {
  const tree: Node<{ name: string }>[] = [
    {
      value: { name: 'banana' },
      children: [{ value: { name: 'cherry' } }, { value: { name: 'apple' } }],
    },
    { value: { name: 'avocado' } },
  ];

  it('sorts root nodes ascending', () => {
    const result = sortTree(tree, 'name', 'asc');
    expect(result[0].value.name).toBe('avocado');
    expect(result[1].value.name).toBe('banana');
  });

  it('sorts root nodes descending', () => {
    const result = sortTree(tree, 'name', 'desc');
    expect(result[0].value.name).toBe('banana');
    expect(result[1].value.name).toBe('avocado');
  });

  it('sorts children independently of parents', () => {
    const result = sortTree(tree, 'name', 'asc');
    const children = result.find((n) => n.value.name === 'banana')?.children ?? [];
    expect(children[0].value.name).toBe('apple');
    expect(children[1].value.name).toBe('cherry');
  });

  it('does not mutate the original array', () => {
    const original = tree.map((n) => n.value.name);
    sortTree(tree, 'name', 'asc');
    expect(tree.map((n) => n.value.name)).toEqual(original);
  });
});

describe('nodeMatchesSearch', () => {
  it('matches when a primitive field contains the term', () => {
    expect(nodeMatchesSearch({ name: 'Alice', age: 30 }, 'alice')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(nodeMatchesSearch({ name: 'ALICE' }, 'alice')).toBe(true);
  });

  it('returns false when no field matches', () => {
    expect(nodeMatchesSearch({ name: 'Bob', age: 25 }, 'alice')).toBe(false);
  });

  it('ignores object-valued fields', () => {
    expect(nodeMatchesSearch({ meta: { hidden: 'alice' } }, 'alice')).toBe(false);
  });

  it('matches numeric fields as strings', () => {
    expect(nodeMatchesSearch({ count: 42 }, '42')).toBe(true);
  });
});
