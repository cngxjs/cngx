import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type CngxTreeNode } from '@cngx/utils';
import { describe, expect, it } from 'vitest';
import { createTreeAdItems } from './tree-ad-items';
import { createTreeController } from './tree-controller';

interface Row {
  readonly id: string;
  readonly name: string;
}

const tree: CngxTreeNode<Row>[] = [
  {
    value: { id: 'a', name: 'Alpha' },
    children: [{ value: { id: 'a1', name: 'Alpha-1' } }],
  },
  { value: { id: 'b', name: 'Bravo' }, disabled: true },
];

describe('createTreeAdItems', () => {
  function setup() {
    const nodes = signal(tree);
    const ctrl = TestBed.runInInjectionContext(() =>
      createTreeController<Row>({
        nodes,
        nodeIdFn: (v) => v.id,
        labelFn: (v) => v.name,
      }),
    );
    const adItems = TestBed.runInInjectionContext(() => createTreeAdItems(ctrl));
    return { ctrl, adItems };
  }

  it('mirrors visibleNodes — collapsed descendants are hidden from AD', () => {
    const { ctrl, adItems } = setup();
    expect(adItems().map((i) => i.id)).toEqual(['a', 'b']);
    ctrl.expand('a');
    expect(adItems().map((i) => i.id)).toEqual(['a', 'a1', 'b']);
  });

  it('projects id/value/label/disabled one-for-one', () => {
    const { adItems } = setup();
    expect(adItems()[1]).toEqual({
      id: 'b',
      value: { id: 'b', name: 'Bravo' },
      label: 'Bravo',
      disabled: true,
    });
  });

  it('is structurally memoised — identical re-reads return the same array ref', () => {
    const { adItems } = setup();
    const first = adItems();
    const second = adItems();
    expect(first).toBe(second);
  });
});
