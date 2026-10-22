import { Component, signal, viewChild, type TemplateRef } from '@angular/core';
import { Subject, type Observable } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { CngxTreeNode } from '@cngx/utils';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeCommitControllerCascade } from '../shared/__test-helpers/commit-controller-cascade';
import { createMockField } from '@cngx/forms/field/testing';
import { describeFieldSkinHost } from '../shared/__test-helpers/field-skin-host';
import { describeFieldAriaHost } from '../shared/__test-helpers/field-aria-host';
import { describeSelectBehaviourHost } from '../shared/__test-helpers/select-behaviour-host';
import { describeMobileSheet } from '../shared/__test-helpers/mobile-sheet';
import { stubTouchFloor } from '../shared/__test-helpers/touch-floor';
import { CngxSelectAnnouncer } from '../shared/announcer';
import { stripBidiIsolates } from '@cngx/testing';
import {
  CNGX_SELECT_CONFIG,
  makeSelectConfig,
  provideSelectConfig,
  withAriaLabels,
  withFallbackLabels,
  withPanelClass,
  withTemplates,
  type CngxSelectAriaLabels,
  type CngxSelectFallbackLabels,
} from '../shared/config';
import { createManualState } from '@cngx/common/data';
import { CngxSelectChipOverflow } from '../shared/template-slots';
import { CngxTreeSelect } from './tree-select.component';
import { CngxTreeSelectChip } from './tree-select-chip.directive';
import { CngxTreeSelectTriggerLabel } from './tree-select-trigger-label.directive';
import { CngxTreeSelectNodeCount } from './tree-select-node-count.directive';
import type {
  CngxTreeSelectChipDisplay,
  CngxTreeSelectNodeCountContext,
} from './tree-select.model';

// jsdom does not implement the Popover API - polyfill so CngxPopover can toggle.
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
      [chipDisplay]="chipDisplay()"
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
  readonly chipDisplay = signal<CngxTreeSelectChipDisplay | undefined>(undefined);
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

  it('sizes the panel to the anchor width by default, like the rest of the family', () => {
    const panel = f.root.querySelector<HTMLElement>('.cngx-select__panel');
    expect(panel?.style.getPropertyValue('--cngx-select-panel-min-width')).toBe(
      'anchor-size(width)',
    );
  });

  it('implements CngxFormFieldControl (empty, disabled, id + focus wiring)', () => {
    expect(f.tree.empty()).toBe(true);
    expect(f.tree.disabled()).toBe(false);
    // `focused` is an honest mirror of the DOM focus lifecycle - the
    // initial value depends on whether the test harness focused the
    // trigger during detectChanges, so we assert the blur path instead
    // of relying on the initial state.
    (f.root.querySelector<HTMLElement>('[role="combobox"]'))!.dispatchEvent(
      new FocusEvent('blur'),
    );
    expect(f.tree.focused()).toBe(false);
    expect(f.tree.id()).toBe(f.root.querySelector('cngx-tree-select')!.id);
  });

  it('handleSelect on a leaf toggles the value and emits selectionChange(toggle)', () => {
    const leaf = f.tree.treeController.flatNodes().find((n) => n.value.id === 'a1')!;
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
    const parent = f.tree.treeController.flatNodes().find((n) => n.value.id === 'a')!;
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

  it('cascade-toggle selection leaves a disabled descendant unselected', () => {
    f.host.cascade.set(true);
    f.host.nodes.set([
      {
        value: { id: 'a', name: 'Alpha' },
        children: [
          { value: { id: 'a1', name: 'Alpha-1' } },
          { value: { id: 'a2', name: 'Alpha-2' }, disabled: true },
        ],
      },
      { value: { id: 'b', name: 'Bravo' } },
    ]);
    f.fixture.detectChanges();
    const parent = f.tree.treeController.flatNodes().find((n) => n.value.id === 'a')!;
    f.tree.handleSelect(parent);
    f.fixture.detectChanges();
    expect(
      f.host
        .values()
        .map((v) => v.id)
        .sort(),
    ).toEqual(['a', 'a1']);
  });

  it('cascade-toggle deselection keeps a selected disabled descendant', () => {
    f.host.cascade.set(true);
    f.host.nodes.set([
      {
        value: { id: 'a', name: 'Alpha' },
        children: [
          { value: { id: 'a1', name: 'Alpha-1' } },
          { value: { id: 'a2', name: 'Alpha-2' }, disabled: true },
        ],
      },
      { value: { id: 'b', name: 'Bravo' } },
    ]);
    f.host.values.set([
      { id: 'a', name: 'Alpha' },
      { id: 'a1', name: 'Alpha-1' },
      { id: 'a2', name: 'Alpha-2' },
    ]);
    f.fixture.detectChanges();
    const parent = f.tree.treeController.flatNodes().find((n) => n.value.id === 'a')!;
    f.tree.handleSelect(parent);
    f.fixture.detectChanges();
    expect(f.host.values().map((v) => v.id)).toEqual(['a2']);
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
    const parent = f.tree.treeController.flatNodes().find((n) => n.value.id === 'a')!;
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

  it('chip remove deselects one value with chipDisplay all, even with cascadeChildren on', () => {
    f.host.cascade.set(true);
    f.host.chipDisplay.set('all');
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

  const fullAlpha = (): Row[] => [
    { id: 'a', name: 'Alpha' },
    { id: 'a1', name: 'Alpha-1' },
    { id: 'a2', name: 'Alpha-2' },
  ];
  const chipLabels = (): string[] =>
    Array.from(f.root.querySelectorAll('cngx-chip')).map((c) =>
      (c.firstChild?.textContent ?? c.textContent ?? '').trim(),
    );

  it('summarizes a fully selected subtree as one parent chip under cascadeChildren', () => {
    f.host.cascade.set(true);
    f.host.values.set([...fullAlpha(), { id: 'b', name: 'Bravo' }]);
    f.fixture.detectChanges();
    expect(f.root.querySelectorAll('cngx-chip').length).toBe(2);
    expect(f.tree.selected()).toHaveLength(4);
  });

  it('removes the whole subtree through the summarizing parent chip', () => {
    f.host.cascade.set(true);
    f.host.values.set(fullAlpha());
    f.fixture.detectChanges();
    expect(f.root.querySelectorAll('cngx-chip').length).toBe(1);
    f.root.querySelector<HTMLButtonElement>('.cngx-chip__remove')!.click();
    f.fixture.detectChanges();
    expect(f.host.values()).toEqual([]);
    expect(f.host.onChange).toHaveBeenCalledTimes(1);
    expect(f.host.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'cascade-toggle' }),
    );
  });

  it('keeps every chip with chipDisplay all and shows descendants with leaves', () => {
    f.host.cascade.set(true);
    f.host.values.set(fullAlpha());
    f.host.chipDisplay.set('all');
    f.fixture.detectChanges();
    expect(f.root.querySelectorAll('cngx-chip').length).toBe(3);
    f.host.chipDisplay.set('leaves');
    f.fixture.detectChanges();
    expect(f.root.querySelectorAll('cngx-chip').length).toBe(2);
  });

  it('defaults to every chip without cascadeChildren', () => {
    f.host.values.set(fullAlpha());
    f.fixture.detectChanges();
    expect(f.root.querySelectorAll('cngx-chip').length).toBe(3);
    expect(chipLabels().length).toBe(3);
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

  for (const key of ['Enter', ' ']) {
    it(`leaves ${JSON.stringify(key)} on a chip remove button to the button`, () => {
      f.host.values.set([
        { id: 'a1', name: 'Alpha-1' },
        { id: 'a2', name: 'Alpha-2' },
      ]);
      f.fixture.detectChanges();
      const chipRemove = f.root.querySelector<HTMLButtonElement>('.cngx-chip__remove')!;
      chipRemove.focus();
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      chipRemove.dispatchEvent(event);
      f.fixture.detectChanges();
      expect(f.tree.panelOpen()).toBe(false);
      expect(event.defaultPrevented).toBe(false);

      // jsdom has no native button activation; click() stands in for it.
      chipRemove.click();
      f.fixture.detectChanges();
      expect(f.host.values().map((v) => v.id)).toEqual(['a2']);
    });
  }

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

  it('*cngxTreeSelectChip overrides the default chip-pill per chip', () => {
    @Component({
      imports: [CngxTreeSelect, CngxTreeSelectChip],
      template: `
        <cngx-tree-select
          [nodes]="nodes"
          [nodeIdFn]="idFn"
          [labelFn]="labelFn"
          [keyFn]="keyFn"
          [(values)]="values"
        >
          <ng-template cngxTreeSelectChip let-opt let-remove="remove">
            <span class="custom-chip" [attr.data-id]="opt.value.id">
              {{ opt.label }}<button type="button" (click)="remove()">x</button>
            </span>
          </ng-template>
        </cngx-tree-select>
      `,
    })
    class ChipHost {
      readonly nodes = tree();
      readonly values = signal<Row[]>([
        { id: 'a1', name: 'Alpha-1' },
        { id: 'a2', name: 'Alpha-2' },
      ]);
      readonly idFn = (v: Row): string => v.id;
      readonly labelFn = (v: Row): string => v.name;
      readonly keyFn = (v: Row): unknown => v.id;
    }
    const fx = TestBed.createComponent(ChipHost);
    fx.detectChanges();
    const root = fx.nativeElement as HTMLElement;
    expect(root.querySelectorAll('.custom-chip').length).toBe(2);
    expect(root.querySelector('.cngx-chip')).toBeNull();
    // The slot's `remove` callback still routes through the commit flow.
    root.querySelector<HTMLElement>('.custom-chip[data-id="a1"] button')!.click();
    fx.detectChanges();
    expect(fx.componentInstance.values().map((v) => v.id)).toEqual(['a2']);
  });

  it('*cngxTreeSelectTriggerLabel replaces the whole chip strip', () => {
    @Component({
      imports: [CngxTreeSelect, CngxTreeSelectTriggerLabel],
      template: `
        <cngx-tree-select
          [nodes]="nodes"
          [nodeIdFn]="idFn"
          [labelFn]="labelFn"
          [keyFn]="keyFn"
          [(values)]="values"
        >
          <ng-template cngxTreeSelectTriggerLabel let-items let-count="count">
            <span class="summary">{{ count }} picked</span>
          </ng-template>
        </cngx-tree-select>
      `,
    })
    class SummaryHost {
      readonly nodes = tree();
      readonly values = signal<Row[]>([
        { id: 'a', name: 'Alpha' },
        { id: 'b', name: 'Bravo' },
      ]);
      readonly idFn = (v: Row): string => v.id;
      readonly labelFn = (v: Row): string => v.name;
      readonly keyFn = (v: Row): unknown => v.id;
    }
    const fx = TestBed.createComponent(SummaryHost);
    fx.detectChanges();
    const root = fx.nativeElement as HTMLElement;
    expect(root.querySelector('.summary')?.textContent).toBe('2 picked');
    expect(root.querySelector('.cngx-chip')).toBeNull();
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

    const leaf = ts.treeController.flatNodes().find((n) => n.value.id === 'a1')!;
    ts.handleSelect(leaf);
    fx.detectChanges();
    expect(fx.componentInstance.values()).toEqual([]);
    expect(root.querySelector<HTMLElement>('[role="combobox"]')?.getAttribute('aria-disabled')).toBe('true');
  });
});

describeCommitControllerCascade('CngxTreeSelect');

describeFieldSkinHost('CngxTreeSelect', CngxTreeSelect, 'cngx-tree-select', () =>
  createMockField({ name: 'pick' }).accessor,
);

describeFieldAriaHost('CngxTreeSelect', CngxTreeSelect, 'cngx-tree-select', {
  ctx: () => ({
    nodes: [{ value: 'a' }, { value: 'b' }],
    idFn: (v: string): string => v,
  }),
  inputs: '[nodes]="ctx[\'nodes\']" [nodeIdFn]="ctx[\'idFn\']"',
  initial: [],
  userWrite: (cmp) => (cmp as CngxTreeSelect<string>).values.set(['a']),
});

describe('CngxTreeSelect - toggle commit error announcement', () => {
  @Component({
    imports: [CngxTreeSelect],
    template: `
      <cngx-tree-select
        label="Teams"
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="labelFn"
        [initiallyExpanded]="'all'"
        [commitAction]="commitAction"
        [commitMode]="mode()"
        [(values)]="values"
      />
    `,
  })
  class CommitTreeHost {
    readonly nodes = tree();
    readonly values = signal<Row[]>([]);
    readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
    readonly idFn = (v: Row): string => v.id;
    readonly labelFn = (v: Row): string => v.name;
    pending: Subject<Row[]> | null = null;
    readonly commitAction = (): Observable<Row[]> => {
      this.pending = new Subject<Row[]>();
      return this.pending.asObservable();
    };
  }

  beforeEach(() => polyfillPopover());

  it.each(['optimistic', 'pessimistic'] as const)(
    'announces a failed %s toggle assertively with the error detail',
    (mode) => {
      const fixture = TestBed.createComponent(CommitTreeHost);
      fixture.componentInstance.mode.set(mode);
      fixture.detectChanges();
      const announce = vi
        .spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce')
        .mockImplementation(() => undefined);
      const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
        .componentInstance as CngxTreeSelect<Row>;
      tree.open();
      fixture.detectChanges();
      TestBed.flushEffects();
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>('[role="treeitem"]')!
        .click();
      fixture.detectChanges();
      announce.mockClear();

      fixture.componentInstance.pending!.error(new Error('server down'));
      fixture.detectChanges();

      expect(announce).toHaveBeenCalledTimes(1);
      const [message, politeness] = announce.mock.calls[0];
      expect(stripBidiIsolates(message)).toBe('Teams: Save failed - server down');
      expect(politeness).toBe('assertive');
      expect(fixture.componentInstance.values()).toEqual([]);
    },
  );
});

describe('CngxTreeSelect - shared core view state', () => {
  @Component({
    imports: [CngxTreeSelect],
    template: `
      <cngx-tree-select
        label="Teams"
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="labelFn"
        [state]="state"
        [commitAction]="commitAction"
        [commitErrorDisplay]="display()"
        [(values)]="values"
      />
    `,
  })
  class StateTreeHost {
    readonly nodes = tree();
    readonly values = signal<Row[]>([]);
    readonly idFn = (v: Row): string => v.id;
    readonly labelFn = (v: Row): string => v.name;
    readonly state = createManualState<readonly CngxTreeNode<Row>[]>();
    readonly display = signal<'banner' | 'none'>('banner');
    readonly commitAction = (): Observable<Row[]> => {
      throw new Error('boom');
    };
  }

  beforeEach(() => polyfillPopover());

  function mount() {
    const fixture = TestBed.createComponent(StateTreeHost);
    fixture.detectChanges();
    const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
      .componentInstance as CngxTreeSelect<Row>;
    return { fixture, tree, host: fixture.componentInstance };
  }

  it('shows the refresh indicator on a reload after the first load', () => {
    const { fixture, tree, host } = mount();
    host.state.setSuccess(tree.treeController.flatNodes().map((n) => n.node));
    host.state.set('loading');
    fixture.detectChanges();
    expect(tree.showRefreshIndicator()).toBe(true);
  });

  it('projects aria-invalid on the trigger after a failed commit under the banner display', () => {
    const { fixture, tree } = mount();
    const trigger = (fixture.nativeElement as HTMLElement).querySelector('[role="combobox"]')!;
    expect(trigger.getAttribute('aria-invalid')).toBeNull();
    tree.handleSelect(tree.treeController.flatNodes().find((n) => n.value.id === 'b')!);
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });

  it('hides the commit-error surface under commitErrorDisplay none', () => {
    const { fixture, tree, host } = mount();
    tree.handleSelect(tree.treeController.flatNodes().find((n) => n.value.id === 'b')!);
    fixture.detectChanges();
    expect(tree.showCommitError()).toBe(true);
    host.display.set('none');
    fixture.detectChanges();
    expect(tree.showCommitError()).toBe(false);
  });
});

describe('CngxTreeSelect - config panel class', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ providers: [provideSelectConfig(withPanelClass('app-panel'))] });
  });

  it('puts the CNGX_SELECT_CONFIG panel class on the tree panel', () => {
    const { root } = setup();
    expect(root.querySelector('.cngx-select__panel')?.classList).toContain('app-panel');
  });
});

describe('CngxTreeSelect - commit error copy without a label', () => {
  @Component({
    imports: [CngxTreeSelect],
    template: `
      <cngx-tree-select
        aria-label=""
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="labelFn"
        [initiallyExpanded]="'all'"
        [commitAction]="commitAction"
        [(values)]="values"
      />
    `,
  })
  class UnlabelledTreeHost {
    readonly nodes = tree();
    readonly values = signal<Row[]>([]);
    readonly idFn = (v: Row): string => v.id;
    readonly labelFn = (v: Row): string => v.name;
    pending: Subject<Row[]> | null = null;
    readonly commitAction = (): Observable<Row[]> => {
      this.pending = new Subject<Row[]>();
      return this.pending.asObservable();
    };
  }

  beforeEach(() => polyfillPopover());

  it('names the field label fallback when aria-label is empty', () => {
    const fixture = TestBed.createComponent(UnlabelledTreeHost);
    fixture.detectChanges();
    const announce = vi
      .spyOn(TestBed.inject(CngxSelectAnnouncer), 'announce')
      .mockImplementation(() => undefined);
    const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
      .componentInstance as CngxTreeSelect<Row>;
    tree.open();
    fixture.detectChanges();
    TestBed.flushEffects();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('[role="treeitem"]')!
      .click();
    fixture.detectChanges();
    announce.mockClear();

    fixture.componentInstance.pending!.error(new Error('server down'));
    fixture.detectChanges();

    const fallback = tree.ariaLabels().fieldLabelFallback;
    expect(fallback.length).toBeGreaterThan(0);
    const [message] = announce.mock.calls[0];
    expect(stripBidiIsolates(message)).toBe(`${fallback}: Save failed - server down`);
  });
});

describe('CngxTreeSelect - commit retry', () => {
  @Component({
    imports: [CngxTreeSelect],
    template: `
      <cngx-tree-select
        label="Teams"
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="labelFn"
        [initiallyExpanded]="'all'"
        [commitAction]="commitAction"
        [commitMode]="mode()"
        [(values)]="values"
        (cleared)="onCleared()"
      />
    `,
  })
  class RetryTreeHost {
    readonly nodes = tree();
    readonly values = signal<Row[]>([]);
    readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
    readonly idFn = (v: Row): string => v.id;
    readonly labelFn = (v: Row): string => v.name;
    readonly onCleared = vi.fn();
    readonly calls: Row[][] = [];
    readonly pending: Subject<Row[]>[] = [];
    readonly commitAction = (intended: Row[] | undefined): Observable<Row[]> => {
      this.calls.push([...(intended ?? [])]);
      const subject = new Subject<Row[]>();
      this.pending.push(subject);
      return subject.asObservable();
    };
  }

  beforeEach(() => polyfillPopover());

  it.each(['optimistic', 'pessimistic'] as const)(
    'replays the failed %s toggle instead of committing a clear',
    (mode) => {
      const fixture = TestBed.createComponent(RetryTreeHost);
      const host = fixture.componentInstance;
      host.mode.set(mode);
      fixture.detectChanges();
      const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
        .componentInstance as CngxTreeSelect<Row>;
      tree.open();
      fixture.detectChanges();
      TestBed.flushEffects();
      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>('[role="treeitem"]')!
        .click();
      fixture.detectChanges();
      host.pending[0].error(new Error('server down'));
      fixture.detectChanges();
      expect(host.values()).toEqual([]);

      tree.commitErrorContext().retry();
      fixture.detectChanges();

      expect(host.calls.length).toBe(2);
      expect(host.calls[1].map((r) => r.id)).toEqual(['a']);
      if (mode === 'optimistic') {
        expect(host.values().map((r) => r.id)).toEqual(['a']);
      }
      host.pending[1].next([{ id: 'a', name: 'Alpha' }]);
      host.pending[1].complete();
      fixture.detectChanges();
      expect(host.values().map((r) => r.id)).toEqual(['a']);
      expect(host.onCleared).not.toHaveBeenCalled();
    },
  );

  it('keeps an external write made while an optimistic toggle was pending', () => {
    const fixture = TestBed.createComponent(RetryTreeHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
      .componentInstance as CngxTreeSelect<Row>;
    tree.open();
    fixture.detectChanges();
    TestBed.flushEffects();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="treeitem"]')!.click();
    fixture.detectChanges();
    expect(host.values().map((r) => r.id)).toEqual(['a']);

    const external = host.nodes[1].value;
    host.values.set([external]);
    fixture.detectChanges();
    host.pending[0].error(new Error('server down'));
    fixture.detectChanges();

    expect(host.values()).toEqual([external]);
  });
});

describe('CngxTreeSelect - per-instance node ids', () => {
  @Component({
    imports: [CngxTreeSelect],
    template: `
      <cngx-tree-select
        class="first"
        label="First"
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="labelFn"
        [initiallyExpanded]="['a']"
      />
      <cngx-tree-select
        class="second"
        label="Second"
        [nodes]="nodes"
        [nodeIdFn]="idFn"
        [labelFn]="labelFn"
        [initiallyExpanded]="['a']"
      />
    `,
  })
  class TwoTreesHost {
    readonly nodes = tree();
    readonly idFn = (v: Row): string => v.id;
    readonly labelFn = (v: Row): string => v.name;
  }

  beforeEach(() => polyfillPopover());

  it('never shares a treeitem id or an aria-activedescendant target between two trees', async () => {
    const fixture = TestBed.createComponent(TwoTreesHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    try {
      fixture.detectChanges();
      await fixture.whenStable();
      const trees = fixture.debugElement
        .queryAll(By.directive(CngxTreeSelect))
        .map((de) => de.componentInstance as CngxTreeSelect<Row>);
      for (const t of trees) {
        t.open();
      }
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const ids = Array.from(root.querySelectorAll('[role="treeitem"]')).map((el) => el.id);
      expect(ids.length).toBe(8);
      expect(new Set(ids).size).toBe(ids.length);

      for (const host of ['.first', '.second']) {
        const treeEl = root.querySelector<HTMLElement>(`${host} [role="tree"]`)!;
        const target = treeEl.getAttribute('aria-activedescendant');
        expect(target).toBeTruthy();
        const resolved = document.getElementById(target!);
        expect(resolved?.closest('[role="tree"]')).toBe(treeEl);
      }
    } finally {
      root.remove();
    }
  });

  it('still expands a raw nodeIdFn id passed to [initiallyExpanded]', async () => {
    const fixture = TestBed.createComponent(TwoTreesHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const first = fixture.debugElement.queryAll(By.directive(CngxTreeSelect))[0]
      .componentInstance as CngxTreeSelect<Row>;
    const alpha = first.treeController.flatNodes().find((n) => n.value.id === 'a');
    expect(alpha).toBeDefined();
    expect(first.treeController.isExpanded(alpha!.id)()).toBe(true);
  });
});

describe('CngxTreeSelect - runtime language switch', () => {
  beforeAll(() => polyfillPopover());

  it('flips the clear label while unbound', () => {
    const labels = signal<CngxSelectAriaLabels>({});
    TestBed.configureTestingModule({ providers: [provideSelectConfig(withAriaLabels(labels))] });
    const { fixture, root } = setup();
    const clear = () => root.querySelector('.cngx-tree-select__clear-all');
    fixture.componentInstance.values.set([{ id: 'a', name: 'Alpha' }]);
    fixture.detectChanges();
    const before = clear()?.getAttribute('aria-label');
    labels.set({ clearButton: 'Auswahl zurücksetzen' });
    fixture.detectChanges();
    expect(before).toBe('Reset selection');
    expect(clear()?.getAttribute('aria-label')).toBe('Auswahl zurücksetzen');
  });
});

// ── Summary trigger under the touch floor ───────────────────────────

@Component({
  imports: [CngxTreeSelect, CngxTreeSelectTriggerLabel],
  template: `
    <cngx-tree-select
      [label]="'Teams'"
      [nodes]="nodes"
      [nodeIdFn]="idFn"
      [labelFn]="labelFn"
      [keyFn]="keyFn"
      [(values)]="values"
      [cascadeChildren]="true"
      [initiallyExpanded]="'all'"
    >
      @if (withTriggerLabel()) {
        <ng-template cngxTreeSelectTriggerLabel let-count="count">
          <span class="trigger-summary">{{ count }} teams</span>
        </ng-template>
      }
    </cngx-tree-select>
  `,
})
class TreeSummaryHost {
  readonly nodes = tree();
  readonly values = signal<Row[]>([
    { id: 'a1', name: 'Alpha-1' },
    { id: 'a2', name: 'Alpha-2' },
    { id: 'b', name: 'Bravo' },
  ]);
  readonly withTriggerLabel = signal(false);
  readonly idFn = (v: Row): string => v.id;
  readonly labelFn = (v: Row): string => v.name;
  readonly keyFn = (v: Row): unknown => v.id;
}

describe('CngxTreeSelect - summary trigger under the touch floor', () => {
  let restore: (() => void) | null = null;

  beforeAll(() => polyfillPopover());

  afterEach(() => {
    restore?.();
    restore = null;
  });

  function render(touch: boolean) {
    if (touch) {
      restore = stubTouchFloor();
    }
    const fixture = TestBed.createComponent(TreeSummaryHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
      .componentInstance as CngxTreeSelect<Row>;
    return { fixture, tree, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the first label plus the +N badge instead of chips', () => {
    const { el } = render(true);
    expect(el.querySelectorAll('cngx-chip').length).toBe(0);
    expect(el.querySelector('.cngx-select-summary__label')?.textContent?.trim()).toBe('Alpha-1');
    expect(el.querySelector('.cngx-select__chip-overflow-badge')?.textContent?.trim()).toBe('+2');
    expect(el.querySelector('.cngx-select__chip-list')?.getAttribute('data-overflow')).toBe(
      'truncate',
    );
  });

  it('exposes the whole selection as the trigger value for AT', () => {
    const { el } = render(true);
    const trigger = el.querySelector('[role="combobox"]')!;
    const sr = trigger.querySelector('cngx-select-summary .cngx-sr-only');
    expect(stripBidiIsolates(sr?.textContent?.trim() ?? '')).toBe(
      '3 selected: Alpha-1, Alpha-2, and Bravo',
    );
    expect(trigger.querySelector('.cngx-select-summary__label')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('summarizes a cascaded selection the way the chips do', () => {
    const { fixture, tree, el } = render(true);
    fixture.componentInstance.values.set([]);
    fixture.detectChanges();
    const parent = tree.treeController.flatNodes().find((n) => n.value.id === 'a')!;
    tree.handleSelect(parent);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(fixture.componentInstance.values()).toHaveLength(3);
    // The summary reads the displayed chip list: the parent stands for its
    // fully selected subtree.
    expect(el.querySelector('.cngx-select-summary__label')?.textContent?.trim()).toBe('Alpha');
    expect(el.querySelector('.cngx-select__chip-overflow-badge')).toBeNull();
    expect(
      stripBidiIsolates(
        el.querySelector('cngx-select-summary .cngx-sr-only')?.textContent?.trim() ?? '',
      ),
    ).toBe('Alpha');
  });

  it('speaks a single value as its label and shows the placeholder for none', () => {
    const { fixture, el } = render(true);
    fixture.componentInstance.values.set([{ id: 'b', name: 'Bravo' }]);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-select-summary__label')?.textContent?.trim()).toBe('Bravo');
    expect(el.querySelector('.cngx-select__chip-overflow-badge')).toBeNull();
    expect(el.querySelector('cngx-select-summary .cngx-sr-only')?.textContent?.trim()).toBe(
      'Bravo',
    );
    fixture.componentInstance.values.set([]);
    fixture.detectChanges();
    expect(el.querySelector('cngx-select-summary')).toBeNull();
    expect(el.querySelector('.cngx-tree-select__placeholder')).not.toBeNull();
  });

  it('lets a projected trigger-label template win over the summary', () => {
    const { fixture, el } = render(true);
    fixture.componentInstance.withTriggerLabel.set(true);
    fixture.detectChanges();
    expect(el.querySelector('cngx-select-summary')).toBeNull();
    expect(el.querySelector('.trigger-summary')?.textContent?.trim()).toBe('3 teams');
  });

  it('keeps the chips on a fine pointer', () => {
    const { el } = render(false);
    expect(el.querySelector('cngx-select-summary')).toBeNull();
    expect(el.querySelectorAll('cngx-chip').length).toBe(3);
    // The tree strip is one line on every pointer.
    expect(el.querySelector('.cngx-select__chip-list')?.getAttribute('data-overflow')).toBe(
      'truncate',
    );
  });
});

describeMobileSheet('CngxTreeSelect', CngxTreeSelect, 'cngx-tree-select', {
  inputs: '[nodes]="nodes" [nodeIdFn]="idFn" [labelFn]="labelFn"',
  optionSelector: '[role="treeitem"]',
  fill: 'sheet',
  showDone: true,
  showInput: false,
  initialFocusSelector: '[role="tree"]',
  popupRole: 'tree',
  makeField: () => {
    const { accessor, ref } = createMockField<string[]>({ name: 'pick', value: [] });
    return { accessor, touched: () => ref.touched() };
  },
});

describeSelectBehaviourHost('CngxTreeSelect', CngxTreeSelect, 'cngx-tree-select', {
  inputs: '[nodes]="nodes" [nodeIdFn]="idFn" [labelFn]="labelFn"',
  optionSelector: '[role="treeitem"]',
  readValue: (cmp) => (cmp as { values: () => unknown }).values(),
});

// ── One-line chip strip with a +N overflow chip ─────────────────────

@Component({
  imports: [CngxTreeSelect, CngxSelectChipOverflow],
  template: `
    <cngx-tree-select
      [label]="'Letters'"
      [nodes]="nodes"
      [nodeIdFn]="idFn"
      [labelFn]="labelFn"
      [keyFn]="keyFn"
      [(values)]="values"
      [maxVisibleChips]="cap()"
    >
      @if (withOverflowSlot()) {
        <ng-template cngxSelectChipOverflow let-count let-label="label" let-hidden="hidden">
          <span class="my-overflow" [attr.data-count]="count" [attr.data-label]="label">{{
            hidden.length
          }}</span>
        </ng-template>
      }
    </cngx-tree-select>
  `,
})
class TreeOverflowHost {
  readonly nodes: CngxTreeNode<Row>[] = ['A', 'B', 'C', 'D', 'E'].map((name) => ({
    value: { id: name.toLowerCase(), name },
  }));
  readonly values = signal<Row[]>(this.nodes.map((n) => n.value));
  readonly cap = signal(3);
  readonly withOverflowSlot = signal(false);
  readonly idFn = (v: Row): string => v.id;
  readonly labelFn = (v: Row): string => v.name;
  readonly keyFn = (v: Row): unknown => v.id;
}

describe('CngxTreeSelect - one-line chip strip', () => {
  beforeAll(() => polyfillPopover());

  function render() {
    const fixture = TestBed.createComponent(TreeOverflowHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('truncates at maxVisibleChips with an aria-hidden +N badge', () => {
    const { el } = render();
    const strip = el.querySelector('.cngx-select__chip-list')!;
    expect(strip.getAttribute('data-overflow')).toBe('truncate');
    expect(strip.querySelectorAll('cngx-chip').length).toBe(3);
    const badge = strip.querySelector('.cngx-select__chip-overflow-badge');
    expect(badge?.textContent?.trim()).toBe('+2');
    expect(badge?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reads the whole displayed selection for AT while values are hidden', () => {
    const { fixture, el } = render();
    const sr = el.querySelector('.cngx-select__chip-list .cngx-select__hidden-summary');
    expect(sr?.classList.contains('cngx-sr-only')).toBe(true);
    expect(stripBidiIsolates(sr?.textContent?.trim() ?? '')).toBe('5 selected: A, B, C, D, and E');
    fixture.componentInstance.cap.set(5);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-select__hidden-summary')).toBeNull();
    expect(el.querySelector('.cngx-select__chip-overflow-badge')).toBeNull();
  });

  it('hands count, label and hidden values to a projected *cngxSelectChipOverflow', () => {
    const { fixture, el } = render();
    fixture.componentInstance.withOverflowSlot.set(true);
    fixture.detectChanges();
    const custom = el.querySelector<HTMLElement>('.my-overflow');
    expect(custom).not.toBeNull();
    expect(custom!.dataset['count']).toBe('2');
    expect(custom!.dataset['label']).toBe('+2');
    expect(custom!.textContent?.trim()).toBe('2');
    expect(el.querySelector('.cngx-select__chip-overflow-badge')).toBeNull();
    // The host keeps the AT text when the badge is projected.
    expect(el.querySelector('.cngx-select__hidden-summary')).not.toBeNull();
  });
});

// ── Selected-of-total count on parent rows ──────────────────────────

let configNodeCountTpl: TemplateRef<CngxTreeSelectNodeCountContext> | null = null;

@Component({
  imports: [CngxTreeSelect, CngxTreeSelectNodeCount],
  template: `
    <cngx-tree-select
      [label]="'Teams'"
      [nodes]="nodes"
      [nodeIdFn]="idFn"
      [labelFn]="labelFn"
      [keyFn]="keyFn"
      [(values)]="values"
      [initiallyExpanded]="'all'"
    >
      @if (withSlot()) {
        <ng-template
          cngxTreeSelectNodeCount
          let-text
          let-selected="selected"
          let-total="total"
          let-node="node"
        >
          <b class="my-count" [attr.data-node]="node.id"
            >{{ selected }} of {{ total }} ({{ text }})</b
          >
        </ng-template>
      }
    </cngx-tree-select>
  `,
})
class TreeCountHost {
  readonly nodes = tree();
  readonly values = signal<Row[]>([{ id: 'a1', name: 'Alpha-1' }]);
  readonly withSlot = signal(false);
  readonly idFn = (v: Row): string => v.id;
  readonly labelFn = (v: Row): string => v.name;
  readonly keyFn = (v: Row): unknown => v.id;
}

@Component({
  imports: [CngxTreeSelect],
  providers: [
    {
      provide: CNGX_SELECT_CONFIG,
      useFactory: () => makeSelectConfig(withTemplates({ treeNodeCount: configNodeCountTpl })),
    },
  ],
  template: `
    <cngx-tree-select
      [label]="'Teams'"
      [nodes]="nodes"
      [nodeIdFn]="idFn"
      [labelFn]="labelFn"
      [keyFn]="keyFn"
      [(values)]="values"
      [initiallyExpanded]="'all'"
    />
  `,
})
class TreeCountConfigHost {
  readonly nodes = tree();
  readonly values = signal<Row[]>([{ id: 'a1', name: 'Alpha-1' }]);
  readonly idFn = (v: Row): string => v.id;
  readonly labelFn = (v: Row): string => v.name;
  readonly keyFn = (v: Row): unknown => v.id;
}

@Component({
  template: `<ng-template #count let-text
    ><i class="config-count">{{ text }}</i></ng-template
  >`,
})
class CountTemplateHolder {
  readonly count = viewChild.required<TemplateRef<CngxTreeSelectNodeCountContext>>('count');
}

function openTree<H>(type: new () => H) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  el.querySelector<HTMLElement>('[role="combobox"]')!.click();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const row = (id: string): HTMLElement =>
    el.querySelector<HTMLElement>(`[role="treeitem"][id$="-${id}"]`)!;
  return { fixture, el, row };
}

describe('CngxTreeSelect - parent row counts', () => {
  beforeAll(() => polyfillPopover());

  it('shows selected-of-total on parent rows only, hidden from AT', () => {
    const { fixture, row } = openTree(TreeCountHost);
    const count = row('a').querySelector('.cngx-tree-select__count');
    expect(count?.textContent?.trim()).toBe('1/2');
    expect(count?.getAttribute('aria-hidden')).toBe('true');
    expect(row('a1').querySelector('.cngx-tree-select__count')).toBeNull();
    expect(row('b').querySelector('.cngx-tree-select__count')).toBeNull();
    fixture.componentInstance.values.set([
      { id: 'a', name: 'Alpha' },
      { id: 'a1', name: 'Alpha-1' },
      { id: 'a2', name: 'Alpha-2' },
    ]);
    fixture.detectChanges();
    expect(row('a').querySelector('.cngx-tree-select__count')?.textContent?.trim()).toBe('2/2');
  });

  it('follows a runtime copy switch', () => {
    const labels = signal<CngxSelectFallbackLabels>({});
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withFallbackLabels(labels))],
    });
    const { fixture, row } = openTree(TreeCountHost);
    expect(row('a').querySelector('.cngx-tree-select__count')?.textContent?.trim()).toBe('1/2');
    labels.set({ treeNodeCount: (selected, total) => `${selected} von ${total}` });
    fixture.detectChanges();
    expect(row('a').querySelector('.cngx-tree-select__count')?.textContent?.trim()).toBe('1 von 2');
  });

  it('lets a projected *cngxTreeSelectNodeCount replace the count, still AT-hidden', () => {
    const { fixture, row } = openTree(TreeCountHost);
    fixture.componentInstance.withSlot.set(true);
    fixture.detectChanges();
    const custom = row('a').querySelector('.my-count');
    expect(custom?.textContent?.trim()).toBe('1 of 2 (1/2)');
    expect(custom?.getAttribute('data-node')).toMatch(/-a$/);
    expect(custom?.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(row('b').querySelector('.my-count')).toBeNull();
  });

  it('falls back to a CNGX_SELECT_CONFIG.templates.treeNodeCount default', () => {
    const holder = TestBed.createComponent(CountTemplateHolder);
    holder.detectChanges();
    configNodeCountTpl = holder.componentInstance.count();
    try {
      const { row } = openTree(TreeCountConfigHost);
      expect(row('a').querySelector('.config-count')?.textContent?.trim()).toBe('1/2');
    } finally {
      configNodeCountTpl = null;
    }
  });
});
