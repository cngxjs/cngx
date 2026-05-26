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
});
