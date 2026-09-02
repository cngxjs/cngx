/**
 * Shared order-aware registration seam for the Material
 * instrumentation directives (`[cngxMatTabs]`, `[cngxMatStepper]`).
 *
 * Both bridges diff a `contentChildren(Mat*)` query into a presenter
 * registry via `register`/`unregister`. The presenters keep pure
 * insertion order and append every new registration at the end, so a
 * mid-list `<mat-tab>` / `<mat-step>` insert would register at the
 * tail while Material renders it at its DOM position - index-based
 * selection, announcements and decorations would then target the
 * wrong item. This seam mirrors the query order into the presenter on
 * every emission: surviving prefix entries stay untouched, the
 * diverging suffix is unregistered and re-registered in query order
 * with the SAME handle instances (per-entry resources such as child
 * injectors are never re-created for surviving items).
 *
 * Pure TypeScript, no Angular imports. Lives in the mat-tabs entry
 * and is exported `@internal` from its barrel for cross-entry
 * consumption by `@cngx/ui/mat-stepper` - ng-packagr rejects source
 * files shared between entry points by relative import, so the
 * export-plus-internal-tag route (the `MaterialPrivateSurfaces`
 * pattern) is the supported sharing path.
 *
 * @internal
 */
export interface CngxOrderedRegistrationSeamOptions<TItem, TEntry> {
  /** Build the per-item entry (handle setup + resources). Called once per item lifetime. */
  create(item: TItem): TEntry;
  /** Register the entry's handle with the presenter. */
  register(entry: TEntry): void;
  /** Remove the entry's handle from the presenter (resources stay alive). */
  unregister(entry: TEntry): void;
  /** Release per-entry resources (child injector etc.). Called once, after the final unregister. */
  dispose(entry: TEntry): void;
}

/**
 * Stateful diff surface returned by {@link createOrderedRegistrationSeam}.
 *
 * @internal
 */
export interface CngxOrderedRegistrationSeam<TItem, TEntry> {
  /**
   * Mirror `items` (the current `contentChildren` emission, in query
   * order) into the presenter registry. Removed items are
   * unregistered and disposed; new items are created and registered;
   * surviving items keep their entry, and any item whose position
   * diverged from the registered order is re-registered so the
   * presenter's order matches `items` exactly.
   */
  sync(items: readonly TItem[]): void;
  /** Entry lookup for per-item decoration hooks. */
  get(item: TItem): TEntry | undefined;
  /** Unregister and dispose every entry (directive destroy). */
  clear(): void;
}

/**
 * Create the order-aware registration seam. See the module JSDoc for
 * the contract.
 *
 * @internal
 */
export function createOrderedRegistrationSeam<TItem, TEntry>(
  options: CngxOrderedRegistrationSeamOptions<TItem, TEntry>,
): CngxOrderedRegistrationSeam<TItem, TEntry> {
  const entries = new Map<TItem, TEntry>();
  // Presenter-side registration order - the seam issued every
  // register() call, so this array IS the presenter's order.
  let registeredOrder: TItem[] = [];

  const sync = (items: readonly TItem[]): void => {
    const live = new Set<TItem>(items);

    // Drop stale entries first so the order diff below only compares
    // survivors. Snapshot before iterating - deletes inside the body
    // must not collide with iterator state.
    for (const [item, entry] of Array.from(entries.entries())) {
      if (live.has(item)) {
        continue;
      }
      options.unregister(entry);
      options.dispose(entry);
      entries.delete(item);
    }
    registeredOrder = registeredOrder.filter((item) => entries.has(item));

    // Longest shared prefix stays registered as-is; everything after
    // it re-registers in query order. Append-only emissions keep
    // prefix === registeredOrder.length and cause zero churn.
    let prefix = 0;
    while (
      prefix < registeredOrder.length &&
      prefix < items.length &&
      registeredOrder[prefix] === items[prefix]
    ) {
      prefix += 1;
    }

    for (let i = registeredOrder.length - 1; i >= prefix; i -= 1) {
      const entry = entries.get(registeredOrder[i]);
      if (entry !== undefined) {
        options.unregister(entry);
      }
    }
    registeredOrder.length = prefix;

    for (let i = prefix; i < items.length; i += 1) {
      const item = items[i];
      let entry = entries.get(item);
      if (entry === undefined) {
        entry = options.create(item);
        entries.set(item, entry);
      }
      options.register(entry);
      registeredOrder.push(item);
    }
  };

  const clear = (): void => {
    for (const entry of entries.values()) {
      options.unregister(entry);
      options.dispose(entry);
    }
    entries.clear();
    registeredOrder = [];
  };

  return {
    sync,
    get: (item: TItem): TEntry | undefined => entries.get(item),
    clear,
  };
}
