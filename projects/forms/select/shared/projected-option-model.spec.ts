import { signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxOption, CngxOptionContainer } from '@cngx/common/interactive';

import type { CngxSelectMatchOption } from './config';

import {
  CNGX_PROJECTED_OPTION_MODEL_FACTORY,
  createProjectedOptionModel,
} from './projected-option-model';

type T = string;

function fakeOption(id: string, value: T, label: string, disabled = false): CngxOptionContainer {
  return {
    kind: 'option',
    id,
    value: () => value,
    label: () => label,
    disabled: () => disabled,
  } as unknown as CngxOptionContainer;
}

function fakeGroup(label: string, children: CngxOptionContainer[]): CngxOptionContainer {
  return {
    kind: 'group',
    label: () => label,
    options: () => children,
  } as unknown as CngxOptionContainer;
}

function labelMatches(option: CngxSelectMatchOption<T>, term: string): boolean {
  return option.label.toLowerCase().includes(term.toLowerCase());
}

function make(
  initial: CngxOptionContainer[],
  term = '',
): {
  containers: WritableSignal<readonly CngxOptionContainer[]>;
  searchTerm: WritableSignal<string>;
  model: ReturnType<typeof createProjectedOptionModel<T>>;
} {
  const containers = signal<readonly CngxOptionContainer[]>(initial);
  const searchTerm = signal(term);
  const model = createProjectedOptionModel<T>({
    containers,
    searchTerm,
    matches: labelMatches,
  });
  return { containers, searchTerm, model };
}

describe('createProjectedOptionModel', () => {
  it('folds projected leaf options into a flat option-def list', () => {
    const { model } = make([fakeOption('o1', 'a', 'Alpha'), fakeOption('o2', 'b', 'Beta', true)]);
    expect(model.derivedOptions()).toEqual([
      { value: 'a', label: 'Alpha', disabled: false },
      { value: 'b', label: 'Beta', disabled: true },
    ]);
  });

  it('preserves group hierarchy with children', () => {
    const { model } = make([
      fakeGroup('Group', [fakeOption('o1', 'a', 'Alpha'), fakeOption('o2', 'b', 'Beta')]),
    ]);
    expect(model.derivedOptions()).toEqual([
      {
        label: 'Group',
        children: [
          { value: 'a', label: 'Alpha', disabled: false },
          { value: 'b', label: 'Beta', disabled: false },
        ],
      },
    ]);
  });

  it('flattens groups into a single projectedOptions list', () => {
    const { model } = make([
      fakeOption('o1', 'a', 'Alpha'),
      fakeGroup('Group', [fakeOption('o2', 'b', 'Beta')]),
    ]);
    expect(model.projectedOptions().map((o) => o.id)).toEqual(['o1', 'o2']);
  });

  it('returns the unfiltered reference for an empty search term', () => {
    const { model } = make([fakeOption('o1', 'a', 'Alpha')]);
    expect(model.visibleProjectedOptions()).toBe(model.projectedOptions());
  });

  it('filters visible options by the match policy for a non-empty term', () => {
    const { model, searchTerm } = make([
      fakeOption('o1', 'a', 'Alpha'),
      fakeOption('o2', 'b', 'Beta'),
    ]);
    searchTerm.set('al');
    expect(model.visibleProjectedOptions().map((o) => o.id)).toEqual(['o1']);
  });

  it('projects AD items from the visible options', () => {
    const { model } = make([fakeOption('o1', 'a', 'Alpha', true)]);
    expect(model.adItems()).toEqual([
      { id: 'o1', value: 'a', label: 'Alpha', disabled: true },
    ]);
  });

  describe('reference stability (structural equal)', () => {
    it('keeps the derivedOptions reference when new containers carry identical content', () => {
      const { model, containers } = make([fakeOption('o1', 'a', 'Alpha')]);
      const first = model.derivedOptions();
      // Fresh container instance, structurally identical option def.
      containers.set([fakeOption('o1-new', 'a', 'Alpha')]);
      expect(model.derivedOptions()).toBe(first);
    });

    it('keeps the adItems reference when the visible AD content is unchanged', () => {
      const { model, containers } = make([fakeOption('o1', 'a', 'Alpha')]);
      const first = model.adItems();
      containers.set([fakeOption('o1', 'a', 'Alpha')]);
      expect(model.adItems()).toBe(first);
    });

    it('produces a fresh derivedOptions reference when content actually changes', () => {
      const { model, containers } = make([fakeOption('o1', 'a', 'Alpha')]);
      const first = model.derivedOptions();
      containers.set([fakeOption('o1', 'a', 'Alpha renamed')]);
      expect(model.derivedOptions()).not.toBe(first);
    });
  });
});

describe('createProjectedOptionModel - stable match records', () => {
  function liveOption(id: string, value: T, label: WritableSignal<string>): CngxOptionContainer {
    return {
      kind: 'option',
      id,
      value: () => value,
      label: () => label(),
      disabled: () => false,
    } as unknown as CngxOptionContainer;
  }

  function recording(initial: CngxOptionContainer[]) {
    const seen: CngxSelectMatchOption<T>[] = [];
    const searchTerm = signal('');
    const model = createProjectedOptionModel<T>({
      containers: signal<readonly CngxOptionContainer[]>(initial),
      searchTerm,
      matches: (option, term) => {
        seen.push(option);
        return labelMatches(option, term);
      },
    });
    return { model, searchTerm, seen };
  }

  it('hands the matcher the same record per option across filter runs', () => {
    const { model, searchTerm, seen } = recording([
      fakeOption('o1', 'a', 'Alpha'),
      fakeOption('o2', 'b', 'Beta'),
    ]);
    searchTerm.set('al');
    model.visibleProjectedOptions();
    searchTerm.set('be');
    model.visibleProjectedOptions();
    expect(seen).toHaveLength(4);
    expect(seen[2]).toBe(seen[0]);
    expect(seen[3]).toBe(seen[1]);
    expect(seen[0]).toEqual({ value: 'a', label: 'Alpha' });
    expect(seen[0]).not.toHaveProperty('id');
  });

  it('returns the record the matcher saw from recordFor', () => {
    const { model, searchTerm, seen } = recording([fakeOption('o1', 'a', 'Alpha')]);
    searchTerm.set('al');
    model.visibleProjectedOptions();
    const option = model.projectedOptions()[0] as CngxOption;
    expect(model.recordFor(option)).toBe(seen[0]);
  });

  it('refreshes the record once the label changes', () => {
    const label = signal('Alpha');
    const { model, searchTerm, seen } = recording([liveOption('o1', 'a', label)]);
    searchTerm.set('a');
    model.visibleProjectedOptions();
    label.set('Aleph');
    model.visibleProjectedOptions();
    expect(seen).toHaveLength(2);
    expect(seen[1]).not.toBe(seen[0]);
    expect(seen[1]).toEqual({ value: 'a', label: 'Aleph' });
    const option = model.projectedOptions()[0] as CngxOption;
    expect(model.recordFor(option)).toBe(seen[1]);
  });
});

describe('CNGX_PROJECTED_OPTION_MODEL_FACTORY', () => {
  it('defaults to createProjectedOptionModel', () => {
    expect(TestBed.inject(CNGX_PROJECTED_OPTION_MODEL_FACTORY)).toBe(createProjectedOptionModel);
  });
});
