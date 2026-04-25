import {
  Component,
  signal,
  TemplateRef,
  viewChild,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type AsyncView } from '@cngx/common/data';
import {
  createTreeController,
  type CngxTreeController,
} from '@cngx/common/interactive';
import type { CngxTreeNode, FlatTreeNode } from '@cngx/utils';
import { describe, expect, it } from 'vitest';
import {
  CNGX_SELECT_PANEL_HOST,
  CNGX_SELECT_PANEL_VIEW_HOST,
  type CngxSelectPanelHost,
} from '../shared/panel-host';
import {
  CNGX_TREE_SELECT_PANEL_HOST,
  type CngxTreeSelectPanelHost,
} from './tree-select-panel-host';
import { CngxTreeSelectNode } from './tree-select-node.directive';
import { CngxTreeSelectPanel } from './tree-select-panel.component';
import type { CngxTreeSelectNodeContext } from './tree-select.model';

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
        { value: { id: 'a2', name: 'Alpha-2' }, disabled: true },
      ],
    },
    { value: { id: 'b', name: 'Bravo' } },
  ];
}

/** Minimal shell-host stub — shell only cares about activeView='content'. */
function makeShellHost(): CngxSelectPanelHost {
  const nullTpl = signal<null>(null);
  return {
    activeView: signal<AsyncView>('content'),
    effectiveOptions: signal([]),
    flatOptions: signal([]),
    skeletonIndices: signal([]),
    showInlineError: signal(false),
    showCommitError: signal(false),
    showRefreshIndicator: signal(false),
    errorContext: signal({ $implicit: null, error: null, retry: () => {} }),
    commitErrorContext: signal({
      $implicit: null,
      error: null,
      option: null,
      retry: () => {},
    }),
    loading: signal(false),
    loadingVariant: signal('spinner'),
    refreshingVariant: signal('bar'),
    commitErrorDisplay: signal('banner'),
    panelClassList: signal(null),
    panelWidthCss: signal(null),
    fallbackLabels: {
      loading: 'Loading…',
      empty: 'No Options',
      loadFailed: 'Loading failed',
      loadFailedRetry: 'Retry',
      refreshFailed: 'Refresh failed',
      refreshFailedRetry: 'Try again',
      commitFailed: 'Save failed',
      commitFailedRetry: 'Try again',
    },
    ariaLabels: {
      treeExpand: 'Expand node',
      treeCollapse: 'Collapse node',
      statusLoading: 'Loading options',
      statusRefreshing: 'Refreshing options',
      fieldLabelFallback: 'Selection',
      commitFailedMessage: 'Save failed',
    },
    resolvedListboxLabel: signal(''),
    resolvedShowSelectionIndicator: signal(true),
    resolvedSelectionIndicatorVariant: signal('checkbox'),
    resolvedSelectionIndicatorPosition: signal('before'),
    listboxCompareWith: signal(Object.is as (a: unknown, b: unknown) => boolean),
    externalActivation: signal(false),
    tpl: {
      check: nullTpl,
      caret: nullTpl,
      optgroup: nullTpl,
      placeholder: nullTpl,
      empty: nullTpl,
      loading: nullTpl,
      optionLabel: nullTpl,
      error: nullTpl,
      retryButton: nullTpl,
      refreshing: nullTpl,
      commitError: nullTpl,
      clearButton: nullTpl,
      optionPending: nullTpl,
      optionError: nullTpl,
      action: nullTpl,
    },
    commitErrorValue: signal(null),
    activeId: signal(null),
    isGroup: ((..._a: unknown[]) => false) as CngxSelectPanelHost['isGroup'],
    isSelected: () => false,
    isIndeterminate: () => false,
    isCommittingOption: () => false,
    patchData: () => {
      /* stub */
    },
    clearLocalItems: () => {
      /* stub */
    },
    handleRetry: () => {},
  };
}

@Component({
  imports: [CngxTreeSelectPanel, CngxTreeSelectNode],
  providers: [
    { provide: CNGX_SELECT_PANEL_HOST, useFactory: makeShellHost },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useFactory: makeShellHost },
    { provide: CNGX_TREE_SELECT_PANEL_HOST, useExisting: TreeHost },
  ],
  template: `
    <cngx-tree-select-panel />
    <ng-template cngxTreeSelectNode let-node>
      <div class="custom-slot" [attr.data-id]="node.id">
        custom: {{ node.label }}
      </div>
    </ng-template>
  `,
})
class TreeHost implements CngxTreeSelectPanelHost<Row> {
  readonly nodes = signal(makeTree());
  readonly selected = signal<Set<string>>(new Set());
  readonly useSlot = signal(false);
  readonly panelOpen = signal(true).asReadonly();
  // Glyph overrides + i18n labels — null / default literals keep the
  // harness on the built-in node-row visuals.
  readonly twistyGlyph = signal<TemplateRef<void> | null>(null).asReadonly();
  readonly twistyOpenGlyph = signal<TemplateRef<void> | null>(null).asReadonly();
  readonly checkGlyph = signal<TemplateRef<void> | null>(null).asReadonly();
  readonly dashGlyph = signal<TemplateRef<void> | null>(null).asReadonly();
  readonly twistyExpandLabel = signal('Expand').asReadonly();
  readonly twistyCollapseLabel = signal('Collapse').asReadonly();
  close(): void {
    /* no-op in the spec harness */
  }

  readonly treeController: CngxTreeController<Row> = TestBed.runInInjectionContext(
    () =>
      createTreeController<Row>({
        nodes: this.nodes,
        nodeIdFn: (v) => v.id,
        labelFn: (v) => v.name,
      }),
  );

  readonly slotDirective = viewChild(CngxTreeSelectNode<Row>);

  readonly nodeTpl: Signal<TemplateRef<CngxTreeSelectNodeContext<Row>> | null> =
    (() => {
      const use = this.useSlot;
      const slot = this.slotDirective;
      return (() => {
        const imported = slot();
        return use() && imported ? imported.templateRef : null;
      }) as unknown as Signal<TemplateRef<CngxTreeSelectNodeContext<Row>> | null>;
    })();

  readonly lastSelected = signal<FlatTreeNode<Row> | null>(null);

  isSelected(v: Row): boolean {
    return this.selected().has(v.id);
  }

  isIndeterminate(_v: Row): boolean {
    return false;
  }

  handleSelect(node: FlatTreeNode<Row>): void {
    this.lastSelected.set(node);
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(node.value.id)) {
        next.delete(node.value.id);
      } else {
        next.add(node.value.id);
      }
      return next;
    });
  }
}

function setup() {
  const fixture = TestBed.createComponent(TreeHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, host, root };
}

describe('CngxTreeSelectPanel', () => {
  it('renders a role="tree" container with aria-multiselectable', () => {
    const { root } = setup();
    const tree = root.querySelector('[role="tree"]');
    expect(tree).toBeTruthy();
    expect(tree?.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('renders one treeitem per visible node with W3C APG ARIA attrs', () => {
    const { fixture, host, root } = setup();
    // Only roots visible initially: a (parent, hasChildren), b (leaf)
    let items = root.querySelectorAll<HTMLElement>('[role="treeitem"]');
    expect(items.length).toBe(2);

    const a = items[0];
    expect(a.getAttribute('aria-level')).toBe('1');
    expect(a.getAttribute('aria-posinset')).toBe('1');
    expect(a.getAttribute('aria-setsize')).toBe('2');
    expect(a.getAttribute('aria-expanded')).toBe('false');
    expect(a.getAttribute('aria-selected')).toBe('false');

    const b = items[1];
    expect(b.getAttribute('aria-level')).toBe('1');
    // Leaf — no aria-expanded attribute at all
    expect(b.hasAttribute('aria-expanded')).toBe(false);

    // Expand Alpha → Alpha-1 + Alpha-2 enter the visible set
    host.treeController.expand('a');
    fixture.detectChanges();

    items = root.querySelectorAll<HTMLElement>('[role="treeitem"]');
    expect(items.length).toBe(4);
    const a1 = items[1];
    expect(a1.getAttribute('aria-level')).toBe('2');
    expect(a1.getAttribute('aria-posinset')).toBe('1');
    expect(a1.getAttribute('aria-setsize')).toBe('2');

    const a2 = items[2];
    expect(a2.getAttribute('aria-disabled')).toBe('true');
  });

  it('twisty click toggles the controller expansion state', () => {
    const { fixture, host, root } = setup();
    const twisty = root.querySelector<HTMLButtonElement>('.cngx-tree-select__twisty');
    expect(twisty).toBeTruthy();
    expect(host.treeController.isExpanded('a')()).toBe(false);

    twisty!.click();
    fixture.detectChanges();
    expect(host.treeController.isExpanded('a')()).toBe(true);

    twisty!.click();
    fixture.detectChanges();
    expect(host.treeController.isExpanded('a')()).toBe(false);
  });

  it('projected *cngxTreeSelectNode template wins over the default row markup', () => {
    const { fixture, host, root } = setup();
    // Baseline: default markup
    expect(root.querySelector('.custom-slot')).toBeNull();
    expect(root.querySelector('.cngx-tree-select__node')).toBeTruthy();

    host.useSlot.set(true);
    fixture.detectChanges();

    expect(root.querySelectorAll('.custom-slot').length).toBe(2);
    expect(root.querySelector('.cngx-tree-select__node')).toBeNull();
    expect(root.querySelector<HTMLElement>('[data-id="a"]')?.textContent?.trim()).toBe(
      'custom: Alpha',
    );
  });
});
