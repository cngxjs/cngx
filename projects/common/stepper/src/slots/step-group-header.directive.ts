import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode, CngxStepStatus } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepGroupHeader` template. Drives the
 * group-row landmark rendered for `kind === 'group'` nodes inside
 * `<cngx-stepper>`. Consumers swap the built-in `<span>` group label
 * for richer markup (collapsible chevron, child-count badge,
 * branded heading) while the surrounding `role="group"` +
 * `aria-roledescription` shell stays library-owned.
 *
 * The `group` field carries a `CngxStepNode` with the semantic
 * guarantee `kind === 'group'`. The plan originally cited a
 * dedicated `CngxStepGroupNode` type; the codebase models groups
 * via the discriminator on the unified node type, so the directive
 * uses `CngxStepNode` and consumers gate on `group.kind === 'group'`
 * if needed (the slot only fires for group nodes, so the gate is a
 * no-op in practice).
 *
 * `expanded` is reserved for future collapsible-group support — the
 * organism passes `true` today since groups always render their
 * children in the strip. Keeping the field on the contract avoids a
 * breaking change when expand/collapse lands.
 *
 * @category interactive
 */
export interface CngxStepGroupHeaderContext {
  /** The group node carrying id / label / state / children signals. */
  readonly group: CngxStepNode;
  /** Reserved — `true` while the group's children are visible. */
  readonly expanded: boolean;
  /** Aggregated group status (rolls up children — drives heading variant). */
  readonly status: CngxStepStatus;
}

/**
 * Structural slot directive marking the group-header template for
 * `<cngx-stepper>`. Discovered via `contentChild` on the organism;
 * cascades through `CNGX_STEPPER_CONFIG.templates.groupHeader`
 * before falling back to the built-in
 * `<span class="cngx-stepper__group-label">` rendering.
 *
 * Pure marker — zero logic. Holds only a typed
 * {@link TemplateRef} reference. Mirrors the family-standard slot
 * pattern.
 *
 * @example
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepGroupHeader let-group="group" let-status="status">
 *     <h4 [class.is-error]="status === 'error'">{{ group.label() }}</h4>
 *   </ng-template>
 * </cngx-stepper>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxStepGroupHeader]',
  exportAs: 'cngxStepGroupHeader',
  standalone: true,
})
export class CngxStepGroupHeader {
  readonly templateRef = inject<TemplateRef<CngxStepGroupHeaderContext>>(
    TemplateRef,
  );
}
