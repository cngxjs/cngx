import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { createManualState } from '@cngx/common/data';
import type { CngxTreeNode } from '@cngx/utils';

import { CngxTreeSelect } from './tree-select.component';

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

const TREE: readonly CngxTreeNode<string>[] = [
  { value: 'fruit', children: [{ value: 'apple' }, { value: 'pear' }] },
  { value: 'veg', children: [{ value: 'leek' }] },
];

const ALL_VALUES = ['fruit', 'apple', 'pear', 'veg', 'leek'];

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxTreeSelect - nodes from [state] data', () => {
  @Component({
    template: `
      <cngx-tree-select [label]="'Food'" [state]="state" [nodes]="nodes()" [nodeIdFn]="idFn" />
    `,
    imports: [CngxTreeSelect],
  })
  class StateOnlyHost {
    readonly state = createManualState<readonly CngxTreeNode<string>[]>();
    readonly nodes = signal<readonly CngxTreeNode<string>[]>([]);
    readonly idFn = (v: string): string => v;
  }

  beforeEach(() => polyfillPopover());

  function mount() {
    const fixture = TestBed.createComponent(StateOnlyHost);
    fixture.detectChanges();
    flush(fixture);
    const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
      .componentInstance as CngxTreeSelect<string>;
    return { fixture, tree, host: fixture.componentInstance };
  }

  it('renders the tree from [state] alone once it succeeds', () => {
    const { fixture, tree, host } = mount();
    host.state.set('loading');
    flush(fixture);
    expect(tree.treeController.flatNodes()).toEqual([]);
    host.state.setSuccess(TREE);
    flush(fixture);
    expect(tree.treeController.flatNodes().map((n) => n.value)).toEqual(ALL_VALUES);
    tree.open();
    flush(fixture);
    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="treeitem"]');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].textContent).toContain('fruit');
  });

  it('lets [state] data win over [nodes] and falls back to [nodes] without data', () => {
    const { fixture, tree, host } = mount();
    host.nodes.set([{ value: 'only-nodes' }]);
    flush(fixture);
    expect(tree.treeController.flatNodes().map((n) => n.value)).toEqual(['only-nodes']);
    host.state.setSuccess(TREE);
    flush(fixture);
    expect(tree.treeController.flatNodes().map((n) => n.value)).toEqual(ALL_VALUES);
  });

  it('keeps the flat projection when [state] re-emits the same node objects', () => {
    const { fixture, tree, host } = mount();
    host.state.setSuccess(TREE);
    flush(fixture);
    const before = tree.treeController.flatNodes();
    host.state.setSuccess([...TREE]);
    flush(fixture);
    expect(Object.is(tree.treeController.flatNodes(), before)).toBe(true);
  });
});
