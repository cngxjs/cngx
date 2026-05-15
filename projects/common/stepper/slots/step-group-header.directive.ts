import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode, CngxStepStatus } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepGroupHeader` template. Drives the
 * group-row landmark for `kind === 'group'` nodes. The `role="group"`
 * + `aria-roledescription` shell stays library-owned.
 *
 * `group` carries a `CngxStepNode` with the runtime guarantee
 * `kind === 'group'` (the slot only fires for group nodes).
 * `expanded` is reserved for future collapsible groups — passed `true`
 * today; declaring it now avoids a breaking change later.
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
 * Slot directive for the group-header template on `<cngx-stepper>`.
 * Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.groupHeader` before falling back to
 * the built-in `<span class="cngx-stepper__group-label">`.
 *
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepGroupHeader let-group="group" let-status="status">
 *     <h4 [class.is-error]="status === 'error'">{{ group.label() }}</h4>
 *   </ng-template>
 * </cngx-stepper>
 * ```
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-busy-spinner-via-code-cngxstepbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-error-badge-via-code-cngxstepbadge-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-group-header-via-code-cngxstepgroupheader-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-indicator-glyph-via-code-cngxstepindicator-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code</example-url>
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
