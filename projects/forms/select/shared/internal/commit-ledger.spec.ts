import { signal, type WritableSignal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { arrayEqual } from '@cngx/utils';

import type { CngxSelectCommitAction, CngxSelectCommitMode } from '../commit-action.types';
import { createCommitController } from '../commit-controller.token';
import type { CngxSelectOptionDef } from '../option.model';
import {
  commitLedgerFor,
  createCommitLedger,
  type CommitKind,
  type CommitLedger,
  type CommitLedgerMembersRequest,
} from './commit-ledger';

type T = string;

const opt = (value: T): CngxSelectOptionDef<T> => ({ value, label: value });

interface Harness {
  readonly ledger: CommitLedger<T[], T>;
  readonly values: WritableSignal<T[]>;
  readonly mode: WritableSignal<CngxSelectCommitMode>;
  readonly action: WritableSignal<CngxSelectCommitAction<T[]> | null>;
  readonly calls: (T[] | undefined)[];
  readonly pendings: Subject<T[] | undefined>[];
  readonly log: string[];
  request(
    kind: Exclude<CommitKind, 'select'>,
    next: T[],
    previous: T[],
    option?: CngxSelectOptionDef<T> | null,
  ): CommitLedgerMembersRequest<T[], T[], T>;
}

function harness(initial: T[] = []): Harness {
  const ledger = createCommitLedger<T[], T>(createCommitController<T[]>());
  const values = signal<T[]>(initial);
  const mode = signal<CngxSelectCommitMode>('optimistic');
  const calls: (T[] | undefined)[] = [];
  const pendings: Subject<T[] | undefined>[] = [];
  const log: string[] = [];
  const deferred: CngxSelectCommitAction<T[]> = (next) => {
    calls.push(next);
    const s = new Subject<T[] | undefined>();
    pendings.push(s);
    return s.asObservable();
  };
  const action = signal<CngxSelectCommitAction<T[]> | null>(deferred);
  return {
    ledger,
    values,
    mode,
    action,
    calls,
    pendings,
    log,
    request: (kind, next, previous, option = null) => ({
      kind,
      next,
      previous,
      option,
      action: deferred,
      commitAction: action,
      value: values,
      same: (a, b) => arrayEqual(a, b),
      copy: (v) => [...v],
      commitMode: mode,
      onStateChange: (s) => log.push(`state:${s}`),
      onReplay: () => log.push('replay'),
      onSuccess: (final) => log.push(`success:${final.join(',')}`),
      onError: () => log.push(`error:${values().join(',')}`),
      onRollback: (restored) => log.push(`rollback:${restored.join(',')}`),
      announceError: () => log.push(`announce:${values().join(',')}`),
    }),
  };
}

const MEMBER_KINDS: readonly Exclude<CommitKind, 'select'>[] = [
  'toggle',
  'clear',
  'reorder',
  'tree',
];

describe('createCommitLedger', () => {
  describe.each(MEMBER_KINDS)('kind %s', (kind) => {
    it('records the commit and reconciles the committed value on success', () => {
      const h = harness(['a']);
      h.values.set(['b']);
      h.ledger.beginMembers(h.request(kind, ['b'], ['a'], opt('b')));
      expect(h.ledger.last()).toEqual({
        kind,
        intended: ['b'],
        previous: ['a'],
        option: opt('b'),
        meta: undefined,
      });
      h.pendings[0].next(['b', 'server']);
      expect(h.values()).toEqual(['b', 'server']);
      expect(h.ledger.confirmed()).toEqual(['b', 'server']);
      expect(h.log).toEqual(['state:pending', 'state:success', 'success:b,server']);
    });

    it('rolls back before it announces the failure', () => {
      const h = harness(['a']);
      h.values.set(['b']);
      h.ledger.beginMembers(h.request(kind, ['b'], ['a']));
      h.pendings[0].error(new Error('down'));
      expect(h.values()).toEqual(['a']);
      expect(h.ledger.confirmed()).toEqual(['a']);
      expect(h.log).toEqual([
        'state:pending',
        'state:error',
        'error:b',
        'rollback:a',
        'announce:a',
      ]);
    });

    it('keeps an external write made while the commit was pending', () => {
      const h = harness(['a']);
      h.values.set(['b']);
      h.ledger.beginMembers(h.request(kind, ['b'], ['a']));
      h.values.set(['x']);
      h.pendings[0].error(new Error('down'));
      expect(h.values()).toEqual(['x']);
      expect(h.log).not.toContain('rollback:a');
    });

    it('replays the recorded commit on retry, re-applying it in optimistic mode', () => {
      const h = harness(['a']);
      h.values.set(['b']);
      h.ledger.beginMembers(h.request(kind, ['b'], ['a']));
      h.pendings[0].error(new Error('down'));
      h.log.length = 0;
      h.ledger.retry();
      expect(h.calls).toEqual([['b'], ['b']]);
      expect(h.values()).toEqual(['b']);
      expect(h.log).toEqual(['replay', 'state:pending']);
    });

    it('leaves the model alone on a pessimistic retry', () => {
      const h = harness(['a']);
      h.mode.set('pessimistic');
      h.ledger.beginMembers(h.request(kind, ['b'], ['a']));
      h.pendings[0].error(new Error('down'));
      h.ledger.retry();
      expect(h.calls).toHaveLength(2);
      expect(h.values()).toEqual(['a']);
    });

    it('replaces a superseded record and never replays it', () => {
      const h = harness(['a']);
      h.ledger.beginMembers(h.request(kind, ['b'], ['a']));
      h.ledger.beginMembers(h.request(kind, ['c'], ['a']));
      expect(h.ledger.last()?.intended).toEqual(['c']);
      h.pendings[1].error(new Error('down'));
      h.ledger.retry();
      expect(h.calls).toEqual([['b'], ['c'], ['c']]);
    });
  });

  it('rolls a superseding commit back to the confirmed value and replays it against that', () => {
    const h = harness(['a']);
    h.values.set(['a', 'b']);
    h.ledger.beginMembers(h.request('toggle', ['a', 'b'], ['a']));
    h.values.set(['a', 'b', 'c']);
    h.ledger.beginMembers(h.request('toggle', ['a', 'b', 'c'], ['a', 'b']));
    expect(h.ledger.last()?.previous).toEqual(['a']);
    expect(h.ledger.baseline(['a', 'b', 'c'])).toEqual(['a']);
    h.pendings[1].error(new Error('down'));
    expect(h.values()).toEqual(['a']);
    h.ledger.retry();
    expect(h.ledger.last()?.previous).toEqual(['a']);
    h.pendings[2].error(new Error('down again'));
    expect(h.values()).toEqual(['a']);
  });

  it('never confirms an in-flight value', () => {
    const h = harness(['a']);
    h.ledger.beginMembers(h.request('toggle', ['b'], ['a']));
    expect(h.ledger.confirmed()).toEqual(['a']);
    h.ledger.beginMembers(h.request('toggle', ['c'], ['b']));
    expect(h.ledger.confirmed()).toEqual(['a']);
    h.pendings[1].next(undefined);
    h.pendings[1].complete();
    expect(h.ledger.confirmed()).toEqual(['c']);
    expect(h.ledger.baseline(['x'])).toEqual(['x']);
  });

  it('routes retry by the kind recorded last, not by an earlier commit', () => {
    const h = harness(['a', 'b']);
    h.values.set([]);
    h.ledger.beginMembers(h.request('clear', [], ['a', 'b']));
    h.pendings[0].next(undefined);
    h.pendings[0].complete();
    h.values.set(['b', 'a']);
    h.ledger.beginMembers(h.request('reorder', ['b', 'a'], ['a', 'b']));
    h.pendings[1].error(new Error('down'));
    expect(h.values()).toEqual(['a', 'b']);
    h.ledger.retry();
    expect(h.ledger.last()?.kind).toBe('reorder');
    expect(h.calls.at(-1)).toEqual(['b', 'a']);
    expect(h.values()).toEqual(['b', 'a']);
  });

  it('records scalar commits with their option', () => {
    const ledger = createCommitLedger<T, T>(createCommitController<T>());
    const value = signal<T | undefined>('red');
    const commitAction = signal<CngxSelectCommitAction<T> | null>(() => new Subject<T>());
    ledger.beginScalar<T | undefined>({
      kind: 'select',
      next: 'green',
      previous: 'red',
      option: opt('green'),
      action: commitAction()!,
      commitAction,
      value,
      same: Object.is,
      commitMode: signal<CngxSelectCommitMode>('optimistic'),
      onSuccess: () => undefined,
    });
    expect(ledger.last()).toMatchObject({
      kind: 'select',
      intended: 'green',
      option: opt('green'),
    });
  });

  it('is a no-op on retry without a record or without a bound action', () => {
    const h = harness(['a']);
    h.ledger.retry();
    expect(h.calls).toEqual([]);
    h.ledger.beginMembers(h.request('toggle', ['b'], ['a']));
    h.pendings[0].error(new Error('down'));
    h.action.set(null);
    h.ledger.retry();
    expect(h.calls).toHaveLength(1);
  });

  it('keeps the last record reference across a retry of the same commit', () => {
    const h = harness(['a']);
    h.ledger.beginMembers(h.request('toggle', ['b'], ['a'], opt('b')));
    const before = h.ledger.last();
    h.pendings[0].error(new Error('down'));
    h.ledger.retry();
    expect(Object.is(h.ledger.last(), before)).toBe(true);
  });

  it('forgets the record and the confirmed value on reset', () => {
    const h = harness(['a']);
    h.ledger.beginMembers(h.request('toggle', ['b'], ['a']));
    h.pendings[0].next(undefined);
    h.pendings[0].complete();
    expect(h.ledger.confirmed()).toEqual(['b']);
    h.ledger.reset();
    expect(h.ledger.last()).toBeNull();
    expect(h.ledger.confirmed()).toBeUndefined();
    h.ledger.retry();
    expect(h.calls).toHaveLength(1);
  });
});

describe('commitLedgerFor', () => {
  it('hands every caller of one controller the same ledger', () => {
    const controller = createCommitController<T[]>();
    expect(commitLedgerFor(controller)).toBe(commitLedgerFor(controller));
    expect(commitLedgerFor(controller)).not.toBe(commitLedgerFor(createCommitController<T[]>()));
  });
});
