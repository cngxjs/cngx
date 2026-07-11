import { type DestroyRef, effect, type Injector, runInInjectionContext, type Signal, untracked } from '@angular/core';

/**
 * Minimal structural view of a `MatExpansionPanel` the set-sync needs:
 * a read/write `expanded` boolean and an `expandedChange` stream. Kept
 * host-agnostic (no `@angular/material` type in the signature) so the
 * helper is unit-testable with plain fakes, mirroring the Material-
 * agnostic shape of `createMaterialBidirectionalSync` in
 * `@cngx/common/data`. `MatExpansionPanel` satisfies it structurally
 * (`expanded` getter/setter from `CdkAccordionItem`, `expandedChange`
 * is an `EventEmitter<boolean>` whose `.subscribe` matches).
 *
 * @category ui/mat-accordion/material-bridge
 */
export interface CngxExpansionPanelLike {
  /** Current expanded state; assigning it drives the Material panel open/closed. */
  expanded: boolean;
  /** Emits the new expanded state on every Material-driven or programmatic change. */
  readonly expandedChange: {
    subscribe(next: (expanded: boolean) => void): { unsubscribe(): void };
  };
}

/**
 * Minimal structural view of the accordion brain's open-set: a reactive
 * membership read and a settable id-set model. `CngxAccordion` satisfies
 * it (`isOpen` reads the clamped `effectiveOpenIds` computed; `openIds`
 * is a `ModelSignal<ReadonlySet<string>>` — callable, with `.set`).
 *
 * @category ui/mat-accordion/material-bridge
 */
export interface CngxAccordionOpenSet {
  /** Reactive membership read — reflects single-mode arbitration. Tracked inside the sync effect. */
  isOpen(panelId: string): boolean;
  /** Settable open-id set model (the brain's single source of truth). */
  readonly openIds: {
    (): ReadonlySet<string>;
    set(value: ReadonlySet<string>): void;
  };
}

/**
 * Options for {@link createMatExpansionSetSync}.
 *
 * @category ui/mat-accordion/material-bridge
 */
export interface CngxMatExpansionSetSyncOptions<P extends CngxExpansionPanelLike> {
  /** Reactive list of projected expansion panels (a `contentChildren` signal). */
  readonly panels: Signal<readonly P[]>;
  /** Stable id for a panel — the key the brain's open-set stores. */
  readonly panelId: (panel: P) => string;
  /** The accordion brain's open-set (membership read + settable model). */
  readonly accordion: CngxAccordionOpenSet;
  /** Injection context for the underlying `effect()`s. */
  readonly injector: Injector;
  /** Same lifetime as the host directive; tears down the `expandedChange` listeners. */
  readonly destroyRef: DestroyRef;
}

/**
 * Set-based bidirectional sync between a `<mat-accordion>`'s projected
 * `<mat-expansion-panel>` tree and the headless {@link CngxAccordion}
 * open-set. The accordion open-set is a multi-membership
 * `Set<string>`, so the index-based `createMaterialBidirectionalSync`
 * (`@cngx/common/data`) does not fit — this helper syncs per-panel
 * `expanded` against set membership instead.
 *
 * Installs two effects and one listener-set:
 *
 * 1. **brain→Material** — an `effect()` tracking `panels()` and, per
 *    panel, `accordion.isOpen(id)`. When the open-set (or the panel
 *    list) changes it writes `panel.expanded` to match, guarded by a
 *    re-entrancy flag so the resulting synchronous `expandedChange`
 *    echo does not loop back. The Material writes run inside
 *    `untracked()` per `reference_signal_architecture` rule 2.
 * 2. **subscription reconcile** — an `effect()` tracking only
 *    `panels()`; inside `untracked()` it subscribes freshly-added
 *    panels' `expandedChange` and drops removed ones (diff-only churn,
 *    a `Map<P, subscription>`).
 * 3. **Material→brain** — each `expandedChange` listener writes back
 *    idempotently: it compares the incoming `expanded` against current
 *    set membership and only rewrites `openIds` when they differ, so a
 *    programmatic echo (or a redundant Material emit) is a no-op. The
 *    brain's `effectiveOpenIds` clamp then arbitrates single-mode.
 *
 * The idempotent membership check is the real loop-breaker; the
 * re-entrancy flag is belt-and-suspenders for the synchronous echo
 * `CdkAccordionItem` emits from its `expanded` setter.
 *
 * @category ui/mat-accordion/material-bridge
 */
export function createMatExpansionSetSync<P extends CngxExpansionPanelLike>(
  opts: CngxMatExpansionSetSyncOptions<P>,
): void {
  const { panels, panelId, accordion, injector, destroyRef } = opts;

  // True while effect 1 is writing Material. `CdkAccordionItem` emits
  // `expandedChange` synchronously from its `expanded` setter, so the
  // Material→brain listener fires re-entrantly during our own write —
  // the flag drops that echo before the idempotent check even runs.
  let writingToMaterial = false;

  const subscriptions = new Map<P, { unsubscribe(): void }>();

  const writeBackFromMaterial = (id: string, expanded: boolean): void => {
    if (writingToMaterial) {
      return;
    }
    const current = accordion.openIds();
    if (current.has(id) === expanded) {
      return;
    }
    const next = new Set(current);
    if (expanded) {
      next.add(id);
    } else {
      next.delete(id);
    }
    accordion.openIds.set(next);
  };

  runInInjectionContext(injector, () => {
    // brain→Material.
    effect(() => {
      const list = panels();
      const desired = list.map((panel) => accordion.isOpen(panelId(panel)));
      untracked(() => {
        writingToMaterial = true;
        try {
          list.forEach((panel, index) => {
            if (panel.expanded !== desired[index]) {
              panel.expanded = desired[index];
            }
          });
        } finally {
          writingToMaterial = false;
        }
      });
    });

    // Subscription reconcile.
    effect(() => {
      const live = new Set(panels());
      untracked(() => {
        for (const panel of live) {
          if (subscriptions.has(panel)) {
            continue;
          }
          const id = panelId(panel);
          subscriptions.set(
            panel,
            panel.expandedChange.subscribe((expanded) => writeBackFromMaterial(id, expanded)),
          );
        }
        for (const [panel, subscription] of Array.from(subscriptions.entries())) {
          if (live.has(panel)) {
            continue;
          }
          subscription.unsubscribe();
          subscriptions.delete(panel);
        }
      });
    });
  });

  destroyRef.onDestroy(() => {
    for (const subscription of subscriptions.values()) {
      subscription.unsubscribe();
    }
    subscriptions.clear();
  });
}
