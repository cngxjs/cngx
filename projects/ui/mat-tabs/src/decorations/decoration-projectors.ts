import {
  afterNextRender,
  type DestroyRef,
  effect,
  type EmbeddedViewRef,
  type Injector,
  type Renderer2,
  runInInjectionContext,
  type Signal,
  type TemplateRef,
  untracked,
  type ViewContainerRef,
} from '@angular/core';

import type { CngxMatTabAggregatorContentContext } from './mat-tab-aggregator-content.directive';

/**
 * Package-private DOM-mutation projectors for `[cngxMatTabs]`.
 *
 * Two separate effects on the same host element project orthogonal
 * state surfaces onto Material's rendered tab buttons:
 *
 * - {@link createMatTabRejectionDecoration} mirrors
 *   `presenter.lastFailedIndex` onto the matching `.mat-mdc-tab` as a
 *   class flag + `aria-invalid="true"`.
 * - {@link createMatTabAggregatorDecoration} projects each handle's
 *   per-tab error-aggregator `shouldShow()` flag onto the matching
 *   button as a `cngx-mat-tab--has-errors` class plus an
 *   `<span class="cngx-sr-only">` descriptor + `aria-describedby`
 *   token append.
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
 * Options for {@link createMatTabRejectionDecoration}.
 */
export interface CngxMatTabRejectionDecorationOptions {
  /** Host element whose subtree contains the `.mat-mdc-tab` buttons. */
  readonly hostEl: HTMLElement;
  /**
   * Stable id of the currently-failed target — `null` when no
   * rejection is pinned. The factory's `effect()` tracks ONLY this
   * computed; the index-based DOM lookup happens inside `untracked()`
   * after the trigger fires.
   */
  readonly failedHandleId: Signal<string | null>;
  /**
   * Index of the currently-failed target — `undefined` when no
   * rejection is pinned. Read inside `untracked()` after
   * `failedHandleId` triggers.
   */
  readonly failedIndex: Signal<number | undefined>;
  readonly renderer: Renderer2;
  readonly injector: Injector;
  readonly destroyRef: DestroyRef;
  /** Default: `.mat-mdc-tab`. Override only for testing. */
  readonly buttonSelector?: string;
  /** Default: `cngx-mat-tab--error`. */
  readonly className?: string;
}

/**
 * Mounts the sticky-rejection decoration projector. The class +
 * `aria-invalid` follow `failedHandleId` reactively; cleared on
 * directive destroy. Single-target by contract (matches the
 * presenter's single-slot `lastFailedIndex` shape).
 *
 * @internal
 */
export function createMatTabRejectionDecoration(
  opts: CngxMatTabRejectionDecorationOptions,
): void {
  const buttonSelector = opts.buttonSelector ?? '.mat-mdc-tab';
  const className = opts.className ?? 'cngx-mat-tab--error';
  let decoratedEl: HTMLElement | null = null;

  const clearDecoration = (): void => {
    if (!decoratedEl) {
      return;
    }
    opts.renderer.removeClass(decoratedEl, className);
    opts.renderer.removeAttribute(decoratedEl, 'aria-invalid');
    decoratedEl = null;
  };

  const applyDecorationAt = (failedIdx: number): void => {
    clearDecoration();
    const buttons = opts.hostEl.querySelectorAll<HTMLElement>(buttonSelector);
    const targetEl = buttons.item(failedIdx);
    if (!targetEl) {
      return;
    }
    opts.renderer.addClass(targetEl, className);
    opts.renderer.setAttribute(targetEl, 'aria-invalid', 'true');
    decoratedEl = targetEl;
  };

  runInInjectionContext(opts.injector, () => {
    effect(() => {
      const id = opts.failedHandleId();
      untracked(() => {
        if (id === null) {
          clearDecoration();
          return;
        }
        const idx = opts.failedIndex();
        if (idx === undefined) {
          clearDecoration();
          return;
        }
        applyDecorationAt(idx);
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
   * Optional dev-mode sink invoked when exactly one of
   * `contentTemplate` / `viewContainerRef` is supplied (the
   * half-wired-slot misconfiguration). Defaults to a
   * `console.warn` gated on `ngDevMode`. Override only for testing
   * — in production the default is what reaches developers.
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
  const slotEnabled = !!opts.contentTemplate && !!opts.viewContainerRef;
  // Surface the half-wired-slot misconfiguration in dev-mode — the
  // graceful degradation above hides the mistake at runtime, so the
  // signal has to come from a deliberate diagnostic. Mirrors the
  // `onMaxRetriesReached` precedent below: optional injectable sink,
  // default `ngDevMode`-gated `console.warn`.
  if (!slotEnabled && (opts.contentTemplate || opts.viewContainerRef)) {
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
    // Embedded view destruction does not implicitly empty the
    // descriptor span — the rendered nodes were appended to it via
    // appendChild. Clear here so a subsequent imperative-fallback
    // write (or a fresh mount) starts from a clean slate.
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
    destroyEmbeddedView(entry);
    opts.renderer.removeClass(entry.el, className);
    opts.renderer.removeChild(entry.el, entry.descriptorSpan);
    if (entry.priorAriaDescribedby === null) {
      opts.renderer.removeAttribute(entry.el, 'aria-describedby');
    } else {
      opts.renderer.setAttribute(
        entry.el,
        'aria-describedby',
        entry.priorAriaDescribedby,
      );
    }
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
      const errorTabs = opts.errorTabs();
      const tplSignal = opts.contentTemplate;
      if (slotEnabled && tplSignal) {
        tplSignal();
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
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    console.warn(
      '[cngxMatTabs] aggregator-content slot half-wired — ' +
        `\`${missing}\` is missing while the other half is supplied. ` +
        'The decoration projector will silently fall back to the ' +
        'imperative `textContent` path, and the consumer-projected ' +
        '`*cngxMatTabAggregatorContent` template will never render. ' +
        'Wire both halves on the [cngxMatTabs] directive (or neither).',
    );
  }
}

function defaultRetryCeilingWarn(max: number): () => void {
  return () => {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn(
        '[cngxMatTabs] aggregator decoration retry ceiling reached ' +
        `(${max} attempts) — MatTabHeader did not render ` +
        '`.mat-mdc-tab` buttons within the expected window. Likely ' +
        'cause: Material upgrade broke the `.mat-mdc-tab` selector ' +
        'contract or a consumer-side render stall. ' +
        'Bound aggregators may remain visually undecorated ' +
        'until the next state change.',
      );
    }
  };
}
