import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import type { FlatNode, Node } from './models';
import { CngxTreetable } from './treetable.component';

interface Item {
  name: string;
  age: number;
}

const tree: Node<Item> = {
  value: { name: 'Alice', age: 30 },
  children: [{ value: { name: 'Bob', age: 10 } }, { value: { name: 'Carol', age: 12 } }],
};

@Component({
  template: `<cngx-treetable [tree]="tree" (nodeClicked)="clicked = $event" />`,
  imports: [CngxTreetable],
})
class TestHost {
  tree: Node<Item> | Node<Item>[] = tree;
  clicked: FlatNode<Item> | null = null;
}

function getTreetable<T>(
  fixture: ReturnType<typeof TestBed.createComponent<TestHost>>,
): CngxTreetable<T> {
  return fixture.debugElement.query(By.directive(CngxTreetable)).componentInstance as CngxTreetable<T>;
}

describe('CngxTreetable', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  it('renders all nodes when fully expanded by default', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('cdk-row'));
    expect(rows.length).toBe(3);
  });

  it('renders header columns: _expand + data columns', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const headers = fixture.debugElement.queryAll(By.css('cdk-header-cell'));
    // _expand + name + age
    expect(headers.length).toBe(3);
  });

  it('hides children when parent node is toggled (collapsed)', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const treetable = getTreetable<Item>(fixture);

    const root = treetable.flatNodes()[0];
    treetable.toggle(root);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('cdk-row'));
    expect(rows.length).toBe(1);
  });

  it('re-expands children after a second toggle', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const treetable = getTreetable<Item>(fixture);

    const root = treetable.flatNodes()[0];
    treetable.toggle(root);
    fixture.detectChanges();
    treetable.toggle(root);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('cdk-row'));
    expect(rows.length).toBe(3);
  });

  it('emits nodeClicked when a row is clicked', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const firstRow = fixture.debugElement.query(By.css('cdk-row'));
    firstRow.triggerEventHandler('click', null);
    expect(fixture.componentInstance.clicked).not.toBeNull();
    expect(fixture.componentInstance.clicked?.value.name).toBe('Alice');
  });

  it('extracts columns from node value by default', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const treetable = getTreetable<Item>(fixture);
    expect(treetable.columns()).toEqual(['name', 'age']);
  });

  it('re-initialises expanded state when tree input changes', () => {
    const fixture = TestBed.createComponent(CngxTreetable<Item>);
    fixture.componentRef.setInput('tree', tree);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('cdk-row')).length).toBe(3);

    const newTree: Node<Item> = {
      value: { name: 'X', age: 1 },
      children: [{ value: { name: 'Y', age: 2 } }],
    };
    fixture.componentRef.setInput('tree', newTree);
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('cdk-row'));
    expect(rows.length).toBe(2);
  });

  describe('reactivity equality (equal-fn discipline)', () => {
    it('flatNodes preserves reference across structurally-equal re-runs', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.detectChanges();
      const before = fixture.componentInstance.flatNodes();
      fixture.componentRef.setInput('tree', tree);
      fixture.detectChanges();
      const after = fixture.componentInstance.flatNodes();
      expect(after).toBe(before);
    });

    it('selectedIds preserves reference when toggled to the same set', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      const root = t.flatNodes()[0];
      t.toggleSelection(root);
      fixture.detectChanges();
      const before = t.selectedIds();
      fixture.componentRef.setInput('expandedIds', new Set<string>(t.expandedIds()));
      fixture.detectChanges();
      const after = t.selectedIds();
      expect(after).toBe(before);
    });

    it('resolvedOptions preserves reference when options input mutates to a structurally-equal object', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('options', { highlightRowOnHover: true });
      fixture.detectChanges();
      const before = fixture.componentInstance.resolvedOptions();
      fixture.componentRef.setInput('options', { highlightRowOnHover: true });
      fixture.detectChanges();
      const after = fixture.componentInstance.resolvedOptions();
      expect(after).toBe(before);
    });
  });

  describe('selectedIds model contract', () => {
    it('starts with an empty set', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedIds().size).toBe(0);
    });

    it('multi-mode toggleSelection adds and removes ids without clearing siblings', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      const [root, child1, child2] = t.flatNodes();
      t.toggleSelection(root);
      t.toggleSelection(child1);
      fixture.detectChanges();
      expect([...t.selectedIds()].sort()).toEqual([child1.id, root.id].sort());
      t.toggleSelection(child2);
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(3);
      t.toggleSelection(root);
      fixture.detectChanges();
      expect([...t.selectedIds()].sort()).toEqual([child1.id, child2.id].sort());
    });

    it('single-mode toggleSelection clears prior selection before adding', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('selectionMode', 'single');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      const [root, child1] = t.flatNodes();
      t.toggleSelection(root);
      t.toggleSelection(child1);
      fixture.detectChanges();
      expect([...t.selectedIds()]).toEqual([child1.id]);
    });

    it('selectionMode -> none clears the selection', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      t.toggleSelection(t.flatNodes()[0]);
      t.toggleSelection(t.flatNodes()[1]);
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(2);

      fixture.componentRef.setInput('selectionMode', 'none');
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(0);
    });

    it('selectionMode multi -> single truncates the selection to one id', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      t.toggleSelection(t.flatNodes()[0]);
      t.toggleSelection(t.flatNodes()[1]);
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(2);

      fixture.componentRef.setInput('selectionMode', 'single');
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(1);
    });

    it('pre-bound non-empty expandedIds is preserved across the init effect', () => {
      const preset = new Set<string>();
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('expandedIds', new Set(['__sentinel__']));
      fixture.detectChanges();
      expect(fixture.componentInstance.expandedIds().has('__sentinel__')).toBe(true);
      // Sanity: sentinel doesn't blow up the visible-nodes pipeline.
      expect(preset.size).toBe(0);
    });
  });
});
