import {
  afterNextRender,
  computed,
  effect,
  linkedSignal,
  signal,
  untracked,
  type Injector,
  type Signal,
} from '@angular/core';

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
  /**
   * Live-region phrase confirming a landed close (`i18n.closedTab`).
   * Derived from the registry transition - it updates when a requested
   * close's id actually leaves the registry, so an async consumer
   * removal announces on completion, not on request. Feed it into
   * `createTabGroupAnnouncements` (options.closedAnnouncement) so the
   * live region resolves one priority chain.
   */
  readonly closedAnnouncement: Signal<string>;
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

  // The close request only ASKS the consumer to remove the tab - the
  // removal may land asynchronously (or never). Focus restore and the
  // closed announcement key on a requested id actually leaving the
  // registry, not on the next render after the request. Requests enter
  // via handleClose (the only writer); landed ids are pruned on the
  // next request, so the map stays interaction-bounded.
  const pendingCloseLabels = signal<ReadonlyMap<string, string>>(new Map());

  // Landed-close phrase, purely derived from the registry transition:
  // an id that was present in the previous registry emission, carries a
  // pending close request, and is gone from the current one has landed.
  // `prev.source` supplies the departed handle (and its label) without
  // a managed side-slot.
  const closedAnnouncement = linkedSignal<readonly CngxTabHandle[], string>({
    source: () => opts.host.tabs(),
    computation: (tabs, prev) => {
      if (prev === undefined) {
        return '';
      }
      const pending = pendingCloseLabels();
      const currentIds = new Set(tabs.map((tab) => tab.id));
      const landed = prev.source.find((tab) => !currentIds.has(tab.id) && pending.has(tab.id));
      if (landed === undefined) {
        return prev.value;
      }
      return opts.i18n.closedTab(pending.get(landed.id) ?? '');
    },
  });

  const restoreFocus = (): void => {
    // Skin-agnostic lookup: `[role="tab"]` + `data-tab-id` are the
    // ARIA/data contract every skin must honour (mirrors the keyboard
    // nav's focus targeting); class names are skin-owned and a rename
    // must not silently break focus restoration.
    const activeId = opts.host.activeId();
    const active =
      activeId === null
        ? null
        : (Array.from(
            opts.hostElement.querySelectorAll<HTMLElement>('[role="tab"]'),
          ).find((button) => button.getAttribute('data-tab-id') === activeId) ?? null);
    const add = opts.hostElement.querySelector<HTMLElement>('[data-tab-add]');
    const target = active ?? add;
    if (target) {
      target.focus();
      return;
    }
    opts.hostElement.tabIndex = -1;
    opts.hostElement.focus();
  };

  // Pure side effect - no signal writes. The once-per-landing guard is
  // plain imperative bookkeeping, not reactive state.
  const focusRestoredIds = new Set<string>();
  effect(
    () => {
      const tabs = opts.host.tabs();
      const pending = pendingCloseLabels();
      untracked(() => {
        const landed = [...pending.keys()].filter(
          (id) => !tabs.some((tab) => tab.id === id) && !focusRestoredIds.has(id),
        );
        if (landed.length === 0) {
          return;
        }
        for (const id of landed) {
          focusRestoredIds.add(id);
        }
        // Restore focus once the removal has rendered: the new active
        // tab, then the add button, and finally the group element itself
        // (made programmatically focusable) so focus never falls to
        // `<body>` when the strip empties with no add button (APG).
        afterNextRender(restoreFocus, { injector: opts.injector });
      });
    },
    { injector: opts.injector },
  );

  const handleClose = (tab: CngxTabHandle, event?: Event): void => {
    event?.stopPropagation();
    if (!isTabClosable(tab)) {
      return;
    }
    pendingCloseLabels.update((current) => {
      const next = new Map(
        // Prune requests that already landed - keeps the map bounded and
        // stops a later consumer-driven removal of a RE-ADDED same id
        // from reading as a close.
        [...current].filter(([id]) => opts.host.tabs().some((tab2) => tab2.id === id)),
      );
      next.set(tab.id, tab.label() ?? '');
      focusRestoredIds.delete(tab.id);
      return next;
    });
    opts.host.requestClose(tab.id);
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
    closedAnnouncement: closedAnnouncement.asReadonly(),
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
