import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxStepperI18n } from './i18n/stepper-i18n';
import { createStepperSlotContextBuilders } from './slot-context-builders';
import type { CngxStepNode, CngxStepperHost } from './stepper-host.token';

function stubI18n(): CngxStepperI18n {
  return { statusLabels: { errored: 'Errored' } } as unknown as CngxStepperI18n;
}

function stubNode(overrides: Partial<CngxStepNode> & { id: string }): CngxStepNode {
  const base = {
    id: overrides.id,
    label: () => overrides.id,
    state: () => 'idle',
    disabled: () => false,
    kind: 'step',
    flatIndex: 0,
    depth: 0,
  } as unknown as CngxStepNode;
  return Object.assign(base, overrides);
}

function stubHost(activeStepId: string | null = null): CngxStepperHost {
  return {
    activeStepId: signal(activeStepId),
    commitState: { status: signal('idle') },
    intendedStepIndex: signal(undefined),
    lastFailedIndex: signal(undefined),
    originIndexDuringCommit: signal(undefined),
  } as unknown as CngxStepperHost;
}

describe('createStepperSlotContextBuilders memoization', () => {
  it('returns the same indicator-context reference when source signals are unchanged', () => {
    const node = stubNode({ id: 'a', flatIndex: 0 });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly, i18n: stubI18n() });
    const first = builders.indicatorContextFor(node);
    const second = builders.indicatorContextFor(node);
    expect(second).toBe(first);
  });

  it('rebuilds the indicator context when a derived signal changes', () => {
    const node = stubNode({ id: 'a', flatIndex: 0 });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const host = stubHost();
    const builders = createStepperSlotContextBuilders({ presenter: host, stepsOnly, i18n: stubI18n() });
    const first = builders.indicatorContextFor(node);
    (host.activeStepId as ReturnType<typeof signal<string | null>>).set('a');
    const second = builders.indicatorContextFor(node);
    expect(second).not.toBe(first);
    expect(second.active).toBe(true);
    expect(first.active).toBe(false);
  });

  it('keeps step-label and step-content contexts as independent builders (no aliasing)', () => {
    const node = stubNode({ id: 'a', flatIndex: 0 });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly, i18n: stubI18n() });
    const label = builders.stepLabelContextFor(node);
    const content = builders.stepContentContextFor(node);
    expect(content).not.toBe(label);
    expect(builders.stepLabelContextFor).not.toBe(builders.stepContentContextFor);
  });

  it('keys the cache by node reference, not node id (rebuildTree-safe)', () => {
    // A future `presenter.rebuildTree()` refactor could either reuse
    // node references (cache hits stay valid because shallowEqual
    // re-checks source signals) or produce fresh ones (the WeakMap
    // entry for the old reference becomes unreachable and is GC'd).
    // This test pins the second case: two distinct node objects
    // carrying the same id must NOT share a cache slot.
    const stepsOnly = signal<readonly CngxStepNode[]>([]);
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly, i18n: stubI18n() });
    const before = stubNode({ id: 'a', flatIndex: 0 });
    const after = stubNode({ id: 'a', flatIndex: 0 });
    stepsOnly.set([before]);
    const ctxBefore = builders.indicatorContextFor(before);
    stepsOnly.set([after]);
    const ctxAfter = builders.indicatorContextFor(after);
    expect(ctxAfter).not.toBe(ctxBefore);
    expect(ctxAfter.node).toBe(after);
    expect(ctxBefore.node).toBe(before);
  });
});

describe('createStepperSlotContextBuilders stepError context', () => {
  function aggregator(labels: readonly string[], announcement = ''): CngxStepNode['errorAggregator'] {
    return signal({
      hasError: signal(labels.length > 0),
      shouldShow: signal(labels.length > 0),
      announcement: signal(announcement),
      errorCount: signal(labels.length),
      errorLabels: signal(labels),
      activeErrors: signal(labels),
      addSource: () => {},
      removeSource: () => {},
    }) as unknown as CngxStepNode['errorAggregator'];
  }

  it('message resolves direct [error] string first', () => {
    const node = stubNode({
      id: 'a',
      errorMessage: signal('Card declined'),
      errorAggregator: aggregator(['email']),
    });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly, i18n: stubI18n() });
    const ctx = builders.stepErrorContextFor(node);
    expect(ctx.message).toBe('Card declined');
    expect(ctx.errorLabels).toEqual(['email']);
  });

  it('message falls back to the first aggregator label when no direct string', () => {
    const node = stubNode({ id: 'a', errorAggregator: aggregator(['email', 'phone'], 'Two errors') });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly, i18n: stubI18n() });
    const ctx = builders.stepErrorContextFor(node);
    expect(ctx.message).toBe('email');
    expect(ctx.announcement).toBe('Two errors');
  });

  it('message falls back to the i18n errored label when neither source has text', () => {
    const node = stubNode({ id: 'a' });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly, i18n: stubI18n() });
    const ctx = builders.stepErrorContextFor(node);
    expect(ctx.message).toBe('Errored');
    expect(ctx.errorLabels).toEqual([]);
    expect(ctx.announcement).toBe('');
  });

  it('showStepError mirrors the error-badge gate (state === error), not commit rejection', () => {
    const erroredNode = stubNode({ id: 'a', state: (() => 'error') as CngxStepNode['state'] });
    const idleNode = stubNode({ id: 'b', state: (() => 'idle') as CngxStepNode['state'] });
    const stepsOnly = signal<readonly CngxStepNode[]>([erroredNode, idleNode]);
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly, i18n: stubI18n() });
    expect(builders.showStepError(erroredNode)).toBe(true);
    expect(builders.showStepError(idleNode)).toBe(false);
  });
});
