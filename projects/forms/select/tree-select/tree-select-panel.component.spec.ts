import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Component, signal, TemplateRef, viewChild, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxActiveDescendant } from '@cngx/common/a11y';
import { type AsyncView } from '@cngx/common/data';
import { CngxPopover, CngxPopoverSheet } from '@cngx/common/popover';
import { createTreeController, type CngxTreeController } from '@cngx/common/interactive';
import { provideLocale } from '@cngx/core/utils';
import type { CngxTreeNode, FlatTreeNode } from '@cngx/utils';
import { describe, expect, it, vi } from 'vitest';
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

/** Minimal shell-host stub - shell only cares about activeView='content'. */
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
    fallbackLabels: signal({
      loading: 'Loading…',
      empty: 'No options',
      loadFailed: 'Could not load',
      loadFailedRetry: 'Retry',
      refreshFailed: 'Refresh failed',
      refreshFailedRetry: 'Retry',
      searchPlaceholder: 'Search…',
      commitFailed: 'Save failed',
      commitFailedRetry: 'Retry',
      chipOverflowBadge: (count: number) => `+${count}`,
      treeNodeCount: (selected: number, total: number) => `${selected}/${total}`,
      selectedCount: (count: number) => `${count} selected`,
    }),
    ariaLabels: signal({
      chipRemove: 'Remove',
      chipRemoveFor: (action: string, label: string) => `${action}: ${label}`,
      statusLoading: 'Loading options',
      statusRefreshing: 'Refreshing options',
      fieldLabelFallback: 'Selection',
      commitFailedMessage: (label: string) => `${label}: Save failed`,
      createFailedMessage: (label: string, option: string) =>
        `${label}: Could not create ${option}`,
      searchInput: 'Search options',
      listboxFallback: 'Options',
      sheetClose: 'Close',
      sheetDone: 'Done',
      commitPending: 'Unavailable while saving',
      selectionSummary: (labels: readonly string[]) => labels.join(', '),
    }),
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
      loadingGlyph: nullTpl,
      refreshing: nullTpl,
      commitError: nullTpl,
      clearButton: nullTpl,
      optionPending: nullTpl,
      optionError: nullTpl,
      action: nullTpl,
      sheetHandle: nullTpl,
      sheetCount: nullTpl,
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
  imports: [CngxTreeSelectPanel, CngxTreeSelectNode, CngxPopover, CngxPopoverSheet],
  providers: [
    { provide: CNGX_SELECT_PANEL_HOST, useFactory: makeShellHost },
    { provide: CNGX_SELECT_PANEL_VIEW_HOST, useFactory: makeShellHost },
    { provide: CNGX_TREE_SELECT_PANEL_HOST, useExisting: TreeHost },
  ],
  template: `
    <div cngxPopover cngxPopoverSheet>
      <cngx-tree-select-panel />
    </div>
    <ng-template cngxTreeSelectNode let-node>
      <div class="custom-slot" [attr.data-id]="node.id">custom: {{ node.label }}</div>
    </ng-template>
    <ng-template #customTwisty><span class="custom-twisty">+</span></ng-template>
  `,
})
class TreeHost implements CngxTreeSelectPanelHost<Row> {
  readonly nodes = signal(makeTree());
  readonly selected = signal<Set<string>>(new Set());
  readonly indeterminateIds = signal<Set<string>>(new Set());
  readonly useSlot = signal(false);
  readonly panelOpen = signal(true).asReadonly();
  readonly disabled = signal(false);
  readonly listboxId = 'tree-1';
  readonly expandToReveal = signal(false);
  // Glyph overrides + i18n labels - null / default literals keep the
  // harness on the built-in node-row visuals.
  readonly twistyGlyphState = signal<TemplateRef<void> | null>(null);
  readonly twistyGlyph = this.twistyGlyphState.asReadonly();
  readonly twistyOpenGlyph = signal<TemplateRef<void> | null>(null).asReadonly();
  readonly checkGlyph = signal<TemplateRef<void> | null>(null).asReadonly();
  readonly dashGlyph = signal<TemplateRef<void> | null>(null).asReadonly();
  readonly customTwisty = viewChild.required<TemplateRef<void>>('customTwisty');
  readonly resolvedListboxLabel = signal('Teams').asReadonly();
  readonly adCompare = signal<(a: Row, b: Row) => boolean>(Object.is);
  readonly adCompareWith = this.adCompare.asReadonly();
  close(): void {
    /* no-op in the spec harness */
  }

  readonly treeController: CngxTreeController<Row> = TestBed.runInInjectionContext(() =>
    createTreeController<Row>({
      nodes: this.nodes,
      nodeIdFn: (v) => v.id,
      labelFn: (v) => v.name,
    }),
  );

  readonly slotDirective = viewChild(CngxTreeSelectNode<Row>);

  readonly nodeTpl: Signal<TemplateRef<CngxTreeSelectNodeContext<Row>> | null> = (() => {
    const use = this.useSlot;
    const slot = this.slotDirective;
    return (() => {
      const imported = slot();
      return use() && imported ? imported.templateRef : null;
    }) as unknown as Signal<TemplateRef<CngxTreeSelectNodeContext<Row>> | null>;
  })();

  readonly lastSelected = signal<FlatTreeNode<Row> | null>(null);

  readonly rowTapExpandsState = signal(false);
  readonly rowTapExpands = this.rowTapExpandsState.asReadonly();
  readonly nodeCountTpl = signal(null).asReadonly();
  readonly selectionCount = signal(0).asReadonly();
  readonly selectionCountText = signal('0 selected').asReadonly();
  readonly clearAllLabel = signal('Reset selection').asReadonly();
  readonly footerTpl = signal(null).asReadonly();
  clearAllInPanel(): void {
    /* no-op in the spec harness */
  }
  nodeCount(): null {
    return null;
  }
  nodeCountText(): string {
    return '';
  }

  isSelected(v: Row): boolean {
    return this.selected().has(v.id);
  }

  isIndeterminate(v: Row): boolean {
    return this.indeterminateIds().has(v.id);
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

/**
 * Name-from-content per accname 1.2 step 2F, reduced to what the default
 * row renders: an `aria-hidden` subtree contributes nothing, an
 * `aria-label` replaces its subtree, text nodes contribute their text.
 */
function accessibleNameFromContent(el: Element): string {
  const parts: string[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      parts.push(child.textContent ?? '');
      continue;
    }
    if (!(child instanceof Element) || child.getAttribute('aria-hidden') === 'true') {
      continue;
    }
    parts.push(child.getAttribute('aria-label') ?? accessibleNameFromContent(child));
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function setup() {
  const fixture = TestBed.createComponent(TreeHost);
  fixture.detectChanges();
  const host = fixture.componentInstance;
  const root = fixture.nativeElement as HTMLElement;
  return { fixture, host, root };
}

describe('CngxTreeSelectPanel', () => {
  it('drops a keyboard activation while the select is disabled', () => {
    const { fixture, host, root } = setup();
    TestBed.flushEffects();
    fixture.detectChanges();
    const tree = root.querySelector<HTMLElement>('[role="tree"]')!;
    host.disabled.set(true);
    tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(host.lastSelected()).toBeNull();
    host.disabled.set(false);
    tree.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(host.lastSelected()).not.toBeNull();
  });

  it('renders a role="tree" container without the aria-selected-model attributes', () => {
    const { root } = setup();
    const tree = root.querySelector('[role="tree"]');
    expect(tree).toBeTruthy();
    // APG checkbox-tree: per-row aria-checked communicates multi-ness;
    // aria-multiselectable belongs to the aria-selected model.
    expect(tree?.hasAttribute('aria-multiselectable')).toBe(false);
  });

  it('names the role="tree" container from the host listbox label', () => {
    const { root } = setup();
    expect(root.querySelector('[role="tree"]')?.getAttribute('aria-label')).toBe('Teams');
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
    expect(a.getAttribute('aria-checked')).toBe('false');
    expect(a.hasAttribute('aria-selected')).toBe(false);

    const b = items[1];
    expect(b.getAttribute('aria-level')).toBe('1');
    // Leaf - no aria-expanded attribute at all
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

  it('aria-checked reflects the tri-state selection: false / true / mixed', () => {
    const { fixture, host, root } = setup();
    host.treeController.expand('a');
    fixture.detectChanges();

    const itemById = (id: string): HTMLElement =>
      root.querySelector<HTMLElement>(`[role="treeitem"][id="${id}"]`)!;
    expect(itemById('a').getAttribute('aria-checked')).toBe('false');

    // Full selection -> true.
    host.selected.set(new Set(['a1']));
    fixture.detectChanges();
    expect(itemById('a1').getAttribute('aria-checked')).toBe('true');

    // Partial cascade -> mixed on the parent, same computed source as the
    // indeterminate indicator.
    host.indeterminateIds.set(new Set(['a']));
    fixture.detectChanges();
    expect(itemById('a').getAttribute('aria-checked')).toBe('mixed');
    const indicator = itemById('a').querySelector('cngx-checkbox-indicator');
    expect(indicator).toBeTruthy();
    expect(root.querySelector('[aria-selected]')).toBeNull();
    expect(root.querySelector('[aria-multiselectable]')).toBeNull();
  });

  it('twisty click toggles the controller expansion state', () => {
    const { fixture, host, root } = setup();
    const twisty = root.querySelector<HTMLElement>('.cngx-tree-select__twisty');
    expect(twisty).toBeTruthy();
    expect(host.treeController.isExpanded('a')()).toBe(false);

    twisty!.click();
    fixture.detectChanges();
    expect(host.treeController.isExpanded('a')()).toBe(true);

    twisty!.click();
    fixture.detectChanges();
    expect(host.treeController.isExpanded('a')()).toBe(false);
  });

  it('draws the default twisty as an AT-hidden chevron SVG, open and closed', () => {
    const { fixture, host, root } = setup();
    const twisty = (): HTMLElement =>
      root.querySelector<HTMLElement>('[role="treeitem"][id="a"] .cngx-tree-select__twisty')!;

    const closed = twisty().querySelector('svg');
    expect(closed).toBeTruthy();
    expect(closed!.getAttribute('focusable')).toBe('false');
    expect(closed!.getAttribute('fill')).toBe('none');
    expect(closed!.getAttribute('stroke')).toBe('currentColor');
    expect(twisty().textContent?.trim()).toBe('');
    expect(twisty().getAttribute('aria-hidden')).toBe('true');
    expect(twisty().classList.contains('cngx-tree-select__twisty--open')).toBe(false);

    host.treeController.expand('a');
    fixture.detectChanges();
    expect(twisty().classList.contains('cngx-tree-select__twisty--open')).toBe(true);
    expect(twisty().querySelector('svg')).toBeTruthy();
    expect(twisty().textContent?.trim()).toBe('');
  });

  it('lets a projected twistyGlyph win over the default chevron', () => {
    const { fixture, host, root } = setup();
    host.twistyGlyphState.set(host.customTwisty());
    fixture.detectChanges();
    const twisty = root.querySelector<HTMLElement>(
      '[role="treeitem"][id="a"] .cngx-tree-select__twisty',
    )!;
    expect(twisty.querySelector('.custom-twisty')).toBeTruthy();
    expect(twisty.querySelector('svg')).toBeNull();
  });

  it('names a parent treeitem by its label alone, the twisty stays out of the name', () => {
    const { fixture, host, root } = setup();
    const parent = (): HTMLElement =>
      root.querySelector<HTMLElement>('[role="treeitem"][id="a"]')!;

    expect(accessibleNameFromContent(parent())).toBe('Alpha');
    const twisty = parent().querySelector<HTMLElement>('.cngx-tree-select__twisty')!;
    expect(twisty.getAttribute('aria-hidden')).toBe('true');
    expect(twisty.hasAttribute('aria-label')).toBe(false);
    expect(twisty.tagName).not.toBe('BUTTON');
    expect(twisty.hasAttribute('tabindex')).toBe(false);

    // Expanded state rides on aria-expanded, never on the name.
    host.treeController.expand('a');
    fixture.detectChanges();
    expect(parent().getAttribute('aria-expanded')).toBe('true');
    expect(accessibleNameFromContent(parent())).toBe('Alpha');
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

describe('CngxTreeSelectPanel - context-cache hygiene', () => {
  interface PanelCaches {
    contextCache: Map<string, { readonly context: unknown }>;
    toggleById: Map<string, () => void>;
  }

  function setupSlotted() {
    const fixture = TestBed.createComponent(TreeHost);
    fixture.componentInstance.useSlot.set(true);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const panel = fixture.debugElement.query(By.directive(CngxTreeSelectPanel))
      .componentInstance as CngxTreeSelectPanel<Row>;
    const caches = panel as unknown as PanelCaches;
    return { fixture, host, caches };
  }

  it('evicts stale entries when the nodes identity changes mid-open', () => {
    const { fixture, host, caches } = setupSlotted();
    host.treeController.expand('a');
    fixture.detectChanges();
    expect(caches.contextCache.has('a')).toBe(true);
    expect(caches.toggleById.has('a')).toBe(true);
    const staleContext = caches.contextCache.get('a')?.context;

    // Swap to a disjoint tree: without the invalidation effect the 'a'
    // entries would survive until the panel is destroyed.
    host.nodes.set([{ value: { id: 'x', name: 'Xray' } }]);
    fixture.detectChanges();
    fixture.detectChanges();
    expect(caches.contextCache.has('a')).toBe(false);
    expect(caches.toggleById.has('a')).toBe(false);
    expect(caches.contextCache.has('x')).toBe(true);

    // Swapping back re-derives a fresh context, never the stale object.
    host.nodes.set(makeTree());
    fixture.detectChanges();
    fixture.detectChanges();
    expect(caches.contextCache.get('a')?.context).not.toBe(staleContext);
  });

  it('keeps cache entries across a structurally-equal swap (flatNodes identity held by flatEq)', () => {
    const { fixture, host, caches } = setupSlotted();
    host.treeController.expand('a');
    fixture.detectChanges();
    const sizeBefore = caches.contextCache.size;
    const contextBefore = caches.contextCache.get('a')?.context;
    expect(sizeBefore).toBeGreaterThan(0);

    // Same node objects in a new top-level array: flattenTree re-runs but
    // flatEq holds the flatNodes reference, so the effect must not fire.
    host.nodes.set([...host.nodes()]);
    fixture.detectChanges();
    expect(caches.contextCache.size).toBe(sizeBefore);
    expect(caches.contextCache.get('a')?.context).toBe(contextBefore);
  });
});

describe('CngxTreeSelectPanel - expand-to-reveal type-to-find', () => {
  function makeDeepTree(): CngxTreeNode<Row>[] {
    return [
      { value: { id: 'ap', name: 'Apple' } },
      {
        value: { id: 'f', name: 'Fruits' },
        children: [{ value: { id: 'c', name: 'Cherry' } }, { value: { id: 'g', name: 'Grape' } }],
      },
      { value: { id: 'z', name: 'Zebra' } },
    ];
  }

  function setupDeep() {
    const fixture = TestBed.createComponent(TreeHost);
    fixture.componentInstance.nodes.set(makeDeepTree());
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const tree = root.querySelector<HTMLElement>('[role="tree"]')!;
    const type = (ch: string): void => {
      tree.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
      TestBed.flushEffects();
      fixture.detectChanges();
      fixture.detectChanges();
    };
    return { fixture, host, root, tree, type };
  }

  it('default off: a typeahead miss leaves expansion and active item untouched', () => {
    const { host, tree, type } = setupDeep();
    // autoHighlightFirst puts the highlight on Apple before any typing.
    expect(tree.getAttribute('aria-activedescendant')).toBe('ap');
    type('c');
    expect(host.treeController.expandedIds().size).toBe(0);
    expect(tree.getAttribute('aria-activedescendant')).toBe('ap');
  });

  it('on: a hidden match expands its ancestors and moves the highlight onto it', () => {
    const { host, tree, type } = setupDeep();
    host.expandToReveal.set(true);
    type('c');
    expect(host.treeController.isExpanded('f')()).toBe(true);
    expect(tree.getAttribute('aria-activedescendant')).toBe('c');
    // The match itself stays unexpanded (it is a leaf anyway) and unselected.
    expect(host.treeController.expandedIds().has('c')).toBe(false);
  });

  it('matches mixed-case labels against the lowercased term', () => {
    const { fixture, host, tree, type } = setupDeep();
    host.nodes.set([
      {
        value: { id: 'f', name: 'Fruits' },
        children: [{ value: { id: 'c', name: 'CHERRY' } }],
      },
    ]);
    host.expandToReveal.set(true);
    fixture.detectChanges();
    type('c');
    expect(host.treeController.isExpanded('f')()).toBe(true);
    expect(tree.getAttribute('aria-activedescendant')).toBe('c');
  });

  it('reveals a hidden match accent-tolerant and with the app locale', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideLocale('tr')] });
    const { fixture, host, tree, type } = setupDeep();
    host.nodes.set([
      {
        value: { id: 'c', name: 'Cities' },
        children: [
          { value: { id: 'is', name: 'Istanbul' } },
          { value: { id: 'iz', name: 'İzmir' } },
        ],
      },
      { value: { id: 'w', name: 'Words' }, children: [{ value: { id: 'u', name: 'Über' } }] },
    ]);
    host.expandToReveal.set(true);
    fixture.detectChanges();
    type('i');
    expect(tree.getAttribute('aria-activedescendant')).toBe('iz');
    vi.advanceTimersByTime(1000);
    type('u');
    expect(host.treeController.isExpanded('w')()).toBe(true);
    expect(tree.getAttribute('aria-activedescendant')).toBe('u');
  });

  it('skips a disabled hidden match while skipDisabled=true (AD default)', () => {
    const { fixture, host, tree, type } = setupDeep();
    host.nodes.set([
      {
        value: { id: 'f', name: 'Fruits' },
        children: [{ value: { id: 'c', name: 'Cherry', disabled: true }, disabled: true }],
      },
    ]);
    host.expandToReveal.set(true);
    fixture.detectChanges();
    type('c');
    expect(host.treeController.expandedIds().size).toBe(0);
    // Highlight stays on the auto-highlighted root.
    expect(tree.getAttribute('aria-activedescendant')).toBe('f');
  });

  it('matches a disabled hidden node when the AD host runs skipDisabled=false', () => {
    const { fixture, host } = setupDeep();
    host.nodes.set([
      {
        value: { id: 'f', name: 'Fruits' },
        children: [{ value: { id: 'c', name: 'Cherry', disabled: true }, disabled: true }],
      },
    ]);
    host.expandToReveal.set(true);
    fixture.detectChanges();
    const panel = fixture.debugElement.query(By.directive(CngxTreeSelectPanel))
      .componentInstance as CngxTreeSelectPanel<Row>;
    const highlighted: unknown[] = [];
    // Collaborator stub: only the AD reads the handler consults.
    const adStub = {
      skipDisabled: () => false,
      activeItem: () => null,
      highlightByValue: (v: unknown) => highlighted.push(v),
    };
    (
      panel as unknown as { handleTypeaheadMiss(term: string, ad: unknown): void }
    ).handleTypeaheadMiss('c', adStub);
    expect(host.treeController.isExpanded('f')()).toBe(true);
    fixture.detectChanges();
    expect(highlighted).toEqual([{ id: 'c', name: 'Cherry', disabled: true }]);
  });

  it('wraps around from a late active node to an earlier hidden match', () => {
    const { host, root, tree, type } = setupDeep();
    host.expandToReveal.set(true);
    // Let the typeahead buffer expire between the two queries -
    // otherwise 'z' + 'c' chain into one 'zc' term.
    vi.useFakeTimers();
    type('z');
    expect(tree.getAttribute('aria-activedescendant')).toBe('z');
    vi.advanceTimersByTime(400);
    type('c');
    expect(host.treeController.isExpanded('f')()).toBe(true);
    expect(tree.getAttribute('aria-activedescendant')).toBe('c');
    expect(root.querySelector('[id="c"]')).toBeTruthy();
  });

  it('no full-tree match: expansion and active item stay untouched', () => {
    const { host, tree, type } = setupDeep();
    host.expandToReveal.set(true);
    type('x');
    expect(host.treeController.expandedIds().size).toBe(0);
    expect(tree.getAttribute('aria-activedescendant')).toBe('ap');
  });
});

describe('CngxTreeSelectPanel - highlight across a nodes refresh', () => {
  function refreshed(): CngxTreeNode<Row>[] {
    return makeTree().map((n) => ({ ...n, value: { ...n.value } }));
  }

  function highlightBravoThenRefresh(compare?: (a: Row, b: Row) => boolean) {
    const fixture = TestBed.createComponent(TreeHost);
    if (compare) {
      fixture.componentInstance.adCompare.set(compare);
    }
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const ad = fixture.debugElement
      .query(By.directive(CngxActiveDescendant))
      .injector.get(CngxActiveDescendant);
    ad.highlightByIndex(1);
    TestBed.flushEffects();
    expect((ad.activeValue() as Row).id).toBe('b');
    fixture.componentInstance.nodes.set(refreshed());
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    return ad;
  }

  it('keeps the highlighted node when the nodes are re-fetched as new objects', () => {
    const ad = highlightBravoThenRefresh((a, b) => a?.id === b?.id);
    expect((ad.activeValue() as Row).id).toBe('b');
  });

  it('loses the highlighted node under identity equality', () => {
    const ad = highlightBravoThenRefresh();
    expect((ad.activeValue() as Row | null)?.id).not.toBe('b');
  });
});

describe('CngxTreeSelectPanel stylesheet', () => {
  // A @media nested in @scope applies unreliably across engines; every
  // media override of this panel must sit outside its @scope blocks.
  it('nests no @media inside an @scope block', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'projects/forms/select/tree-select/tree-select-panel.component.css'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '');
    const nested: string[] = [];
    const scopeDepths: number[] = [];
    let depth = 0;
    for (let i = 0; i < css.length; i++) {
      const ch = css[i];
      if (css.startsWith('@scope', i)) {
        scopeDepths.push(depth);
      } else if (css.startsWith('@media', i) && scopeDepths.length > 0) {
        nested.push(css.slice(i, css.indexOf('{', i)).trim());
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (scopeDepths.length > 0 && depth === scopeDepths[scopeDepths.length - 1]) {
          scopeDepths.pop();
        }
      }
    }
    expect(nested).toEqual([]);
  });
});

describe('CngxTreeSelectPanel - row tap under the touch floor', () => {
  function pointer(type: string, pointerType: string): Event {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    return event;
  }

  function rows() {
    const { fixture, host, root } = setup();
    const row = (id: string): HTMLElement =>
      root.querySelector<HTMLElement>(`[role="treeitem"][id="${id}"]`)!;
    return { fixture, host, row };
  }

  it('expands a parent on a touch tap and leaves the selection alone', () => {
    const { fixture, host, row } = rows();
    host.rowTapExpandsState.set(true);
    fixture.detectChanges();
    row('a').dispatchEvent(pointer('pointerdown', 'touch'));
    row('a').click();
    fixture.detectChanges();
    expect(row('a').getAttribute('aria-expanded')).toBe('true');
    expect(host.lastSelected()).toBeNull();
  });

  it('keeps an AT activation (a click without a pointer gesture) on the select path', () => {
    const { fixture, host, row } = rows();
    host.rowTapExpandsState.set(true);
    fixture.detectChanges();
    row('a').click();
    fixture.detectChanges();
    expect(host.lastSelected()?.id).toBe('a');
    expect(row('a').getAttribute('aria-expanded')).toBe('false');
  });

  it('selects through the checkbox target on a touch tap', () => {
    const { fixture, host, row } = rows();
    host.rowTapExpandsState.set(true);
    fixture.detectChanges();
    const check = row('a').querySelector<HTMLElement>('.cngx-tree-select__check')!;
    expect(check.getAttribute('aria-hidden')).toBe('true');
    check.dispatchEvent(pointer('pointerdown', 'touch'));
    check.click();
    fixture.detectChanges();
    expect(host.lastSelected()?.id).toBe('a');
    expect(row('a').getAttribute('aria-expanded')).toBe('false');
  });

  it('selects a row whose click does not end the touch gesture recorded on it', () => {
    const { fixture, host, row } = rows();
    host.rowTapExpandsState.set(true);
    fixture.detectChanges();
    row('a').dispatchEvent(pointer('pointerdown', 'touch'));
    row('b').click();
    fixture.detectChanges();
    expect(host.lastSelected()?.id).toBe('b');
    // The record is consumed: a later bare click on the parent selects.
    row('a').click();
    fixture.detectChanges();
    expect(host.lastSelected()?.id).toBe('a');
  });

  it('keeps mouse and every pointer on select while the floor is off', () => {
    const { fixture, host, row } = rows();
    row('a').dispatchEvent(pointer('pointerdown', 'mouse'));
    row('a').click();
    fixture.detectChanges();
    expect(host.lastSelected()?.id).toBe('a');
    host.rowTapExpandsState.set(false);
    row('b').dispatchEvent(pointer('pointerdown', 'touch'));
    row('b').click();
    fixture.detectChanges();
    expect(host.lastSelected()?.id).toBe('b');
  });

  it('leaves a leaf row on select under the floor', () => {
    const { fixture, host, row } = rows();
    host.rowTapExpandsState.set(true);
    fixture.detectChanges();
    row('b').dispatchEvent(pointer('pointerdown', 'touch'));
    row('b').click();
    fixture.detectChanges();
    expect(host.lastSelected()?.id).toBe('b');
  });
});
