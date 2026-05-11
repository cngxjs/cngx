import { InjectionToken } from '@angular/core';

/**
 * Discriminated union describing one direct child of a hierarchy-aware
 * option projection root (e.g. `CngxSelectShell`).
 *
 * `CngxOption` registers as `{ kind: 'option' }`, `CngxOptionGroup` as
 * `{ kind: 'group' }`. Both providers expose `useExisting` so consumers
 * can `inject(CNGX_OPTION_CONTAINER)` and reach the directive instance
 * through the discriminator.
 *
 * @category interactive
 */
export type CngxOptionContainer =
  | (CngxOptionContainerOption & { readonly kind: 'option' })
  | (CngxOptionContainerGroup & { readonly kind: 'group' });

/**
 * Public surface a `CngxOption` exposes when registered under
 * `CNGX_OPTION_CONTAINER`. Kept structural so consumers can walk the
 * projection tree without importing the directive class directly.
 *
 * @category interactive
 */
export interface CngxOptionContainerOption {
  readonly id: string;
}

/**
 * Public surface a `CngxOptionGroup` exposes when registered under
 * `CNGX_OPTION_CONTAINER`. The `options` signal yields the direct
 * `CngxOption` children of the group; nested groups are unsupported
 * (the surrounding directive dev-warns when one is detected).
 *
 * @category interactive
 */
export interface CngxOptionContainerGroup {
  readonly label: () => string;
  readonly options: () => readonly CngxOptionContainerOption[];
}

/**
 * DI token registered by both `CngxOption` and `CngxOptionGroup`.
 *
 * Hierarchy-aware projection roots (`CngxSelectShell` and friends)
 * query a single token via `contentChildren(CNGX_OPTION_CONTAINER,
 * { descendants: false })` and walk the result preserving DOM order.
 * The discriminated `kind` field separates leaves from groups without
 * forcing the consumer to import either directive class.
 *
 * @category interactive
 */
export const CNGX_OPTION_CONTAINER = new InjectionToken<CngxOptionContainer>(
  'CNGX_OPTION_CONTAINER',
);
