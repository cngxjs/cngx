import { afterNextRender, computed, type Injector, type Signal } from '@angular/core';

import type { CngxTabsI18n } from '../i18n/tabs-i18n';
import type { CngxTabCloseIconContext } from '../slots/tab-close-icon.directive';
import type { CngxTabsConfig } from '../tabs-config';
import type { CngxTabGroupHost, CngxTabHandle } from '../tab-group-host.token';

/**
 * Inputs to {@link createTabDismissals}. \
 * The organism owns the
 * `[closable]` / `[addable]` inputs and the DOM handle; the factory runs
 * the cascade and the close/add interaction so the organism class stays
 * under the LOC guard. \
 *
 * Sibling shape to `createTabGroupAnnouncements`.
 *
 * @category common/tabs
 */
export interface CngxTabDismissalsOptions {
  readonly host: CngxTabGroupHost;
  readonly config: CngxTabsConfig;
  readonly i18n: CngxTabsI18n;
  readonly closable: Signal<boolean | undefined>;
  readonly addable: Signal<boolean | undefined>;
  readonly hostElement: HTMLElement;
  readonly injector: Injector;
}

/**
 * Resolved dismissable/addable surface for `<cngx-tab-group>`. \
 * The organism holds this as one field and the template reads it.
 *
 * @category common/tabs
 */
export interface CngxTabDismissals {
  /** Effective group-level close affordance (`input ?? config ?? false`). */
  readonly resolvedClosable: Signal<boolean>;
  /** Effective group-level add affordance (`input ?? config ?? false`). */
  readonly resolvedAddable: Signal<boolean>;
  /** Per-tab closable: per-tab override > group resolution. */
  isTabClosable(tab: CngxTabHandle): boolean;
  /** i18n accessible name for a tab's close button. */
  closeButtonLabel(tab: CngxTabHandle): string;
  /** Stable `*cngxTabCloseIcon` context (`{ tab }`) per tab. */
  closeIconContextFor(tab: CngxTabHandle): CngxTabCloseIconContext;
  /** Close a tab and restore focus to the new active tab / add button. */
  handleClose(tab: CngxTabHandle, event?: Event): void;
  /** Delete on a focused closable tab requests its close (APG). */
  handleTabKeydown(tab: CngxTabHandle, event: KeyboardEvent): void;
  /** Request a new tab via the add button. */
  handleAdd(): void;
}

/**
 * Helper resolving the dismissable/addable affordances for
 * `<cngx-tab-group>`. \
 * Keeps the close/add cascade + interaction off the
 * organism class (LOC guard). \
 * Each cascade is one `computed()`.
 * The actual tab removal is the consumer's -
 * `handleClose` only routes through the presenter's `requestClose`, which
 * moves the active index, and restores focus once the consumer's removal
 * has rendered.
 *
 * ```ts
 * // The organism builds it once from field-init; the template reads it.
 * protected readonly dismiss = createTabDismissals({
 *   host: this.host,            // CNGX_TAB_GROUP_HOST
 *   config: this.config,        // injectTabsConfig()
 *   i18n: this.i18n,            // injectTabsI18n()
 *   closable: this.closable,    // input<boolean | undefined>('closable')
 *   addable: this.addable,      // input<boolean | undefined>('addable')
 *   hostElement: this.hostElement,
 *   injector: this.injector,
 * });
 *
 * // Per-tab close affordance, read from the header template:
 * dismiss.isTabClosable(tab);              // per-tab override > group resolution
 * dismiss.closeButtonLabel(tab);           // i18n accessible name for the close button
 * dismiss.handleClose(tab, clickEvent);    // routes through presenter.requestClose, restores focus
 * dismiss.handleTabKeydown(tab, keyEvent); // Delete on a focused closable tab closes it (APG)
 *
 * // Group-level add affordance:
 * dismiss.resolvedAddable();               // input ?? config ?? false
 * dismiss.handleAdd();                     // routes through presenter.requestAdd
 * ```
 *
 * @category common/tabs
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/dismissals/tab-dismissals.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroup, CngxTabCloseIcon, CngxTabAddIcon
 */
export function createTabDismissals(opts: CngxTabDismissalsOptions): CngxTabDismissals {
  const resolvedClosable = computed<boolean>(
    () => opts.closable() ?? opts.config.closable ?? false,
  );
  const resolvedAddable = computed<boolean>(() => opts.addable() ?? opts.config.addable ?? false);

  const closeIconContextCache = new WeakMap<CngxTabHandle, CngxTabCloseIconContext>();

  const isTabClosable = (tab: CngxTabHandle): boolean => tab.closable() ?? resolvedClosable();

  const handleClose = (tab: CngxTabHandle, event?: Event): void => {
    event?.stopPropagation();
    if (!isTabClosable(tab)) {
      return;
    }
    opts.host.requestClose(tab.id);
    // Restore focus once the consumer's removal has rendered: the new
    // active tab, then the add button, and finally the group element
    // itself (made programmatically focusable) so focus never falls to
    // `<body>` when the strip empties with no add button (APG).
    afterNextRender(
      () => {
        const active = opts.hostElement.querySelector<HTMLElement>(
          '.cngx-tabs__tab[aria-selected="true"]',
        );
        const add = opts.hostElement.querySelector<HTMLElement>('.cngx-tabs__add');
        const target = active ?? add;
        if (target) {
          target.focus();
          return;
        }
        opts.hostElement.tabIndex = -1;
        opts.hostElement.focus();
      },
      { injector: opts.injector },
    );
  };

  return {
    resolvedClosable,
    resolvedAddable,
    isTabClosable,
    closeButtonLabel: (tab) => opts.i18n.closeTab(tab.label() ?? ''),
    closeIconContextFor: (tab) => {
      let ctx = closeIconContextCache.get(tab);
      if (!ctx) {
        ctx = { tab };
        closeIconContextCache.set(tab, ctx);
      }
      return ctx;
    },
    handleClose,
    handleTabKeydown: (tab, event) => {
      if (event.key === 'Delete' && isTabClosable(tab)) {
        event.preventDefault();
        handleClose(tab);
      }
    },
    handleAdd: () => opts.host.requestAdd(),
  };
}
