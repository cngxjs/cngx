import {
  computed,
  InjectionToken,
  type Injector,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import type { MatTab } from '@angular/material/tabs';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';
import type { CngxTabHandle } from '@cngx/common/tabs';

import type { MaterialPrivateSurfaces } from './private-surfaces';

/**
 * Wiring bundle returned from {@link createMatTabHandle}. The
 * directive owns the writable `errorAggregator` slot so the
 * `[cngxMatTabError]` per-tab directive can pump aggregators into
 * it; `label` and `disabled` track Material's current state via a
 * `toSignal(matTab._stateChanges)` trigger.
 */
export interface CngxMatTabHandleSetup {
  readonly handle: CngxTabHandle;
  /** Convenience mirror of `handle.label`. */
  readonly label: Signal<string | undefined>;
  /** Convenience mirror of `handle.disabled`. */
  readonly disabled: Signal<boolean>;
  readonly errorAggregator: WritableSignal<CngxErrorAggregatorContract | undefined>;
}

/**
 * Translates a Material `MatTab` into a cngx {@link CngxTabHandle}
 * plus a writable `errorAggregator` slot the `[cngxMatTabError]`
 * directive binds.
 *
 * - `id` - fresh `idSeed()` value; a label-keyed id would collide
 *   when two tabs share a label.
 * - `label` / `disabled` - `computed` signals retriggered by
 *   `toSignal(matTab._stateChanges)`. Bridge lifetime is tied to
 *   the supplied `injector` (typically a per-tab child
 *   `EnvironmentInjector`). `_stateChanges` is a Material-internal
 *   surface.
 * - `errorAggregator` - writable seeded at `undefined`;
 *   `[cngxMatTabError]` writes its bound aggregator in and resets
 *   on teardown. The handle exposes `.asReadonly()` to preserve the
 *   `CngxTabHandle` contract.
 *
 * @category ui/mat-tabs
 */
export function createMatTabHandle(
  matTab: MatTab,
  idSeed: () => string,
  injector: Injector,
): CngxMatTabHandleSetup {
  // Typed local - anchors `MaterialPrivateSurfaces.StateChangeSource`
  // at the consumer site so an upgrade-watch grep lands here too.
  // Documentation-only at runtime; MatTab's public typing already
  // exposes `_stateChanges`.
  const stateChangeSource: MaterialPrivateSurfaces.StateChangeSource = matTab;
  // `equal: () => false` is load-bearing - `_stateChanges` is a
  // `Subject<void>`, so `Object.is(undefined, undefined)` would dedup
  // every emission and the dependent computeds would never recompute.
  const stateChangeTrigger = toSignal(stateChangeSource._stateChanges, {
    injector,
    initialValue: undefined,
    equal: () => false,
  });
  const label = computed<string | undefined>(() => {
    stateChangeTrigger();
    return matTab.textLabel;
  });
  const disabled = computed<boolean>(() => {
    stateChangeTrigger();
    return matTab.disabled;
  });
  const errorAggregator = signal<CngxErrorAggregatorContract | undefined>(undefined);
  // Material owns its own tab lifecycle - the cngx dismissable/addable
  // affordances are native-only by design, so the Material handle pins
  // `closable` to `undefined` (group-default, never a close button).
  const closable = signal<boolean | undefined>(undefined);
  // `nextUid` is process-wide monotonic, so `${id}-errors` descriptor
  // ids stay unique across coexisting `[cngxMatTabs]` instances.
  const id = idSeed();
  return {
    handle: {
      id,
      label,
      disabled,
      errorAggregator: errorAggregator.asReadonly(),
      closable: closable.asReadonly(),
    },
    label,
    disabled,
    errorAggregator,
  };
}

/**
 * Factory signature for {@link createMatTabHandle}. The DI token
 * {@link CNGX_MAT_TAB_HANDLE_FACTORY} resolves to a function with
 * this exact shape - overrides match it identically.
 *
 * @category ui/mat-tabs
 */
export type CngxMatTabHandleFactory = typeof createMatTabHandle;

/**
 * DI token fronting the per-tab handle factory used by
 * `[cngxMatTabs]`. Default is {@link createMatTabHandle}. Symmetric
 * with `CNGX_MAT_STEP_HANDLE_FACTORY` and
 * `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY`.
 *
 * The seam separates handle shape (factory body) from id keying
 * (the supplied `idSeed` closure). Overrides may call, ignore, or
 * replace `idSeed` - server-synced ids, deterministic test ids,
 * consumer-domain ids - without touching the factory body.
 *
 * ```ts
 * providers: [
 *   {
 *     provide: CNGX_MAT_TAB_HANDLE_FACTORY,
 *     useValue: ((tab, idSeed, injector) => {
 *       const setup = createMatTabHandle(tab, idSeed, injector);
 *       reportTabRegistered(setup.handle.id);
 *       return setup;
 *     }) satisfies CngxMatTabHandleFactory,
 *   },
 * ]
 * ```
 *
 * @category ui/mat-tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-tabs/material-bridge/handle.ts
 * @since 0.1.0
 */
export const CNGX_MAT_TAB_HANDLE_FACTORY = new InjectionToken<CngxMatTabHandleFactory>(
  'CNGX_MAT_TAB_HANDLE_FACTORY',
  {
    providedIn: 'root',
    factory: () => createMatTabHandle,
  },
);
