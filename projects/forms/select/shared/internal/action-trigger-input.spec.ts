import { Injector, signal, type ElementRef } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';

import { createDefaultFlatNavStrategy } from '../flat-nav-strategy';
import { createActionTriggerInput } from './action-trigger-input';
import { cngxSelectDefaultCompare } from './select-core';
import type { CngxListbox } from '@cngx/common/interactive';

interface Harness {
  readonly searchTerm: ReturnType<typeof signal<string>>;
  readonly liveInputFallback: ReturnType<typeof signal<boolean>>;
  readonly dispatchLog: Array<[{ readonly label: string }, string, string | undefined]>;
  activeItem: object | null;
  hasAction: boolean;
  inputValue: string;
  previous: string | undefined;
  trigger: ReturnType<typeof createActionTriggerInput<string | undefined>>;
}

function makeHarness(): Harness {
  const searchTerm = signal<string>('');
  const liveInputFallback = signal<boolean>(true);
  const h: Harness = {
    searchTerm,
    liveInputFallback,
    dispatchLog: [],
    activeItem: null,
    hasAction: true,
    inputValue: '',
    previous: undefined,
    trigger: null as unknown as Harness['trigger'],
  };
  h.trigger = createActionTriggerInput<string | undefined>({
    listbox: () => ({ ad: { activeItem: () => h.activeItem } }) as unknown as CngxListbox,
    popover: () => undefined,
    strategy: createDefaultFlatNavStrategy(),
    flatOptions: () => [],
    compareWith: () => cngxSelectDefaultCompare,
    input: () =>
      ({ nativeElement: { value: h.inputValue } }) as unknown as ElementRef<HTMLInputElement>,
    searchTerm,
    liveInputFallback,
    hasQuickCreateAction: () => h.hasAction,
    snapshotPrevious: () => h.previous,
    dispatch: (draft, term, previous) => h.dispatchLog.push([draft, term, previous]),
    // The deferred Enter path is covered by search-debounce-window.spec.ts.
    injector: Injector.NULL,
  });
  return h;
}

function enterEvent(): Event & { prevented: boolean } {
  const e = new Event('keydown', { cancelable: true }) as Event & { prevented: boolean };
  Object.defineProperty(e, 'prevented', { get: () => e.defaultPrevented });
  return e;
}

describe('createActionTriggerInput', () => {
  let h: Harness;

  beforeEach(() => {
    h = makeHarness();
  });

  describe('resolveLiveTerm', () => {
    it('returns the debounced term when it is non-empty', () => {
      h.searchTerm.set('ab');
      h.inputValue = 'abc';
      expect(h.trigger.resolveLiveTerm()).toBe('ab');
    });

    it('falls back to the raw input value inside the debounce window', () => {
      h.inputValue = 'abc';
      expect(h.trigger.resolveLiveTerm()).toBe('abc');
    });

    it('skips the fallback when liveInputFallback is disabled', () => {
      h.liveInputFallback.set(false);
      h.inputValue = 'abc';
      expect(h.trigger.resolveLiveTerm()).toBe('');
    });
  });

  describe('handleActionCommit', () => {
    it('dispatches the draft with the live term and the previous snapshot', () => {
      h.searchTerm.set('te');
      h.previous = 'old';
      h.trigger.handleActionCommit({ label: 'team' });
      expect(h.dispatchLog).toEqual([[{ label: 'team' }, 'te', 'old']]);
    });

    it('defaults the draft to the live term', () => {
      h.searchTerm.set('team');
      h.trigger.handleActionCommit();
      expect(h.dispatchLog).toEqual([[{ label: 'team' }, 'team', undefined]]);
    });

    it('no-ops on an empty effective label', () => {
      h.trigger.handleActionCommit();
      expect(h.dispatchLog).toEqual([]);
    });
  });

  describe('handleTriggerEnter', () => {
    it('fires quick-create for a non-empty term with no active AD item', () => {
      h.searchTerm.set('new tag');
      const e = enterEvent();
      h.trigger.handleTriggerEnter(e);
      expect(e.defaultPrevented).toBe(true);
      expect(h.dispatchLog).toEqual([[{ label: 'new tag' }, 'new tag', undefined]]);
    });

    it('stays inert while an AD item is active (listbox owns activation)', () => {
      h.activeItem = {};
      h.searchTerm.set('new tag');
      const e = enterEvent();
      h.trigger.handleTriggerEnter(e);
      expect(e.defaultPrevented).toBe(false);
      expect(h.dispatchLog).toEqual([]);
    });

    it('stays inert without a bound quickCreateAction', () => {
      h.hasAction = false;
      h.searchTerm.set('new tag');
      h.trigger.handleTriggerEnter(enterEvent());
      expect(h.dispatchLog).toEqual([]);
    });

    it('stays inert on an empty term', () => {
      const e = enterEvent();
      h.trigger.handleTriggerEnter(e);
      expect(e.defaultPrevented).toBe(false);
      expect(h.dispatchLog).toEqual([]);
    });

    it('does not create on the Enter that confirms an IME composition', () => {
      h.searchTerm.set('にほん');
      const composing = new KeyboardEvent('keydown', {
        key: 'Enter',
        isComposing: true,
        cancelable: true,
      });
      h.trigger.handleTriggerEnter(composing);
      expect(composing.defaultPrevented).toBe(false);
      expect(h.dispatchLog).toEqual([]);
    });

    it('does not create on a keyCode 229 Enter (Safari composition end)', () => {
      h.searchTerm.set('にほん');
      const safari = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, cancelable: true });
      h.trigger.handleTriggerEnter(safari);
      expect(h.dispatchLog).toEqual([]);

      h.trigger.handleTriggerEnter(
        new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
      );
      expect(h.dispatchLog).toEqual([[{ label: 'にほん' }, 'にほん', undefined]]);
    });
  });
});
