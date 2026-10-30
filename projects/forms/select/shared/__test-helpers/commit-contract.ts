import { Component, DestroyRef, inject, signal, type Provider, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { EMPTY, Subject, type Observable } from 'rxjs';
import { afterEach, describe, expect, vi } from 'vitest';

import type { AsyncStatus } from '@cngx/core/utils';
import { CngxFormField, adaptFormControl } from '@cngx/forms/field';

import { CngxSelectAnnouncer } from '../announcer';
import {
  CNGX_ARRAY_COMMIT_HANDLER_FACTORY,
  createArrayCommitHandler,
  type CngxArrayCommitHandlerFactory,
} from '../array-commit-handler';
import type { CngxSelectCommitMode } from '../commit-action.types';
import {
  CNGX_REORDER_COMMIT_HANDLER_FACTORY,
  createReorderCommitHandler,
  type CngxReorderCommitHandlerFactory,
} from '../reorder-commit-handler';

/**
 * Commit kinds a composite can start. `select` is the scalar pick, `toggle`
 * the flat array toggle, `tree` the tree-node toggle.
 *
 * @internal
 */
export type CommitContractKind = 'select' | 'toggle' | 'clear' | 'reorder' | 'tree';

/**
 * Per-composite wiring for {@link describeCommitContract}.
 *
 * @internal
 */
export interface CommitContractHost {
  readonly name: string;
  readonly component: Type<unknown>;
  readonly selector: string;
  /** Inputs that make the composite render the three rows red, green, blue. */
  readonly inputs: string;
  readonly content?: string;
  readonly contentImports?: readonly Type<unknown>[];
  /** Selector of one pickable row inside the panel. */
  readonly optionSelector: string;
  /** `value` for scalar composites, `values` for array composites. */
  readonly model: 'value' | 'values';
  readonly kinds: readonly CommitContractKind[];
  /** The composite exposes a `displayWith` input. */
  readonly displayWith?: boolean;
}

/**
 * Case bodies of the commit contract. The spec decides per composite which
 * cases apply and whether a case is expected to fail on the current base.
 *
 * @internal
 */
export interface CommitContractCases {
  /** A3 / B2: a field holding `null` reads as empty and never reaches `displayWith`. */
  readonly fieldNullIsEmpty: () => void;
  /** A3 / B2: a field holding `''` reads as empty and never reaches `displayWith`. */
  readonly fieldEmptyStringIsEmpty: () => void;
  /** A1 / A11: Retry after a failed scalar pick replays the pick. */
  readonly retrySelect: () => void;
  /** A1 / A11: Retry after a failed array toggle replays the toggle. */
  readonly retryToggle: () => void;
  /** A1 / A11 (array) or A15 (scalar): Retry after a failed clear replays the clear. */
  readonly retryClear: () => void;
  /** A1 / A11: Retry after a failed reorder replays the reorder. */
  readonly retryReorder: () => void;
  /** A1: Retry after a failed reorder never replays an earlier successful clear. */
  readonly retryReorderNotStaleClear: () => void;
  /** A1 / A11: Retry after a failed tree toggle replays the tree toggle. */
  readonly retryTree: () => void;
  /** B3 / A12: a failed reorder is spoken assertively once the order is rolled back. */
  readonly reorderFailureAnnounced: () => void;
  /** A18: an action that completes without a value settles as error and unblocks closing. */
  readonly emptyActionSettles: () => void;
  /** A13: the soft announce policy never speaks the cleared phrase for a failed commit. */
  readonly softPolicyNeverSpeaksCleared: () => void;
  /** B11: a provided `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` is used. */
  readonly arrayHandlerFactoryUsed: () => void;
  /**
   * Retry after a failed toggle (or clear, on the tree) started by a custom
   * `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` handler calls that handler's
   * `retryLast`, never the internal ledger.
   */
  readonly customArrayHandlerOwnsRetry: () => void;
  /**
   * Retry routes by the handler that started the last commit: a failed
   * toggle replays through the array handler, a failed reorder started by a
   * custom `CNGX_REORDER_COMMIT_HANDLER_FACTORY` handler calls its
   * `retryLast`.
   */
  readonly customReorderHandlerOwnsRetry: () => void;
  /** A6: a letter key on the closed trigger commits through `commitAction`. */
  readonly closedTypeaheadCommits: () => void;
  /** A15: clear while a commit is pending wins over that commit. */
  readonly clearWhilePendingWins: () => void;
  /** A15: clear after a failed commit clears the commit error. */
  readonly clearClearsCommitError: () => void;
  /** A14: a second commit while one is pending rolls back to the confirmed value. */
  readonly secondCommitRollsBackToConfirmed: () => void;
}

const OPTIONS = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
];

const NODES = [{ value: 'red' }, { value: 'green' }, { value: 'blue' }];

const CLEARED_PHRASE = /selection cleared/i;

// jsdom has no Popover API.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: () => boolean;
  };
  if (typeof proto.showPopover === 'function') {
    return;
  }
  proto.showPopover = function (this: HTMLElement) {
    this.setAttribute('data-popover-open', 'true');
  };
  proto.hidePopover = function (this: HTMLElement) {
    this.removeAttribute('data-popover-open');
  };
  proto.togglePopover = function (this: HTMLElement) {
    const open = !this.hasAttribute('data-popover-open');
    if (open) {
      this.setAttribute('data-popover-open', 'true');
    } else {
      this.removeAttribute('data-popover-open');
    }
    return open;
  };
}

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

interface VariantApi {
  open(): void;
  close(): void;
  readonly panelOpen: () => boolean;
  readonly empty: () => boolean;
}

interface MountOptions {
  readonly mode?: CngxSelectCommitMode;
  readonly initial?: unknown;
  readonly softPolicy?: boolean;
  readonly respondEmpty?: boolean;
  readonly providers?: readonly Provider[];
}

let fieldSeed: string | null = null;

/**
 * Commit contract shared by the nine select-family composites: every commit
 * kind a composite supports settles, rolls back, speaks and retries the
 * same way. Mounted anchored with a deferred `[commitAction]` that records
 * every intended value.
 *
 * ```ts
 * describeCommitContract(SELECT, (c) => {
 *   it('A1/A11: Retry after a failed select replays the select', c.retrySelect);
 *   it.fails('A6: a letter key on the closed trigger calls commitAction', c.closedTypeaheadCommits);
 * });
 * ```
 *
 * @internal
 */
export function describeCommitContract(
  host: CommitContractHost,
  register: (cases: CommitContractCases) => void,
): void {
  describe(`commit contract (${host.name})`, () => {
    @Component({ template: '', host: { 'data-commit-contract-host': '' } })
    class ContractHost {
      readonly options = OPTIONS;
      readonly nodes = NODES;
      readonly idFn = (v: unknown): string => String(v);
      readonly labelFn = (v: unknown): string => String(v);
      readonly mode = signal<CngxSelectCommitMode>('optimistic');
      readonly model = signal<unknown>(undefined);
      readonly states: AsyncStatus[] = [];
      readonly calls: unknown[] = [];
      readonly pendings: Subject<unknown>[] = [];
      respondEmpty = false;
      readonly commitAction = (intended: unknown): Observable<unknown> => {
        this.calls.push(intended);
        if (this.respondEmpty) {
          return EMPTY;
        }
        const subject = new Subject<unknown>();
        this.pendings.push(subject);
        return subject.asObservable();
      };
    }

    @Component({ template: '' })
    class FieldHost {
      private readonly destroyRef = inject(DestroyRef);
      readonly options = OPTIONS;
      readonly nodes = NODES;
      readonly idFn = (v: unknown): string => String(v);
      readonly labelFn = (v: unknown): string => String(v);
      readonly displayWith = vi.fn((v: unknown) => `shown ${String(v)}`);
      readonly control = new FormControl<string | null>(fieldSeed);
      readonly field = adaptFormControl(this.control, 'pick', this.destroyRef);
    }

    const mountedRoots: HTMLElement[] = [];
    afterEach(() => {
      mountedRoots.splice(0).forEach((el) => el.remove());
    });

    const has = (kind: CommitContractKind): boolean => host.kinds.includes(kind);

    function attach<C>(fixture: ComponentFixture<C>) {
      const root = fixture.nativeElement as HTMLElement;
      document.body.appendChild(root);
      mountedRoots.push(root);
      fixture.detectChanges();
      flush(fixture as ComponentFixture<unknown>);
      const de = fixture.debugElement.query(By.directive(host.component));
      return {
        el: de.nativeElement as HTMLElement,
        variant: de.componentInstance as VariantApi,
      };
    }

    function mount(mountOpts: MountOptions = {}) {
      polyfillPopover();
      if (mountOpts.providers) {
        TestBed.configureTestingModule({ providers: [...mountOpts.providers] });
      }
      const binding = host.model === 'value' ? '[(value)]="model"' : '[(values)]="model"';
      const policy = mountOpts.softPolicy ? `[commitErrorAnnouncePolicy]="{ kind: 'soft' }"` : '';
      TestBed.overrideComponent(ContractHost, {
        set: {
          template: `
            <button type="button" class="outside-btn">Outside</button>
            <${host.selector}
              [label]="'Colour'"
              ${host.inputs}
              ${binding}
              [presentation]="'anchored'"
              [clearable]="true"
              [commitAction]="commitAction"
              [commitMode]="mode()"
              [commitErrorDisplay]="'banner'"
              ${policy}
              (stateChange)="states.push($event)"
            >${host.content ?? ''}</${host.selector}>`,
          imports: [host.component, ...(host.contentImports ?? [])],
        },
      });
      const fixture = TestBed.createComponent(ContractHost);
      const h = fixture.componentInstance;
      h.mode.set(mountOpts.mode ?? 'optimistic');
      h.model.set(mountOpts.initial ?? (host.model === 'value' ? undefined : []));
      h.respondEmpty = mountOpts.respondEmpty ?? false;
      const { el, variant } = attach(fixture);
      const f = fixture as ComponentFixture<unknown>;
      const settle = () => flush(f);
      const open = () => {
        if (!variant.panelOpen()) {
          variant.open();
        }
        settle();
      };
      const rows = () =>
        Array.from(el.querySelectorAll<HTMLElement>(`.cngx-select__panel ${host.optionSelector}`));
      const pickAt = (index: number) => {
        open();
        const row = rows()[index];
        expect(row, `${host.selector} renders no row ${index}`).toBeDefined();
        row.click();
        settle();
      };
      const trigger = () => {
        const t = el.querySelector<HTMLElement>('[role="combobox"]');
        expect(t, `${host.selector} renders no role="combobox" element`).not.toBeNull();
        return t!;
      };
      const clear = () => {
        const target = el.querySelector<HTMLElement>('.cngx-select__clear-target');
        expect(target, `${host.selector} renders no clear target`).not.toBeNull();
        target!.click();
        settle();
      };
      const retry = () => {
        open();
        const button = el.querySelector<HTMLElement>(
          '.cngx-select__commit-error .cngx-select__error-retry',
        );
        expect(button, `${host.selector} renders no commit-error Retry`).not.toBeNull();
        button!.click();
        settle();
      };
      const reorderFirstRight = () => {
        const chip = el.querySelector<HTMLElement>('[data-reorder-index="0"]');
        expect(chip, `${host.selector} renders no reorderable chip`).not.toBeNull();
        chip!.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            altKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
        settle();
      };
      const last = () => h.pendings.at(-1);
      const resolveLast = () => {
        last()!.next(undefined);
        last()!.complete();
        settle();
      };
      const rejectLast = () => {
        last()!.error(new Error('server down'));
        settle();
      };
      return {
        fixture: f,
        h,
        el,
        variant,
        settle,
        open,
        pickAt,
        trigger,
        clear,
        retry,
        reorderFirstRight,
        resolveLast,
        rejectLast,
      };
    }

    function mountField(seed: string | null) {
      polyfillPopover();
      fieldSeed = seed;
      const displayWith = host.displayWith ? '[displayWith]="displayWith"' : '';
      TestBed.overrideComponent(FieldHost, {
        set: {
          template: `
            <cngx-form-field [field]="field">
              <${host.selector} [label]="'Colour'" ${host.inputs} ${displayWith}>${host.content ?? ''}</${host.selector}>
            </cngx-form-field>`,
          imports: [CngxFormField, host.component, ...(host.contentImports ?? [])],
        },
      });
      const fixture = TestBed.createComponent(FieldHost);
      const { el, variant } = attach(fixture);
      return { h: fixture.componentInstance, el, variant };
    }

    function spyAnnouncements(read?: () => unknown) {
      const spoken: { message: string; politeness: string; value: unknown }[] = [];
      const spy = vi
        .spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce')
        .mockImplementation((message, politeness = 'polite') => {
          spoken.push({ message, politeness, value: read?.() });
        });
      return { spoken, restore: () => spy.mockRestore() };
    }

    function expectFieldEmpty(seed: string | null): void {
      const { h, el, variant } = mountField(seed);
      expect(variant.empty()).toBe(true);
      const input = el.querySelector<HTMLInputElement>('input');
      if (input) {
        expect(input.value).toBe('');
      }
      expect(el.textContent ?? '').not.toContain('null');
      const reached = h.displayWith.mock.calls.filter(([v]) => v === null || v === '');
      expect(reached).toEqual([]);
    }

    function requireKind(kind: CommitContractKind): void {
      expect(has(kind), `${host.name} does not declare the '${kind}' commit kind`).toBe(true);
    }

    function pickKind(): CommitContractKind {
      if (has('select')) {
        return 'select';
      }
      return has('tree') ? 'tree' : 'toggle';
    }

    const cases: CommitContractCases = {
      fieldNullIsEmpty: () => {
        expect(host.model).toBe('value');
        expectFieldEmpty(null);
      },

      fieldEmptyStringIsEmpty: () => {
        expect(host.model).toBe('value');
        expectFieldEmpty('');
      },

      retrySelect: () => {
        requireKind('select');
        const m = mount({ initial: 'red' });
        m.pickAt(1);
        expect(m.h.calls).toEqual(['green']);
        m.rejectLast();
        expect(m.h.model()).toBe('red');
        m.retry();
        expect(m.h.calls).toEqual(['green', 'green']);
        expect(m.h.model()).toBe('green');
      },

      retryToggle: () => {
        requireKind('toggle');
        const m = mount();
        m.pickAt(1);
        expect(m.h.calls).toEqual([['green']]);
        m.rejectLast();
        expect(m.h.model()).toEqual([]);
        m.retry();
        expect(m.h.calls).toEqual([['green'], ['green']]);
        expect(m.h.model()).toEqual(['green']);
      },

      retryTree: () => {
        requireKind('tree');
        const m = mount();
        m.pickAt(1);
        expect(m.h.calls).toEqual([['green']]);
        m.rejectLast();
        expect(m.h.model()).toEqual([]);
        m.retry();
        expect(m.h.calls).toEqual([['green'], ['green']]);
        expect(m.h.model()).toEqual(['green']);
      },

      retryClear: () => {
        requireKind('clear');
        const scalar = host.model === 'value';
        const m = mount({ initial: scalar ? 'red' : ['red'] });
        const cleared = scalar ? undefined : [];
        m.clear();
        expect(m.h.calls).toEqual([cleared]);
        m.rejectLast();
        expect(m.h.model()).toEqual(scalar ? 'red' : ['red']);
        m.retry();
        expect(m.h.calls).toEqual([cleared, cleared]);
      },

      retryReorder: () => {
        requireKind('reorder');
        const m = mount({ initial: ['red', 'green', 'blue'] });
        m.reorderFirstRight();
        expect(m.h.calls).toEqual([['green', 'red', 'blue']]);
        m.rejectLast();
        expect(m.h.model()).toEqual(['red', 'green', 'blue']);
        m.retry();
        expect(m.h.calls.at(-1)).toEqual(['green', 'red', 'blue']);
        expect(m.h.calls).toHaveLength(2);
      },

      retryReorderNotStaleClear: () => {
        requireKind('reorder');
        const m = mount({ initial: ['red', 'green'] });
        m.clear();
        m.resolveLast();
        expect(m.h.model()).toEqual([]);
        m.h.model.set(['red', 'green', 'blue']);
        m.settle();
        m.reorderFirstRight();
        m.rejectLast();
        m.retry();
        expect(m.h.calls.at(-1)).toEqual(['green', 'red', 'blue']);
        expect(m.h.model()).not.toEqual([]);
      },

      reorderFailureAnnounced: () => {
        requireKind('reorder');
        const m = mount({ initial: ['red', 'green', 'blue'] });
        m.reorderFirstRight();
        const { spoken, restore } = spyAnnouncements(() => m.h.model());
        m.rejectLast();
        restore();
        const assertive = spoken.filter((s) => s.politeness === 'assertive');
        expect(assertive).toHaveLength(1);
        expect(assertive[0].value).toEqual(['red', 'green', 'blue']);
      },

      emptyActionSettles: () => {
        const m = mount({ mode: 'pessimistic', respondEmpty: true });
        m.pickAt(1);
        expect(m.h.calls).toHaveLength(1);
        expect(m.h.states.at(-1)).toBe('error');
        expect(m.variant.panelOpen()).toBe(true);
        const outside = document.querySelector<HTMLElement>('.outside-btn')!;
        m.trigger().dispatchEvent(
          new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }),
        );
        m.settle();
        expect(m.variant.panelOpen()).toBe(false);
      },

      softPolicyNeverSpeaksCleared: () => {
        const m = mount({ softPolicy: true, initial: host.model === 'value' ? 'red' : [] });
        m.pickAt(1);
        expect(m.h.calls).toHaveLength(1);
        const { spoken, restore } = spyAnnouncements();
        m.rejectLast();
        restore();
        expect(spoken.map((s) => s.message).filter((s) => CLEARED_PHRASE.test(s))).toEqual([]);
        const soft = spoken.filter((s) =>
          s.message.includes('Save failed, previous value restored'),
        );
        expect(soft.map((s) => s.politeness)).toEqual(['polite']);
      },

      arrayHandlerFactoryUsed: () => {
        expect(host.model).toBe('values');
        const factory = vi.fn(createArrayCommitHandler) as unknown as CngxArrayCommitHandlerFactory;
        mount({ providers: [{ provide: CNGX_ARRAY_COMMIT_HANDLER_FACTORY, useValue: factory }] });
        expect(factory).toHaveBeenCalled();
      },

      customArrayHandlerOwnsRetry: () => {
        expect(host.model).toBe('values');
        const retryLast = vi.fn();
        const factory: CngxArrayCommitHandlerFactory = (opts) => ({
          ...createArrayCommitHandler(opts),
          retryLast,
        });
        const viaToggle = has('toggle');
        const m = mount({
          initial: viaToggle ? [] : ['red'],
          providers: [{ provide: CNGX_ARRAY_COMMIT_HANDLER_FACTORY, useValue: factory }],
        });
        if (viaToggle) {
          m.pickAt(1);
        } else {
          m.clear();
        }
        m.rejectLast();
        m.retry();
        expect(retryLast).toHaveBeenCalledTimes(1);
        expect(m.h.calls).toHaveLength(1);
      },

      customReorderHandlerOwnsRetry: () => {
        requireKind('reorder');
        const retryLast = vi.fn();
        const factory: CngxReorderCommitHandlerFactory = (opts) => ({
          ...createReorderCommitHandler(opts),
          retryLast,
        });
        const m = mount({
          initial: ['red', 'green', 'blue'],
          providers: [{ provide: CNGX_REORDER_COMMIT_HANDLER_FACTORY, useValue: factory }],
        });
        m.reorderFirstRight();
        m.rejectLast();
        m.retry();
        expect(retryLast).toHaveBeenCalledTimes(1);
        expect(m.h.calls).toHaveLength(1);
        m.clear();
        m.rejectLast();
        m.retry();
        expect(retryLast).toHaveBeenCalledTimes(1);
        expect(m.h.calls).toEqual([['green', 'red', 'blue'], [], []]);
      },

      closedTypeaheadCommits: () => {
        requireKind('select');
        const m = mount();
        expect(m.variant.panelOpen()).toBe(false);
        const t = m.trigger();
        t.focus();
        t.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'g', bubbles: true, cancelable: true }),
        );
        m.settle();
        expect(m.h.calls).toEqual(['green']);
      },

      clearWhilePendingWins: () => {
        requireKind('select');
        const m = mount({ initial: 'red' });
        m.pickAt(1);
        const first = m.h.pendings[0];
        if (m.variant.panelOpen()) {
          m.variant.close();
          m.settle();
        }
        m.clear();
        first.next(undefined);
        first.complete();
        m.settle();
        if (m.h.pendings.length > 1) {
          m.resolveLast();
        }
        expect(m.h.model()).toBeUndefined();
      },

      clearClearsCommitError: () => {
        requireKind('select');
        const m = mount({ initial: 'red' });
        m.pickAt(1);
        m.rejectLast();
        expect(m.trigger().getAttribute('aria-invalid')).toBe('true');
        if (m.variant.panelOpen()) {
          m.variant.close();
          m.settle();
        }
        m.clear();
        if (m.h.pendings.length > 1) {
          m.resolveLast();
        }
        expect(m.h.model()).toBeUndefined();
        expect(m.trigger().getAttribute('aria-invalid')).not.toBe('true');
      },

      secondCommitRollsBackToConfirmed: () => {
        const kind = pickKind();
        const m = mount();
        m.pickAt(1);
        m.pickAt(2);
        expect(m.h.calls).toHaveLength(2);
        m.rejectLast();
        expect(m.h.model()).toEqual(kind === 'select' ? undefined : []);
      },
    };

    register(cases);
  });
}
