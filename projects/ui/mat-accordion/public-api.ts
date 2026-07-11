/**
 * @module @cngx/ui/mat-accordion
 *
 * Material instrumentation directive for `<mat-accordion>`: attach
 * `[cngxMatAccordion]` and it composes the same {@link CngxAccordion}
 * brain as `<cngx-accordion-group>` (in `@cngx/ui/accordion`) via
 * `hostDirectives`, so the controlled `[(openIds)]` group model and
 * single-open arbitration work against Material's own markup. Mirrors
 * `[cngxMatStepper]` / `[cngxMatTabs]`.
 */
export { CngxMatAccordion } from './mat-accordion.directive';
