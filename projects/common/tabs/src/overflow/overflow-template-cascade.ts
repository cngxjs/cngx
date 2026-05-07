import { computed, type Signal, type TemplateRef } from '@angular/core';

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
  const buildItemContext = (
    tab: CngxTabHandle,
    index: number,
  ): CngxTabOverflowItemContext => ({
    $implicit: tab,
    tab,
    pick: () => opts.pickTab(tab),
    disabled: tab.disabled(),
    index,
  });
  return { triggerTemplate, itemTemplate, triggerContext, buildItemContext };
}
