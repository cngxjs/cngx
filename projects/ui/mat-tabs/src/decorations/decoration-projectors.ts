import {
  afterNextRender,
  type DestroyRef,
  effect,
  type Injector,
  type Renderer2,
  runInInjectionContext,
  type Signal,
  untracked,
} from '@angular/core';

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
 */
export interface CngxMatTabAggregatorErrorEntry {
  readonly idx: number;
  readonly id: string;
  readonly announcement: string;
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

  const decorated = new Map<
    string,
    {
      el: HTMLElement;
      descriptorSpan: HTMLElement;
      priorAriaDescribedby: string | null;
    }
  >();
  let pendingRetry = false;
  let retryAttempts = 0;

  const removeDecoration = (id: string): void => {
    const entry = decorated.get(id);
    if (!entry) {
      return;
    }
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
    id: string,
    announcement: string,
  ): void => {
    opts.renderer.addClass(targetEl, className);

    const spanId = `${id}-errors`;
    const descriptorSpan = opts.renderer.createElement('span') as HTMLElement;
    opts.renderer.addClass(descriptorSpan, srOnlyClassName);
    opts.renderer.setAttribute(descriptorSpan, 'id', spanId);
    opts.renderer.setProperty(descriptorSpan, 'textContent', announcement);
    opts.renderer.appendChild(targetEl, descriptorSpan);

    const priorAriaDescribedby = targetEl.getAttribute('aria-describedby');
    const tokens = priorAriaDescribedby
      ? priorAriaDescribedby.split(/\s+/).filter(Boolean)
      : [];
    if (!tokens.includes(spanId)) {
      tokens.push(spanId);
    }
    opts.renderer.setAttribute(targetEl, 'aria-describedby', tokens.join(' '));

    decorated.set(id, { el: targetEl, descriptorSpan, priorAriaDescribedby });
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
    for (const { idx, id, announcement } of errorTabs) {
      const targetEl = buttons.item(idx);
      if (!targetEl) {
        needsRetry = true;
        continue;
      }
      const existing = decorated.get(id);
      if (existing?.el === targetEl) {
        if (existing.descriptorSpan.textContent !== announcement) {
          opts.renderer.setProperty(
            existing.descriptorSpan,
            'textContent',
            announcement,
          );
        }
        continue;
      }
      if (existing) {
        removeDecoration(id);
      }
      applyDecoration(targetEl, id, announcement);
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
      const errorTabs = opts.errorTabs();
      untracked(() => sync(errorTabs));
    });
  });

  opts.destroyRef.onDestroy(() => {
    for (const id of Array.from(decorated.keys())) {
      removeDecoration(id);
    }
  });
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
