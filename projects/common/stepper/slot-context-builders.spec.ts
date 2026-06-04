import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createStepperSlotContextBuilders } from './slot-context-builders';
import type { CngxStepNode, CngxStepperHost } from './stepper-host.token';

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
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly });
    const first = builders.indicatorContextFor(node);
    const second = builders.indicatorContextFor(node);
    expect(second).toBe(first);
  });

  it('rebuilds the indicator context when a derived signal changes', () => {
    const node = stubNode({ id: 'a', flatIndex: 0 });
    const stepsOnly = signal<readonly CngxStepNode[]>([node]);
    const host = stubHost();
    const builders = createStepperSlotContextBuilders({ presenter: host, stepsOnly });
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
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly });
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
    const builders = createStepperSlotContextBuilders({ presenter: stubHost(), stepsOnly });
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
