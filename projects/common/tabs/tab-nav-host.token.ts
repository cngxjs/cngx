import { InjectionToken } from '@angular/core';

/**
 * Marks a tab presenter as the **navigation** flavour rather than the
 * tablist flavour. \
 * Provided by `<cngx-tab-nav>` (`@cngx/ui/tabs`) and `[cngxMatTabNav]`
 * (`@cngx/ui/mat-tabs`); deliberately not provided by `<cngx-tab-group>`.
 *
 * Presence-only by design. There is no contract interface: providers
 * register `{ provide: CNGX_TAB_NAV_HOST, useValue: true }` and readers
 * only ever test `navHost != null`. Nothing here can be widened into a
 * second host contract - {@link CNGX_TAB_GROUP_HOST} already owns the
 * presenter surface, and this token sits beside it so the tablist path
 * gains no dead field.
 *
 * **Why a token and not the host class.** A sub-directive talks to its
 * host through DI, never through a concrete class: importing `CngxTabNav`
 * from `@cngx/common` would be a `common -> ui` edge that Sheriff rejects,
 * and element-tag sniffing breaks the moment a decomposed skin renames the
 * element.
 *
 * **What reads it.** {@link CngxTabsRouteSync} injects it
 * `{ optional: true, host: true }` to pick its URL-matching semantics: a
 * nav link owns a whole subtree and stays current for every URL beneath it
 * (prefix), while a tablist tab is a leaf and matches only its own route
 * (suffix). The `[match]` input overrides the token-derived default when a
 * consumer needs the other mode.
 *
 * ```ts
 * @Component({
 *   selector: 'my-section-nav',
 *   providers: [{ provide: CNGX_TAB_NAV_HOST, useValue: true }],
 *   hostDirectives: [CngxTabGroupPresenter],
 * })
 * export class MySectionNav {}
 * ```
 *
 * @category common/tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/tab-nav-host.token.ts
 * @since 0.1.0
 * @relatedTo CngxTabsRouteSync, CNGX_TAB_GROUP_HOST, CngxTabNav, CngxMatTabNav
 */
export const CNGX_TAB_NAV_HOST = new InjectionToken<true>('CngxTabNavHost');
