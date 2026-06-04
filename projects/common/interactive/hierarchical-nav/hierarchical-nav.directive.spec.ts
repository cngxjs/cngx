import { Component, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxActiveDescendant, type ActiveDescendantItem } from '@cngx/common/a11y';
import { type CngxTreeNode } from '@cngx/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTreeAdItems } from '../tree-controller/tree-ad-items';
import { createTreeController, type CngxTreeController } from '../tree-controller/tree-controller';
import { CngxHierarchicalNav } from './hierarchical-nav.directive';

interface Row {
  readonly id: string;
  readonly name: string;
  readonly disabled?: boolean;
}

function makeTree(): CngxTreeNode<Row>[] {
  return [
    {
      value: { id: 'a', name: 'Alpha' },
      children: [
        { value: { id: 'a1', name: 'Alpha-1' } },
        {
          value: { id: 'a2', name: 'Alpha-2' },
          children: [{ value: { id: 'a2a', name: 'Alpha-2-a' } }],
        },
      ],
    },
    { value: { id: 'b', name: 'Bravo' } },
  ];
}

@Component({
  template: `
    <ul
      role="tree"
      tabindex="0"
      cngxActiveDescendant
      #ad="cngxActiveDescendant"
      [items]="items()"
      [cngxHierarchicalNav]="ctrl!"
      (expand)="onExpand($event)"
      (collapse)="onCollapse($event)"
      (movedToChild)="onMovedToChild($event)"
      (movedToParent)="onMovedToParent($event)"
    ></ul>
  `,
  imports: [CngxActiveDescendant, CngxHierarchicalNav],
})
class TestHost {
  ctrl: CngxTreeController<Row> | null = null;
  items: Signal<ActiveDescendantItem[]> = signal([]);
  onExpand = vi.fn();
  onCollapse = vi.fn();
  onMovedToChild = vi.fn();
  onMovedToParent = vi.fn();
}

type Fixture = ReturnType<typeof setup>;

function setup(tree: CngxTreeNode<Row>[] = makeTree()) {
  const nodes = signal(tree);
  const ctrl = TestBed.runInInjectionContext(() =>
    createTreeController<Row>({
      nodes,
      nodeIdFn: (v) => v.id,
      labelFn: (v) => v.name,
    }),
  );
  const items = TestBed.runInInjectionContext(() => createTreeAdItems(ctrl));

  const fixture = TestBed.createComponent(TestHost);
  const host = fixture.componentInstance;
  host.ctrl = ctrl;
  host.items = items;
  fixture.detectChanges();

  const de = fixture.debugElement.query(By.directive(CngxActiveDescendant));
  const ad = de.injector.get(CngxActiveDescendant);
  const el = de.nativeElement as HTMLElement;

  const press = (key: 'ArrowLeft' | 'ArrowRight'): void => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  return { fixture, host, ctrl, ad, el, press };
}

describe('CngxHierarchicalNav', () => {
  let f: Fixture;

  beforeEach(() => {
    f = setup();
  });

  it('ArrowRight on a collapsed parent expands it and emits expand', () => {
    f.ad.highlightByValue({ id: 'a', name: 'Alpha' });
    // value lookup won't match — the AD has the actual option refs; fall back
    // to index-based highlighting for the test harness:
    f.ad.highlightByIndex(0);
    expect(f.ctrl.isExpanded('a')()).toBe(false);

    f.press('ArrowRight');
    expect(f.ctrl.isExpanded('a')()).toBe(true);
    expect(f.host.onExpand).toHaveBeenCalledWith('a');
    expect(f.host.onMovedToChild).not.toHaveBeenCalled();
  });

  it('ArrowRight on an expanded parent moves active to the first child', () => {
    f.ad.highlightByIndex(0);
    f.ctrl.expand('a');
    f.fixture.detectChanges();

    f.press('ArrowRight');
    expect(f.host.onMovedToChild).toHaveBeenCalledWith('a1');
    expect(f.ad.activeId()).toBe('a1');
    // No expand emission on the already-expanded path.
    expect(f.host.onExpand).not.toHaveBeenCalled();
  });

  it('ArrowRight on a leaf is a no-op', () => {
    // Bravo (root leaf) — no children, ArrowRight has nothing to do.
    f.ctrl.expand('a');
    f.fixture.detectChanges();
    // After expanding a, visible is [a, a1, a2, b]; b is at index 3.
    f.ad.highlightByIndex(3);

    f.press('ArrowRight');
    expect(f.host.onExpand).not.toHaveBeenCalled();
    expect(f.host.onMovedToChild).not.toHaveBeenCalled();
    expect(f.ad.activeId()).toBe('b');
  });

  it('ArrowLeft on an expanded parent collapses it and emits collapse', () => {
    f.ctrl.expand('a');
    f.fixture.detectChanges();
    f.ad.highlightByIndex(0);

    f.press('ArrowLeft');
    expect(f.ctrl.isExpanded('a')()).toBe(false);
    expect(f.host.onCollapse).toHaveBeenCalledWith('a');
    expect(f.host.onMovedToParent).not.toHaveBeenCalled();
  });

  it('ArrowLeft on a non-expanded node with a parent moves active to the parent', () => {
    f.ctrl.expand('a');
    f.fixture.detectChanges();
    // visible now: a (0), a1 (1), a2 (2), b (3). a1 is a leaf under a.
    f.ad.highlightByIndex(1);
    expect(f.ad.activeId()).toBe('a1');

    f.press('ArrowLeft');
    expect(f.host.onMovedToParent).toHaveBeenCalledWith('a');
    expect(f.ad.activeId()).toBe('a');
    expect(f.host.onCollapse).not.toHaveBeenCalled();
  });

  it('ArrowLeft on a root leaf is a no-op', () => {
    // Bravo — root leaf. No parent, not expanded. Nothing to do.
    f.ad.highlightByIndex(1); // b at index 1 (a collapsed, so visible is a, b)
    expect(f.ad.activeId()).toBe('b');

    f.press('ArrowLeft');
    expect(f.host.onCollapse).not.toHaveBeenCalled();
    expect(f.host.onMovedToParent).not.toHaveBeenCalled();
    expect(f.ad.activeId()).toBe('b');
  });

  it('does not emit movedToChild when AD rejects the target (disabled)', () => {
    // Build a tree where the first child under "a" is disabled.
    const disabledFirstChild: CngxTreeNode<Row>[] = [
      {
        value: { id: 'a', name: 'Alpha' },
        children: [
          { value: { id: 'a1', name: 'Alpha-1' }, disabled: true },
          { value: { id: 'a2', name: 'Alpha-2' } },
        ],
      },
    ];
    f = setup(disabledFirstChild);
    f.ad.highlightByIndex(0);
    f.ctrl.expand('a');
    f.fixture.detectChanges();

    f.press('ArrowRight');
    // AD skipDisabled=true is the default → the disabled first child is
    // refused. Directive must NOT emit movedToChild on a rejected move.
    expect(f.host.onMovedToChild).not.toHaveBeenCalled();
    expect(f.ad.activeId()).toBe('a');
  });
});
