import {
  afterNextRender,
  computed,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  Renderer2,
  untracked,
} from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import type { Subscription } from 'rxjs';

import { createMaterialBidirectionalSync } from '@cngx/common/data';
import {
  CNGX_TAB_GROUP_HOST,
  CngxTabGroupPresenter,
} from '@cngx/common/tabs';
import { nextUid } from '@cngx/core/utils';

import {
  createMatTabHandle,
  type CngxMatTabHandleSetup,
} from './material-bridge/handle';

/**
 * Material instrumentation directive — attaches to an existing
 * `<mat-tab-group>` and bridges it against a cngx
 * {@link CngxTabGroupPresenter} so consumers gain commit-action
 * lifecycle, `CNGX_STATEFUL` provision (and therefore `<cngx-toast-on />`
 * / `<cngx-banner-on />` composition), and the cngx tab-handle
 * registry — without rewriting their template. One attribute upgrade.
 *
 * Topology is the inverse of the `<cngx-mat-stepper>` thin-wrapper:
 * Material is the host, cngx is the instrumentation layer.
 * `inject(MatTabGroup, { self: true })` resolves directly off the
 * consumer's element. No content projection, no DI ordering issue —
 * `stepper-accepted-debt §1`'s structural blocker on the **adoption**
 * direction does not apply here.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMatTabs]',
  exportAs: 'cngxMatTabs',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxTabGroupPresenter,
      inputs: ['activeIndex', 'orientation', 'loop', 'commitAction', 'commitMode'],
      outputs: ['activeIndexChange'],
    },
  ],
})
export class CngxMatTabs {
  private readonly matTabGroup = inject(MatTabGroup, { self: true });
  private readonly presenter = inject(CNGX_TAB_GROUP_HOST);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly renderer = inject(Renderer2);
  private readonly hostEl =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private readonly matTabs = contentChildren(MatTab, { descendants: true });
  // Per-tab registries — strong refs are bounded by the directive's
  // lifetime (every entry is explicitly deleted when the matching
  // MatTab leaves the children set, AND the maps go away on
  // directive destroy). Map (not WeakMap) so the diff loop in
  // `syncHandles` can iterate to find removed tabs without a
  // parallel `Set<MatTab>`.
  private readonly setupsByTab = new Map<MatTab, CngxMatTabHandleSetup>();
  private readonly stateChangeSubsByTab = new Map<MatTab, Subscription>();

  // Tracks the currently-decorated MatTab element so the next
  // decoration cycle can clean its prior class + aria-invalid before
  // applying the new one. Material owns the elements; we own only
  // our additive class and attribute. Persists across effect runs;
  // cleared on directive destroy.
  private decoratedEl: HTMLElement | null = null;

  // Per-handle registry of currently-decorated aggregator elements.
  // Keyed by stable handle id so a target-element re-emit (Material
  // re-renders the strip on dynamic tab add/remove) can be detected
  // and the prior class + descriptor span + aria-describedby state
  // restored. `priorAriaDescribedby` captures whatever Material set
  // before we appended our `${id}-errors` token so cleanup restores
  // the original value (or removes the attribute entirely when no
  // prior value existed). Persists across effect runs; cleared on
  // directive destroy.
  private readonly decoratedAggregatorEls = new Map<
    string,
    {
      el: HTMLElement;
      descriptorSpan: HTMLElement;
      priorAriaDescribedby: string | null;
    }
  >();

  // Retry guard for the aggregator-decoration effect's race window
  // against Material's own view-render. The effect fires when our
  // `aggregatedErrorTabs` computed transitions from empty to
  // populated (`[cngxMatTabError]` directive writes its bound
  // aggregator into the per-handle slot, which flips
  // `aggregator.shouldShow()` true). That can land before
  // `MatTabHeader` has rendered the matching `.mat-mdc-tab`
  // buttons — `hostEl.querySelectorAll('.mat-mdc-tab')` returns 0
  // items, the decoration is silently skipped. The retry flag pins
  // a single `afterNextRender` callback that re-runs the sync after
  // Material's view has settled. Cleared on directive destroy.
  //
  // Bounded ceiling: a pathological Material render-stall (multi-
  // frame layout deferral) could re-arm the flag indefinitely. The
  // attempt counter caps recursion at `AGGREGATOR_RETRY_MAX_ATTEMPTS`
  // and surfaces a single dev-mode warning when the ceiling fires —
  // signal of either Material upgrade breaking the `.mat-mdc-tab`
  // selector contract (`tabs-accepted-debt §5`) or a consumer-side
  // stall worth investigating. Reset on success (any successful
  // sync that did not need a retry).
  private pendingAggregatorRetry = false;
  private aggregatorRetryAttempts = 0;
  private static readonly AGGREGATOR_RETRY_MAX_ATTEMPTS = 5;

  // Resolves the failed handle's stable id (or `null` when no
  // failure). Collapses spurious effect re-fires when `tabs()`
  // re-emits without a meaningful target change — e.g. dynamic
  // `<mat-tab>` add/remove during normal navigation while
  // `lastFailedIndex` stays `undefined`. The presenter guarantees
  // unique handle ids (`nextUid('cngx-mat-tab-')`) so id-equality
  // implies same-target; default `Object.is` on `string | null` is
  // the correct equality predicate (Pillar 1: derive once, never
  // re-fire on irrelevant input changes).
  private readonly failedHandleId = computed<string | null>(() => {
    const idx = this.presenter.lastFailedIndex();
    if (idx === undefined) {
      return null;
    }
    return this.presenter.tabs()[idx]?.id ?? null;
  });

  // Resolves the current set of tabs whose bound aggregator wants to
  // be revealed (`shouldShow() === true`). Reads each handle's
  // `errorAggregator()` signal, then `aggregator.shouldShow()` and
  // `aggregator.announcement()` — every tracked dependency feeds the
  // downstream Renderer2 effect (Pillar 1: derive once, project
  // once). Structural `equal` fn drops re-runs whose returned shape
  // is identical to the previous one — keeps the DOM-mutation effect
  // idempotent against `tabs()` re-emits where no aggregator state
  // actually changed (e.g. dynamic tab add/remove during normal
  // navigation while no aggregator is bound, or while bound
  // aggregators stay clean).
  private readonly aggregatedErrorTabs = computed<
    readonly { idx: number; id: string; announcement: string }[]
  >(
    () => {
      const tabs = this.presenter.tabs();
      const acc: { idx: number; id: string; announcement: string }[] = [];
      for (let i = 0; i < tabs.length; i++) {
        const handle = tabs[i];
        const aggregator = handle.errorAggregator();
        if (aggregator?.shouldShow()) {
          acc.push({
            idx: i,
            id: handle.id,
            announcement: aggregator.announcement(),
          });
        }
      }
      return acc;
    },
    {
      equal: (a, b) => {
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (
            a[i].idx !== b[i].idx ||
            a[i].id !== b[i].id ||
            a[i].announcement !== b[i].announcement
          ) {
            return false;
          }
        }
        return true;
      },
    },
  );

  constructor() {
    effect(() => {
      const tabs = this.matTabs();
      untracked(() => this.syncHandles(tabs));
    });

    // Persistent rejection decoration (Pillar 2 — Kommunikation als
    // First-Class Concern) projected onto the matching <mat-tab>
    // element via Renderer2. The effect tracks ONLY the
    // `failedHandleId` computed — that derivation collapses spurious
    // `tabs()` re-emits where the resolved target hasn't changed
    // (Pillar 1: derivation, not re-projection on every upstream
    // tick). DOM mutation runs inside `untracked()`, including the
    // `lastFailedIndex()` re-read for the index-based DOM lookup
    // (idx and id move in lockstep — handle ids are unique, so
    // id-change implies idx-change and vice versa). Sanctioned
    // `effect()` + `Renderer2` pattern per
    // `reference_signal_architecture` hook matrix: signal projection
    // onto DOM is a side-effect, not a derivation. Material consumers
    // gain the persistent error visual + standard `aria-invalid="true"`
    // ARIA without touching their <mat-tab> templates.
    effect(() => {
      const id = this.failedHandleId();
      untracked(() => {
        if (id === null) {
          this.clearDecoration();
          return;
        }
        const idx = this.presenter.lastFailedIndex();
        if (idx === undefined) {
          // Race-safety: failedHandleId returned non-null but
          // lastFailedIndex flipped to undefined inside the same
          // microtask. Clear and bail.
          this.clearDecoration();
          return;
        }
        this.applyRejectionDecorationAt(idx);
      });
    });

    // Per-tab form-error aggregation decoration (Pillar 2 — three
    // communication channels for the same per-tab aggregator state:
    // `.cngx-mat-tab--has-errors` class for the visual badge, an
    // `<span class="cngx-sr-only" id="${handle.id}-errors">` carrying
    // the `aggregator.announcement()` phrase, and an `aria-describedby`
    // patch on the rendered button that references the span). The
    // effect tracks ONLY the `aggregatedErrorTabs` computed — that
    // derivation collapses spurious `tabs()` re-emits where no
    // aggregator-state changed (Pillar 1). DOM mutation runs inside
    // `untracked()`. Sanctioned `effect()` + `Renderer2` pattern per
    // `reference_signal_architecture` hook matrix; orthogonal to the
    // rejection effect above (independent state sources, independent
    // target-resolution paths, both projecting onto the same `<button>`
    // element via additive class flags + `aria-*` attributes).
    effect(() => {
      const errorTabs = this.aggregatedErrorTabs();
      untracked(() => this.syncAggregatorDecoration(errorTabs));
    });

    this.destroyRef.onDestroy(() => {
      for (const sub of this.stateChangeSubsByTab.values()) {
        sub.unsubscribe();
      }
      this.stateChangeSubsByTab.clear();
      this.setupsByTab.clear();
      this.clearDecoration();
      for (const id of Array.from(this.decoratedAggregatorEls.keys())) {
        this.removeAggregatorDecoration(id);
      }
    });

    createMaterialBidirectionalSync({
      presenterIndex: this.presenter.activeIndex,
      readSelectedIndex: () => this.matTabGroup.selectedIndex ?? 0,
      writeSelectedIndex: (i) => {
        this.matTabGroup.selectedIndex = i;
      },
      selectionChange$: this.matTabGroup.selectedIndexChange.asObservable(),
      onMaterialSelection: (i) => this.presenter.select(i),
      injector: this.injector,
      destroyRef: this.destroyRef,
    });
  }

  private syncHandles(tabs: readonly MatTab[]): void {
    const liveTabs = new Set<MatTab>(tabs);

    // Add: only fresh MatTabs get a setup + handle registration +
    // `_stateChanges` subscription. Cached MatTabs survive untouched
    // — no register-churn, no resubscribe-churn.
    for (const tab of tabs) {
      if (this.setupsByTab.has(tab)) {
        continue;
      }
      const setup = createMatTabHandle(tab, () => nextUid('cngx-mat-tab-'));
      this.setupsByTab.set(tab, setup);
      this.presenter.register(setup.handle);
      // Live projection of MatTab.disabled / textLabel via
      // `_stateChanges`. See `handle.ts` JSDoc for the
      // underscore-prefix coupling note.
      const sub = tab._stateChanges.subscribe(() => {
        setup.label.set(tab.textLabel);
        setup.disabled.set(tab.disabled);
      });
      this.stateChangeSubsByTab.set(tab, sub);
    }

    // Remove: any MatTab in our registry that's no longer in the
    // children-set is gone — unsubscribe + unregister. Snapshot
    // entries before the loop so multi-key deletes inside the body
    // never collide with iterator state (current-key delete is
    // spec-safe; the snapshot is defensive against future-edit
    // regressions that introduce non-current-key deletes).
    for (const [tab, setup] of Array.from(this.setupsByTab.entries())) {
      if (liveTabs.has(tab)) {
        continue;
      }
      this.stateChangeSubsByTab.get(tab)?.unsubscribe();
      this.stateChangeSubsByTab.delete(tab);
      this.setupsByTab.delete(tab);
      this.presenter.unregister(setup.handle.id);
    }
  }

  private applyRejectionDecorationAt(failedIdx: number): void {
    // Clear any prior decoration first — keeps the contract that
    // `cngx-mat-tab--error` lives on at most one element at any time
    // (matches the presenter's single-slot `lastFailedIndex` shape).
    this.clearDecoration();

    // Material renders the clickable tab buttons inside `MatTabHeader`
    // (NOT on each `<mat-tab>` declaration — `MatTab.elementRef` is
    // not part of the public API). The buttons land in declaration
    // order, which matches the presenter's `tabs()` array order
    // (registration follows `contentChildren(MatTab)` order which
    // follows declaration order). Indexing `.mat-mdc-tab` by
    // `failedIdx` is the only viable way to reach the rendered DOM
    // element. Index drift on dynamic tab removal is the same risk
    // the cngx-native variant carries via `[class.X]="failedIdx === i"`
    // — accepted (Pillar 1: index-driven binding is idempotent on
    // re-render). The `.mat-mdc-tab` selector is a Material-internal
    // CSS class — tracked as `tabs-accepted-debt §5` (Material-private
    // surface couplings) alongside `MatTab._stateChanges` in
    // `handle.ts:43-54`. Re-evaluation triggers: Material upgrades
    // that break the selector OR a future public per-MatTab-header
    // element accessor.
    const buttons = this.hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab');
    const targetEl = buttons.item(failedIdx);
    if (!targetEl) {
      return;
    }
    this.renderer.addClass(targetEl, 'cngx-mat-tab--error');
    this.renderer.setAttribute(targetEl, 'aria-invalid', 'true');
    this.decoratedEl = targetEl;
  }

  private clearDecoration(): void {
    if (!this.decoratedEl) {
      return;
    }
    this.renderer.removeClass(this.decoratedEl, 'cngx-mat-tab--error');
    this.renderer.removeAttribute(this.decoratedEl, 'aria-invalid');
    this.decoratedEl = null;
  }

  private syncAggregatorDecoration(
    errorTabs: readonly { idx: number; id: string; announcement: string }[],
  ): void {
    const liveIds = new Set<string>();
    for (const t of errorTabs) {
      liveIds.add(t.id);
    }

    // Drop decorations for handles that left the result set —
    // either the consumer flipped `shouldShow` back to false, or the
    // tab was removed from the children-set entirely.
    for (const id of Array.from(this.decoratedAggregatorEls.keys())) {
      if (!liveIds.has(id)) {
        this.removeAggregatorDecoration(id);
      }
    }

    // Apply or refresh decorations for current error-bearing tabs.
    // `.mat-mdc-tab` indexing matches `presenter.tabs()` order — same
    // assumption the rejection-decoration path documents at length
    // (`tabs-accepted-debt §5`). Index drift on dynamic tab removal
    // is the same accepted risk and compounds here: aggregator
    // decoration is multi-target (any number of handles can carry
    // `--has-errors` simultaneously, vs the single rejected tab),
    // so a removal that shifts all remaining indices left causes
    // each retained badge to land on a now-stale button until the
    // next computed re-fire prunes the registry. The next sync tick
    // (driven by the dependent `presenter.tabs()` re-emit on
    // remove) repaints correctly. Re-evaluation triggers same as
    // §5: a public per-MatTab-header element accessor would let us
    // resolve targets by id instead of index.
    const buttons = this.hostEl.querySelectorAll<HTMLElement>('.mat-mdc-tab');
    let needsRetry = false;
    for (const { idx, id, announcement } of errorTabs) {
      const targetEl = buttons.item(idx);
      if (!targetEl) {
        // Race window: our effect ran before MatTabHeader rendered
        // the matching button. Schedule a one-shot retry via
        // `afterNextRender` (guarded by the pendingAggregatorRetry
        // flag so concurrent missing-button entries collapse to one
        // retry callback).
        needsRetry = true;
        continue;
      }
      const existing = this.decoratedAggregatorEls.get(id);
      if (existing && existing.el === targetEl) {
        // Same element, possibly new announcement text — patch the
        // descriptor span content without re-creating the element so
        // AT live-region implementations don't re-announce on every
        // identity-only refresh.
        if (existing.descriptorSpan.textContent !== announcement) {
          this.renderer.setProperty(
            existing.descriptorSpan,
            'textContent',
            announcement,
          );
        }
        continue;
      }
      // Different element (Material re-rendered the strip) — clean up
      // the prior entry's class + span + aria-describedby first so we
      // don't leak the visual onto a now-stale button.
      if (existing) {
        this.removeAggregatorDecoration(id);
      }
      this.applyAggregatorDecoration(targetEl, id, announcement);
    }

    if (!needsRetry) {
      // Successful sync clears the attempt counter — every transient
      // race recovers on the next pass; we only treat "still racing
      // after N attempts" as the pathological case.
      this.aggregatorRetryAttempts = 0;
      return;
    }
    if (this.pendingAggregatorRetry) {
      return;
    }
    if (
      this.aggregatorRetryAttempts >=
      CngxMatTabs.AGGREGATOR_RETRY_MAX_ATTEMPTS
    ) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        // eslint-disable-next-line no-console
        console.warn(
          '[cngxMatTabs] aggregator decoration retry ceiling reached ' +
            `(${CngxMatTabs.AGGREGATOR_RETRY_MAX_ATTEMPTS} attempts) — ` +
            'MatTabHeader did not render `.mat-mdc-tab` buttons within ' +
            'the expected window. Likely cause: Material upgrade broke ' +
            'the `.mat-mdc-tab` selector contract (tabs-accepted-debt §5) ' +
            'or a consumer-side render stall. Bound aggregators may ' +
            'remain visually undecorated until the next state change.',
        );
      }
      this.aggregatorRetryAttempts = 0;
      return;
    }
    this.pendingAggregatorRetry = true;
    this.aggregatorRetryAttempts++;
    afterNextRender(
      () => {
        this.pendingAggregatorRetry = false;
        this.syncAggregatorDecoration(this.aggregatedErrorTabs());
      },
      { injector: this.injector },
    );
  }

  private applyAggregatorDecoration(
    targetEl: HTMLElement,
    id: string,
    announcement: string,
  ): void {
    this.renderer.addClass(targetEl, 'cngx-mat-tab--has-errors');

    const spanId = `${id}-errors`;
    const descriptorSpan = this.renderer.createElement('span') as HTMLElement;
    this.renderer.addClass(descriptorSpan, 'cngx-sr-only');
    this.renderer.setAttribute(descriptorSpan, 'id', spanId);
    this.renderer.setProperty(descriptorSpan, 'textContent', announcement);
    this.renderer.appendChild(targetEl, descriptorSpan);

    // Preserve any existing `aria-describedby` token list — Material
    // and consumer code may have set it for unrelated descriptor
    // elements; we only ever append our own `${id}-errors` token and
    // restore the original value on cleanup.
    const priorAriaDescribedby = targetEl.getAttribute('aria-describedby');
    const tokens = priorAriaDescribedby
      ? priorAriaDescribedby.split(/\s+/).filter(Boolean)
      : [];
    if (!tokens.includes(spanId)) {
      tokens.push(spanId);
    }
    this.renderer.setAttribute(targetEl, 'aria-describedby', tokens.join(' '));

    this.decoratedAggregatorEls.set(id, {
      el: targetEl,
      descriptorSpan,
      priorAriaDescribedby,
    });
  }

  private removeAggregatorDecoration(id: string): void {
    const entry = this.decoratedAggregatorEls.get(id);
    if (!entry) {
      return;
    }
    this.renderer.removeClass(entry.el, 'cngx-mat-tab--has-errors');
    this.renderer.removeChild(entry.el, entry.descriptorSpan);
    if (entry.priorAriaDescribedby === null) {
      this.renderer.removeAttribute(entry.el, 'aria-describedby');
    } else {
      this.renderer.setAttribute(
        entry.el,
        'aria-describedby',
        entry.priorAriaDescribedby,
      );
    }
    this.decoratedAggregatorEls.delete(id);
  }

  /**
   * Clear the persisted `lastFailedIndex` rejection flag on the
   * presenter — public delegator mirroring the
   * {@link https://cngx.dev/api/CngxTabGroup#clearLastFailed
   * `CngxTabGroup.clearLastFailed()`} pattern so consumers using a
   * template ref (`#mt="cngxMatTabs"`) can dismiss the rejection
   * decoration programmatically without injecting the host token.
   */
  clearLastFailed(): void {
    this.presenter.clearLastFailed();
  }

  /**
   * Look up the per-handle `errorAggregator` writable slot for a
   * given `MatTab`. Returns `undefined` when the tab has not been
   * registered yet (the directive's `contentChildren(MatTab)` query
   * lands during Angular's content-init pass, so a same-microtask
   * injection from a per-tab attribute directive can race the
   * registration). The `[cngxMatTabError]` directive uses this to
   * reach the per-handle slot; race-recovery happens by tracking
   * `presenter.tabs()` in the consumer's effect so a later sync tick
   * re-attempts the lookup.
   *
   * Return type is narrowed to `Pick<CngxMatTabHandleSetup,
   * 'errorAggregator'>` — the rest of the setup (handle, label,
   * disabled writables) is internal bookkeeping the directive owns
   * and should not leak through this access path.
   *
   * @internal — exposed for the in-library `[cngxMatTabError]`
   * directive only. Public consumers should bind `[cngxMatTabError]`
   * on each `<mat-tab>` rather than walking the registry by hand.
   * Re-evaluate when ≥1 documented external consumer needs the
   * per-handle setup directly OR a second `[cngxMatTab*]`-shaped
   * per-tab attribute directive lands. Tracked as
   * `tabs-accepted-debt §7` (convention-only narrowing — TypeScript
   * visibility is `public` because no library-private modifier
   * exists; alternative options are over-abstraction).
   */
  getHandleSetup(
    matTab: MatTab,
  ): Pick<CngxMatTabHandleSetup, 'errorAggregator'> | undefined {
    return this.setupsByTab.get(matTab);
  }
}
