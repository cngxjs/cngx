import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { createCommitController } from '../commit-controller.token';
import { commitLedgerFor } from './commit-ledger';
import { commitRetryFor } from './commit-retry';

describe('commitRetryFor', () => {
  it('returns one router per controller', () => {
    const controller = createCommitController<string>();
    expect(commitRetryFor(controller)).toBe(commitRetryFor(controller));
    expect(commitRetryFor(controller)).not.toBe(commitRetryFor(createCommitController<string>()));
  });

  it('routes Retry to the handler that started the last commit', () => {
    const router = commitRetryFor(createCommitController<string>());
    const log: string[] = [];
    const handler = (name: string) => ({
      begin: () => log.push(`begin:${name}`),
      retryLast: () => log.push(`retry:${name}`),
    });
    const a = router.route(handler('a'), ['begin']);
    const b = router.route(handler('b'), ['begin']);
    router.retry();
    expect(log).toEqual([]);
    a.begin();
    router.retry();
    b.begin();
    router.retry();
    a.retryLast();
    expect(log).toEqual(['begin:a', 'retry:a', 'begin:b', 'retry:b', 'retry:a']);
    router.claim({ retryLast: () => log.push('retry:claimed') });
    router.retry();
    expect(log.at(-1)).toBe('retry:claimed');
  });

  it('a claim drops the ledger record of the earlier commit', () => {
    const controller = createCommitController<string>();
    const ledger = commitLedgerFor<string, string>(controller);
    const commitAction = signal(() => new Subject<string>());
    ledger.beginScalar<string | undefined>({
      kind: 'select',
      next: 'red',
      previous: undefined,
      option: { value: 'red', label: 'Red' },
      action: commitAction(),
      commitAction,
      value: signal<string | undefined>(undefined),
      same: Object.is,
      commitMode: signal('pessimistic'),
      onSuccess: () => undefined,
    });
    expect(ledger.last()?.option?.label).toBe('Red');
    commitRetryFor(controller).claim({ retryLast: () => undefined });
    expect(ledger.last()).toBeNull();
  });
});
