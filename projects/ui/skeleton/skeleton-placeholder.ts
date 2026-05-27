import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive that registers a `<ng-template>` as the
 * loading-state stand-in for `<cngx-skeleton>`. The container reads
 * it via `contentChild(CngxSkeletonPlaceholder)`; the directive
 * holds only the `TemplateRef` and contributes no DOM of its own.
 *
 * One-per-container contract: the container uses `contentChild`
 * (single), not `contentChildren`. Multiple sibling
 * `<ng-template cngxSkeletonPlaceholder>` blocks resolve to the
 * first match; the rest are dead code. Pick the variant at author
 * time, do not stack alternatives.
 *
 * Repetition: while the container's `loading()` (or
 * `state.isFirstLoad()`) is `true`, the template renders `[count]`
 * times inside the container's internal `@for`. When loading flips
 * to `false`, the skeleton DOM tears down and the projected sibling
 * content renders in its place.
 *
 * Context fields ({@link CngxSkeletonPlaceholderContext}):
 * - `$implicit` / `index` - 0-based iteration index. Drive per-row
 *   width variance with it (`i === 0 ? '60%' : '100%'`).
 * - `count` - total placeholders being rendered, mirrors the
 *   container's `[count]` input.
 * - `first` / `last` - row markers for end-of-block treatments
 *   (e.g. last row without a trailing border).
 *
 * Bind via `let-i` for the implicit index, or `let-x="<field>"`
 * for any other field:
 *
 * ```html
 * <cngx-skeleton [loading]="loading()" [count]="3">
 *   <ng-template cngxSkeletonPlaceholder let-i>
 *     <div class="skeleton-line"
 *          [style.width]="i === 0 ? '60%' : '100%'"></div>
 *   </ng-template>
 *   <p>Real content</p>
 * </cngx-skeleton>
 * ```
 *
 * Last-row variant using `let-last`:
 *
 * ```html
 * <ng-template cngxSkeletonPlaceholder let-i let-last="last">
 *   <div class="skeleton-row" [class.is-last]="last"></div>
 * </ng-template>
 * ```
 *
 * @category ui/skeleton
 */
@Directive({
  selector: 'ng-template[cngxSkeletonPlaceholder]',
  standalone: true,
})
export class CngxSkeletonPlaceholder {
  /** Reference to the projected template. Used internally by `CngxSkeletonContainer`. */
  readonly templateRef = inject<TemplateRef<CngxSkeletonPlaceholderContext>>(TemplateRef);
}

/**
 * Template context for `cngxSkeletonPlaceholder`.
 *
 * @category ui/skeleton
 */
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
