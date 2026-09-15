import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type CngxTreeNode } from '@cngx/utils';
import { describe, expect, it } from 'vitest';
import { createTreeController } from './tree-controller';
import {
  CNGX_TREE_CONFIG,
  injectTreeConfig,
  provideTreeConfig,
  provideTreeConfigAt,
  withDefaultInitiallyExpanded,
  withDefaultKeyFn,
  withDefaultLabelFn,
  withDefaultNodeIdFn,
  withTreeCacheLimit,
} from './tree-config';

interface Row {
  readonly id: string;
  readonly name: string;
}

const tree: CngxTreeNode<Row>[] = [
  {
    value: { id: 'a', name: 'Alpha' },
    children: [
      { value: { id: 'a1', name: 'Alpha-1' } },
      { value: { id: 'a2', name: 'Alpha-2' } },
    ],
  },
];

describe('provideTreeConfig - app-wide defaults', () => {
  it('withDefaultNodeIdFn is picked up when options omit nodeIdFn', () => {
    TestBed.configureTestingModule({
      providers: [provideTreeConfig(withDefaultNodeIdFn<Row>((v) => v.id))],
    });
    const ctrl = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({ nodes: signal(tree) }),
    );
    expect(ctrl.flatNodes().map((n) => n.id)).toEqual(['a', 'a1', 'a2']);
  });

  it('per-options nodeIdFn overrides the config default', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTreeConfig(withDefaultNodeIdFn<Row>((v) => `config:${v.id}`)),
      ],
    });
    const ctrl = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({
        nodes: signal(tree),
        nodeIdFn: (v) => `local:${v.id}`,
      }),
    );
    expect(ctrl.flatNodes()[0].id).toBe('local:a');
  });

  it('throws in dev mode when neither options nor config provide nodeIdFn', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(() =>
      TestBed.runInInjectionContext(() =>
        createTreeController<Row>({ nodes: signal(tree) }),
      ),
    ).toThrow(/nodeIdFn/);
  });

  it('withDefaultLabelFn / withDefaultKeyFn flow through to the controller', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTreeConfig(
          withDefaultNodeIdFn<Row>((v) => v.id),
          withDefaultLabelFn<Row>((v) => v.name.toUpperCase()),
          withDefaultKeyFn<Row>((v) => v.id),
        ),
      ],
    });
    const ctrl = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({ nodes: signal(tree) }),
    );
    expect(ctrl.flatNodes()[0].label).toBe('ALPHA');
    // keyFn default from config means findByValue accepts any Row
    // reference that shares the domain id.
    expect(ctrl.findByValue({ id: 'a1', name: 'different' })?.id).toBe('a1');
  });

  it('withDefaultInitiallyExpanded seeds the expansion set', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTreeConfig(
          withDefaultNodeIdFn<Row>((v) => v.id),
          withDefaultInitiallyExpanded('all'),
        ),
      ],
    });
    const ctrl = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({ nodes: signal(tree) }),
    );
    expect([...ctrl.expandedIds()]).toEqual(['a']);
  });

  it('withTreeCacheLimit is honoured as the signal-cache bound', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTreeConfig(
          withDefaultNodeIdFn<Row>((v) => v.id),
          withTreeCacheLimit(1),
        ),
      ],
    });
    const ctrl = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({ nodes: signal(tree) }),
    );
    const s1 = ctrl.isExpanded('a');
    ctrl.isExpanded('a1'); // evicts 'a'
    expect(ctrl.isExpanded('a')).not.toBe(s1);
  });
});

describe('CNGX_TREE_CONFIG token + injectTreeConfig', () => {
  it('defaults to an empty config so unconfigured trees keep library behaviour', () => {
    expect(TestBed.inject(CNGX_TREE_CONFIG)).toEqual({});
    const resolved = TestBed.runInInjectionContext(() => injectTreeConfig());
    expect(resolved).toEqual({});
  });

  it('injectTreeConfig returns the merged config registered via provideTreeConfig', () => {
    const labelFn = (v: Row): string => v.name;
    TestBed.configureTestingModule({
      providers: [provideTreeConfig(withDefaultLabelFn<Row>(labelFn), withTreeCacheLimit(42))],
    });
    const resolved = TestBed.runInInjectionContext(() => injectTreeConfig());
    expect(resolved.defaultLabelFn).toBe(labelFn);
    expect(resolved.cacheLimit).toBe(42);
  });
});

describe('provideTreeConfigAt - sub-tree scope', () => {
  it('registers the same merged CNGX_TREE_CONFIG as provideTreeConfig', () => {
    TestBed.configureTestingModule({
      providers: [provideTreeConfigAt(withDefaultNodeIdFn<Row>((v) => v.id))],
    });
    const ctrl = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({ nodes: signal(tree) }),
    );
    expect(ctrl.flatNodes().map((n) => n.id)).toEqual(['a', 'a1', 'a2']);
  });
});
