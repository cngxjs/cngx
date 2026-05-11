import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  input,
  isDevMode,
  type Signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';

import { injectTagConfig } from '../tag/config/inject-tag-config';
import { injectResolvedTagTemplate } from '../tag/shared/inject-resolved-template';
import { CngxTag } from '../tag/tag.directive';
import { CngxTagGroupAccessory } from './slots/tag-group-accessory.directive';
import { CngxTagGroupHeader } from './slots/tag-group-header.directive';
import type { CngxTagGroupHeaderContext } from './slots/tag-group-slot.context';
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
 * owns *only* the flex-wrap layout (gap / align), the `role="list"` +
 * `aria-label` ARIA opt-in, and the `<ng-template>`-driven header /
 * accessory slot zones. The cascade that flips each child's
 * `role="listitem"` lives on the `CngxTag` side (`tag.directive.ts`
 * reads `CNGX_TAG_GROUP.semanticList()` through a `computed`); this
 * component just provides the implementer of that token (Pillar 1 —
 * derivation rather than imperative sync; Pillar 2 — ARIA in the
 * reactive graph).
 *
 * **Responsibilities (intentionally narrow).**
 * - Apply gap / align host-class modifiers + thematic CSS custom
 *   properties.
 * - Bind `role="list"` reactively from `[semanticList]`.
 * - Bind `aria-label` reactively from `[label]`.
 * - Provide `CNGX_TAG_GROUP` so descendant `CngxTag` directives can
 *   read `semanticList()` without injecting this concrete class
 *   (atomic-decompose rule 4).
 * - Project consumer-supplied `*cngxTagGroupHeader` /
 *   `*cngxTagGroupAccessory` templates above / below the tag row,
 *   exposing the live group state plus `count` of projected
 *   `CngxTag` children via the slot context.
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
  imports: [NgTemplateOutlet],
  // Encapsulation `None` mirrors `CngxTag` — host-class modifier rules
  // (`.cngx-tag-group--gap-md`, `.cngx-tag-group--align-between`) need to
  // match the host element directly. Emulated encapsulation rewrites
  // those to `[_ngcontent-xxx]` selectors that never match the host
  // (which carries `_nghost-xxx`), silently dropping the chrome at
  // runtime. Same convention as `mat-*` containers.
  encapsulation: ViewEncapsulation.None,
  // Three-zone vertical stack: header (default empty), row (default
  // `<ng-content />` carrying the projected `<span cngxTag>` siblings),
  // accessory (default empty). The row class is the stable layout
  // anchor — gap and align modifier classes target it via descendant
  // selectors regardless of whether header / accessory render.
  template: `
    @if (headerTpl(); as t) {
      <ng-container *ngTemplateOutlet="t; context: slotContext()" />
    }
    <div class="cngx-tag-group__row">
      <ng-content />
    </div>
    @if (accessoryTpl(); as t) {
      <ng-container *ngTemplateOutlet="t; context: slotContext()" />
    }
  `,
  styleUrls: ['../tag/shared/tag-base.css', './tag-group.component.css'],
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
  /**
   * Snapshot of the resolved tag-family config at construction
   * time. Drives the per-input fallback defaults below.
   *
   * **Field-init ordering is load-bearing** — must be declared
   * before any input field that reads `this.cfg.groupDefaults?.*`.
   * Per the `tag-family-architectural-a-plus-pass` plan
   * Architectural-Decisions table.
   */
  private readonly cfg = injectTagConfig();

  /** Spacing between projected tags. `sm` (default) | `xs` | `md`. */
  readonly gap = input<CngxTagGroupGap>(this.cfg.groupDefaults?.gap ?? 'sm');

  /** Cross-axis distribution. `start` (default) | `center` | `end` | `between`. */
  readonly align = input<CngxTagGroupAlign>(this.cfg.groupDefaults?.align ?? 'start');

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
  readonly semanticListInput = input<boolean>(
    this.cfg.groupDefaults?.semanticList ?? false,
    { alias: 'semanticList' },
  );

  /**
   * Public host-contract field. `InputSignal<boolean>` already
   * structurally extends `Signal<boolean>`, so the assignment narrows
   * the public type without a runtime conversion. Read by
   * `CngxTag.roleAttr` through `CNGX_TAG_GROUP` to derive
   * `role="listitem"` reactively.
   */
  readonly semanticList: Signal<boolean> = this.semanticListInput;

  /**
   * Live count of projected `<span cngxTag>` direct children. Drives
   * the `count` field of the header / accessory slot contexts so
   * consumer "Filters ({{ count }})" patterns work without
   * injection. Default `Object.is` equality is correct for a
   * primitive number.
   */
  readonly count = computed<number>(() => this.projectedTags().length);

  /**
   * Per-instance header-slot directive — projected as
   * `<ng-template cngxTagGroupHeader>...</ng-template>`. Resolved
   * through {@link injectResolvedTagTemplate} so consumers can
   * project a header without wrapping the group component.
   */
  protected readonly headerSlot = contentChild(CngxTagGroupHeader);

  /** Per-instance accessory-slot directive — projected below the row. */
  protected readonly accessorySlot = contentChild(CngxTagGroupAccessory);

  /**
   * Resolved header template. Phase 2 cascade: instance slot → null
   * (no DOM rendered above the row when not projected). Phase 4
   * commit 5 inserts `CNGX_TAG_CONFIG.templates.header` as a middle
   * tier without touching this call site.
   */
  protected readonly headerTpl = injectResolvedTagTemplate(
    this.headerSlot,
    'header',
  );

  /** Resolved accessory template. Same 2-stage cascade as {@link headerTpl}. */
  protected readonly accessoryTpl = injectResolvedTagTemplate(
    this.accessorySlot,
    'accessory',
  );

  /**
   * Projected `<span cngxTag>` siblings. Default-scoped
   * (`descendants: false`) so tags inside consumer-projected header /
   * accessory templates do NOT inflate the count — the count
   * represents the row's own taxonomy items, not arbitrary tag
   * usage inside the slot zones.
   */
  private readonly projectedTags = contentChildren(CngxTag);

  /**
   * Reactive bundle exposed to header / accessory slots'
   * `*ngTemplateOutletContext`. The two slot context interfaces are
   * structurally identical in Phase 2; the same computed source
   * serves both. Consumer templates `let-count="count"` etc. read
   * the live state without injecting the directive.
   *
   * Explicit structural `equal` fn — without it, a fresh literal
   * each CD cycle would force `ngTemplateOutlet` to rebind embedded
   * views even when no input changed. Per
   * `reference_signal_architecture` §1 Equality Rule: every
   * `computed` returning an object MUST pass an `equal` fn.
   */
  protected readonly slotContext = computed<CngxTagGroupHeaderContext>(
    () => ({
      $implicit: undefined as void,
      gap: this.gap(),
      align: this.align(),
      semanticList: this.semanticList(),
      label: this.label(),
      count: this.count(),
    }),
    {
      equal: (a, b) =>
        a.gap === b.gap &&
        a.align === b.align &&
        a.semanticList === b.semanticList &&
        a.label === b.label &&
        a.count === b.count,
    },
  );

  constructor() {
    // Dev-mode advisory: `<cngx-tag-group [label]="...">` without
    // `[semanticList]="true"` lands the `aria-label` on a generic
    // `<div>` (no `role="list"`). AT then exposes the aria-label
    // but doesn't surface "list, N items" — likely not the
    // consumer's intent. One-shot post-mount check; tree-shaken in
    // prod via the `isDevMode()` guard.
    //
    // `afterNextRender` is the canonical hook for one-shot
    // post-mount checks (per `reference_signal_architecture` Hook
    // Selection Matrix); `effect()` would re-fire on every input
    // change. Reads are wrapped in `untracked()` defensively —
    // `afterNextRender` does not establish a reactive scope, but
    // the explicit wrapper documents one-shot intent and matches
    // the cngx style-guide bias toward signal-read hygiene.
    afterNextRender(() => {
      const { label, semanticList } = untracked(() => ({
        label: this.label(),
        semanticList: this.semanticList(),
      }));
      if (isDevMode() && label && !semanticList) {
        console.warn(
          '[cngx-tag-group] [label] is bound without [semanticList]="true"; ' +
            'the aria-label lands on a generic <div>. Add ' +
            '[semanticList]="true" to expose role="list" + aria-label, ' +
            'or remove [label].',
        );
      }
    });
  }
}
