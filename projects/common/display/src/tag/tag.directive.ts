import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { CNGX_TAG_GROUP } from '../tag-group/tag-group.token';

/** Visual variant. `filled` is the default solid pill; `outline` swaps fill for border; `subtle` softens both. */
export type CngxTagVariant = 'filled' | 'outline' | 'subtle';

/**
 * Semantic colour key. The five named values cascade through the
 * matching `--cngx-tag-{name}-bg/-color/-border` custom properties
 * with English-readable fallback hex values (see `tag.css`).
 *
 * Open-ended `(string & {})` accepts any consumer-defined palette
 * key (e.g. `'my-brand'`); the directive emits it as a `data-color`
 * attribute so consumers can author `[data-color="my-brand"]`
 * styles against their own design tokens. Re-evaluation trigger
 * toward a `withTagColors()` cascade is tracked in
 * `display-accepted-debt.md §1`.
 */
export type CngxTagColor =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | (string & {});

/** Density. `md` is the default; `sm` shrinks padding + font-size. */
export type CngxTagSize = 'sm' | 'md';

/**
 * Decorative tag / label / badge atom.
 *
 * **Why this exists.**
 * `CngxChip` (`@cngx/common/display`) covers the *removable pill*
 * surface inside chip strips. `CngxTag` covers the long tail of
 * static labels: status indicators on a list row, taxonomy badges
 * on a card, role markers in an admin table, pre-filter chips in a
 * dashboard sidebar. Two narrow atoms with non-overlapping
 * concerns beat one chip-tag hybrid with mode flags
 * (Pillar 3 — Komposition statt Konfiguration).
 *
 * **Responsibilities (intentionally narrow).**
 * - Apply variant / color / size / truncate / maxWidth host
 *   classes + style bindings to any host element (`<span>`,
 *   `<a>`, `<button>`, `<div>`).
 * - When projected inside a `<cngx-tag-group [semanticList]="true">`,
 *   reactively expose `role="listitem"` so the parent's
 *   `role="list"` semantics propagate without consumer wiring.
 *   The cascade reads `CNGX_TAG_GROUP.semanticList()` through a
 *   single `computed<'listitem' | null>()` (Pillar 1 —
 *   derivation; Pillar 2 — ARIA in the reactive graph).
 *
 * **Non-responsibilities.**
 * - Removable affordance — use `CngxChip` instead.
 * - Clickable / interactive semantics — wrap with native
 *   `<button cngxTag>` or `<a cngxTag>` for keyboard +
 *   focus + Enter/Space.
 * - Configuration cascade — deferred (see
 *   `display-accepted-debt.md §1`).
 *
 * @category display
 */
@Component({
  selector: '[cngxTag], cngx-tag',
  exportAs: 'cngxTag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './tag.css',
  host: {
    class: 'cngx-tag',
    '[class.cngx-tag--filled]': "variant() === 'filled'",
    '[class.cngx-tag--outline]': "variant() === 'outline'",
    '[class.cngx-tag--subtle]': "variant() === 'subtle'",
    '[class.cngx-tag--sm]': "size() === 'sm'",
    '[class.cngx-tag--truncate]': 'truncate()',
    '[attr.data-color]': 'color()',
    '[style.max-width]': 'maxWidth()',
    '[attr.role]': 'roleAttr()',
  },
})
export class CngxTag {
  /** Visual variant. `filled` (default) | `outline` | `subtle`. */
  readonly variant = input<CngxTagVariant>('filled');

  /**
   * Semantic colour. Predefined keys (`neutral` default, `success`,
   * `warning`, `error`, `info`) plus any consumer-defined string
   * which is emitted verbatim as a `data-color` attribute.
   */
  readonly color = input<CngxTagColor>('neutral');

  /** Density. `md` (default) | `sm`. */
  readonly size = input<CngxTagSize>('md');

  /**
   * When `true`, applies `text-overflow: ellipsis` + `white-space: nowrap`
   * + `overflow: hidden`. Pair with `[maxWidth]` for a hard upper bound.
   * Visual-only — the full text remains in the DOM for AT.
   */
  readonly truncate = input<boolean>(false);

  /**
   * Optional CSS `max-width` (e.g. `'12rem'`, `'200px'`). Bound
   * inline so consumers don't need a CSS authoring step for ad-hoc
   * width caps. `null` clears the binding.
   */
  readonly maxWidth = input<string | null>(null);

  /**
   * Optional parent group (Phase 3 ships `CngxTagGroup` as the
   * default implementer). When present and `semanticList()` is
   * `true`, the host carries `role="listitem"` so the parent's
   * `role="list"` propagates. When absent, no synthetic role is
   * set — `<a cngxTag>` keeps its native `role="link"`,
   * `<button cngxTag>` keeps its `role="button"`, etc.
   */
  private readonly group = inject(CNGX_TAG_GROUP, { optional: true });

  /**
   * Reactive `role` attribute. Returns `'listitem'` when projected
   * inside a `<cngx-tag-group [semanticList]="true">`; `null`
   * otherwise. No explicit `equal` fn passed — primitive string
   * output, default `Object.is` is correct (per
   * `reference_signal_architecture` §1: equality discipline applies
   * to object/array results, not primitives).
   *
   * @internal
   */
  protected readonly roleAttr = computed<'listitem' | null>(() =>
    this.group?.semanticList() ? 'listitem' : null,
  );
}
