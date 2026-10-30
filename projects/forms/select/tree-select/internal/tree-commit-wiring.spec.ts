import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createTreeController } from '@cngx/common/interactive';
import { describe, expect, it, vi } from 'vitest';

import type {
  ArrayCommitHandler,
  CngxArrayCommitHandlerFactory,
} from '../../shared/array-commit-handler';
import type { CngxSelectCommitAction } from '../../shared/commit-action.types';
import { createCommitController } from '../../shared/commit-controller.token';
import {
  cngxSelectDefaultCompare,
  type CngxCommitRetryOwner,
  type CngxSelectCompareFn,
  type CngxSelectCore,
} from '../../shared/internal/select-core';
import { createTreeCommitWiring, isReferenceCompare } from './tree-commit-wiring';

interface Item {
  readonly id: string;
}

function setup(
  opts: { keyFn?: (v: Item) => unknown; compareWith?: CngxSelectCompareFn<Item> } = {},
) {
  const log: string[] = [];
  let owner: CngxCommitRetryOwner | null = null;
  const clearHandler: ArrayCommitHandler<Item> = {
    beginToggle: () => log.push('array:toggle'),
    beginClear: () => log.push('array:clear'),
    retryLast: () => log.push('array:retry'),
  };
  const factory = vi.fn(() => clearHandler) as unknown as CngxArrayCommitHandlerFactory;
  const core = {
    commitController: createCommitController<Item[]>(),
    announce: vi.fn(),
    createCommitErrorAnnouncer: () => vi.fn(),
    routeRetryThrough: <H extends CngxCommitRetryOwner>(h: H, begins: readonly (keyof H)[]) => {
      const routed = Object.create(h) as H;
      for (const key of begins) {
        const begin = h[key] as (...a: unknown[]) => unknown;
        Object.defineProperty(routed, key, {
          value: (...args: unknown[]) => {
            owner = h;
            return begin(...args);
          },
        });
      }
      return routed;
    },
    claimCommitRetry: (o: CngxCommitRetryOwner) => {
      owner = o;
    },
    retryLastCommit: () => owner?.retryLast(),
    bindCommitRetry: (retry: () => void) => signal({ retry }),
  } as unknown as CngxSelectCore<Item, Item[]>;
  const values = signal<Item[]>([{ id: 'a' }]);
  const treeController = TestBed.runInInjectionContext(() =>
    createTreeController<Item>({
      nodes: signal([{ value: { id: 'a' } }, { value: { id: 'b' } }]),
      nodeIdFn: (v) => v.id,
      keyFn: (v) => v.id,
    }),
  );
  const wiring = createTreeCommitWiring<Item>({
    values,
    keyFn: signal(opts.keyFn),
    compareWith: signal(
      opts.compareWith ?? (cngxSelectDefaultCompare as CngxSelectCompareFn<Item>),
    ),
    cascade: signal(false),
    commitAction: signal<CngxSelectCommitAction<Item[]> | null>(() => undefined),
    commitMode: signal('optimistic'),
    commitErrorAnnouncePolicy: signal({ kind: 'verbose', severity: 'assertive' }),
    core,
    treeController,
    arrayHandlerFactory: factory,
    emitChange: vi.fn(),
    emitCleared: vi.fn(),
    emitState: vi.fn(),
    emitCommitError: vi.fn(),
    beforeRetry: () => log.push('refocus'),
  });
  return { wiring, factory, log, values };
}

describe('createTreeCommitWiring', () => {
  it('keys member identity by keyFn, else by compareWith', () => {
    const keyed = setup({ keyFn: (v) => v.id });
    expect(keyed.wiring.memberEquality()({ id: 'a' }, { id: 'a' })).toBe(true);
    const plain = setup();
    expect(plain.wiring.memberEquality()({ id: 'a' }, { id: 'a' })).toBe(false);
  });

  it('builds the clear handler through the resolved array handler factory', () => {
    const t = setup();
    expect(t.factory).toHaveBeenCalledTimes(1);
    t.wiring.dispatch.clearAll();
    expect(t.log).toEqual(['array:clear']);
  });

  it('refocuses, then routes Retry to the handler that started the last commit', () => {
    const t = setup();
    t.wiring.dispatch.clearAll();
    t.wiring.commitErrorContext().retry();
    expect(t.log).toEqual(['array:clear', 'refocus', 'array:retry']);
  });

  it('treats only the default compare and Object.is as reference compares', () => {
    expect(isReferenceCompare(cngxSelectDefaultCompare)).toBe(true);
    expect(isReferenceCompare(Object.is)).toBe(true);
    expect(isReferenceCompare((a: unknown, b: unknown) => a === b)).toBe(false);
  });
});
