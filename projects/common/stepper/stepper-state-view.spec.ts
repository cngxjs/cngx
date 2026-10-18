import { computed, signal, type WritableSignal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxTransitionOutcome } from '@cngx/common/data';
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
  lastOutcome: WritableSignal<CngxTransitionOutcome | undefined>;
}

function stubHost(): StubHost {
  const commitStatus = signal<CngxStepStatus | 'pending' | 'idle'>('idle');
  const intendedStepIndex = signal<number | undefined>(undefined);
  const lastFailedIndex = signal<number | undefined>(undefined);
  const lastOutcome = signal<CngxTransitionOutcome | undefined>(undefined);
  const host = {
    commitState: { status: commitStatus },
    intendedStepIndex,
    lastFailedIndex,
    lastOutcome,
  } as unknown as CngxStepperHost;
  return { host, commitStatus, intendedStepIndex, lastFailedIndex, lastOutcome };
}

function summaryView(count: number, first: number, refused = false) {
  return {
    errorMarkerCount: signal(count),
    firstErrorMarkerIndex: signal(first),
    isRefused: () => refused,
    hasErrorBadge: () => false,
  };
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

  it('folds a failed commit into hasError but NOT into hasErrorBadge', () => {
    const node = stubNode({ id: 'a', flatIndex: 1 });
    const stepsOnly = signal<readonly CngxStepNode[]>([stubNode({ id: 'x', flatIndex: 0 }), node]);
    const { host, lastFailedIndex, lastOutcome } = stubHost();
    const view = createStepperStateView({ presenter: host, stepsOnly });

    expect(view.hasError(node)).toBe(false);
    lastOutcome.set({ kind: 'failed', index: 1, sequence: 1 });
    lastFailedIndex.set(1);
    // The classic skin keeps rejection in its own slot, so the badge
    // predicate must stay false while the unified predicate flips true.
    expect(view.hasErrorBadge(node)).toBe(false);
    expect(view.isRejected(node)).toBe(true);
    expect(view.isRefused(node)).toBe(false);
    expect(view.hasErrorMarker(node)).toBe(true);
    expect(view.hasError(node)).toBe(true);
  });

  it('marks a refused step without putting it in error', () => {
    const node = stubNode({ id: 'a', flatIndex: 1 });
    const stepsOnly = signal<readonly CngxStepNode[]>([stubNode({ id: 'x', flatIndex: 0 }), node]);
    const { host, lastFailedIndex, lastOutcome } = stubHost();
    const view = createStepperStateView({ presenter: host, stepsOnly });

    lastOutcome.set({ kind: 'refused', index: 1, sequence: 1 });
    lastFailedIndex.set(1);
    expect(view.isRejected(node)).toBe(true);
    expect(view.isRefused(node)).toBe(true);
    expect(view.hasErrorMarker(node)).toBe(true);
    expect(view.hasError(node)).toBe(false);
    expect(view.errorCount()).toBe(0);
    expect(view.hasAnyError()).toBe(false);
    expect(view.errorMarkerCount()).toBe(1);
    expect(view.firstErrorMarkerIndex()).toBe(1);
    expect(view.hasAnyErrorMarker()).toBe(true);
  });

  it('keeps a validation error in error when its step change is also refused', () => {
    const node = stubNode({ id: 'a', flatIndex: 0, state: () => 'error' });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const { host, lastFailedIndex, lastOutcome } = stubHost();
    const view = createStepperStateView({ presenter: host, stepsOnly });

    lastOutcome.set({ kind: 'refused', index: 0, sequence: 1 });
    lastFailedIndex.set(0);
    expect(view.hasError(node)).toBe(true);
    expect(view.errorCount()).toBe(1);
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
    const { host, lastFailedIndex, lastOutcome } = stubHost();
    const view = createStepperStateView({ presenter: host, stepsOnly });

    expect(view.errorCount()).toBe(1);
    expect(view.firstErrorIndex()).toBe(1);
    expect(view.hasAnyError()).toBe(true);

    lastOutcome.set({ kind: 'failed', index: 2, sequence: 1 });
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
    expect(view.errorMarkerCount()).toBe(0);
    expect(view.hasAnyErrorMarker()).toBe(false);
  });
});

describe('resolveStepperErrorSummary', () => {
  const i18n = {
    statusLabels: { errored: 'Errored', refused: 'Not allowed' },
    stepWithDetail: (step: string, detail: string) => `${step}: ${detail}`,
    stepHasErrors: (count: number) => `${count} error${count === 1 ? '' : 's'}`,
  } as unknown as CngxStepperI18n;

  it('names a single refused step with the refused word', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([
      stubNode({ id: 'Payment', flatIndex: 0, label: () => 'Payment' }),
    ]);
    const view = summaryView(1, 0, true);
    expect(resolveStepperErrorSummary(view, stepsOnly, i18n, () => undefined)).toBe(
      'Payment: Not allowed',
    );
  });

  it('returns empty when no step errored', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([stubNode({ id: 'a', flatIndex: 0 })]);
    const view = summaryView(0, -1);
    expect(resolveStepperErrorSummary(view, stepsOnly, i18n)).toBe('');
  });

  it('names the single errored step', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([
      stubNode({ id: 'a', flatIndex: 0 }),
      stubNode({ id: 'Payment', flatIndex: 1, label: () => 'Payment' }),
    ]);
    const view = summaryView(1, 1);
    expect(resolveStepperErrorSummary(view, stepsOnly, i18n)).toBe('Payment: Errored');
  });

  it('joins the step label and the errored status through stepWithDetail', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([
      stubNode({ id: 'Payment', flatIndex: 0, label: () => 'Payment' }),
    ]);
    const view = summaryView(1, 0);
    const reordered = {
      ...i18n,
      stepWithDetail: (step: string, detail: string) => `${detail} - ${step}`,
    } as CngxStepperI18n;
    expect(resolveStepperErrorSummary(view, stepsOnly, reordered)).toBe('Errored - Payment');
  });

  it('collapses multiple errors to the count phrase', () => {
    const stepsOnly = signal<readonly CngxStepNode[]>([stubNode({ id: 'a', flatIndex: 0 })]);
    const view = summaryView(3, 0);
    expect(resolveStepperErrorSummary(view, stepsOnly, i18n)).toBe('3 errors');
  });

  describe('optional messageOf resolver', () => {
    it('prefixes a resolved per-step message with the step label', () => {
      const stepsOnly = signal<readonly CngxStepNode[]>([
        stubNode({ id: 'Payment', flatIndex: 0, label: () => 'Payment' }),
      ]);
      const view = summaryView(1, 0);
      const summary = resolveStepperErrorSummary(view, stepsOnly, i18n, () => 'Card declined');
      expect(summary).toBe('Payment: Card declined');
    });

    it('surfaces the bare message when the errored step has no label', () => {
      const stepsOnly = signal<readonly CngxStepNode[]>([
        stubNode({ id: 'a', flatIndex: 0, label: () => '' }),
      ]);
      const view = summaryView(1, 0);
      const summary = resolveStepperErrorSummary(view, stepsOnly, i18n, () => 'Card declined');
      expect(summary).toBe('Card declined');
    });

    it('falls back to the status phrasing when the resolver returns undefined', () => {
      const stepsOnly = signal<readonly CngxStepNode[]>([
        stubNode({ id: 'Payment', flatIndex: 0, label: () => 'Payment' }),
      ]);
      const view = summaryView(1, 0);
      const summary = resolveStepperErrorSummary(view, stepsOnly, i18n, () => undefined);
      expect(summary).toBe('Payment: Errored');
    });

    it('called WITHOUT the 4th arg is byte-identical to the no-resolver form', () => {
      // Closes the backward-compat requirement: the classic mobile-collapse
      // caller passes no resolver and must be a guaranteed no-op.
      const stepsOnly = signal<readonly CngxStepNode[]>([
        stubNode({ id: 'a', flatIndex: 0 }),
        stubNode({ id: 'Payment', flatIndex: 1, label: () => 'Payment' }),
      ]);
      const single = summaryView(1, 1);
      const multi = summaryView(2, 1);
      const none = summaryView(0, -1);
      expect(resolveStepperErrorSummary(single, stepsOnly, i18n)).toBe('Payment: Errored');
      expect(resolveStepperErrorSummary(multi, stepsOnly, i18n)).toBe('2 errors');
      expect(resolveStepperErrorSummary(none, stepsOnly, i18n)).toBe('');
    });
  });
});

describe('resolveStepperErrorSummary language switch', () => {
  it('does not re-announce on a language flip of a consumer-translated label', () => {
    const lang = signal<'en' | 'de'>('en');
    const i18n = {
      statusLabels: { errored: 'Errored' },
      stepWithDetail: (step: string, detail: string) => `${step}: ${detail}`,
      stepHasErrors: (count: number) => `${count} errors`,
    } as unknown as CngxStepperI18n;
    const stepsOnly = signal<readonly CngxStepNode[]>([
      stubNode({
        id: 'pay',
        flatIndex: 0,
        label: computed(() => (lang() === 'de' ? 'Zahlung' : 'Payment')),
      }),
    ]);
    const errorCount = signal(1);
    const view = { ...summaryView(1, 0), errorMarkerCount: errorCount };
    const summary = computed(() => resolveStepperErrorSummary(view, stepsOnly, i18n));
    expect(summary()).toBe('Payment: Errored');

    lang.set('de');
    expect(summary()).toBe('Payment: Errored');

    errorCount.set(0);
    expect(summary()).toBe('');
    errorCount.set(1);
    expect(summary()).toBe('Zahlung: Errored');
  });
});
