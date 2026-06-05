import { signal, type WritableSignal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { createStepperStateView, resolveStepperErrorSummary } from './stepper-state-view';
import type { CngxStepperI18n } from './i18n/stepper-i18n';
import type { CngxStepNode, CngxStepperHost, CngxStepStatus } from './stepper-host.token';

function stubNode(
  overrides: { id: string; flatIndex: number } & Record<string, unknown>,
): CngxStepNode {
  const base = {
    id: overrides.id,
    label: () => overrides.id,
    state: () => 'idle' as CngxStepStatus,
    disabled: () => false,
    kind: 'step',
    flatIndex: overrides.flatIndex,
    depth: 0,
  };
  return Object.assign(base, overrides) as unknown as CngxStepNode;
}

interface StubHost {
  host: CngxStepperHost;
  commitStatus: WritableSignal<CngxStepStatus | 'pending' | 'idle'>;
  intendedStepIndex: WritableSignal<number | undefined>;
  lastFailedIndex: WritableSignal<number | undefined>;
}

function stubHost(): StubHost {
  const commitStatus = signal<CngxStepStatus | 'pending' | 'idle'>('idle');
  const intendedStepIndex = signal<number | undefined>(undefined);
  const lastFailedIndex = signal<number | undefined>(undefined);
  const host = {
    commitState: { status: commitStatus },
    intendedStepIndex,
    lastFailedIndex,
  } as unknown as CngxStepperHost;
  return { host, commitStatus, intendedStepIndex, lastFailedIndex };
}

function aggregator(shouldShow: boolean): CngxErrorAggregatorContract {
  return { shouldShow: () => shouldShow } as unknown as CngxErrorAggregatorContract;
}

describe('createStepperStateView', () => {
  it('reports hasError for a literal error state', () => {
    const node = stubNode({ id: 'a', flatIndex: 0, state: () => 'error' });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const view = createStepperStateView({ presenter: stubHost().host, stepsOnly });
    expect(view.hasErrorBadge(node)).toBe(true);
    expect(view.hasError(node)).toBe(true);
  });

  it('reports hasError when the error aggregator says shouldShow', () => {
    const node = stubNode({ id: 'a', flatIndex: 0, errorAggregator: () => aggregator(true) });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const view = createStepperStateView({ presenter: stubHost().host, stepsOnly });
    expect(view.hasErrorBadge(node)).toBe(true);
    expect(view.hasError(node)).toBe(true);
  });

  it('folds commit rejection into hasError but NOT into hasErrorBadge', () => {
    const node = stubNode({ id: 'a', flatIndex: 1 });
    const stepsOnly = signal<readonly CngxStepNode[]>([stubNode({ id: 'x', flatIndex: 0 }), node]);
    const { host, lastFailedIndex } = stubHost();
    const view = createStepperStateView({ presenter: host, stepsOnly });

    expect(view.hasError(node)).toBe(false);
    lastFailedIndex.set(1);
    // The classic skin keeps rejection in its own slot, so the badge
    // predicate must stay false while the unified predicate flips true.
    expect(view.hasErrorBadge(node)).toBe(false);
    expect(view.isRejected(node)).toBe(true);
    expect(view.hasError(node)).toBe(true);
  });

  it('marks the in-flight step busy only when commit pending targets it', () => {
    const node = stubNode({ id: 'a', flatIndex: 2 });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const { host, commitStatus, intendedStepIndex } = stubHost();
    const view = createStepperStateView({ presenter: host, stepsOnly });

    expect(view.isBusy(node)).toBe(false);
    commitStatus.set('pending');
    intendedStepIndex.set(2);
    expect(view.isBusy(node)).toBe(true);
    intendedStepIndex.set(0);
    expect(view.isBusy(node)).toBe(false);
  });

  it('aggregates errorCount / firstErrorIndex / hasAnyError reactively', () => {
    const a = stubNode({ id: 'a', flatIndex: 0 });
    const b = stubNode({ id: 'b', flatIndex: 1, state: () => 'error' });
    const c = stubNode({ id: 'c', flatIndex: 2 });
    const stepsOnly = signal<readonly CngxStepNode[]>([a, b, c]);
    const { host, lastFailedIndex } = stubHost();
    const view = createStepperStateView({ presenter: host, stepsOnly });

    expect(view.errorCount()).toBe(1);
    expect(view.firstErrorIndex()).toBe(1);
    expect(view.hasAnyError()).toBe(true);

    lastFailedIndex.set(2);
    expect(view.errorCount()).toBe(2);
    expect(view.firstErrorIndex()).toBe(1);
  });

  it('reports no error for a clean flow', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([
      stubNode({ id: 'a', flatIndex: 0 }),
      stubNode({ id: 'b', flatIndex: 1, state: () => 'success' }),
    ]);
    const view = createStepperStateView({ presenter: stubHost().host, stepsOnly });
    expect(view.errorCount()).toBe(0);
    expect(view.firstErrorIndex()).toBe(-1);
    expect(view.hasAnyError()).toBe(false);
  });
});

describe('resolveStepperErrorSummary', () => {
  const i18n = {
    statusLabels: { errored: 'Errored' },
    stepHasErrors: (count: number) => `${count} error${count === 1 ? '' : 's'}`,
  } as unknown as CngxStepperI18n;

  it('returns empty when no step errored', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([stubNode({ id: 'a', flatIndex: 0 })]);
    const view = { errorCount: signal(0), firstErrorIndex: signal(-1) };
    expect(resolveStepperErrorSummary(view, stepsOnly, i18n)).toBe('');
  });

  it('names the single errored step', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([
      stubNode({ id: 'a', flatIndex: 0 }),
      stubNode({ id: 'Payment', flatIndex: 1, label: () => 'Payment' }),
    ]);
    const view = { errorCount: signal(1), firstErrorIndex: signal(1) };
    expect(resolveStepperErrorSummary(view, stepsOnly, i18n)).toBe('Payment: Errored');
  });

  it('collapses multiple errors to the count phrase', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([stubNode({ id: 'a', flatIndex: 0 })]);
    const view = { errorCount: signal(3), firstErrorIndex: signal(0) };
    expect(resolveStepperErrorSummary(view, stepsOnly, i18n)).toBe('3 errors');
  });
});
