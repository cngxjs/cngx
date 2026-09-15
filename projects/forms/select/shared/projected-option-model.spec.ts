import { signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { CngxOptionContainer } from '@cngx/common/interactive';

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

function labelMatches(_value: T, label: string, term: string): boolean {
  return label.toLowerCase().includes(term.toLowerCase());
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

describe('CNGX_PROJECTED_OPTION_MODEL_FACTORY', () => {
  it('defaults to createProjectedOptionModel', () => {
    expect(TestBed.inject(CNGX_PROJECTED_OPTION_MODEL_FACTORY)).toBe(createProjectedOptionModel);
  });
});
