import { DOCUMENT } from '@angular/common';
import {
  computed,
  type DestroyRef,
  DestroyRef as DestroyRefToken,
  ElementRef,
  inject,
  InjectionToken,
  type Signal,
} from '@angular/core';

import { createResizeSignal, type ResizeObserverHost } from './resize-signal';

/**
 * Reactive read of a query container: its size, and the custom properties its
 * `@container` rules resolved to.
 *
 * @category common/layout/observers
 * @since 0.1.0
 */
export interface CngxContainerSize {
  /** Border-box inline size in pixels. `0` before the first observation. */
  readonly inlineSize: Signal<number>;
  /** Border-box block size in pixels. `0` before the first observation. */
  readonly blockSize: Signal<number>;
  /** `true` once the first observation has arrived. */
  readonly isReady: Signal<boolean>;
  /**
   * The resolved value of a custom property, re-read on every resize of the
   * container.
   *
   * **The `@container` rule must style a descendant, never the container
   * itself.** A container query resolves against an *ancestor* query container
   * of the element it styles, so a rule whose subject is the container element
   * matches nothing and the property never changes. Pass that descendant as
   * `on`; it defaults to the container host, which is only correct for
   * properties no container query writes.
   *
   * A component that is container and reader at once has no descendant to
   * carry the value. Pass `pseudo` instead: the query container for a
   * pseudo-element is selected from its originating element's *inclusive*
   * ancestors, so `.host::after` resolves against `.host` while a rule on
   * `.host` itself still matches nothing. No sentinel node enters the
   * template.
   *
   * ```css
   * .cngx-thing::after { --cngx-thing-narrow: 0; }
   * &#64;container cngx-thing (max-inline-size: 30rem) {
   *   .cngx-thing::after { --cngx-thing-narrow: 1; }
   * }
   * ```
   *
   * Returns the empty string before the first observation and in environments
   * without layout (SSR, jsdom).
   */
  property(name: string, on?: Element, pseudo?: '::before' | '::after'): Signal<string>;
}

/**
 * The nearest query container declared by {@link CngxContainer}.
 *
 * Deliberately has no root factory: absence is meaningful. A component that
 * needs a container and finds none must say so (a dev-mode warning), not
 * silently observe itself.
 *
 * @category common/layout/observers
 * @since 0.1.0
 */
export const CNGX_CONTAINER_SIZE = new InjectionToken<CngxContainerSize>('CNGX_CONTAINER_SIZE');

/**
 * Creates a {@link CngxContainerSize} over `element`.
 *
 * Observes the border box, so the reported size matches what an
 * `inline-size` container query measures. The `property()` reads are plain
 * `computed()`s over the same resize signal - the browser has already
 * re-evaluated every container query by the time a `ResizeObserver` callback
 * runs, so the read returns the current value without a second scheduling hop.
 *
 * @param element The container host.
 * @param destroyRef Scope whose destruction disconnects the observer.
 * @param win The window-like object providing `ResizeObserver` and `getComputedStyle`.
 * @category common/layout/observers
 * @relatedTo injectContainerSize, CngxContainer
 * @since 0.1.0
 */
export function createContainerSize(
  element: Element,
  destroyRef: DestroyRef,
  win: (ResizeObserverHost & Pick<Window, 'getComputedStyle'>) | null | undefined,
): CngxContainerSize {
  const entry = createResizeSignal(element, 'border-box', destroyRef, win);

  const inlineSize = computed(() => entry()?.borderBoxSize?.[0]?.inlineSize ?? 0);
  const blockSize = computed(() => entry()?.borderBoxSize?.[0]?.blockSize ?? 0);
  const isReady = computed(() => entry() !== null);

  // Weak on the element: the container outlives descendants that get
  // destroyed, so a strong Map would pin every dead node it ever read.
  const cache = new WeakMap<Element, Map<string, Signal<string>>>();

  const property = (
    name: string,
    on?: Element,
    pseudo?: '::before' | '::after',
  ): Signal<string> => {
    const target = on ?? element;
    let byName = cache.get(target);
    if (!byName) {
      byName = new Map();
      cache.set(target, byName);
    }
    const key = `${pseudo ?? ''}|${name}`;
    const cached = byName.get(key);
    if (cached) {
      return cached;
    }
    // A DOM read inside a computed() is deliberate here, not an oversight: the
    // only tracked dependency is the resize entry, and a ResizeObserver
    // callback runs after layout, when every container query has already been
    // re-evaluated. The read is therefore idempotent for a given entry and
    // never forces a recalc of its own. An effect writing into a signal would
    // add a scheduling hop for nothing.
    const value = computed(() => {
      if (entry() === null || !win?.getComputedStyle) {
        return '';
      }
      return win
        .getComputedStyle(target, pseudo ?? null)
        .getPropertyValue(name)
        .trim();
    });
    byName.set(key, value);
    return value;
  };

  return { inlineSize, blockSize, isReady, property };
}

/**
 * Reads the nearest query container declared by a `[cngxContainer]` ancestor,
 * or observes `target` (default: the host element) when there is none.
 *
 * Use it where a component must branch structurally on the width it was given
 * - a different template, a focus move, an `aria-modal` flip. Purely visual
 * adaptation needs no TypeScript at all: write a `@container` rule.
 *
 * ```typescript
 * private readonly container = inject(CNGX_CONTAINER_SIZE, { optional: true });
 * private readonly wide = this.container?.property('--cngx-thing-wide', this.host) ?? signal('').asReadonly();
 * readonly mode = computed(() => (this.wide() === '1' ? 'side' : 'over'));
 * ```
 *
 * A component that declares the container in its own stylesheet and reads it
 * itself passes its host explicitly and reads the property off `::after` -
 * there is no descendant to carry the value:
 *
 * ```typescript
 * private readonly host = inject(ElementRef).nativeElement as Element;
 * private readonly container = injectContainerSize(this.host);
 * private readonly narrow = this.container.property('--cngx-thing-narrow', this.host, '::after');
 * ```
 *
 * @param target Element to observe when no ancestor container exists.
 * @category common/layout/observers
 * @relatedTo CngxContainer, injectMediaQuery
 * @since 0.1.0
 */
export function injectContainerSize(target?: ElementRef<Element> | Element): CngxContainerSize {
  const ancestor = inject(CNGX_CONTAINER_SIZE, { optional: true, skipSelf: true });
  if (ancestor && !target) {
    return ancestor;
  }
  const resolved: Element =
    target instanceof ElementRef
      ? target.nativeElement
      : (target ?? (inject(ElementRef).nativeElement as Element));
  return createContainerSize(resolved, inject(DestroyRefToken), inject(DOCUMENT).defaultView);
}
