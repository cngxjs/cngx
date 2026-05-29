import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepLabelContext } from './step-panel-host.token';

/**
 * Marker directive carrying a `CngxStep`'s label template.
 * Discovered via `contentChild(CngxStepLabel)`. Typed with
 * {@link CngxStepLabelContext} for typed `let-node="node"` /
 * `let-active="active"` access.
 *
 * ```html
 * <ng-template cngxStepLabel let-node="node">
 *   {{ node.label() }}
 * </ng-template>
 * ```
 *
 * @category common/stepper
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/step-label.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStep, CngxStepContent, CngxStepGroupHeader
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-custom-labels/mixing-code-label-code-input-with-code-cngxsteplabel-code-slot</example-url>
 */
@Directive({
  selector: 'ng-template[cngxStepLabel]',
  standalone: true,
})
export class CngxStepLabel {
  readonly templateRef = inject<TemplateRef<CngxStepLabelContext>>(TemplateRef);
}
