import { InjectionToken, type OutputRef, type Signal } from '@angular/core';

import type { CngxTocItem } from './toc.types';

/**
 * Minimal contract a toc rail exposes to its collaborators (the opt-in
 * `CngxTocRouterSync` fragment directive): the active-section signal it
 * derives, the activation output it emits, and the imperative `scrollTo`
 * it owns. Injected via {@link CNGX_TOC} + `useExisting`, never by injecting
 * the concrete `CngxToc` class - that would create a cyclic type dependency
 * and block the decompose brain/skin split.
 *
 * Direction mirrors `CNGX_SIDENAV`, not `CNGX_BREADCRUMB_ITEMS_SOURCE`: the
 * rail owns the state (`activeId`, `scrollTo`) and the collaborator consumes
 * it, so the toc *provides* the token and the sync directive *injects* it.
 *
 * @category ui/toc
 * @since 0.1.0
 * @relatedTo CngxToc, CngxTocRouterSync
 */
export interface CngxTocContract {
  /** The section currently most visible, or `null` before the spy resolves. */
  readonly activeId: Signal<string | null>;
  /** Fires when a link is activated (click / Enter), carrying its item. */
  readonly activated: OutputRef<CngxTocItem>;
  /** Scroll the section with this id into view and move focus to it. */
  scrollTo(id: string): void;
}

/**
 * Contract token for a toc rail. `CngxToc` provides it via
 * `{ provide: CNGX_TOC, useExisting: CngxToc }`, so a collaborator injects the
 * narrow {@link CngxTocContract} instead of the concrete class.
 *
 * @category ui/toc
 * @since 0.1.0
 * @relatedTo CngxToc, CngxTocRouterSync
 */
export const CNGX_TOC = new InjectionToken<CngxTocContract>('CNGX_TOC');
