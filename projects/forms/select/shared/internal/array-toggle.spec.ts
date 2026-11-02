import { signal, type WritableSignal } from '@angular/core';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { createCommitController, type CngxCommitController } from '../commit-controller.token';
import { createArrayToggleDispatch, type ArrayToggleChange } from './array-toggle';
import { commitLedgerFor } from './commit-ledger';
import type { CngxSelectCompareFn, CngxSelectCore } from './select-core';
import type { CngxSelectCommitAction, CngxSelectCommitMode } from '../commit-action.types';
import type { CngxSelectOptionDef } from '../option.model';

type T = string;

function opt(value: T): CngxSelectOptionDef<T> {
  return { value, label: value, disabled: false };
}

interface CoreMock {
  readonly commitController: CngxCommitController<T[]>;
  readonly togglingOption: WritableSignal<CngxSelectOptionDef<T> | null>;
  readonly announceCalls: Array<{
    option: CngxSelectOptionDef<T> | null;
    action: string;
    count: number;
    multi: boolean;
  }>;
  readonly panelHostAdapter: { isSelected(o: CngxSelectOptionDef<T>): boolean };
  selected: T[];
  announce(
    option: CngxSelectOptionDef<T> | null,
    action: string,
    count: number,
    multi: boolean,
  ): void;
}

interface Harness {
  readonly values: WritableSignal<T[]>;
  readonly compareWith: WritableSignal<CngxSelectCompareFn<T>>;
  readonly commitMode: WritableSignal<CngxSelectCommitMode>;
  readonly commitAction: WritableSignal<CngxSelectCommitAction<T[]> | null>;
  readonly coreMock: CoreMock;
  readonly beginToggleLog: Array<[T[], T[], CngxSelectOptionDef<T>]>;
  readonly beginClearLog: T[][];
  readonly toggledLog: Array<[CngxSelectOptionDef<T>, boolean]>;
  readonly changeLog: ArrayToggleChange<T>[];
  readonly onToggledLog: Array<[CngxSelectOptionDef<T>, boolean, number]>;
  clearedCount: number;
  dispatch: ReturnType<typeof createArrayToggleDispatch<T>>;
}

function makeHarness(initial: T[] = []): Harness {
  const values = signal<T[]>(initial);
  const coreMock: CoreMock = {
    commitController: createCommitController<T[]>(),
    togglingOption: signal<CngxSelectOptionDef<T> | null>(null),
    announceCalls: [],
    selected: [...initial],
    panelHostAdapter: {
      isSelected: (o) => coreMock.selected.includes(o.value),
    },
    announce(option, action, count, multi): void {
      coreMock.announceCalls.push({ option, action, count, multi });
    },
  };
  const h: Harness = {
    values,
    compareWith: signal<CngxSelectCompareFn<T>>((a, b) => Object.is(a, b)),
    commitMode: signal<CngxSelectCommitMode>('optimistic'),
    commitAction: signal<CngxSelectCommitAction<T[]> | null>(null),
    coreMock,
    beginToggleLog: [],
    beginClearLog: [],
    toggledLog: [],
    changeLog: [],
    onToggledLog: [],
    clearedCount: 0,
    dispatch: null as unknown as ReturnType<typeof createArrayToggleDispatch<T>>,
  };
  h.dispatch = createArrayToggleDispatch<T>({
    values,
    compareWith: h.compareWith,
    commitMode: h.commitMode,
    commitAction: h.commitAction,
    core: coreMock as unknown as CngxSelectCore<T, T[]>,
    beginToggle: (next, previous, option) => h.beginToggleLog.push([next, previous, option]),
    beginClear: (previous) => h.beginClearLog.push(previous),
    emitOptionToggled: (option, added) => h.toggledLog.push([option, added]),
    emitSelectionChange: (change) => h.changeLog.push(change),
    emitCleared: () => {
      h.clearedCount += 1;
    },
    onToggled: (option, isNowSelected) =>
      h.onToggledLog.push([option, isNowSelected, h.toggledLog.length]),
  });
  return h;
}

describe('createArrayToggleDispatch', () => {
  let h: Harness;

  describe('finalizeToggle', () => {
    beforeEach(() => {
      h = makeHarness(['a', 'b']);
    });

    it('emits optionToggled, a toggle change and an added announce for a selection', () => {
      h.dispatch.finalizeToggle(opt('b'), true, ['a']);
      expect(h.toggledLog).toEqual([[opt('b'), true]]);
      expect(h.changeLog).toEqual([
        {
          values: ['a', 'b'],
          previousValues: ['a'],
          added: ['b'],
          removed: [],
          option: opt('b'),
          action: 'toggle',
        },
      ]);
      expect(h.coreMock.announceCalls).toEqual([
        { option: opt('b'), action: 'added', count: 2, multi: true },
      ]);
    });

    it('emits a removal change and a removed announce for a deselection', () => {
      h.dispatch.finalizeToggle(opt('c'), false, ['a', 'b', 'c']);
      expect(h.changeLog[0].added).toEqual([]);
      expect(h.changeLog[0].removed).toEqual(['c']);
      expect(h.coreMock.announceCalls[0].action).toBe('removed');
    });

    it('defaults previousValues to an empty array', () => {
      h.dispatch.finalizeToggle(opt('b'), true);
      expect(h.changeLog[0].previousValues).toEqual([]);
    });
  });

  describe('clearFinalize', () => {
    it('emits cleared plus a clear change without announcing', () => {
      h = makeHarness(['a']);
      h.dispatch.clearFinalize(['a'], []);
      expect(h.clearedCount).toBe(1);
      expect(h.changeLog).toEqual([
        {
          values: [],
          previousValues: ['a'],
          added: [],
          removed: ['a'],
          option: null,
          action: 'clear',
        },
      ]);
      expect(h.coreMock.announceCalls).toEqual([]);
    });
  });

  describe('clearAll - sync path', () => {
    beforeEach(() => {
      h = makeHarness(['a', 'b']);
    });

    it('empties values, finalizes and announces the removal', () => {
      h.dispatch.clearAll();
      expect(h.values()).toEqual([]);
      expect(h.clearedCount).toBe(1);
      expect(h.changeLog[0]).toMatchObject({ action: 'clear', previousValues: ['a', 'b'] });
      expect(h.coreMock.announceCalls).toEqual([
        { option: null, action: 'removed', count: 0, multi: true },
      ]);
      expect(h.beginClearLog).toEqual([]);
    });

    it('is a no-op on an empty selection', () => {
      h.values.set([]);
      h.dispatch.clearAll();
      expect(h.clearedCount).toBe(0);
      expect(h.changeLog).toEqual([]);
    });
  });

  describe('clearAll - commit path', () => {
    beforeEach(() => {
      h = makeHarness(['a', 'b']);
      h.commitAction.set((next) => next);
    });

    it('nulls togglingOption, writes optimistically and routes to beginClear', () => {
      h.coreMock.togglingOption.set(opt('a'));
      h.dispatch.clearAll();
      expect(h.coreMock.togglingOption()).toBeNull();
      expect(h.values()).toEqual([]);
      expect(h.beginClearLog).toEqual([['a', 'b']]);
      expect(h.clearedCount).toBe(0);
    });

    it('keeps values untouched in pessimistic mode', () => {
      h.commitMode.set('pessimistic');
      h.dispatch.clearAll();
      expect(h.values()).toEqual(['a', 'b']);
      expect(h.beginClearLog).toEqual([['a', 'b']]);
    });
  });

  describe('handleADCommit', () => {
    beforeEach(() => {
      h = makeHarness(['a']);
      h.commitAction.set((next) => next);
    });

    it('adds an unselected value and routes to beginToggle', () => {
      h.dispatch.handleADCommit('b', opt('b'));
      expect(h.coreMock.togglingOption()).toEqual(opt('b'));
      expect(h.values()).toEqual(['a', 'b']);
      expect(h.beginToggleLog).toEqual([[['a', 'b'], ['a'], opt('b')]]);
    });

    it('removes an already-selected value', () => {
      h.dispatch.handleADCommit('a', opt('a'));
      expect(h.values()).toEqual([]);
      expect(h.beginToggleLog).toEqual([[[], ['a'], opt('a')]]);
    });

    it('keeps values untouched in pessimistic mode but still routes the commit', () => {
      h.commitMode.set('pessimistic');
      h.dispatch.handleADCommit('b', opt('b'));
      expect(h.values()).toEqual(['a']);
      expect(h.beginToggleLog).toEqual([[['a', 'b'], ['a'], opt('b')]]);
    });

    it('hands beginToggle the live selection while another commit is in flight', () => {
      commitLedgerFor<T[], T>(h.coreMock.commitController).beginMembers<T[]>({
        kind: 'toggle',
        next: ['a', 'x'],
        previous: ['a'],
        action: () => new Subject<T[]>(),
        commitAction: h.commitAction,
        value: h.values,
        same: (x, y) => x.length === y.length && x.every((v, i) => v === y[i]),
        commitMode: h.commitMode,
        onSuccess: () => undefined,
      });
      h.values.set(['a', 'x']);
      h.dispatch.handleADCommit('b', opt('b'));
      expect(h.beginToggleLog).toEqual([[['a', 'x', 'b'], ['a', 'x'], opt('b')]]);
    });

    it('performs the optimistic write even without a commit action but routes nothing', () => {
      h.commitAction.set(null);
      h.dispatch.handleADCommit('b', opt('b'));
      expect(h.values()).toEqual(['a', 'b']);
      expect(h.beginToggleLog).toEqual([]);
    });
  });

  describe('handleADActivate', () => {
    it('recovers the pre-mutation snapshot for a post-write selection', () => {
      h = makeHarness(['a', 'b']);
      h.coreMock.selected = ['a', 'b'];
      h.dispatch.handleADActivate('b', opt('b'));
      expect(h.changeLog[0]).toMatchObject({
        values: ['a', 'b'],
        previousValues: ['a'],
        added: ['b'],
        action: 'toggle',
      });
    });

    it('recovers the pre-mutation snapshot for a post-write deselection', () => {
      h = makeHarness(['a']);
      h.coreMock.selected = ['a'];
      h.dispatch.handleADActivate('b', opt('b'));
      expect(h.changeLog[0]).toMatchObject({
        previousValues: ['a', 'b'],
        added: [],
        removed: ['b'],
      });
    });
  });

  describe('onToggled', () => {
    it('runs before the toggle events with the toggled option and direction', () => {
      h = makeHarness(['a', 'b']);
      h.dispatch.finalizeToggle(opt('b'), true, ['a']);
      h.dispatch.finalizeToggle(opt('a'), false, ['a', 'b']);
      expect(h.onToggledLog).toEqual([
        [opt('b'), true, 0],
        [opt('a'), false, 1],
      ]);
    });

    it('does not run for a clear', () => {
      h = makeHarness(['a']);
      h.dispatch.clearAll();
      expect(h.onToggledLog).toEqual([]);
    });
  });

  describe('toggleByUser', () => {
    it('without a commit action writes the toggle and finalizes it', () => {
      h = makeHarness(['a']);
      h.dispatch.toggleByUser(opt('b'));
      expect(h.values()).toEqual(['a', 'b']);
      expect(h.beginToggleLog).toEqual([]);
      expect(h.changeLog[0]).toMatchObject({
        values: ['a', 'b'],
        previousValues: ['a'],
        added: ['b'],
        action: 'toggle',
      });

      h.dispatch.toggleByUser(opt('a'));
      expect(h.values()).toEqual(['b']);
      expect(h.changeLog[1]).toMatchObject({ previousValues: ['a', 'b'], removed: ['a'] });
      expect(h.coreMock.announceCalls.map((c) => c.action)).toEqual(['added', 'removed']);
    });

    it('with a commit action routes through the AD commit path', () => {
      h = makeHarness(['a']);
      h.commitAction.set((next) => next);
      h.dispatch.toggleByUser(opt('b'));
      expect(h.coreMock.togglingOption()).toEqual(opt('b'));
      expect(h.values()).toEqual(['a', 'b']);
      expect(h.beginToggleLog).toEqual([[['a', 'b'], ['a'], opt('b')]]);
      expect(h.changeLog).toEqual([]);
    });

    it('with a commit action in pessimistic mode leaves values to the commit', () => {
      h = makeHarness(['a']);
      h.commitAction.set((next) => next);
      h.commitMode.set('pessimistic');
      h.dispatch.toggleByUser(opt('a'));
      expect(h.values()).toEqual(['a']);
      expect(h.beginToggleLog).toEqual([[[], ['a'], opt('a')]]);
    });
  });
});
