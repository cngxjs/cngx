import { Directive, input, signal } from '@angular/core';
import { CNGX_ERROR_SCOPE, type CngxErrorScopeContract } from './error-scope.token';

/**
 * Marks a DOM subtree as an error visibility scope.
 *
 * The scope starts hidden — descendant aggregators and error states do
 * not reveal until the consumer calls {@link reveal}, typically via a
 * `(submit)` handler, a route guard, or an HTTP interceptor reveal-on-422
 * pattern.
 *
 * Provides {@link CNGX_ERROR_SCOPE} so any descendant
 * (`CngxErrorAggregator`, `CngxErrorState`, the form-field presenter in
 * Phase 6b) can read `showErrors` reactively without injecting a
 * concrete class.
 *
 * @example
 * ```html
 * <form [cngxErrorScope] cngxErrorScopeName="checkout"
 *       (submit)="scope.reveal(); save()" #scope="cngxErrorScope">
 *   <input [cngxErrorState]="email().invalid()" />
 * </form>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxErrorScope]',
  standalone: true,
  exportAs: 'cngxErrorScope',
  providers: [{ provide: CNGX_ERROR_SCOPE, useExisting: CngxErrorScope }],
})
export class CngxErrorScope implements CngxErrorScopeContract {
  /** Optional name; enables programmatic lookup once the registry ships (Phase 6b). */
  readonly scopeName = input<string | undefined>(undefined, {
    alias: 'cngxErrorScopeName',
  });

  private readonly showErrorsState = signal(false);

  /** Reactive flag consumed by descendants. */
  readonly showErrors = this.showErrorsState.asReadonly();

  /** Reveals errors in this scope (idempotent). */
  reveal(): void {
    this.showErrorsState.set(true);
  }

  /** Resets the scope to hidden (idempotent). */
  reset(): void {
    this.showErrorsState.set(false);
  }
}
