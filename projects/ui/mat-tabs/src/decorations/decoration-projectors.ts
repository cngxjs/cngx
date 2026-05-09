import {
  afterNextRender,
  type DestroyRef,
  effect,
  type EmbeddedViewRef,
  type Injector,
  isDevMode,
  type Renderer2,
  runInInjectionContext,
  type Signal,
  type TemplateRef,
  untracked,
  type ViewContainerRef,
} from '@angular/core';

import type { CngxMatTabAggregatorContentContext } from './mat-tab-aggregator-content.directive';
import type { CngxMatTabRejectionContentContext } from './mat-tab-rejection-content.directive';

/**
 * Package-private DOM-mutation projectors for `[cngxMatTabs]`.
 *
 * Two separate effects on the same host element project orthogonal
 * state surfaces onto Material's rendered tab buttons:
 *
 * - {@link createMatTabRejectionDecoration} mirrors
 *   `presenter.lastFailedIndex` onto the matching `.mat-mdc-tab` as a
 *   class flag plus a hidden `<span class="cngx-sr-only">` descriptor
 *   referenced through `aria-describedby`. The descriptor's
 *   `textContent` is driven by a reactive `descriptorText` signal —
 *   typically the i18n `commitRolledBackTo(originLabel)` phrase
 *   resolved at the directive site (mirrors the cngx-native
 *   organism's `liveAnnouncement` chain). `aria-invalid` is NOT used:
 *   per ARIA 1.2 the attribute is form-field vocabulary and does not
 *   apply to a `<button role="tab">`.
 * - {@link createMatTabAggregatorDecoration} projects each handle's
 *   per-tab error-aggregator `shouldShow()` flag onto the matching
 *   button as a `cngx-mat-tab--has-errors` class plus an
 *   `<span class="cngx-sr-only">` descriptor + `aria-describedby`
 *   token append.
 *
 * The two projectors land different descriptor spans (`-rejected` vs
 * `-errors` id suffixes) on the same target when both flags coexist;
 * the shared aria-describedby token-list append pattern preserves
 * consumer-supplied tokens AND supports both descriptors stacking
 * cleanly without collision.
 *
 * Both factories live as siblings of `CngxMatTabs` (NOT exported from
 * `public-api.ts`) — single in-package consumer; promoting them to a
 * Level-2 surface in `@cngx/common/<lib>` would land an
 * over-abstraction smell (`one-consumer factory token` per the
 * architecture-lens rule). The directive class shrinks below the
 * `level-4-organism-loc-guard` threshold via these helpers; visual +
 * A11y contracts are unchanged.
 *
 * Index-based DOM lookup (`.mat-mdc-tab[idx]`) and the matching
 * Material-internal selector are tracked accepted-debt — see
 * `tabs-accepted-debt §5`.
 *
 * @category interactive
 * @internal — package-private. Consumers bind `[cngxMatTabError]` on
 * each `<mat-tab>`; the directive owns the projection mechanics.
 */

/**
 * Diff-restore the `aria-describedby` token list on a button after a
 * decoration's descriptor span has been detached. The decoration's own
 * id token is dropped from whatever the attribute currently holds —
 * any third-party token written between apply and clear (e.g. a
 * tooltip ref bound after the projector mounted, an `mat-mdc-tab`'s
 * own runtime additions) is preserved.
 *
 * Whole-attribute restore (the pre-this-fix path) clobbered any such
 * write because it overwrote the attribute with the snapshot taken at
 * apply time. The diff approach treats the attribute as a token-set —
 * the cngx ARIA-by-value rule (`aria-describedby` is a space-separated
 * token list, never a single owner) — so every owner's writes
 * compose cleanly.
 *
 * Restore semantics:
 * - If the resulting token list is empty AND the attribute was absent
 *   before the decoration mounted (`priorAriaDescribedby === null`),
 *   the attribute is removed entirely — the empty-string state would
 *   leave a dangling `aria-describedby=""` which AT readers may
 *   interpret as a malformed reference.
 * - Otherwise, the resulting tokens are written verbatim. This covers
 *   both the third-party-tokens-only case (own id removed, tokens
 *   remain) and the no-third-party-writes case (the result equals
 *   `priorAriaDescribedby` exactly).
 *
 * @internal — package-private helper for the two decoration projectors.
 */
function restoreAriaDescribedbyExceptToken(
  el: HTMLElement,
  tokenToRemove: string,
  renderer: Renderer2,
  priorAriaDescribedby: string | null,
): void {
  const current = el.getAttribute('aria-describedby');
  const tokens = current ? current.split(/\s+/).filter(Boolean) : [];
  const remaining = tokens.filter((t) => t !== tokenToRemove);
  if (remaining.length === 0) {
    if (priorAriaDescribedby === null) {
      renderer.removeAttribute(el, 'aria-describedby');
    } else {
      renderer.setAttribute(el, 'aria-describedby', priorAriaDescribedby);
    }
    return;
  }
  renderer.setAttribute(el, 'aria-describedby', remaining.join(' '));
}

/**
 * Options for {@link createMatTabRejectionDecoration}.
 */
export interface CngxMatTabRejectionDecorationOptions {
  /** Host element whose subtree contains the `.mat-mdc-tab` buttons. */
  readonly hostEl: HTMLElement;
  /**
   * Stable id of the currently-failed target — `null` when no
   * rejection is pinned. The factory's `effect()` tracks ONLY this
   * computed; the index-based DOM lookup happens inside `untracked()`
   * after the trigger fires. The id is also the prefix for the
   * descriptor span's DOM id (`${id}-rejected`).
   */
  readonly failedHandleId: Signal<string | null>;
  /**
   * Index of the currently-failed target — `undefined` when no
   * rejection is pinned. Read inside `untracked()` after
   * `failedHandleId` triggers.
   */
  readonly failedIndex: Signal<number | undefined>;
  /**
   * Reactive descriptor phrase rendered into the hidden SR-only span
   * referenced by the rejected button's `aria-describedby` token list.
   * Typical resolution at the caller: i18n `commitRolledBackTo(originLabel)`
   * when the rollback origin is resolvable, falling back to
   * `commitFailedRetry` otherwise — same priority chain the
   * cngx-native organism's `liveAnnouncement` uses, so the AT
   * announcement and the persistent descriptor stay phrased
   * identically. A separate effect tracks this signal so text
   * mutations during a held rejection (e.g. origin label resolves
   * later) update the existing span in place rather than recreating
   * it. Empty string is honoured — the span stays present so the
   * `aria-describedby` reference never becomes a dangling pointer
   * (cngx ARIA-by-value rule: ids always present, content reactive).
   */
  readonly descriptorText: Signal<string>;
  readonly renderer: Renderer2;
  readonly injector: Injector;
  readonly destroyRef: DestroyRef;
  /** Default: `.mat-mdc-tab`. Override only for testing. */
  readonly buttonSelector?: string;
  /** Default: `cngx-mat-tab--error`. */
  readonly className?: string;
  /** Default: `cngx-sr-only`. */
  readonly srOnlyClassName?: string;
  /**
   * Suffix appended to `failedHandleId` to form the descriptor span's
   * DOM id (full id: `${failedHandleId}-${descriptorIdSuffix}`).
   * Default `'rejected'` — chosen to coexist with the aggregator
   * projector's `'-errors'` suffix on the same target without
   * collision.
   */
  readonly descriptorIdSuffix?: string;
  /**
   * Optional reactive `*cngxMatTabRejectionContent` slot template.
   * When the signal returns a non-null `TemplateRef`, the projector
   * renders an embedded view of it into the SR descriptor span
   * instead of writing the imperative `textContent` fallback. When
   * `null`, the projector falls back to the imperative
   * `setProperty(textContent, descriptorText)` path — same shape
   * the pre-Phase-4 contract shipped with.
   */
  readonly contentTemplate?: Signal<
    TemplateRef<CngxMatTabRejectionContentContext> | null
  >;
  /**
   * View container ref used to instantiate embedded views from
   * `contentTemplate`. Required only when `contentTemplate` is
   * supplied — when omitted, the projector silently falls back to
   * the imperative descriptor path even if a template is otherwise
   * available. Mirrors the aggregator projector's same-name opt.
   */
  readonly viewContainerRef?: ViewContainerRef;
  /**
   * Optional reactive label of the rollback origin — feeds the
   * slot context's `originLabel` field. Read inside `untracked()`
   * during the apply path; the `descriptorText` re-fire effect
   * destroys + remounts the embedded view so the value picked up
   * from this signal is always the value at fire time.
   */
  readonly originLabel?: Signal<string | undefined>;
}

/**
 * Mounts the sticky-rejection decoration projector. The class plus a
 * hidden `aria-describedby`-linked descriptor span follow
 * `failedHandleId` reactively; cleared on directive destroy.
 * Single-target by contract (matches the presenter's single-slot
 * `lastFailedIndex` shape).
 *
 * `aria-describedby` token-list append mirrors the aggregator
 * projector — consumer-supplied tokens are preserved across decorate
 * / clear cycles. Two effects: one tracks `failedHandleId` and
 * mounts/unmounts the span; the other tracks `descriptorText` and
 * mutates the live span's `textContent` in place. The split keeps
 * text updates O(1) (no DOM rebuild) when the descriptor phrase
 * resolves later than the trigger flag — typical when the origin
 * label arrives via a downstream `tabs()` re-emission.
 *
 * @internal
 */
export function createMatTabRejectionDecoration(
  opts: CngxMatTabRejectionDecorationOptions,
): void {
  const buttonSelector = opts.buttonSelector ?? '.mat-mdc-tab';
  const className = opts.className ?? 'cngx-mat-tab--error';
  const srOnlyClassName = opts.srOnlyClassName ?? 'cngx-sr-only';
  const descriptorIdSuffix = opts.descriptorIdSuffix ?? 'rejected';
  // Slot path requires both a template signal AND a view container —
  // either alone falls back to the imperative descriptor write so the
  // contract degrades gracefully when consumers wire only one half.
  // Mirrors the aggregator projector's slot wiring; the rejection
  // projector currently has no half-wired diagnostic sink (single
  // in-package consumer is `[cngxMatTabs]` which always passes both
  // when projecting `*cngxMatTabRejectionContent`).
  const slotEnabled = !!opts.contentTemplate && !!opts.viewContainerRef;
  let decoratedEl: HTMLElement | null = null;
  // The descriptor span is created lazily on first apply and retained
  // across the projector's lifetime — detached on clear, reattached on
  // next apply, never recreated. Reusing the JS element avoids two
  // `createElement` allocations per A→B→A flip and lets AT readers /
  // animation observers that hold a reference to the node keep it
  // pointing at a live DOM object even though the parent button and
  // the `id` attribute change between flips. The element is GC'd when
  // the projector's closure dies on directive destroy.
  let cachedSpan: HTMLElement | null = null;
  let priorAriaDescribedby: string | null = null;
  // Slot tracks the id whose decoration is currently mounted (or
  // `null` when cleared). Used by the apply effect below to
  // short-circuit on structurally-identical re-emissions of
  // `failedHandleId` — Pillar 1: every signal-driven side effect
  // must be a no-op when its observable input has not meaningfully
  // changed. Without this slot, a `tabs()`-driven re-eval that
  // returns the same id forces a `clearDecoration` + `applyDecorationAt`
  // round-trip, mid-flight clobbering AT readers and adding O(n)
  // DOM work per tab-list churn.
  let lastAppliedId: string | null = null;
  let embeddedView:
    | EmbeddedViewRef<CngxMatTabRejectionContentContext>
    | undefined;

  const destroyEmbeddedView = (): void => {
    if (!embeddedView) {
      return;
    }
    embeddedView.destroy();
    embeddedView = undefined;
    if (cachedSpan) {
      while (cachedSpan.firstChild) {
        opts.renderer.removeChild(cachedSpan, cachedSpan.firstChild);
      }
    }
  };

  const writeDescriptorContent = (
    span: HTMLElement,
    handleId: string,
    text: string,
  ): void => {
    const tplSignal = opts.contentTemplate;
    const vcr = opts.viewContainerRef;
    const tpl = tplSignal && vcr ? tplSignal() : null;
    if (tpl && vcr) {
      destroyEmbeddedView();
      const context: CngxMatTabRejectionContentContext = {
        failedHandleId: handleId,
        originLabel: opts.originLabel?.(),
        fallbackText: text,
      };
      const view = vcr.createEmbeddedView(tpl, context, {
        injector: opts.injector,
      });
      // Force CD on the embedded view immediately — the view is
      // about to be detached from the host's CD tree (we move its
      // rootNodes under an SR-only span via Renderer2; the span is
      // not part of the embedded view's logical parent), so the
      // initial bindings would otherwise wait for the next host CD
      // pass to evaluate. SR-only content + zoneless / OnPush
      // scheduling makes the CD wait observable as stale text on
      // first read.
      view.detectChanges();
      for (const node of view.rootNodes) {
        opts.renderer.appendChild(span, node);
      }
      embeddedView = view;
      return;
    }
    // Imperative fallback — also covers the path where a slot was
    // previously bound and is now removed (destroy any prior view).
    destroyEmbeddedView();
    opts.renderer.setProperty(span, 'textContent', text);
  };

  const clearDecoration = (): void => {
    if (!decoratedEl || !cachedSpan) {
      return;
    }
    const ownTokenId = cachedSpan.id;
    destroyEmbeddedView();
    opts.renderer.removeClass(decoratedEl, className);
    opts.renderer.removeChild(decoratedEl, cachedSpan);
    // `cachedSpan` deliberately retained — reused on the next apply.
    restoreAriaDescribedbyExceptToken(
      decoratedEl,
      ownTokenId,
      opts.renderer,
      priorAriaDescribedby,
    );
    decoratedEl = null;
    priorAriaDescribedby = null;
  };

  const applyDecorationAt = (failedIdx: number, handleId: string): void => {
    clearDecoration();
    const buttons = opts.hostEl.querySelectorAll<HTMLElement>(buttonSelector);
    const targetEl = buttons.item(failedIdx);
    if (!targetEl) {
      return;
    }
    opts.renderer.addClass(targetEl, className);

    const spanId = `${handleId}-${descriptorIdSuffix}`;
    let span = cachedSpan;
    if (!span) {
      span = opts.renderer.createElement('span') as HTMLElement;
      opts.renderer.addClass(span, srOnlyClassName);
      cachedSpan = span;
    }
    // Always rewrite id + textContent — the same element serves every
    // mount across the projector's lifetime, so prior values are stale
    // by definition. The live-text effect below picks up subsequent
    // `descriptorText` changes without recreating the span.
    opts.renderer.setAttribute(span, 'id', spanId);
    // Initial content read inside `untracked()` (the caller wraps the
    // whole apply path); the live-text effect below picks up
    // subsequent changes. Slot path renders the embedded view; the
    // imperative path writes textContent — both go through
    // `writeDescriptorContent`.
    opts.renderer.appendChild(targetEl, span);
    writeDescriptorContent(span, handleId, opts.descriptorText());

    // Renderer2 exposes `setAttribute`/`removeAttribute` only — there is
    // no read counterpart, so attribute reads go through the native
    // element. Browser-only context here (the projector decorates
    // Material-rendered DOM); SSR adoption would require a platform-
    // aware adapter on top of this read.
    const prior = targetEl.getAttribute('aria-describedby');
    const tokens = prior ? prior.split(/\s+/).filter(Boolean) : [];
    if (!tokens.includes(spanId)) {
      tokens.push(spanId);
    }
    opts.renderer.setAttribute(targetEl, 'aria-describedby', tokens.join(' '));

    decoratedEl = targetEl;
    priorAriaDescribedby = prior;
  };

  runInInjectionContext(opts.injector, () => {
    effect(() => {
      const id = opts.failedHandleId();
      untracked(() => {
        if (id === lastAppliedId) {
          return;
        }
        if (id === null) {
          clearDecoration();
          lastAppliedId = null;
          return;
        }
        const idx = opts.failedIndex();
        if (idx === undefined) {
          clearDecoration();
          lastAppliedId = null;
          return;
        }
        applyDecorationAt(idx, id);
        lastAppliedId = id;
      });
    });

    // Live-text effect — tracks `descriptorText` (and the slot
    // template when slotEnabled, so a lazy / late mount of the
    // template re-renders into the existing decorated span). The
    // attached/detached state is non-signal; both reads live inside
    // `untracked()` (they are check, not dependency). Updates fire
    // only when the cached span is currently mounted (`decoratedEl`
    // non-null) — otherwise the next apply path will write the
    // current text via `writeDescriptorContent` before re-attaching,
    // so a detached-span text update would be redundant.
    effect(() => {
      const text = opts.descriptorText();
      const tplSignal = opts.contentTemplate;
      if (slotEnabled && tplSignal) {
        tplSignal();
      }
      untracked(() => {
        if (decoratedEl === null || cachedSpan === null) {
          return;
        }
        const id = opts.failedHandleId();
        if (id === null) {
          return;
        }
        writeDescriptorContent(cachedSpan, id, text);
      });
    });
  });

  opts.destroyRef.onDestroy(clearDecoration);
}

/**
 * One per-tab error-aggregator decoration entry — caller filters
 * handles whose aggregator wants reveal (`shouldShow() === true`)
 * before passing the list to the factory.
 *
 * `count` and `label` feed the optional
 * `*cngxMatTabAggregatorContent` slot template's typed context
 * ({@link CngxMatTabAggregatorContentContext}). When no slot is
 * bound, the projector falls back to writing `announcement` into
 * the descriptor span verbatim and the two extra fields are unused;
 * carrying them on the entry shape keeps the public contract
 * uniform regardless of which render path the consumer activates.
 */
export interface CngxMatTabAggregatorErrorEntry {
  readonly idx: number;
  readonly id: string;
  readonly announcement: string;
  /** Aggregated error count — feeds the slot context's `count` field. */
  readonly count: number;
  /** Resolved tab label — feeds the slot context's `label` field. */
  readonly label: string;
}

/**
 * Options for {@link createMatTabAggregatorDecoration}.
 */
export interface CngxMatTabAggregatorDecorationOptions {
  readonly hostEl: HTMLElement;
  /**
   * Reactive list of tabs whose bound aggregator wants reveal.
   * Caller pre-filters; factory consumes the list as the effect's
   * primary trigger.
   */
  readonly errorTabs: Signal<readonly CngxMatTabAggregatorErrorEntry[]>;
  readonly renderer: Renderer2;
  readonly injector: Injector;
  readonly destroyRef: DestroyRef;
  /** Default: `.mat-mdc-tab`. Override only for testing. */
  readonly buttonSelector?: string;
  /** Default: `cngx-mat-tab--has-errors`. */
  readonly className?: string;
  /** Default: `cngx-sr-only`. */
  readonly srOnlyClassName?: string;
  /** Default: `5`. Cap on `afterNextRender` retry recursion. */
  readonly maxRetryAttempts?: number;
  /**
   * Optional dev-mode sink invoked when the retry ceiling is hit.
   * Defaults to a `console.warn` gated on `ngDevMode`.
   */
  readonly onMaxRetriesReached?: () => void;
  /**
   * Reactive slot for the optional `*cngxMatTabAggregatorContent`
   * template. When the signal returns a non-null `TemplateRef`, the
   * projector renders an embedded view of it into the SR descriptor
   * span and updates / destroys the view on every state change.
   * When `null`, the projector falls back to the imperative
   * `setProperty(textContent, announcement)` path — same shape the
   * pre-Phase-4 contract shipped with.
   */
  readonly contentTemplate?: Signal<
    TemplateRef<CngxMatTabAggregatorContentContext> | null
  >;
  /**
   * View container ref used to instantiate embedded views from
   * `contentTemplate`. Required only when `contentTemplate` is
   * supplied — when omitted, the projector silently falls back to
   * the imperative descriptor path even if a template is otherwise
   * available.
   */
  readonly viewContainerRef?: ViewContainerRef;
  /**
   * Diagnostic sink invoked when exactly one of `contentTemplate` /
   * `viewContainerRef` is supplied (the half-wired-slot
   * misconfiguration). Fires unconditionally — the projector itself
   * is mode-agnostic; the production-vs-dev gate lives in whichever
   * sink the caller passes. The `[cngxMatTabs]` directive resolves
   * this from `provideMatTabsConfig(withHalfWiredSlotSink(fn))`;
   * the library default is a dev-mode `console.warn`. Direct
   * callers of this factory who skip the directive may pass any
   * sink they like; omitting falls back to a dev-mode warn so
   * historical behaviour is preserved.
   */
  readonly onHalfWiredSlot?: (
    missing: 'contentTemplate' | 'viewContainerRef',
  ) => void;
}

/**
 * Mounts the per-tab aggregator decoration projector. Class +
 * descriptor span + `aria-describedby` token follow `errorTabs`
 * reactively; pruned on every effect re-fire that drops a handle
 * from the list and on directive destroy.
 *
 * Race recovery: when the effect fires before Material's
 * `<MatTabHeader>` has rendered the matching buttons (initial-render
 * race after consumer-bound aggregators flip `shouldShow=true`),
 * the factory schedules a single `afterNextRender` retry. Bounded
 * by `maxRetryAttempts` so a pathological Material render-stall
 * does not re-arm indefinitely.
 *
 * @internal
 */
export function createMatTabAggregatorDecoration(
  opts: CngxMatTabAggregatorDecorationOptions,
): void {
  const buttonSelector = opts.buttonSelector ?? '.mat-mdc-tab';
  const className = opts.className ?? 'cngx-mat-tab--has-errors';
  const srOnlyClassName = opts.srOnlyClassName ?? 'cngx-sr-only';
  const maxRetryAttempts = opts.maxRetryAttempts ?? 5;
  // Slot path requires both a template signal AND a view container —
  // either alone falls back to the imperative descriptor write so the
  // contract degrades gracefully when consumers wire only one half.
  // The half-wired-slot misconfiguration check fires once at
  // construction (captures the initial wiring shape); the per-fire
  // re-evaluation lives inline in the effect body below so a
  // lazy-mounted slot template (`*ngIf` / `@defer` /
  // `*ngTemplateOutlet`) gets picked up the first time it materialises.
  const isFullyWired = (): boolean =>
    !!opts.contentTemplate && !!opts.viewContainerRef;
  // Surface the half-wired-slot misconfiguration in dev-mode — the
  // graceful degradation above hides the mistake at runtime, so the
  // signal has to come from a deliberate diagnostic.
  if (!isFullyWired() && (opts.contentTemplate || opts.viewContainerRef)) {
    const missing: 'contentTemplate' | 'viewContainerRef' =
      opts.contentTemplate ? 'viewContainerRef' : 'contentTemplate';
    const sink = opts.onHalfWiredSlot ?? defaultHalfWiredSlotWarn;
    sink(missing);
  }

  const decorated = new Map<
    string,
    {
      el: HTMLElement;
      descriptorSpan: HTMLElement;
      priorAriaDescribedby: string | null;
      /**
       * Embedded view rendered from `contentTemplate` when bound.
       * Owned by the entry so re-decorations can destroy the prior
       * view before mounting a fresh one (every signal-driven
       * context update goes through destroy + remount; embedded
       * views do not expose a context-mutation API in the
       * standalone-component world that doesn't risk stale
       * `let-` bindings).
       */
      embeddedView?: EmbeddedViewRef<CngxMatTabAggregatorContentContext>;
    }
  >();
  let pendingRetry = false;
  let retryAttempts = 0;

  const destroyEmbeddedView = (entry: {
    descriptorSpan: HTMLElement;
    embeddedView?: EmbeddedViewRef<CngxMatTabAggregatorContentContext>;
  }): void => {
    if (!entry.embeddedView) {
      return;
    }
    entry.embeddedView.destroy();
    entry.embeddedView = undefined;
    // The rendered nodes live under the descriptor span via appendChild;
    // EmbeddedViewRef.destroy() does not detach them, so clear manually.
    while (entry.descriptorSpan.firstChild) {
      opts.renderer.removeChild(
        entry.descriptorSpan,
        entry.descriptorSpan.firstChild,
      );
    }
  };

  const writeDescriptorContent = (
    entry: {
      descriptorSpan: HTMLElement;
      embeddedView?: EmbeddedViewRef<CngxMatTabAggregatorContentContext>;
    },
    announcement: string,
    context: CngxMatTabAggregatorContentContext,
  ): void => {
    const tplSignal = opts.contentTemplate;
    const vcr = opts.viewContainerRef;
    const tpl = tplSignal && vcr ? tplSignal() : null;
    if (tpl && vcr) {
      destroyEmbeddedView(entry);
      const view = vcr.createEmbeddedView(tpl, context, {
        injector: opts.injector,
      });
      view.detectChanges();
      for (const node of view.rootNodes) {
        opts.renderer.appendChild(entry.descriptorSpan, node);
      }
      entry.embeddedView = view;
      return;
    }
    // Imperative fallback — also covers the path where a slot was
    // previously bound and is now removed (destroy any prior view).
    destroyEmbeddedView(entry);
    opts.renderer.setProperty(
      entry.descriptorSpan,
      'textContent',
      announcement,
    );
  };

  const removeDecoration = (id: string): void => {
    const entry = decorated.get(id);
    if (!entry) {
      return;
    }
    const ownTokenId = entry.descriptorSpan.id;
    destroyEmbeddedView(entry);
    opts.renderer.removeClass(entry.el, className);
    opts.renderer.removeChild(entry.el, entry.descriptorSpan);
    restoreAriaDescribedbyExceptToken(
      entry.el,
      ownTokenId,
      opts.renderer,
      entry.priorAriaDescribedby,
    );
    decorated.delete(id);
  };

  const applyDecoration = (
    targetEl: HTMLElement,
    entry: CngxMatTabAggregatorErrorEntry,
  ): void => {
    opts.renderer.addClass(targetEl, className);

    const spanId = `${entry.id}-errors`;
    const descriptorSpan = opts.renderer.createElement('span') as HTMLElement;
    opts.renderer.addClass(descriptorSpan, srOnlyClassName);
    opts.renderer.setAttribute(descriptorSpan, 'id', spanId);
    opts.renderer.appendChild(targetEl, descriptorSpan);

    // See the read-via-nativeElement note in `applyDecorationAt` above —
    // Renderer2 has no `getAttribute` counterpart, so attribute reads
    // go through the native element directly.
    const priorAriaDescribedby = targetEl.getAttribute('aria-describedby');
    const tokens = priorAriaDescribedby
      ? priorAriaDescribedby.split(/\s+/).filter(Boolean)
      : [];
    if (!tokens.includes(spanId)) {
      tokens.push(spanId);
    }
    opts.renderer.setAttribute(targetEl, 'aria-describedby', tokens.join(' '));

    const decoratedEntry: {
      el: HTMLElement;
      descriptorSpan: HTMLElement;
      priorAriaDescribedby: string | null;
      embeddedView?: EmbeddedViewRef<CngxMatTabAggregatorContentContext>;
    } = { el: targetEl, descriptorSpan, priorAriaDescribedby };
    writeDescriptorContent(decoratedEntry, entry.announcement, {
      count: entry.count,
      label: entry.label,
      announcement: entry.announcement,
    });
    decorated.set(entry.id, decoratedEntry);
  };

  const sync = (
    errorTabs: readonly CngxMatTabAggregatorErrorEntry[],
  ): void => {
    const liveIds = new Set<string>();
    for (const t of errorTabs) {
      liveIds.add(t.id);
    }
    for (const id of Array.from(decorated.keys())) {
      if (!liveIds.has(id)) {
        removeDecoration(id);
      }
    }
    const buttons = opts.hostEl.querySelectorAll<HTMLElement>(buttonSelector);
    let needsRetry = false;
    for (const entry of errorTabs) {
      const targetEl = buttons.item(entry.idx);
      if (!targetEl) {
        needsRetry = true;
        continue;
      }
      const existing = decorated.get(entry.id);
      if (existing?.el === targetEl) {
        // Same target element: refresh content (slot path destroys +
        // remounts the embedded view; imperative path overwrites the
        // textContent property idempotently).
        writeDescriptorContent(existing, entry.announcement, {
          count: entry.count,
          label: entry.label,
          announcement: entry.announcement,
        });
        continue;
      }
      if (existing) {
        removeDecoration(entry.id);
      }
      applyDecoration(targetEl, entry);
    }

    if (!needsRetry) {
      retryAttempts = 0;
      return;
    }
    if (pendingRetry) {
      return;
    }
    if (retryAttempts >= maxRetryAttempts) {
      retryAttempts = 0;
      const sink =
        opts.onMaxRetriesReached ?? defaultRetryCeilingWarn(maxRetryAttempts);
      sink();
      return;
    }
    pendingRetry = true;
    retryAttempts++;
    afterNextRender(
      () => {
        pendingRetry = false;
        sync(opts.errorTabs());
      },
      { injector: opts.injector },
    );
  };

  runInInjectionContext(opts.injector, () => {
    effect(() => {
      // Track BOTH the error-tabs list AND the slot template — when
      // the consumer projects / removes a `*cngxMatTabAggregatorContent`
      // template at runtime, every decorated entry needs to switch
      // render paths (embedded view ↔ imperative span). Reading the
      // signal here registers it as a primary trigger; the actual
      // re-application logic stays inside `untracked()` so the sync
      // body can freely read other signals without registering them.
      //
      // `isFullyWired()` is recomputed per fire so a lazily-mounted
      // slot template gets picked up the first time both opts appear.
      // (The directive's case has both opts present at construction;
      // the per-fire re-eval is defensive against direct factory
      // callers and forward-compatible with shape changes.)
      const errorTabs = opts.errorTabs();
      if (isFullyWired() && opts.contentTemplate) {
        opts.contentTemplate();
      }
      untracked(() => sync(errorTabs));
    });
  });

  opts.destroyRef.onDestroy(() => {
    for (const id of Array.from(decorated.keys())) {
      removeDecoration(id);
    }
  });
}

function defaultHalfWiredSlotWarn(
  missing: 'contentTemplate' | 'viewContainerRef',
): void {
  if (!isDevMode()) {
    return;
  }
  console.warn(
    '[cngxMatTabs] aggregator-content slot half-wired — ' +
      `\`${missing}\` is missing while the other half is supplied. ` +
      'The decoration projector will silently fall back to the ' +
      'imperative `textContent` path, and the consumer-projected ' +
      '`*cngxMatTabAggregatorContent` template will never render. ' +
      'Wire both halves on the [cngxMatTabs] directive (or neither).',
  );
}

function defaultRetryCeilingWarn(max: number): () => void {
  return () => {
    if (!isDevMode()) {
      return;
    }
    console.warn(
      '[cngxMatTabs] aggregator decoration retry ceiling reached ' +
        `(${max} attempts) — MatTabHeader did not render ` +
        '`.mat-mdc-tab` buttons within the expected window. Likely ' +
        'cause: Material upgrade broke the `.mat-mdc-tab` selector ' +
        'contract or a consumer-side render stall. ' +
        'Bound aggregators may remain visually undecorated ' +
        'until the next state change.',
    );
  };
}
