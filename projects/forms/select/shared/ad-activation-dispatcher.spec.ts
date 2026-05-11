import { Component, signal, type Signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Subject } from 'rxjs';

import type { CngxListbox } from '@cngx/common/interactive';
import type { CngxPopover } from '@cngx/common/popover';

import { createADActivationDispatcher } from './ad-activation-dispatcher';
import type { CngxSelectCommitAction } from './commit-action.types';
import type { CngxSelectOptionDef } from './option.model';
import type { CngxSelectCore } from './select-core';

// ── Shared mocks ───────────────────────────────────────────────────────

type Value = string;

function makeOption(value: Value): CngxSelectOptionDef<Value> {
  return { value, label: value, disabled: false };
}

interface MockListbox {
  readonly ad: { readonly activated: Subject<unknown> };
}

function makeListbox(): { lb: CngxListbox<unknown>; activated: Subject<unknown> } {
  const activated = new Subject<unknown>();
  const mock: MockListbox = { ad: { activated } };
  return { lb: mock as unknown as CngxListbox<unknown>, activated };
}

function makeCore(options: readonly CngxSelectOptionDef<Value>[]): CngxSelectCore<Value, unknown> {
  const map = new Map(options.map((o) => [o.value, o]));
  return {
    findOption: (value: Value) => map.get(value) ?? null,
  } as unknown as CngxSelectCore<Value, unknown>;
}

function makePopover(): { popoverRef: Signal<CngxPopover | null>; hideCount: { n: number } } {
  const hideCount = { n: 0 };
  const pop = { hide: () => void hideCount.n++ };
  return {
    popoverRef: signal<CngxPopover | null>(pop as unknown as CngxPopover).asReadonly(),
    hideCount,
  };
}

// ── Host probe — installs the dispatcher in its constructor ────────────

interface ProbeInputs {
  readonly listboxRef: WritableSignal<CngxListbox<unknown> | null>;
  readonly commitAction: WritableSignal<CngxSelectCommitAction<unknown> | null>;
  readonly popoverRef?: Signal<CngxPopover | null>;
  readonly core: CngxSelectCore<Value, unknown>;
  readonly closeOnSelect: boolean;
  readonly onCommit: (v: Value, o: CngxSelectOptionDef<Value>) => void;
  readonly onActivate: (v: Value, o: CngxSelectOptionDef<Value>) => void;
}

@Component({ selector: 'dispatch-probe', template: '', standalone: true })
class DispatchProbe {
  static inputs: ProbeInputs;
  constructor() {
    createADActivationDispatcher<Value, unknown>({
      listboxRef: DispatchProbe.inputs.listboxRef,
      core: DispatchProbe.inputs.core,
      popoverRef: DispatchProbe.inputs.popoverRef,
      closeOnSelect: DispatchProbe.inputs.closeOnSelect,
      commitAction: DispatchProbe.inputs.commitAction,
      onCommit: DispatchProbe.inputs.onCommit,
      onActivate: DispatchProbe.inputs.onActivate,
    });
  }
}

function installProbe(
  inputs: ProbeInputs,
): ReturnType<typeof TestBed.createComponent<DispatchProbe>> {
  DispatchProbe.inputs = inputs;
  TestBed.configureTestingModule({ imports: [DispatchProbe] });
  const fixture = TestBed.createComponent(DispatchProbe);
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  return fixture;
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('createADActivationDispatcher', () => {
  const optA = makeOption('a');
  const optB = makeOption('b');
  const core = makeCore([optA, optB]);
  const noopCommit: CngxSelectCommitAction<unknown> = () => undefined;

  let commitAction: WritableSignal<CngxSelectCommitAction<unknown> | null>;
  let listboxRef: WritableSignal<CngxListbox<unknown> | null>;
  let onCommitCalls: Array<[Value, CngxSelectOptionDef<Value>]>;
  let onActivateCalls: Array<[Value, CngxSelectOptionDef<Value>]>;

  beforeEach(() => {
    commitAction = signal<CngxSelectCommitAction<unknown> | null>(null);
    listboxRef = signal<CngxListbox<unknown> | null>(null);
    onCommitCalls = [];
    onActivateCalls = [];
  });

  it('is a no-op until the listbox ref resolves', () => {
    const { lb, activated } = makeListbox();
    installProbe({
      listboxRef,
      commitAction,
      core,
      closeOnSelect: false,
      onCommit: (v, o) => onCommitCalls.push([v, o]),
      onActivate: (v, o) => onActivateCalls.push([v, o]),
    });
    // No subscription yet — emitting on the mock should do nothing.
    activated.next('a');
    expect(onActivateCalls).toEqual([]);

    // After the ref resolves, subscription wires up and activations flow.
    listboxRef.set(lb);
    TestBed.flushEffects();
    activated.next('a');
    expect(onActivateCalls).toEqual([['a', optA]]);
  });

  it('calls onActivate with value + option when commitAction is null', () => {
    const { lb, activated } = makeListbox();
    installProbe({
      listboxRef,
      commitAction,
      core,
      closeOnSelect: false,
      onCommit: (v, o) => onCommitCalls.push([v, o]),
      onActivate: (v, o) => onActivateCalls.push([v, o]),
    });
    listboxRef.set(lb);
    TestBed.flushEffects();

    activated.next('b');

    expect(onActivateCalls).toEqual([['b', optB]]);
    expect(onCommitCalls).toEqual([]);
  });

  it('calls onCommit instead of onActivate when commitAction is non-null', () => {
    const { lb, activated } = makeListbox();
    commitAction.set(noopCommit);
    installProbe({
      listboxRef,
      commitAction,
      core,
      closeOnSelect: false,
      onCommit: (v, o) => onCommitCalls.push([v, o]),
      onActivate: (v, o) => onActivateCalls.push([v, o]),
    });
    listboxRef.set(lb);
    TestBed.flushEffects();

    activated.next('a');

    expect(onCommitCalls).toEqual([['a', optA]]);
    expect(onActivateCalls).toEqual([]);
  });

  it('drops activations whose value does not resolve to a known option', () => {
    const { lb, activated } = makeListbox();
    installProbe({
      listboxRef,
      commitAction,
      core,
      closeOnSelect: false,
      onCommit: (v, o) => onCommitCalls.push([v, o]),
      onActivate: (v, o) => onActivateCalls.push([v, o]),
    });
    listboxRef.set(lb);
    TestBed.flushEffects();

    activated.next('unknown-value');

    expect(onActivateCalls).toEqual([]);
    expect(onCommitCalls).toEqual([]);
  });

  it('hides the popover after onActivate when closeOnSelect is true', () => {
    const { lb, activated } = makeListbox();
    const { popoverRef, hideCount } = makePopover();
    installProbe({
      listboxRef,
      commitAction,
      core,
      popoverRef,
      closeOnSelect: true,
      onCommit: () => {
        throw new Error('unreachable');
      },
      onActivate: (v, o) => onActivateCalls.push([v, o]),
    });
    listboxRef.set(lb);
    TestBed.flushEffects();

    activated.next('a');

    expect(onActivateCalls).toEqual([['a', optA]]);
    expect(hideCount.n).toBe(1);
  });

  it('does not hide the popover when closeOnSelect is false', () => {
    const { lb, activated } = makeListbox();
    const { popoverRef, hideCount } = makePopover();
    installProbe({
      listboxRef,
      commitAction,
      core,
      popoverRef,
      closeOnSelect: false,
      onCommit: () => undefined,
      onActivate: (v, o) => onActivateCalls.push([v, o]),
    });
    listboxRef.set(lb);
    TestBed.flushEffects();

    activated.next('a');

    expect(onActivateCalls.length).toBe(1);
    expect(hideCount.n).toBe(0);
  });

  it('does not hide the popover on the commit path even with closeOnSelect', () => {
    const { lb, activated } = makeListbox();
    const { popoverRef, hideCount } = makePopover();
    commitAction.set(noopCommit);
    installProbe({
      listboxRef,
      commitAction,
      core,
      popoverRef,
      closeOnSelect: true,
      onCommit: (v, o) => onCommitCalls.push([v, o]),
      onActivate: () => {
        throw new Error('unreachable');
      },
    });
    listboxRef.set(lb);
    TestBed.flushEffects();

    activated.next('a');

    expect(onCommitCalls).toEqual([['a', optA]]);
    expect(hideCount.n).toBe(0);
  });

  it('unsubscribes on host teardown — no activations after destroy', () => {
    const { lb, activated } = makeListbox();
    const fixture = installProbe({
      listboxRef,
      commitAction,
      core,
      closeOnSelect: false,
      onCommit: () => undefined,
      onActivate: (v, o) => onActivateCalls.push([v, o]),
    });
    listboxRef.set(lb);
    TestBed.flushEffects();

    activated.next('a');
    expect(onActivateCalls.length).toBe(1);

    fixture.destroy();

    activated.next('b');
    expect(onActivateCalls.length).toBe(1);
  });
});
