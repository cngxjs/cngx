import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Marks a template as the skeleton placeholder inside `cngx-skeleton`.
 *
 * The template is repeated `count` times while loading. Context provides the
 * current index as `$implicit`.
 *
 * @example
 * ```html
 * <cngx-skeleton [loading]="loading()" [count]="3">
 *   <ng-template cngxSkeletonPlaceholder let-i>
 *     <div class="skeleton-line" [style.width]="i === 0 ? '60%' : '100%'"></div>
 *   </ng-template>
 *   <p>Real content</p>
 * </cngx-skeleton>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxSkeletonPlaceholder]',
  standalone: true,
})
export class CngxSkeletonPlaceholder {
  /** Reference to the projected template. Used internally by `CngxSkeletonContainer`. */
  readonly templateRef = inject<TemplateRef<CngxSkeletonPlaceholderContext>>(TemplateRef);
}

/** Template context for `cngxSkeletonPlaceholder`. */
export interface CngxSkeletonPlaceholderContext {
  /** Current index (0-based). */
  $implicit: number;
  /** Current index (named). */
  index: number;
  /** Total count. */
  count: number;
  /** Whether this is the first item. */
  first: boolean;
  /** Whether this is the last item. */
  last: boolean;
}
