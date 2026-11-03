import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

// Public API only: the replacement below is what a consumer can write.
import {
  createArrayCommitHandler,
  createCommitBaseline,
  createCommitController,
  type ArrayCommitHandler,
  type ArrayCommitHandlerOptions,
  type CngxArrayCommitHandlerFactory,
  type CngxCommitHandlerCore,
  type CngxSelectCommitAction,
  type CngxSelectOptionDef,
} from '../public-api';

type T = string;

const opt = (value: T): CngxSelectOptionDef<T> => ({ value, label: value, disabled: false });

/** A full replacement that calls the controller itself instead of the default handler. */
const replacementFactory: CngxArrayCommitHandlerFactory = <V>(
  opts: ArrayCommitHandlerOptions<V>,
): ArrayCommitHandler<V> => {
  const controller = opts.core.commitController;
  const baseline = createCommitBaseline(controller);
  const begin = (
    next: V[],
    previous: V[],
    action: CngxSelectCommitAction<V[]>,
    onSuccess: (final: V[], rollbackTo: V[]) => void,
  ): void => {
    const rollbackTo = baseline.begin(previous);
    controller.begin(action, next, rollbackTo, {
      onSuccess: (committed) => {
        const final = committed ?? next;
        opts.values.set([...final]);
        baseline.confirm(final);
        onSuccess(final, rollbackTo);
      },
      onError: (err, restoreTo) => {
        opts.values.set([...(restoreTo ?? rollbackTo)]);
        opts.onError(err);
      },
    });
  };
  return {
    beginToggle: (next, previous, option, action) =>
      begin(next, previous, action, (final, rollbackTo) =>
        opts.onToggleFinalize(option, final.includes(option.value), rollbackTo),
      ),
    beginClear: (previous, action) =>
      begin([], previous, action, (final, rollbackTo) => opts.onClearFinalize(rollbackTo, final)),
    retryLast: () => undefined,
  };
};

function harness() {
  const values = signal<T[]>(['a']);
  const core: CngxCommitHandlerCore<T, T[]> = {
    commitController: createCommitController<T[]>(),
    togglingOption: signal<CngxSelectOptionDef<T> | null>(null),
    findOption: () => null,
    announce: () => undefined,
  };
  const previousLog: (readonly T[])[] = [];
  const options: ArrayCommitHandlerOptions<T> = {
    values,
    compareWith: signal((a: T | undefined, b: T | undefined) => a === b),
    commitMode: signal('optimistic'),
    core,
    commitAction: signal(null),
    onToggleFinalize: (_option, _selected, previous) => previousLog.push(previous),
    onClearFinalize: () => undefined,
    onStateChange: () => undefined,
    onError: () => undefined,
  };
  return { values, options, previousLog };
}

describe('createCommitBaseline - a replacement commit handler from public API', () => {
  it('rolls a superseding toggle back to the confirmed selection', () => {
    const { values, options } = harness();
    const handler = replacementFactory(options);
    const first = new Subject<T[]>();
    const second = new Subject<T[]>();
    values.set(['a', 'x']);
    handler.beginToggle(['a', 'x'], ['a'], opt('x'), () => first);
    values.set(['a', 'x', 'b']);
    handler.beginToggle(['a', 'x', 'b'], ['a', 'x'], opt('b'), () => second);
    second.error(new Error('boom'));
    expect(values()).toEqual(['a']);
  });

  it('reports the confirmed selection as previous when a superseding toggle succeeds', () => {
    const { values, options, previousLog } = harness();
    const handler = replacementFactory(options);
    const first = new Subject<T[]>();
    const second = new Subject<T[]>();
    handler.beginToggle(['a', 'x'], ['a'], opt('x'), () => first);
    handler.beginToggle(['a', 'x', 'b'], ['a', 'x'], opt('b'), () => second);
    second.next(['a', 'x', 'b']);
    expect(values()).toEqual(['a', 'x', 'b']);
    expect(previousLog).toEqual([['a']]);
  });

  it('shares the confirmed value with a default handler on the same controller', () => {
    const { values, options, previousLog } = harness();
    const replacement = replacementFactory(options);
    const defaults = createArrayCommitHandler(options);
    const pending = new Subject<T[]>();
    values.set(['a', 'x']);
    replacement.beginToggle(['a', 'x'], ['a'], opt('x'), () => pending);
    values.set(['a', 'x', 'b']);
    defaults.beginToggle(['a', 'x', 'b'], ['a', 'x'], opt('b'), (next) => next);
    expect(previousLog).toEqual([['a']]);
  });
});
