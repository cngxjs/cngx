import {
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  untracked,
} from '@angular/core';
import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion';

import { CngxAccordion } from '@cngx/common/interactive';
import { nextUid } from '@cngx/core/utils';

import { createMatExpansionSetSync } from './material-bridge/set-sync';

/**
 * The Material twin of the cngx accordion: attach `cngxMatAccordion` to
 * a vanilla `<mat-accordion>` and it is driven by the headless
 * {@link CngxAccordion} brain. Consumers gain the controlled
 * `[(openIds)]` group model and single-open arbitration on Material
 * markup — neither of which `<mat-accordion>` exposes (Material has only
 * per-panel `[expanded]`). Mirrors `[cngxMatStepper]` / `[cngxMatTabs]`.
 *
 * This is the instrumentation pattern: Material owns rendering and the
 * consumer authors native `<mat-expansion-panel>` markup; cngx is the
 * behaviour layer. `[multi]` and the two-way `[(openIds)]` are forwarded
 * from {@link CngxAccordion} via `hostDirectives`.
 *
 * ```html
 *   <mat-accordion cngxMatAccordion [(openIds)]="openIds" [multi]="false">
 *     <mat-expansion-panel>
 *       <mat-expansion-panel-header>Personal info</mat-expansion-panel-header>
 *       <p>Tell us who you are.</p>
 *     </mat-expansion-panel>
 *     <mat-expansion-panel>
 *       <mat-expansion-panel-header>Account</mat-expansion-panel-header>
 *       <p>Choose your sign-in method.</p>
 *     </mat-expansion-panel>
 *   </mat-accordion>
 * ```
 *
 * `multi` is authoritative on the cngx side. `MatAccordion` inherits its
 * own `multi` input from `CdkAccordion`, and both directives sit on the
 * same host element, so a single `[multi]` binding feeds both — the
 * directive therefore pins `matAccordion.multi = true` (via an `effect`
 * that re-asserts on every `multi` change) so Material never runs its own
 * single-open close while the cngx `effectiveOpenIds` clamp arbitrates.
 *
 * @playground Controlled open-set ./examples/bridge/bridge-example.component.ts
 * @category ui/mat-accordion
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-accordion/mat-accordion.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordion, CngxAccordionItem, CngxMatStepper, CngxMatTabs
 */
@Directive({
  selector: '[cngxMatAccordion]',
  exportAs: 'cngxMatAccordion',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxAccordion,
      inputs: ['multi', 'openIds'],
      outputs: ['openIdsChange'],
    },
  ],
})
export class CngxMatAccordion {
  private readonly matAccordion = inject(MatAccordion, { self: true });
  /**
   * The accordion brain on this host element (declared in
   * `hostDirectives`). Same-host ownership — not a child→parent inject —
   * so it stays decompose-safe.
   */
  private readonly accordion = inject(CngxAccordion, { self: true });
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private readonly panels = contentChildren(MatExpansionPanel, { descendants: true });

  // Stable id per panel — the key the brain's open-set stores. A WeakMap:
  // the id is assigned first-seen and never needs enumeration, so a removed
  // panel's entry drops with the panel instead of accumulating over churn.
  private readonly idByPanel = new WeakMap<MatExpansionPanel, string>();

  constructor() {
    // Pin Material's own `multi` so it never arbitrates single-open: the
    // brain's `effectiveOpenIds` clamp is the sole arbiter. A single
    // `[multi]` binding on the host also sets `MatAccordion.multi`
    // (inherited from `CdkAccordion`); Angular applies that input during
    // change detection, so re-assert from an `effect` that flushes after
    // CD and re-runs whenever the consumer's `multi` changes.
    effect(() => {
      this.accordion.multi();
      untracked(() => {
        this.matAccordion.multi = true;
      });
    });

    createMatExpansionSetSync<MatExpansionPanel>({
      panels: this.panels,
      panelId: (panel) => this.panelId(panel),
      accordion: this.accordion,
      injector: this.injector,
      destroyRef: this.destroyRef,
    });
  }

  private panelId(panel: MatExpansionPanel): string {
    let id = this.idByPanel.get(panel);
    if (id === undefined) {
      id = nextUid('cngx-mat-panel-');
      this.idByPanel.set(panel, id);
    }
    return id;
  }
}
