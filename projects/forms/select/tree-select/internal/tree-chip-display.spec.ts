import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createTreeController } from '@cngx/common/interactive';
import type { CngxTreeNode } from '@cngx/utils';
import { describe, expect, it } from 'vitest';

import type { CngxTreeSelectChipDisplay, CngxTreeSelectedItem } from '../tree-select.model';
import { createTreeChipDisplay } from './tree-chip-display';

// Frontend
//   Web (Angular, React)
//   Mobile
// Backend
function nodes(): CngxTreeNode<string>[] {
  return [
    {
      value: 'frontend',
      children: [
        { value: 'web', children: [{ value: 'angular' }, { value: 'react' }] },
        { value: 'mobile' },
      ],
    },
    { value: 'backend', children: [{ value: 'java' }, { value: 'legacy', disabled: true }] },
  ];
}

function setup(values: string[], mode: CngxTreeSelectChipDisplay) {
  const selected = signal<readonly CngxTreeSelectedItem<string>[]>(
    values.map((value) => ({ value, label: value })),
  );
  const modeSig = signal(mode);
  const treeController = TestBed.runInInjectionContext(() =>
    createTreeController<string>({ nodes: signal(nodes()), nodeIdFn: (v) => v }),
  );
  const display = createTreeChipDisplay<string>({ selected, mode: modeSig, treeController });
  const shown = (): string[] => display.displayed().map((i) => i.value);
  return { selected, modeSig, display, shown };
}

const FULL_FRONTEND = ['frontend', 'web', 'angular', 'react', 'mobile'];

describe('createTreeChipDisplay', () => {
  it('parents: one chip for the topmost fully selected node', () => {
    const t = setup([...FULL_FRONTEND, 'java'], 'parents');
    expect(t.shown()).toEqual(['frontend', 'java']);
    expect(t.display.summarizes('frontend')).toBe(true);
    expect(t.display.summarizes('web')).toBe(true);
    expect(t.display.summarizes('java')).toBe(false);
  });

  it('parents: a partly selected parent shows every selected value', () => {
    const t = setup(['frontend', 'web', 'angular', 'react'], 'parents');
    expect(t.shown()).toEqual(['frontend', 'web']);
    expect(t.display.summarizes('frontend')).toBe(false);
  });

  it('leaves: hides fully selected parents and shows their descendants', () => {
    const t = setup(FULL_FRONTEND, 'leaves');
    expect(t.shown()).toEqual(['angular', 'react', 'mobile']);
    expect(t.display.summarizes('frontend')).toBe(false);
  });

  it('all: one chip per value', () => {
    const t = setup(FULL_FRONTEND, 'all');
    expect(t.shown()).toEqual(FULL_FRONTEND);
  });

  it('a disabled unselected descendant does not break "fully selected"', () => {
    const t = setup(['backend', 'java'], 'parents');
    expect(t.shown()).toEqual(['backend']);
  });

  it('an enabled unselected descendant breaks "fully selected"', () => {
    const t = setup(['frontend', 'web', 'angular', 'mobile'], 'parents');
    expect(t.shown()).toEqual(['frontend', 'web', 'angular', 'mobile']);
  });

  it('always shows a stale value that is not in the tree', () => {
    const t = setup([...FULL_FRONTEND, 'gone'], 'parents');
    expect(t.shown()).toEqual(['frontend', 'gone']);
  });

  it('follows a mode switch', () => {
    const t = setup(FULL_FRONTEND, 'parents');
    expect(t.shown()).toEqual(['frontend']);
    t.modeSig.set('all');
    expect(t.shown()).toEqual(FULL_FRONTEND);
  });
});
