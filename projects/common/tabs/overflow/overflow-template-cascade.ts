import {
  effect,
  InjectionToken,
  untracked,
  type Signal,
  computed,
  type TemplateRef,
} from '@angular/core';

import type {
  ActiveDescendantItem,
  CngxActiveDescendant,
} from '@cngx/common/a11y';
import type { CngxPopover } from '@cngx/common/popover';

import type { CngxTabHandle } from '../tab-group-host.token';
import type { CngxTabsConfig } from '../tabs-config';
import type {
  CngxTabOverflowItem,
  CngxTabOverflowItemContext,
} from './tab-overflow-item.directive';
import type {
  CngxTabOverflowTrigger,
  CngxTabOverflowTriggerContext,
} from './tab-overflow-trigger.directive';

/**
 * DOM `id` for a hidden-tab option row in the overflow listbox.
 * Stable across CD passes so `aria-activedescendant` resolves to
 * the same `<li>`. `-overflow-option` suffix avoids collision with
 * the strip-button (`-header`) and per-tab descriptor (`-desc`).
 *
 * @category interactive
 */
export function tabOverflowOptionId(tab: CngxTabHandle): string {
  return `${tab.id}-overflow-option`;
}

/**
 * Inputs to {@link createTabOverflowTemplateBindings}. The molecule
 * runs the `contentChild()` queries (injection-context-only) and
 * supplies the reactive sources; the factory owns cascade
 * resolution and per-context builders.
 *
 * @category interactive
 */
export interface CngxTabOverflowTemplateBindingsOptions {
  /** `contentChild(CngxTabOverflowTrigger)` from the molecule. */
  readonly triggerSlot: Signal<CngxTabOverflowTrigger | undefined>;
  /** `contentChild(CngxTabOverflowItem)` from the molecule. */
  readonly itemSlot: Signal<CngxTabOverflowItem | undefined>;
  /** Resolved {@link CngxTabsConfig} (the middle cascade tier). */
  readonly config: CngxTabsConfig;
  /** Live count of hidden tabs (drives `triggerContext.count`). */
  readonly hiddenCount: Signal<number>;
  /** Live hidden-tab list (drives `triggerContext.hiddenTabs`). */
  readonly hiddenTabs: Signal<readonly CngxTabHandle[]>;
  /** Commit-aware select callback — invoked from `itemContext.pick`. */
  readonly pickTab: (tab: CngxTabHandle) => void;
}

/**
 * Output of {@link createTabOverflowTemplateBindings}. Carries the two
 * resolved templates plus a stable trigger-context signal and an
 * imperative item-context builder.
 *
 * @category interactive
 */
export interface CngxTabOverflowTemplateBindings {
  readonly triggerTemplate: Signal<
    TemplateRef<CngxTabOverflowTriggerContext> | null
  >;
  readonly itemTemplate: Signal<TemplateRef<CngxTabOverflowItemContext> | null>;
  readonly triggerContext: Signal<CngxTabOverflowTriggerContext>;
  readonly buildItemContext: (
    tab: CngxTabHandle,
    index: number,
  ) => CngxTabOverflowItemContext;
  /**
   * `ActiveDescendantItem[]` projection of `hiddenTabs()` for
   * `CngxActiveDescendant.items`. Each entry's `id` matches the
   * row's `<li>` (see {@link tabOverflowOptionId}); `value` carries
   * the tab handle so AD's `(activated)` payload casts back without
   * a registry lookup. Structural equal guards against no-op IO
   * cascades. Mutable array shape because
   * `CngxActiveDescendant.items` declares the input that way; the
   * array is rebuilt each computed run so callers can't mutate the
   * live source.
   */
  readonly adItems: Signal<ActiveDescendantItem[]>;
}

/**
 * Structural equal — same `count` + same `hiddenTabs` reference.
 * The upstream `hiddenTabs` signal already uses `tabIdListEqual`,
 * so this guard stops `ngTemplateOutlet` rebinding on shape-stable
 * IO emissions.
 */
function triggerContextEqual(
  a: CngxTabOverflowTriggerContext,
  b: CngxTabOverflowTriggerContext,
): boolean {
  return a.count === b.count && a.hiddenTabs === b.hiddenTabs;
}

/**
 * Structural equal — same length + per-index `id` and `disabled`.
 * Without this, every IO emission yields fresh
 * `ActiveDescendantItem[]` references and AD's `resolvedItems`
 * cascade fires for an unchanged visible-tab set.
 */
function adItemsEqual(
  a: ActiveDescendantItem[],
  b: ActiveDescendantItem[],
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].disabled !== b[i].disabled) {
      return false;
    }
  }
  return true;
}

/**
 * Wires the 3-stage template cascade for the overflow molecule's
 * two visible regions: per-instance directive >
 * `CNGX_TABS_CONFIG.templates.overflow*` > built-in markup
 * (template-outlet returns `null`).
 *
 * Pure — no DI, no side effects, no destroy hooks. Safe to call
 * from a component's field-init block. Mirrors the select-family
 * `createTemplateRegistry` pattern.
 *
 * @category interactive
 */
export function createTabOverflowTemplateBindings(
  opts: CngxTabOverflowTemplateBindingsOptions,
): CngxTabOverflowTemplateBindings {
  const triggerTemplate = computed<
    TemplateRef<CngxTabOverflowTriggerContext> | null
  >(
    () =>
      opts.triggerSlot()?.templateRef ??
      opts.config.templates?.overflowTrigger ??
      null,
  );
  const itemTemplate = computed<
    TemplateRef<CngxTabOverflowItemContext> | null
  >(
    () =>
      opts.itemSlot()?.templateRef ??
      opts.config.templates?.overflowItem ??
      null,
  );
  const triggerContext = computed<CngxTabOverflowTriggerContext>(
    () => {
      const count = opts.hiddenCount();
      const hiddenTabs = opts.hiddenTabs();
      return { $implicit: count, count, hiddenTabs };
    },
    { equal: triggerContextEqual },
  );
  // Per-row context cache — stable context + closure-captured `pick`
  // per `tab` so `ngTemplateOutlet` doesn't re-bind the embedded view
  // unless `index` or `disabled` actually changed. WeakMap so
  // detached handles GC. Mirrors `CngxTreeSelectPanel.nodeContext`.
  interface CachedRow {
    readonly context: CngxTabOverflowItemContext;
    readonly disabled: boolean;
    readonly index: number;
  }
  const itemContextCache = new WeakMap<CngxTabHandle, CachedRow>();
  const buildItemContext = (
    tab: CngxTabHandle,
    index: number,
  ): CngxTabOverflowItemContext => {
    const disabled = tab.disabled();
    const cached = itemContextCache.get(tab);
    if (cached?.disabled === disabled && cached?.index === index) {
      return cached.context;
    }
    const context: CngxTabOverflowItemContext = {
      $implicit: tab,
      tab,
      pick: () => opts.pickTab(tab),
      disabled,
      index,
    };
    itemContextCache.set(tab, { context, disabled, index });
    return context;
  };
  const adItems = computed<ActiveDescendantItem[]>(
    () =>
      opts.hiddenTabs().map((tab) => ({
        id: tabOverflowOptionId(tab),
        value: tab,
        label: tab.label() ?? tab.id,
        disabled: tab.disabled(),
      })),
    { equal: adItemsEqual },
  );
  return {
    triggerTemplate,
    itemTemplate,
    triggerContext,
    buildItemContext,
    adItems,
  };
}

/**
 * Resets the AD highlight on popover close. Keyboard-open paths
 * (ArrowDown / End / typeahead on the closed trigger) set
 * `activeIndex` via AD's own keydown listener before opening —
 * unaffected. Mouse-open leaves `activeIndex === -1` so the popover
 * renders unhighlighted. Without this reset, the next open would
 * inherit a stale index from the prior keyboard session.
 *
 * Must run in injection context.
 *
 * @category interactive
 */
export function createOverflowPopoverHighlightSync(
  popover: Signal<CngxPopover>,
  ad: Signal<CngxActiveDescendant>,
): void {
  effect(() => {
    const visible = popover().isVisible();
    untracked(() => {
      if (!visible) {
        ad().resetHighlight();
      }
    });
  });
}

/**
 * Factory signature for {@link CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY}.
 *
 * @category interactive
 */
export type CngxOverflowPopoverHighlightSyncFactory = (
  popover: Signal<CngxPopover>,
  ad: Signal<CngxActiveDescendant>,
) => void;

/**
 * DI token for the overflow popover highlight-sync policy.
 * Default {@link createOverflowPopoverHighlightSync}. Override via
 * `providers` / `viewProviders` for last-index preservation,
 * telemetry on close, custom highlight rules. Symmetric to
 * `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY` and
 * `CNGX_TABS_COMMIT_HANDLER_FACTORY`.
 *
 * @category interactive
 */
export const CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY =
  new InjectionToken<CngxOverflowPopoverHighlightSyncFactory>(
    'CngxOverflowPopoverHighlightSyncFactory',
    {
      providedIn: 'root',
      factory: () => createOverflowPopoverHighlightSync,
    },
  );
