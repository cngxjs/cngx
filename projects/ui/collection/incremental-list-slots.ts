import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Context exposed to a projected item template - the accumulated item and its
 * index in the revealed slice.
 *
 * @category ui/collection
 */
export interface CngxIncrementalItemContext<T> {
  readonly $implicit: T;
  readonly index: number;
}

/**
 * Item slot. Project `<ng-template cngxIncrementalItem let-item let-i="index">`
 * inside `<cngx-incremental-list>` to render each accumulated row; the organism
 * renders it per item in the revealed slice. Resolution cascades instance slot
 * -> `CngxIncrementalListConfig.templates.item` -> the built-in text row.
 *
 * @category ui/collection
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxIncrementalItem]',
  standalone: true,
  exportAs: 'cngxIncrementalItem',
})
export class CngxIncrementalItem<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxIncrementalItemContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: CngxIncrementalItem<T>,
    ctx: unknown,
  ): ctx is CngxIncrementalItemContext<T> {
    return true;
  }
}

/**
 * Empty slot. Project `<ng-template cngxIncrementalEmpty>` to replace the
 * built-in empty view shown when the bound state settles with no data.
 *
 * @category ui/collection
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxIncrementalEmpty]',
  standalone: true,
  exportAs: 'cngxIncrementalEmpty',
})
export class CngxIncrementalEmpty {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Context exposed to a projected error template - a `retry` callback that
 * re-drives the consumer's data source (emits the organism's `retry` output)
 * and the raw `error` the bound state carries.
 *
 * @category ui/collection
 */
export interface CngxIncrementalErrorContext {
  readonly retry: () => void;
  readonly error: unknown;
}

/**
 * Error slot. Project `<ng-template cngxIncrementalError let-retry="retry">` to
 * replace the built-in error + retry view. Resolution cascades instance slot ->
 * `CngxIncrementalListConfig.templates.error` -> the built-in message + button.
 *
 * @category ui/collection
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxIncrementalError]',
  standalone: true,
  exportAs: 'cngxIncrementalError',
})
export class CngxIncrementalError {
  readonly templateRef = inject<TemplateRef<CngxIncrementalErrorContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxIncrementalError,
    ctx: unknown,
  ): ctx is CngxIncrementalErrorContext {
    return true;
  }
}

/**
 * End-reached slot. Project `<ng-template cngxIncrementalEnd>` to replace the
 * built-in "all loaded" label shown once every page has been revealed.
 *
 * @category ui/collection
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxIncrementalEnd]',
  standalone: true,
  exportAs: 'cngxIncrementalEnd',
})
export class CngxIncrementalEnd {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Loading slot. Project `<ng-template cngxIncrementalLoading>` to replace the
 * built-in first-load progress indicator. Resolution cascades instance slot ->
 * `CngxIncrementalListConfig.templates.loading` -> the built-in `CngxProgress`.
 *
 * @category ui/collection
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxIncrementalLoading]',
  standalone: true,
  exportAs: 'cngxIncrementalLoading',
})
export class CngxIncrementalLoading {
  readonly templateRef = inject(TemplateRef);
}
