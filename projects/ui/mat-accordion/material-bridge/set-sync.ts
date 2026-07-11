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
 * Minimal structural view of the accordion brain the sync drives:
 * a reactive membership read plus the same `toggle` the native
 * `CngxAccordionPanel` calls. `CngxAccordion` satisfies it — `isOpen`
 * reads the clamped `effectiveOpenIds` computed and `toggle` mutates
 * from that clamped view, so single-open arbitration stays authoritative
 * and the exposed `openIds` model never retains a clamped-out id. The
 * sync writes membership exclusively through `toggle`, never a raw
 * set-write, so it can never diverge from the brain's own DOM path.
 *
 * @category ui/mat-accordion/material-bridge
 */
export interface CngxAccordionOpenSet {
  /** Reactive membership read — reflects single-mode arbitration. Tracked inside the sync effect. */
  isOpen(panelId: string): boolean;
  /** Flip a panel's open state, arbitrated by the brain (clamps siblings in single mode). */
  toggle(panelId: string): void;
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
 * 3. **Material→brain** — each `expandedChange` listener flips the
 *    brain via `accordion.toggle(id)`, but only when the incoming
 *    `expanded` differs from the brain's current (clamped) membership,
 *    so a programmatic echo (or a redundant Material emit) is a no-op.
 *    Routing through `toggle` (not a raw set-write) means single-mode
 *    arbitration and the exposed `openIds` model stay identical to the
 *    native `CngxAccordionPanel` DOM path.
 *
 * The idempotent membership check plus the re-entrancy flag together
 * close the loop: the flag drops the synchronous echo `CdkAccordionItem`
 * emits from its `expanded` setter during our own write, and the
 * membership check drops any Material emit that already agrees with the
 * brain.
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
    if (accordion.isOpen(id) === expanded) {
      return;
    }
    accordion.toggle(id);
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
