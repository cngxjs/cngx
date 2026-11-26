import { Directive, inject, input, signal } from '@angular/core';
import { CngxErrorRegistry } from '../error-registry/error-registry';
import { registerByName } from '../error-registry/register-by-name';
import { CNGX_ERROR_SCOPE, type CngxErrorScopeContract } from './error-scope.token';

/**
 * Marks a DOM subtree as an error visibility scope.
 *
 * The scope starts hidden - descendant aggregators and error states do
 * not reveal until the consumer calls {@link reveal}, typically via a
 * `(submit)` handler, a route guard, or an HTTP interceptor reveal-on-422
 * pattern.
 *
 * Provides {@link CNGX_ERROR_SCOPE} so any descendant
 * (`CngxErrorAggregator`, `CngxErrorState`, the form-field presenter) can
 * read `showErrors` reactively without injecting a concrete class. Every
 * `reveal()` bumps `revealEpoch`, so aggregators speak unchanged errors again.
 *
 * ```html
 * <form cngxErrorScope cngxErrorScopeName="checkout"
 *       (submit)="scope.reveal(); save()" #scope="cngxErrorScope">
 *   <input [cngxErrorState]="email().invalid()" />
 * </form>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/error-scope/error-scope.directive.ts
 * @since 0.3.0
 * @relatedTo CngxErrorAggregator, CngxErrorState, CngxErrorSource
 * <example-url>/#/common/interactive/error/aggregator/cngx-card-host-no-scope-errors-visible-immediately</example-url>
 * <example-url>/#/common/interactive/error/aggregator/cngx-popover-panel-host</example-url>
 * <example-url>/#/common/interactive/error/aggregator/material-mat-tab-label-with-error-count-badge</example-url>
 * <example-url>/#/common/interactive/error/aggregator/native-form-scope-reveal-on-submit</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxErrorScope]',
  standalone: true,
  exportAs: 'cngxErrorScope',
  providers: [{ provide: CNGX_ERROR_SCOPE, useExisting: CngxErrorScope }],
})
export class CngxErrorScope implements CngxErrorScopeContract {
  /** Optional name; enables programmatic lookup via {@link CngxErrorRegistry}. */
  readonly scopeName = input<string | undefined>(undefined, {
    alias: 'cngxErrorScopeName',
  });

  private readonly showErrorsState = signal(false);

  private readonly revealEpochState = signal(0);

  /** Reactive flag consumed by descendants. */
  readonly showErrors = this.showErrorsState.asReadonly();

  /** Count of `reveal()` calls; an aggregator speaks its errors again on each. */
  readonly revealEpoch = this.revealEpochState.asReadonly();

  /** Reveals errors in this scope; a repeated call speaks the errors again. */
  reveal(): void {
    this.showErrorsState.set(true);
    this.revealEpochState.update((n) => n + 1);
  }

  /** Resets the scope to hidden (idempotent). */
  reset(): void {
    this.showErrorsState.set(false);
  }

  constructor() {
    const registry = inject(CngxErrorRegistry, { optional: true });
    if (!registry) {
      return;
    }
    registerByName(
      this.scopeName,
      (name) => registry.registerScope(name, this),
      (name) => registry.unregisterScope(name, this),
    );
  }
}
