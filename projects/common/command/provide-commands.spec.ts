import { signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxCommand } from './command';
import { injectCommands, provideCommands } from './provide-commands';

function cmd(id: string, overrides: Partial<CngxCommand> = {}): CngxCommand {
  return { id, label: id, run: () => {}, ...overrides };
}

function merged(): Signal<readonly CngxCommand[]> {
  return TestBed.runInInjectionContext(() => injectCommands());
}

describe('provideCommands / injectCommands', () => {
  it('merges multiple provideCommands sources into one signal', () => {
    const a = cmd('a');
    const b = cmd('b');
    const c = cmd('c');
    TestBed.configureTestingModule({
      providers: [provideCommands([a, b]), provideCommands([c])],
    });

    expect(merged()().map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty list when no source is registered', () => {
    TestBed.configureTestingModule({});
    expect(merged()()).toEqual([]);
  });

  it('tracks a signal source live', () => {
    const source = signal<readonly CngxCommand[]>([cmd('a')]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    expect(commands().map((x) => x.id)).toEqual(['a']);
    source.set([cmd('a'), cmd('b')]);
    expect(commands().map((x) => x.id)).toEqual(['a', 'b']);
  });

  it('reflects a command disabled signal live', () => {
    const disabled = signal(false);
    const source = signal<readonly CngxCommand[]>([cmd('a', { disabled, disabledReason: 'busy' })]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    expect(commands()[0].disabled?.()).toBe(false);
    disabled.set(true);
    expect(commands()[0].disabled?.()).toBe(true);
    expect(commands()[0].disabledReason).toBe('busy');
  });

  it('does not emit a new array when an identical set is re-provided (equal holds)', () => {
    const a = cmd('a');
    const b = cmd('b');
    const source = signal<readonly CngxCommand[]>([a, b]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    const first = commands();
    // Fresh array literal, same command references, same order.
    source.set([a, b]);
    const second = commands();

    expect(second).toBe(first);
  });

  it('emits a new array when the command identity changes', () => {
    const source = signal<readonly CngxCommand[]>([cmd('a')]);
    TestBed.configureTestingModule({ providers: [provideCommands(source)] });
    const commands = merged();

    const first = commands();
    source.set([cmd('a')]); // same id, fresh reference
    const second = commands();

    expect(second).not.toBe(first);
  });
});
