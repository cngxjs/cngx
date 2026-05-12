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
import { MaterialPrivateSurfaces } from '../material-bridge/private-surfaces';

/**
 * Package-private DOM-mutation projectors for `[cngxMatTabs]`.
 *
 * - {@link createMatTabRejectionDecoration} — mirrors
 *   `presenter.lastFailedIndex` onto the matching `.mat-mdc-tab` as a
 *   class flag plus a hidden `cngx-sr-only` descriptor span linked via
 *   `aria-describedby`. `aria-invalid` is intentionally absent: ARIA
 *   1.2 scopes it to form-field vocabulary, not `role="tab"`.
 * - {@link createMatTabAggregatorDecoration} — projects each handle's
 *   `shouldShow()` flag onto the matching button as a class +
 *   descriptor span pair, same `aria-describedby` token-append pattern.
 *
 * Distinct descriptor-id suffixes (`-rejected` vs `-errors`) let both
 * projectors stack on the same target without collision; the shared
 * token-list append preserves consumer-supplied tokens.
 *
 * Index-based DOM lookup tracks `tabs-accepted-debt §5`.
 *
 * @internal package-private — consumers bind `[cngxMatTabError]` on
 * each `<mat-tab>`; the directive owns the projection mechanics.
 */

/**
 * Diff-restore the `aria-describedby` token list after a decoration's
 * descriptor span detaches — drops the decoration's own id token from
 * the live attribute, leaving any third-party tokens written between
 * apply and clear (tooltip refs, Material's own runtime additions)
 * intact. Treats the attribute as a token-set per the cngx ARIA-by-value
 * rule, not as a single-owner string.
 *
 * Empty-result + originally-absent attribute removes the attribute
 * entirely — a dangling `aria-describedby=""` would be a malformed
 * reference in some AT readers.
 *
 * @internal
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
   * Stable id of the currently-failed target, or `null` when no
   * rejection is pinned. Sole effect-trigger; the descriptor span's
   * DOM id is `${failedHandleId}-rejected`.
   */
  readonly failedHandleId: Signal<string | null>;
  /**
   * Index of the currently-failed target — `undefined` when no
   * rejection is pinned. Read inside `untracked()` after
   * `failedHandleId` fires.
   */
  readonly failedIndex: Signal<number | undefined>;
  /**
   * Reactive descriptor phrase for the SR-only span. Typical
   * resolution at the caller: i18n `commitRolledBackTo(originLabel)`
   * when origin resolves, `commitFailedRetry` otherwise. A separate
   * effect tracks this signal so late label resolution mutates the
   * span in place rather than rebuilding it. Empty string keeps the
   * span mounted — `aria-describedby` must never dangle.
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
   * Suffix appended to `failedHandleId` for the descriptor span's
   * DOM id. Default `'rejected'` — distinct from the aggregator
   * projector's `'errors'` so both can stack on the same target.
   */
  readonly descriptorIdSuffix?: string;
  /**
   * Optional `*cngxMatTabRejectionContent` slot template. When
   * non-null AND `viewContainerRef` is supplied, the projector
   * renders an embedded view into the SR span; otherwise it falls
   * back to the imperative `textContent` path.
   */
  readonly contentTemplate?: Signal<
    TemplateRef<CngxMatTabRejectionContentContext> | null
  >;
  /**
   * Required half of the slot path. Without it, the projector
   * silently degrades to the imperative descriptor path. Mirrors
   * the aggregator projector's same-name opt.
   */
  readonly viewContainerRef?: ViewContainerRef;
  /**
   * Reactive origin label feeding the slot context's `originLabel`.
   * Read inside `untracked()` during apply; the `descriptorText`
   * re-fire effect destroys + remounts the embedded view, so the
   * value is always read at fire time.
   */
  readonly originLabel?: Signal<string | undefined>;
}

/**
 * Mounts the sticky-rejection decoration projector. Class +
 * descriptor span follow `failedHandleId` reactively; cleared on
 * directive destroy. Single-target by contract (matches the
 * presenter's single-slot `lastFailedIndex`).
 *
 * Two effects split the work: one tracks `failedHandleId` and
 * mounts/unmounts the span; the other tracks `descriptorText` and
 * mutates `textContent` in place. The split keeps late label
 * resolution O(1) — no DOM rebuild when the origin label arrives
 * via a downstream `tabs()` re-emission.
 *
 * @internal
 */
export function createMatTabRejectionDecoration(
  opts: CngxMatTabRejectionDecorationOptions,
): void {
  const buttonSelector =
    opts.buttonSelector ?? MaterialPrivateSurfaces.MAT_MDC_TAB_SELECTOR;
  const className = opts.className ?? 'cngx-mat-tab--error';
  const srOnlyClassName = opts.srOnlyClassName ?? 'cngx-sr-only';
  const descriptorIdSuffix = opts.descriptorIdSuffix ?? 'rejected';
  // Slot path needs both halves; either alone degrades to imperative
  // textContent. No diagnostic — single in-package consumer always
  // passes both.
  const slotEnabled = !!opts.contentTemplate && !!opts.viewContainerRef;
  let decoratedEl: HTMLElement | null = null;
  // Cached across the projector's lifetime — reusing the same node
  // keeps AT-reader / observer references live across A→B→A flips.
  let cachedSpan: HTMLElement | null = null;
  let priorAriaDescribedby: string | null = null;
  // Pillar 1 — short-circuits structurally-identical re-emissions of
  // `failedHandleId` so a `tabs()` re-eval doesn't clobber the AT
  // descriptor mid-flight.
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
      // Force CD before moving rootNodes out of the embedded view's
      // logical parent — zoneless + OnPush would otherwise leave the
      // first SR read stale.
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
    // Always rewrite id + textContent — the cached span carries stale
    // values from the prior mount. The live-text effect below picks
    // up subsequent `descriptorText` changes in place.
    opts.renderer.setAttribute(span, 'id', spanId);
    opts.renderer.appendChild(targetEl, span);
    writeDescriptorContent(span, handleId, opts.descriptorText());

    // Renderer2 has no `getAttribute` counterpart — read off the
    // native element. Browser-only; SSR would need a platform adapter.
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

    // Live-text effect — tracks `descriptorText` plus the slot
    // template (when wired) so a late-mounted template re-renders
    // into the existing span. Mount-state checks live in untracked.
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
 * One per-tab error-aggregator decoration entry. Caller pre-filters
 * to handles whose `shouldShow() === true`.
 *
 * `count` / `label` feed the optional `*cngxMatTabAggregatorContent`
 * slot context ({@link CngxMatTabAggregatorContentContext}); the
 * imperative-fallback path uses `announcement` only and ignores the
 * two extra fields. They stay on the shape so the contract is
 * uniform across render paths.
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
   * Reactive list of tabs whose bound aggregator wants reveal —
   * caller pre-filters; sole effect-trigger.
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
   * Optional `*cngxMatTabAggregatorContent` template. When non-null
   * AND `viewContainerRef` is supplied, the projector renders an
   * embedded view per entry; otherwise it falls back to the
   * imperative `textContent` path.
   */
  readonly contentTemplate?: Signal<
    TemplateRef<CngxMatTabAggregatorContentContext> | null
  >;
  /**
   * Required half of the slot path. Without it, the projector
   * silently degrades to the imperative descriptor path.
   */
  readonly viewContainerRef?: ViewContainerRef;
  /**
   * Sink fired when exactly one of `contentTemplate` /
   * `viewContainerRef` is supplied — the projector is mode-agnostic
   * so the dev-vs-prod gate lives in whichever sink the caller
   * passes. `[cngxMatTabs]` resolves this from
   * `provideMatTabsConfig(withHalfWiredSlotSink(fn))`; the default
   * is a dev-mode `console.warn`.
   */
  readonly onHalfWiredSlot?: (
    missing: 'contentTemplate' | 'viewContainerRef',
  ) => void;
}

/**
 * Mounts the per-tab aggregator decoration projector. Class +
 * descriptor span + `aria-describedby` token follow `errorTabs`
 * reactively; pruned on entry drop and on directive destroy.
 *
 * Race recovery — when the effect fires before MatTabHeader has
 * rendered the matching buttons (initial-render race), schedules a
 * single `afterNextRender` retry, bounded by `maxRetryAttempts`.
 *
 * @internal
 */
export function createMatTabAggregatorDecoration(
  opts: CngxMatTabAggregatorDecorationOptions,
): void {
  const buttonSelector =
    opts.buttonSelector ?? MaterialPrivateSurfaces.MAT_MDC_TAB_SELECTOR;
  const className = opts.className ?? 'cngx-mat-tab--has-errors';
  const srOnlyClassName = opts.srOnlyClassName ?? 'cngx-sr-only';
  const maxRetryAttempts = opts.maxRetryAttempts ?? 5;
  // Slot path needs both halves; either alone degrades to imperative
  // textContent. Re-evaluated per fire so a lazy-mounted template
  // (`*ngIf` / `@defer`) picks up on first materialisation.
  const isFullyWired = (): boolean =>
    !!opts.contentTemplate && !!opts.viewContainerRef;
  // Half-wired diagnostic — graceful degradation hides the mistake
  // at runtime, so the signal has to come from a deliberate sink.
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
      // See the rejection projector's identical call site for the
      // detached-view CD rationale (rootNodes move out of the
      // embedded view's logical parent into an SR-only span).
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
      // Track the slot template alongside `errorTabs` so a runtime
      // project/remove of `*cngxMatTabAggregatorContent` switches
      // every decorated entry between render paths.
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
