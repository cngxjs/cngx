import {
  ChangeDetectionStrategy,
  Component,
  input,
  type Signal,
  ViewEncapsulation,
} from '@angular/core';

import { CNGX_TAG_GROUP, type CngxTagGroupHost } from './tag-group.token';

/**
 * Spacing between projected tags. Maps to the
 * `--cngx-tag-group-gap{,-xs,-md}` CSS custom property cascade with
 * fallback defaults (see `tag-group.component.css`). `sm` is the
 * default — matches the tag's own padding rhythm.
 *
 * - `xs` → 0.25rem (tight chip strips)
 * - `sm` → 0.5rem (default)
 * - `md` → 0.75rem (roomy taxonomy clusters)
 */
export type CngxTagGroupGap = 'xs' | 'sm' | 'md';

/**
 * Cross-axis distribution of projected tags within the flex-wrap row.
 * Resolves to a `justify-content` value:
 *
 * - `start` (default) → `flex-start`
 * - `center` → `center`
 * - `end` → `flex-end`
 * - `between` → `space-between`
 *
 * Only meaningful when the group has more horizontal room than its
 * intrinsic content; otherwise the row hugs its tags.
 */
export type CngxTagGroupAlign = 'start' | 'center' | 'end' | 'between';

/**
 * Layout-only container for a row of `CngxTag` siblings.
 *
 * **Why this exists.**
 * Pairs with `CngxTag` to satisfy the long tail of "render N taxonomy
 * badges in a row, optionally as a semantic list" needs. The component
 * owns *only* the flex-wrap layout (gap / align) and the
 * `role="list"` + `aria-label` ARIA opt-in. The cascade that flips
 * each child's `role="listitem"` lives on the `CngxTag` side
 * (`tag.directive.ts` reads `CNGX_TAG_GROUP.semanticList()` through a
 * `computed`); this component just provides the implementer of that
 * token (Pillar 1 — derivation rather than imperative sync;
 * Pillar 2 — ARIA in the reactive graph).
 *
 * **Responsibilities (intentionally narrow).**
 * - Apply gap / align host-class modifiers + thematic CSS custom
 *   properties.
 * - Bind `role="list"` reactively from `[semanticList]`.
 * - Bind `aria-label` reactively from `[label]`.
 * - Provide `CNGX_TAG_GROUP` so descendant `CngxTag` directives can
 *   read `semanticList()` without injecting this concrete class
 *   (atomic-decompose rule 4).
 *
 * **Non-responsibilities.**
 * - No `role="listitem"` cascade implementation here — that lives in
 *   `CngxTag` so the cascade survives any future non-component
 *   implementer of `CngxTagGroupHost` (test doubles, programmatic
 *   groups).
 * - No `hostDirectives` — decorative atoms have no shared cross-cutting
 *   behaviour to compose. Per atomic-decompose rule 1 the absence is
 *   the right call until a future shared concern lands.
 * - Configuration cascade (`provideTagConfig`) — deferred (see
 *   `display-accepted-debt.md §1`).
 *
 * @category display
 */
@Component({
  selector: 'cngx-tag-group',
  exportAs: 'cngxTagGroup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Encapsulation `None` mirrors `CngxTag` — host-class modifier rules
  // (`.cngx-tag-group--gap-md`, `.cngx-tag-group--align-between`) need to
  // match the host element directly. Emulated encapsulation rewrites
  // those to `[_ngcontent-xxx]` selectors that never match the host
  // (which carries `_nghost-xxx`), silently dropping the chrome at
  // runtime. Same convention as `mat-*` containers.
  encapsulation: ViewEncapsulation.None,
  template: '<ng-content />',
  styleUrl: './tag-group.component.css',
  providers: [{ provide: CNGX_TAG_GROUP, useExisting: CngxTagGroup }],
  host: {
    class: 'cngx-tag-group',
    '[class.cngx-tag-group--gap-xs]': "gap() === 'xs'",
    '[class.cngx-tag-group--gap-md]': "gap() === 'md'",
    '[class.cngx-tag-group--align-start]': "align() === 'start'",
    '[class.cngx-tag-group--align-center]': "align() === 'center'",
    '[class.cngx-tag-group--align-end]': "align() === 'end'",
    '[class.cngx-tag-group--align-between]': "align() === 'between'",
    '[attr.role]': "semanticList() ? 'list' : null",
    '[attr.aria-label]': 'label() ?? null',
  },
})
export class CngxTagGroup implements CngxTagGroupHost {
  /** Spacing between projected tags. `sm` (default) | `xs` | `md`. */
  readonly gap = input<CngxTagGroupGap>('sm');

  /** Cross-axis distribution. `start` (default) | `center` | `end` | `between`. */
  readonly align = input<CngxTagGroupAlign>('start');

  /**
   * Optional label rendered as `aria-label` on the host. When the
   * group also opts into `[semanticList]="true"`, AT reads "Tags,
   * list, N items"; without `semanticList`, the label sits on a
   * decorative grouping (no `role`).
   */
  readonly label = input<string | undefined>(undefined);

  /**
   * Input-binding hook for the public `[semanticList]` attribute.
   * Accessed by Angular's template type-checker on consumer
   * markup — therefore must be class-public (Angular rejects
   * `private` per NG1053; `protected` blocks external template
   * bindings). The hook is intentionally **not** the contract
   * surface — that role belongs to `semanticList` below, typed
   * `Signal<boolean>` so test doubles and programmatic
   * implementers of `CngxTagGroupHost` can satisfy the interface
   * without owning an Angular `input()`.
   *
   * @internal
   */
  readonly semanticListInput = input<boolean>(false, { alias: 'semanticList' });

  /**
   * Public host-contract field. `InputSignal<boolean>` already
   * structurally extends `Signal<boolean>`, so the assignment narrows
   * the public type without a runtime conversion. Read by
   * `CngxTag.roleAttr` through `CNGX_TAG_GROUP` to derive
   * `role="listitem"` reactively.
   */
  readonly semanticList: Signal<boolean> = this.semanticListInput;
}
