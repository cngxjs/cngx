import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { createManualState } from '@cngx/common/data';
import { provideDirection } from '@cngx/core';
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
  return fixture.debugElement.query(By.directive(CngxTreetable))
    .componentInstance as CngxTreetable<T>;
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

  it('keeps expansion for ids still present when the tree input changes', () => {
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
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      // A real id that the default seed would NOT produce ('0-1' is a leaf;
      // the seed only collects parents), so surviving verbatim proves the
      // init effect neither overwrote nor re-derived the bound value.
      fixture.componentRef.setInput('expandedIds', new Set(['0-1']));
      fixture.detectChanges();
      expect([...fixture.componentInstance.expandedIds()]).toEqual(['0-1']);
    });
  });

  describe('toggleAll visibility bounds', () => {
    it('clear branch deselects only visible rows; hidden-selected stay untouched', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', {
        value: { name: 'Alice', age: 30 },
        children: [
          { value: { name: 'Bob', age: 10 }, children: [{ value: { name: 'Dave', age: 3 } }] },
          { value: { name: 'Carol', age: 12 } },
        ],
      });
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;

      // Select Dave, then collapse his parent so he is hidden but selected.
      t.toggleSelection(t.flatNodes()[2]);
      t.toggle(t.flatNodes()[1]);
      fixture.detectChanges();
      expect(t.visibleNodes().map((n) => n.id)).toEqual(['0', '0-0', '0-1']);

      // Select-all over the visible rows, then toggle again to clear them.
      t.toggleAll();
      fixture.detectChanges();
      expect(t.isAllSelected()).toBe(true);
      expect(t.selectedIds()).toEqual(new Set(['0', '0-0', '0-1', '0-0-0']));

      t.toggleAll();
      fixture.detectChanges();
      expect(t.selectedIds()).toEqual(new Set(['0-0-0']));
    });

    it('clear branch on a fully visible selection empties the set', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      t.toggleAll();
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(3);
      t.toggleAll();
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(0);
    });
  });

  describe('expansion seed guard + id pruning', () => {
    const bigTree: Node<Item> = {
      value: { name: 'Alice', age: 30 },
      children: [
        {
          value: { name: 'Bob', age: 10 },
          children: [{ value: { name: 'Dave', age: 3 } }],
        },
        { value: { name: 'Carol', age: 12 } },
      ],
    };

    it('seeds fully expanded on the first non-empty tree, even when it arrives late', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', []);
      fixture.detectChanges();
      expect(fixture.componentInstance.expandedIds().size).toBe(0);

      fixture.componentRef.setInput('tree', bigTree);
      fixture.detectChanges();
      // Root '0' and parent '0-0' both carry children.
      expect(fixture.componentInstance.expandedIds()).toEqual(new Set(['0', '0-0']));
      expect(fixture.debugElement.queryAll(By.css('cdk-row')).length).toBe(4);
    });

    it('a fully collapsed grid survives a data refresh instead of re-expanding', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', bigTree);
      fixture.detectChanges();
      const t = fixture.componentInstance;
      // Collapse everything the seed expanded.
      t.toggle(t.visibleNodes()[1]);
      t.toggle(t.visibleNodes()[0]);
      fixture.detectChanges();
      expect(t.expandedIds().size).toBe(0);

      // Data refresh: structurally different tree, same root ids.
      fixture.componentRef.setInput('tree', { ...bigTree, value: { name: 'Alice2', age: 31 } });
      fixture.detectChanges();
      expect(t.expandedIds().size).toBe(0);
      expect(fixture.debugElement.queryAll(By.css('cdk-row')).length).toBe(1);
    });

    it('prunes expansion ids that vanish from the tree after a swap', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', bigTree);
      fixture.detectChanges();
      const t = fixture.componentInstance;
      expect(t.expandedIds()).toEqual(new Set(['0', '0-0']));

      // The swapped tree is a single childless root: '0-0' no longer exists
      // at all. ('0' survives as an id even though it lost its children -
      // pruning is by id presence, not by hasChildren.)
      fixture.componentRef.setInput('tree', { value: { name: 'X', age: 1 } });
      fixture.detectChanges();
      expect(t.expandedIds()).toEqual(new Set(['0']));
    });

    it('prunes selection ids that vanish from the tree after a swap', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', bigTree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      t.toggleSelection(t.flatNodes()[2]); // Dave '0-0-0'
      t.toggleSelection(t.flatNodes()[3]); // Carol '0-1'
      fixture.detectChanges();
      expect(t.selectedIds()).toEqual(new Set(['0-0-0', '0-1']));

      // Dave's subtree is gone in the swapped tree; Carol's id survives.
      fixture.componentRef.setInput('tree', {
        value: { name: 'Alice', age: 30 },
        children: [{ value: { name: 'Bob', age: 10 } }, { value: { name: 'Carol', age: 12 } }],
      });
      fixture.detectChanges();
      expect(t.selectedIds()).toEqual(new Set(['0-1']));
    });

    it('keeps set references (and stays silent) when a swap removes nothing', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', bigTree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      t.toggleSelection(t.flatNodes()[3]);
      fixture.detectChanges();
      const expandedBefore = t.expandedIds();
      const selectedBefore = t.selectedIds();

      fixture.componentRef.setInput('tree', { ...bigTree, value: { name: 'Alice2', age: 31 } });
      fixture.detectChanges();
      expect(t.expandedIds()).toBe(expandedBefore);
      expect(t.selectedIds()).toBe(selectedBefore);
    });

    it('does not prune against a transient empty forest', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', bigTree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.detectChanges();
      const t = fixture.componentInstance;
      t.toggleSelection(t.flatNodes()[3]);
      fixture.detectChanges();

      fixture.componentRef.setInput('tree', []);
      fixture.detectChanges();
      expect(t.expandedIds()).toEqual(new Set(['0', '0-0']));
      expect(t.selectedIds()).toEqual(new Set(['0-1']));

      fixture.componentRef.setInput('tree', bigTree);
      fixture.detectChanges();
      expect(t.selectedIds()).toEqual(new Set(['0-1']));
    });

    it('prunes a pre-bound selection against the first non-empty tree', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', bigTree);
      fixture.componentRef.setInput('selectionMode', 'multi');
      fixture.componentRef.setInput('selectedIds', new Set(['0-1', '__stale__']));
      fixture.detectChanges();
      expect(fixture.componentInstance.selectedIds()).toEqual(new Set(['0-1']));
    });
  });

  describe('APG row semantics (ARIA)', () => {
    function mount(selectionMode: 'none' | 'single' | 'multi' = 'none') {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('selectionMode', selectionMode);
      fixture.detectChanges();
      return fixture;
    }

    function rowEls(fixture: ReturnType<typeof mount>): HTMLElement[] {
      return fixture.debugElement
        .queryAll(By.css('cdk-row'))
        .map((de) => de.nativeElement as HTMLElement);
    }

    it('binds aria-level, aria-posinset, and aria-setsize per row', () => {
      const [root, child1, child2] = rowEls(mount());
      expect(root.getAttribute('aria-level')).toBe('1');
      expect(root.getAttribute('aria-posinset')).toBe('1');
      expect(root.getAttribute('aria-setsize')).toBe('1');
      expect(child1.getAttribute('aria-level')).toBe('2');
      expect(child1.getAttribute('aria-posinset')).toBe('1');
      expect(child1.getAttribute('aria-setsize')).toBe('2');
      expect(child2.getAttribute('aria-level')).toBe('2');
      expect(child2.getAttribute('aria-posinset')).toBe('2');
      expect(child2.getAttribute('aria-setsize')).toBe('2');
    });

    it('binds aria-expanded on parent rows and flips it with toggle', () => {
      const fixture = mount();
      const t = fixture.componentInstance;
      expect(rowEls(fixture)[0].getAttribute('aria-expanded')).toBe('true');

      t.toggle(t.flatNodes()[0]);
      fixture.detectChanges();
      expect(rowEls(fixture)[0].getAttribute('aria-expanded')).toBe('false');
    });

    it('suppresses aria-expanded on leaf rows', () => {
      const [, child1, child2] = rowEls(mount());
      expect(child1.hasAttribute('aria-expanded')).toBe(false);
      expect(child2.hasAttribute('aria-expanded')).toBe(false);
    });

    it('suppresses aria-selected when selection is disabled', () => {
      for (const row of rowEls(mount('none'))) {
        expect(row.hasAttribute('aria-selected')).toBe(false);
      }
    });

    it('binds aria-selected to the selection state when selection is enabled', () => {
      const fixture = mount('multi');
      const t = fixture.componentInstance;
      expect(rowEls(fixture).map((r) => r.getAttribute('aria-selected'))).toEqual([
        'false',
        'false',
        'false',
      ]);

      t.toggleSelection(t.flatNodes()[0]);
      fixture.detectChanges();
      expect(rowEls(fixture)[0].getAttribute('aria-selected')).toBe('true');
      expect(rowEls(fixture)[1].getAttribute('aria-selected')).toBe('false');
    });

    it('binds aria-multiselectable on the treegrid exactly in multi mode', () => {
      const treegrid = (fixture: ReturnType<typeof mount>) =>
        fixture.debugElement.query(By.css('cdk-table')).nativeElement as HTMLElement;
      expect(treegrid(mount('none')).hasAttribute('aria-multiselectable')).toBe(false);
      expect(treegrid(mount('single')).hasAttribute('aria-multiselectable')).toBe(false);
      expect(treegrid(mount('multi')).getAttribute('aria-multiselectable')).toBe('true');
    });

    it('keeps role="row" on rows via the CDK after dropping the explicit attribute', () => {
      expect(rowEls(mount())[0].getAttribute('role')).toBe('row');
    });
  });

  describe('roving focus model', () => {
    function mount(
      opts: { selectionMode?: 'none' | 'single' | 'multi'; showCheckboxes?: boolean } = {},
    ) {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.componentRef.setInput('selectionMode', opts.selectionMode ?? 'none');
      fixture.componentRef.setInput('showCheckboxes', opts.showCheckboxes ?? false);
      fixture.detectChanges();
      return fixture;
    }

    function rowEls(fixture: ReturnType<typeof mount>): HTMLElement[] {
      return fixture.debugElement
        .queryAll(By.css('cdk-row'))
        .map((de) => de.nativeElement as HTMLElement);
    }

    function key(k: string, init: KeyboardEventInit = {}): KeyboardEvent {
      return new KeyboardEvent('keydown', { key: k, cancelable: true, ...init });
    }

    it('gives the first visible row tabindex="0" before any interaction', () => {
      const rows = rowEls(mount());
      expect(rows.map((r) => r.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    });

    it('moves DOM focus to the next row on ArrowDown', () => {
      const fixture = mount();
      const t = fixture.componentInstance;
      t.handleKeyDown(key('ArrowDown'));
      fixture.detectChanges();
      const rows = rowEls(fixture);
      expect(document.activeElement).toBe(rows[1]);
      expect(rows.map((r) => r.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    });

    it('re-anchors the tab stop to the first visible row when the focused row is collapsed away', () => {
      const fixture = mount();
      const t = fixture.componentInstance;
      const [root, child1] = t.visibleNodes();
      t.focusedNodeId.set(child1.id);
      fixture.detectChanges();
      expect(rowEls(fixture)[1].getAttribute('tabindex')).toBe('0');

      t.toggle(root);
      fixture.detectChanges();
      const rows = rowEls(fixture);
      expect(rows).toHaveLength(1);
      expect(rows[0].getAttribute('tabindex')).toBe('0');
    });

    it('keeps toggle buttons and body-row checkboxes out of the tab order', () => {
      const fixture = mount({ selectionMode: 'multi', showCheckboxes: true });
      const toggles = fixture.debugElement.queryAll(By.css('.cngx-treetable__toggle'));
      for (const toggle of toggles) {
        expect((toggle.nativeElement as HTMLElement).getAttribute('tabindex')).toBe('-1');
      }
      const bodyCheckboxes = fixture.debugElement.queryAll(
        By.css('cdk-cell .cngx-treetable__checkbox'),
      );
      expect(bodyCheckboxes.length).toBeGreaterThan(0);
      for (const checkbox of bodyCheckboxes) {
        expect((checkbox.nativeElement as HTMLElement).getAttribute('tabindex')).toBe('-1');
      }
      // The header select-all checkbox is folded too - the roving row is the
      // grid's only tab stop; Ctrl+A is the keyboard path to select-all.
      const headerCheckbox = fixture.debugElement.query(
        By.css('cdk-header-cell .cngx-treetable__checkbox'),
      );
      expect((headerCheckbox.nativeElement as HTMLElement).getAttribute('tabindex')).toBe('-1');
    });

    it('syncs the logical focus when DOM focus lands in a row', () => {
      const fixture = mount();
      const t = fixture.componentInstance;
      const child2 = t.visibleNodes()[2];
      rowEls(fixture)[2].dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      fixture.detectChanges();
      expect(t.focusedNodeId()).toBe(child2.id);
      expect(rowEls(fixture)[2].getAttribute('tabindex')).toBe('0');
    });

    it('keeps the bulk-selection live region in the DOM at all times', () => {
      const fixture = mount();
      const region = fixture.debugElement.query(By.css('.cngx-treetable__sr'));
      expect(region).not.toBeNull();
      const el = region.nativeElement as HTMLElement;
      expect(el.getAttribute('aria-live')).toBe('polite');
      expect(el.textContent?.trim()).toBe('');
    });

    it('announces bulk selection and clearing through the live region', () => {
      const fixture = mount({ selectionMode: 'multi' });
      const t = fixture.componentInstance;
      const region = () =>
        (
          fixture.debugElement.query(By.css('.cngx-treetable__sr')).nativeElement as HTMLElement
        ).textContent?.trim();

      t.handleKeyDown(key('a', { ctrlKey: true }));
      fixture.detectChanges();
      expect(region()).toBe('3 rows selected');

      t.handleKeyDown(key('a', { ctrlKey: true }));
      fixture.detectChanges();
      expect(region()).toBe('Selection cleared');
    });

    it('stays silent in the live region on per-row selection toggles', () => {
      const fixture = mount({ selectionMode: 'multi' });
      const t = fixture.componentInstance;
      t.toggleSelection(t.flatNodes()[0]);
      fixture.detectChanges();
      const region = fixture.debugElement.query(By.css('.cngx-treetable__sr'))
        .nativeElement as HTMLElement;
      expect(region.textContent?.trim()).toBe('');
    });

    it('Ctrl+A selects all visible rows in multi mode and a second Ctrl+A clears', () => {
      const fixture = mount({ selectionMode: 'multi' });
      const t = fixture.componentInstance;
      const event = key('a', { ctrlKey: true });
      t.handleKeyDown(event);
      fixture.detectChanges();
      expect(event.defaultPrevented).toBe(true);
      expect(t.selectedIds().size).toBe(3);

      t.handleKeyDown(key('a', { ctrlKey: true }));
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(0);
    });

    it('Cmd+A selects all visible rows in multi mode', () => {
      const fixture = mount({ selectionMode: 'multi' });
      const t = fixture.componentInstance;
      t.handleKeyDown(key('a', { metaKey: true }));
      fixture.detectChanges();
      expect(t.selectedIds().size).toBe(3);
    });

    it('Ctrl+A is inert in single and none mode', () => {
      for (const selectionMode of ['single', 'none'] as const) {
        const fixture = mount({ selectionMode });
        const t = fixture.componentInstance;
        const event = key('a', { ctrlKey: true });
        t.handleKeyDown(event);
        fixture.detectChanges();
        expect(t.selectedIds().size).toBe(0);
        expect(event.defaultPrevented).toBe(false);
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ imports: [TestHost] });
      }
    });

    it('leaves modifier-key arrows to the browser', () => {
      const fixture = mount();
      const t = fixture.componentInstance;
      const root = t.visibleNodes()[0];
      t.focusedNodeId.set(root.id);
      for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
        const event = key('ArrowDown', init);
        t.handleKeyDown(event);
        fixture.detectChanges();
        expect(t.focusedNodeId()).toBe(root.id);
        expect(event.defaultPrevented).toBe(false);
      }
    });
  });

  describe('[state] async view cascade', () => {
    function mount(input: Node<Item> | Node<Item>[]) {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', input);
      const state = createManualState<readonly Item[]>();
      fixture.componentRef.setInput('state', state);
      fixture.detectChanges();
      return { fixture, state };
    }

    type Fixture = ComponentFixture<CngxTreetable<Item>>;

    const table = (f: Fixture) => f.debugElement.query(By.css('cdk-table'));
    const skeleton = (f: Fixture) => f.debugElement.query(By.css('.cngx-treetable__skeleton'));
    const errorSurface = (f: Fixture) => f.debugElement.query(By.css('.cngx-treetable__error'));
    const emptySurface = (f: Fixture) => f.debugElement.query(By.css('.cngx-treetable__empty'));

    function stateRegionText(fixture: Fixture): string {
      const regions = fixture.debugElement.queryAll(By.css('.cngx-treetable__sr'));
      // The bulk-selection announcer comes first; the state announcer second.
      return (regions[1].nativeElement as HTMLElement).textContent?.trim() ?? '';
    }

    it('renders the grid and no aria-busy when no state is bound', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('cdk-table'))).not.toBeNull();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('aria-busy')).toBeNull();
    });

    it('renders the empty surface synchronously when no state is bound and the tree is empty', () => {
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', []);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.cngx-treetable__empty'))).not.toBeNull();
      expect(fixture.debugElement.query(By.css('cdk-table'))).toBeNull();
    });

    it('renders nothing while a bound state is idle before the first load', () => {
      const { fixture } = mount([]);
      expect(table(fixture)).toBeNull();
      expect(skeleton(fixture)).toBeNull();
      expect(emptySurface(fixture)).toBeNull();
      expect(errorSurface(fixture)).toBeNull();
    });

    it('shows the skeleton with aria-busy during the first load of an empty grid', () => {
      const { fixture, state } = mount([]);
      state.set('loading');
      fixture.detectChanges();
      const sk = skeleton(fixture) as { nativeElement: HTMLElement } | null;
      expect(sk).not.toBeNull();
      expect(sk?.nativeElement.getAttribute('aria-hidden')).toBe('true');
      expect(table(fixture)).toBeNull();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('aria-busy')).toBe('true');
      expect(stateRegionText(fixture)).toBe('Loading');
    });

    it('honors skeletonRowCount in the skeleton branch', () => {
      const { fixture, state } = mount([]);
      fixture.componentRef.setInput('skeletonRowCount', 5);
      state.set('loading');
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.cngx-treetable__skeleton-row')).length).toBe(5);
    });

    it('paints seed rows instead of the skeleton during a first load', () => {
      const { fixture, state } = mount(tree);
      state.set('loading');
      fixture.detectChanges();
      expect(skeleton(fixture)).toBeNull();
      expect(table(fixture)).not.toBeNull();
      expect(fixture.debugElement.queryAll(By.css('cdk-row')).length).toBe(3);
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('aria-busy')).toBe('true');
    });

    it('shows the error surface when the first load fails, announced politely without an alert', () => {
      const { fixture, state } = mount([]);
      state.set('loading');
      fixture.detectChanges();
      state.setError(new Error('boom'));
      fixture.detectChanges();
      expect(errorSurface(fixture)).not.toBeNull();
      expect(table(fixture)).toBeNull();
      expect(stateRegionText(fixture)).toBe('Data failed to load');
      expect(fixture.debugElement.query(By.css('[role="alert"]'))).toBeNull();
    });

    it('shows the empty surface when a load succeeds with nothing to render', () => {
      const { fixture, state } = mount([]);
      state.setSuccess([]);
      fixture.detectChanges();
      expect(emptySurface(fixture)).not.toBeNull();
      expect(table(fixture)).toBeNull();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('aria-busy')).toBeNull();
      expect(stateRegionText(fixture)).toBe('');
    });

    it('keeps rows on screen and shows the refresh indicator during a refresh', () => {
      const { fixture, state } = mount(tree);
      state.setSuccess([]);
      fixture.detectChanges();
      state.set('refreshing');
      fixture.detectChanges();
      expect(table(fixture)).not.toBeNull();
      const refresh = fixture.debugElement.query(By.css('.cngx-treetable__refresh'));
      expect(refresh).not.toBeNull();
      expect((refresh.nativeElement as HTMLElement).getAttribute('aria-hidden')).toBe('true');
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('aria-busy')).toBe('true');
      expect(stateRegionText(fixture)).toBe('Refreshing');
    });

    it('keeps content and adds the error surface when a refresh fails', () => {
      const { fixture, state } = mount(tree);
      state.setSuccess([]);
      fixture.detectChanges();
      state.setError(new Error('boom'));
      fixture.detectChanges();
      expect(table(fixture)).not.toBeNull();
      expect(errorSurface(fixture)).not.toBeNull();
      expect(stateRegionText(fixture)).toBe('Data failed to load');
    });

    it('treats a non-first-load load over an empty grid as a load, not a blank region', () => {
      const { fixture, state } = mount([]);
      state.setSuccess([]);
      fixture.detectChanges();
      state.set('loading');
      fixture.detectChanges();
      expect(skeleton(fixture)).not.toBeNull();
      expect(emptySurface(fixture)).toBeNull();
    });

    it('drops the announcement and aria-busy once content settles', () => {
      const { fixture, state } = mount(tree);
      state.set('loading');
      fixture.detectChanges();
      state.setSuccess([]);
      fixture.detectChanges();
      expect(table(fixture)).not.toBeNull();
      expect(stateRegionText(fixture)).toBe('');
      const host = fixture.nativeElement as HTMLElement;
      expect(host.getAttribute('aria-busy')).toBeNull();
    });

    it('keeps both live regions in the DOM across every view', () => {
      const { fixture, state } = mount([]);
      for (const move of [
        () => state.set('loading'),
        () => state.setError(new Error('x')),
        () => state.setSuccess([]),
      ]) {
        move();
        fixture.detectChanges();
        expect(fixture.debugElement.queryAll(By.css('.cngx-treetable__sr')).length).toBe(2);
      }
    });
  });

  describe('keyboard direction (dir=rtl)', () => {
    function mount(direction: 'ltr' | 'rtl') {
      TestBed.configureTestingModule({ providers: [provideDirection(direction)] });
      const fixture = TestBed.createComponent(CngxTreetable<Item>);
      fixture.componentRef.setInput('tree', tree);
      fixture.detectChanges();
      return fixture;
    }

    function key(k: string): KeyboardEvent {
      return new KeyboardEvent('keydown', { key: k });
    }

    it('rtl: physical ArrowLeft expands a collapsed parent, ArrowRight collapses it', () => {
      const fixture = mount('rtl');
      const t = fixture.componentInstance;
      const root = t.visibleNodes()[0];
      t.toggle(root);
      fixture.detectChanges();
      expect(t.visibleNodes().length).toBe(1);

      t.focusedNodeId.set(root.id);
      // Under rtl the physical ArrowLeft is inline-forward -> expand.
      t.handleKeyDown(key('ArrowLeft'));
      fixture.detectChanges();
      expect(t.visibleNodes().length).toBe(3);

      // Under rtl the physical ArrowRight is inline-back -> collapse.
      t.handleKeyDown(key('ArrowRight'));
      fixture.detectChanges();
      expect(t.visibleNodes().length).toBe(1);
    });

    it('ltr: physical ArrowRight expands a collapsed parent, ArrowLeft collapses it', () => {
      const fixture = mount('ltr');
      const t = fixture.componentInstance;
      const root = t.visibleNodes()[0];
      t.toggle(root);
      fixture.detectChanges();
      expect(t.visibleNodes().length).toBe(1);

      t.focusedNodeId.set(root.id);
      t.handleKeyDown(key('ArrowRight'));
      fixture.detectChanges();
      expect(t.visibleNodes().length).toBe(3);

      t.handleKeyDown(key('ArrowLeft'));
      fixture.detectChanges();
      expect(t.visibleNodes().length).toBe(1);
    });

    it('block axis: ArrowDown/ArrowUp move the focused row identically in both directions', () => {
      for (const direction of ['ltr', 'rtl'] as const) {
        const fixture = mount(direction);
        const t = fixture.componentInstance;
        const [root, child1] = t.visibleNodes();
        t.focusedNodeId.set(root.id);

        t.handleKeyDown(key('ArrowDown'));
        fixture.detectChanges();
        expect(t.focusedNodeId()).toBe(child1.id);

        t.handleKeyDown(key('ArrowUp'));
        fixture.detectChanges();
        expect(t.focusedNodeId()).toBe(root.id);

        TestBed.resetTestingModule();
      }
    });
  });
});
