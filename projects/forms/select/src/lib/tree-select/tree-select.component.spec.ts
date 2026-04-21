import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { CngxTreeNode } from '@cngx/utils';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxTreeSelect } from './tree-select.component';

// jsdom does not implement the Popover API — polyfill so CngxPopover can toggle.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: (force?: boolean) => boolean;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.dispatchEvent(new Event('beforetoggle', { bubbles: false }));
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.togglePopover = function (this: HTMLElement) {
      if (this.hasAttribute('data-popover-open')) {
        (this as HTMLElement & { hidePopover: () => void }).hidePopover();
        return false;
      }
      (this as HTMLElement & { showPopover: () => void }).showPopover();
      return true;
    };
  }
}

interface Row {
  readonly id: string;
  readonly name: string;
}

function tree(): CngxTreeNode<Row>[] {
  return [
    {
      value: { id: 'a', name: 'Alpha' },
      children: [
        { value: { id: 'a1', name: 'Alpha-1' } },
        { value: { id: 'a2', name: 'Alpha-2' } },
      ],
    },
    { value: { id: 'b', name: 'Bravo' } },
  ];
}

@Component({
  imports: [CngxTreeSelect],
  template: `
    <cngx-tree-select
      [nodes]="nodes()"
      [nodeIdFn]="idFn"
      [labelFn]="labelFn"
      [keyFn]="keyFn"
      [(values)]="values"
      [cascadeChildren]="cascade()"
      [clearable]="true"
      [initiallyExpanded]="'all'"
      (selectionChange)="onChange($event)"
      (cleared)="onCleared()"
    />
  `,
})
class TreeHost {
  readonly nodes = signal<CngxTreeNode<Row>[]>(tree());
  readonly values = signal<Row[]>([]);
  readonly cascade = signal(false);
  readonly idFn = (v: Row): string => v.id;
  readonly labelFn = (v: Row): string => v.name;
  readonly keyFn = (v: Row): unknown => v.id;
  readonly onChange = vi.fn();
  readonly onCleared = vi.fn();
}

function setup() {
  const fixture = TestBed.createComponent(TreeHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const de = fixture.debugElement.query(By.directive(CngxTreeSelect));
  const tree = de.componentInstance as CngxTreeSelect<Row>;
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, host, tree, root };
}

describe('CngxTreeSelect', () => {
  beforeAll(() => polyfillPopover());

  let f: ReturnType<typeof setup>;
  beforeEach(() => {
    f = setup();
  });

  it('renders combobox trigger with placeholder when values are empty', () => {
    const trigger = f.root.querySelector<HTMLElement>('[role="combobox"]');
    expect(trigger).toBeTruthy();
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    // placeholder fallback uses `label()` when placeholder is empty
    expect(f.root.querySelector('.cngx-tree-select__placeholder')).toBeTruthy();
  });

  it('implements CngxFormFieldControl (empty, disabled, id + focus wiring)', () => {
    expect(f.tree.empty()).toBe(true);
    expect(f.tree.disabled()).toBe(false);
    // `focused` is an honest mirror of the DOM focus lifecycle — the
    // initial value depends on whether the test harness focused the
    // trigger during detectChanges, so we assert the blur path instead
    // of relying on the initial state.
    (f.root.querySelector<HTMLElement>('[role="combobox"]'))!.dispatchEvent(
      new FocusEvent('blur'),
    );
    expect(f.tree.focused()).toBe(false);
    expect(f.tree.id()).toMatch(/^cngx-tree-select-/);
  });

  it('handleSelect on a leaf toggles the value and emits selectionChange(toggle)', () => {
    const leaf = f.tree.treeController.findById('a1')!;
    f.tree.handleSelect(leaf);
    f.fixture.detectChanges();
    expect(f.host.values()).toEqual([{ id: 'a1', name: 'Alpha-1' }]);
    expect(f.host.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'toggle',
        added: [{ id: 'a1', name: 'Alpha-1' }],
        removed: [],
      }),
    );

    f.tree.handleSelect(leaf);
    f.fixture.detectChanges();
    expect(f.host.values()).toEqual([]);
    expect(f.host.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'toggle',
        added: [],
        removed: [{ id: 'a1', name: 'Alpha-1' }],
      }),
    );
  });

  it('cascade-toggle selects the parent + every descendant atomically', () => {
    f.host.cascade.set(true);
    f.fixture.detectChanges();
    const parent = f.tree.treeController.findById('a')!;
    f.tree.handleSelect(parent);
    f.fixture.detectChanges();
    expect(f.host.values().map((v) => v.id).sort()).toEqual(['a', 'a1', 'a2']);
    expect(f.host.onChange).toHaveBeenCalledTimes(1);
    expect(f.host.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'cascade-toggle',
        added: expect.arrayContaining([
          expect.objectContaining({ id: 'a' }),
          expect.objectContaining({ id: 'a1' }),
          expect.objectContaining({ id: 'a2' }),
        ]),
      }),
    );
  });

  it('cascade-toggle deselection removes parent + descendants that were selected', () => {
    f.host.cascade.set(true);
    f.host.values.set([
      { id: 'a', name: 'Alpha' },
      { id: 'a1', name: 'Alpha-1' },
      { id: 'a2', name: 'Alpha-2' },
      { id: 'b', name: 'Bravo' },
    ]);
    f.fixture.detectChanges();
    const parent = f.tree.treeController.findById('a')!;
    f.tree.handleSelect(parent);
    f.fixture.detectChanges();
    // Bravo is untouched; a-branch is cleared.
    expect(f.host.values().map((v) => v.id)).toEqual(['b']);
  });

  it('indeterminate propagates through SelectionController with childrenFn', () => {
    f.host.values.set([{ id: 'a1', name: 'Alpha-1' }]);
    f.fixture.detectChanges();
    const parentValue: Row = { id: 'a', name: 'Alpha' };
    expect(f.tree.isSelected(parentValue)).toBe(false);
    expect(f.tree.isIndeterminate(parentValue)).toBe(true);

    f.host.values.set([
      { id: 'a1', name: 'Alpha-1' },
      { id: 'a2', name: 'Alpha-2' },
    ]);
    f.fixture.detectChanges();
    expect(f.tree.isIndeterminate(parentValue)).toBe(false);
  });

  it('clearAll resets values and emits cleared + selectionChange(clear)', () => {
    f.host.values.set([{ id: 'a1', name: 'Alpha-1' }]);
    f.fixture.detectChanges();

    // Access the protected clearAll via the trigger clear button (integration)
    const clearBtn = f.root.querySelector<HTMLButtonElement>(
      '.cngx-tree-select__clear-all',
    );
    expect(clearBtn).toBeTruthy();
    clearBtn!.click();
    f.fixture.detectChanges();

    expect(f.host.values()).toEqual([]);
    expect(f.host.onCleared).toHaveBeenCalledTimes(1);
    expect(f.host.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'clear',
        removed: [{ id: 'a1', name: 'Alpha-1' }],
      }),
    );
  });

  it('chip remove deselects one value (no cascade even if cascadeChildren is on)', () => {
    f.host.cascade.set(true);
    f.host.values.set([
      { id: 'a', name: 'Alpha' },
      { id: 'a1', name: 'Alpha-1' },
      { id: 'a2', name: 'Alpha-2' },
    ]);
    f.fixture.detectChanges();

    const chipRemove = f.root.querySelector<HTMLButtonElement>('.cngx-chip__remove');
    expect(chipRemove).toBeTruthy();
    chipRemove!.click();
    f.fixture.detectChanges();

    // Single deselect (first chip = Alpha). Cascade must not fire here.
    const ids = f.host.values().map((v) => v.id).sort();
    expect(ids).toEqual(['a1', 'a2']);
  });

  it('selected() derives label via labelFn + emits chip for each value', () => {
    f.host.values.set([
      { id: 'a1', name: 'Alpha-1' },
      { id: 'a2', name: 'Alpha-2' },
    ]);
    f.fixture.detectChanges();
    expect(f.tree.selected().map((s) => s.label)).toEqual(['Alpha-1', 'Alpha-2']);
    expect(f.root.querySelectorAll('.cngx-chip').length).toBe(2);
  });

  it('ArrowDown / Enter / Space / ArrowUp on the trigger opens the panel when closed', () => {
    const trigger = f.root.querySelector<HTMLElement>('[role="combobox"]')!;
    expect(f.tree.panelOpen()).toBe(false);

    for (const key of ['ArrowDown', 'Enter', ' ', 'ArrowUp']) {
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      f.fixture.detectChanges();
      expect(f.tree.panelOpen()).toBe(true);
      f.tree.close();
      f.fixture.detectChanges();
    }
  });

  it('Escape on the trigger closes the panel when open', () => {
    f.tree.open();
    f.fixture.detectChanges();
    expect(f.tree.panelOpen()).toBe(true);
    const trigger = f.root.querySelector<HTMLElement>('[role="combobox"]')!;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    f.fixture.detectChanges();
    expect(f.tree.panelOpen()).toBe(false);
  });

  it('disabled blocks handleSelect and the trigger click', () => {
    // Swap host component to provide [disabled]="true"
    @Component({
      imports: [CngxTreeSelect],
      template: `
        <cngx-tree-select
          [nodes]="nodes"
          [nodeIdFn]="idFn"
          [labelFn]="labelFn"
          [keyFn]="keyFn"
          [(values)]="values"
          [disabled]="true"
        />
      `,
    })
    class DisabledHost {
      readonly nodes = tree();
      readonly values = signal<Row[]>([]);
      readonly idFn = (v: Row): string => v.id;
      readonly labelFn = (v: Row): string => v.name;
      readonly keyFn = (v: Row): unknown => v.id;
    }
    const fx = TestBed.createComponent(DisabledHost);
    fx.detectChanges();
    const de = fx.debugElement.query(By.directive(CngxTreeSelect));
    const ts = de.componentInstance as CngxTreeSelect<Row>;
    const root = fx.nativeElement as HTMLElement;

    const leaf = ts.treeController.findById('a1')!;
    ts.handleSelect(leaf);
    fx.detectChanges();
    expect(fx.componentInstance.values()).toEqual([]);
    expect(root.querySelector<HTMLElement>('[role="combobox"]')?.getAttribute('aria-disabled')).toBe('true');
  });
});
