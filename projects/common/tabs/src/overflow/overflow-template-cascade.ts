import { effect, untracked, type Signal, computed, type TemplateRef } from '@angular/core';

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
 * Format the DOM `id` for a hidden-tab option row inside the
 * `<cngx-tab-overflow>` listbox. Stable across CD passes so
 * `aria-activedescendant` on the trigger button resolves to the same
 * `<li>` element each time AD points at the same tab handle. The
 * `-overflow-option` suffix prevents collision with the strip-button
 * id (`${id}-header`) and the per-tab descriptor span
 * (`${id}-desc`) used by the cngx-native organism.
 *
 * @category interactive
 */
export function tabOverflowOptionId(tab: CngxTabHandle): string {
  return `${tab.id}-overflow-option`;
}

/**
 * Inputs to {@link createTabOverflowTemplateBindings}. The molecule
 * keeps the `contentChild()` queries (must run in component injection
 * context) and the reactive sources for `count` / `hiddenTabs` /
 * `pickTab`; the factory absorbs the 3-stage cascade resolution and
 * the per-context builders so the organism stays thin.
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
   * `CngxActiveDescendant.items`. Each entry's `id` matches the DOM
   * id assigned to the row's `<li>` (see {@link tabOverflowOptionId});
   * `value` carries the tab handle so AD's `(activated)` payload casts
   * back to {@link CngxTabHandle} without a registry lookup. Carries a
   * structural-equal guard so no-op IO emissions don't cascade into
   * AD's `resolvedItems` and re-render the trigger's
   * `aria-activedescendant` binding. Mutable array shape (not
   * `readonly`) because `CngxActiveDescendant.items` declares its
   * input as the mutable type — the array is freshly constructed
   * inside the computed each time so callers cannot mutate the live
   * source.
   */
  readonly adItems: Signal<ActiveDescendantItem[]>;
}

/**
 * Structural equality for {@link CngxTabOverflowTriggerContext} — same
 * `count` and same `hiddenTabs` reference. The `hiddenTabs` signal
 * upstream already carries `tabIdListEqual` so its identity is stable
 * across no-op IO emissions; this guard prevents `ngTemplateOutlet`
 * from re-binding the embedded view on every CD cycle when neither
 * field actually changed.
 */
function triggerContextEqual(
  a: CngxTabOverflowTriggerContext,
  b: CngxTabOverflowTriggerContext,
): boolean {
  return a.count === b.count && a.hiddenTabs === b.hiddenTabs;
}

/**
 * Structural equality for the `adItems` projection — same length, same
 * id per index, same disabled flag per index. Without this guard,
 * every IO emission re-derives a fresh `ActiveDescendantItem[]` with
 * new object identities and AD's `resolvedItems` cascade fires even
 * when the visible-tab set hasn't actually changed.
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
 * Wires the family-standard 3-stage template cascade for the
 * `<cngx-tab-overflow>` molecule's two visible regions:
 *   per-instance directive (`*cngxTabOverflowTrigger` /
 *   `*cngxTabOverflowItem`) > `CNGX_TABS_CONFIG.templates.overflow*`
 *   > built-in markup (template-outlet returns `null`, the molecule's
 *   default branch renders the built-in span).
 *
 * Pure function — no DI, no side effects, no destroy hooks. Safe to
 * call from a component's field-init block. Mirrors the select-family
 * `createTemplateRegistry` pattern but is local to `@cngx/common/tabs`
 * because the molecule has only two slots.
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
  // Per-row context cache — keyed on `tab` via WeakMap so detached
  // handles GC freely. Cached entry stores the `index` and `disabled`
  // flag at the build moment; if either changes on a re-emit we
  // rebuild, otherwise the same context reference is returned.
  // `pick` is closure-captured per cache entry, so its identity is
  // stable across CD passes — `ngTemplateOutlet` doesn't re-bind the
  // embedded view when neither the context nor the captured callback
  // shift. Mirrors the `nodeContext` / `selectByValue` cache pattern
  // in `CngxTreeSelectPanel`.
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
 * Resets the AD highlight whenever the overflow popover transitions
 * to closed. Keyboard-driven open paths (ArrowDown / End / typeahead
 * on the closed trigger) already set `activeIndex` via AD's own host
 * keydown listener BEFORE the popover opens — those paths are
 * untouched. Mouse-driven open paths (click on the trigger button)
 * leave `activeIndex === -1`, so the popover renders without a
 * pre-selected highlight; the user can ArrowDown to start nav or
 * click any option directly. Without this reset on close, the next
 * open would inherit a stale index from the previous keyboard
 * session and show a confusing "already selected" highlight.
 *
 * Must run in injection context (`effect()` requirement). Returns
 * nothing — the effect cleans up via the host's `DestroyRef`.
 *
 * @category interactive
 */
export function wireOverflowPopoverHighlight(
  popover: Signal<CngxPopover | undefined>,
  ad: Signal<CngxActiveDescendant | undefined>,
): void {
  effect(() => {
    const pop = popover();
    if (!pop) {
      return;
    }
    const visible = pop.isVisible();
    untracked(() => {
      const adRef = ad();
      if (!adRef) {
        return;
      }
      if (!visible) {
        adRef.resetHighlight();
      }
    });
  });
}
