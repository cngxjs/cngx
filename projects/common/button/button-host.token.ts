import { InjectionToken, type Provider, type Signal } from '@angular/core';

import type { CngxButtonSize, CngxButtonTone, CngxButtonVariant } from './button.types';

/**
 * Static facts about a button host, read by `CngxButtonBrain`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo provideButtonHost, CngxButtonBrain
 */
export interface CngxButtonHostDescriptor {
  /** Selector name, e.g. `'cngxIconButton'`, printed by dev diagnostics. */
  readonly name: string;
  /** Last fallback of the variant chain. */
  readonly defaultVariant: CngxButtonVariant;
  /** Axes pinned against the group and the config; the input still wins. */
  readonly fixed?: {
    readonly variant?: CngxButtonVariant;
    readonly tone?: CngxButtonTone;
    readonly size?: CngxButtonSize;
  };
  /** No visible text: turns on the [`CNGX1071`](/error-codes/cngx1071.md) name check. */
  readonly iconOnly?: boolean;
}

/**
 * The host descriptor of `CngxButtonBrain`, set through {@link provideButtonHost}. A host fact,
 * not a consumer option.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonBrain, provideButtonHost, CNGX_BUTTON_HOST_STATE
 */
export const CNGX_BUTTON_HOST = new InjectionToken<CngxButtonHostDescriptor>('CngxButtonHost');

/**
 * The {@link CNGX_BUTTON_HOST} descriptor. Goes in the `providers` of the class that declares
 * `CngxButtonBrain` in its `hostDirectives`. Full host in the README, "Building a custom button
 * host".
 *
 * ```ts
 * providers: [provideButtonHost('appChipButton', { defaultVariant: 'outline' })]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonBrain, CNGX_BUTTON_HOST, CngxActionButton
 */
export function provideButtonHost(
  name: string,
  descriptor: Omit<CngxButtonHostDescriptor, 'name'>,
): Provider {
  return { provide: CNGX_BUTTON_HOST, useValue: { ...descriptor, name } };
}

/**
 * Refusal and a run a host adds on top of the brain's inputs, e.g. a split caret blocked by its
 * main action.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_HOST_STATE, CngxButtonBrain, CngxSplitCaret
 */
export interface CngxButtonHostState {
  /** Folded into `blocked`; never references the disabled reason. */
  readonly refusing: Signal<boolean>;
  /**
   * A run the co-hosted runner does not own. Reads busy and refuses activation. Without a runner
   * it also drives `busyVisible()` on the `CNGX_LOADING_CONFIG` timing.
   */
  readonly busy?: Signal<boolean>;
}

/**
 * Optional host state on the host element. Read on first use, so a factory may inject the host
 * component.
 *
 * ```ts
 * providers: [
 *   { provide: CNGX_BUTTON_HOST_STATE, useFactory: () => inject(AppCaret).hostState },
 * ]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonBrain, CNGX_BUTTON_HOST, CngxSplitCaret
 */
export const CNGX_BUTTON_HOST_STATE = new InjectionToken<CngxButtonHostState>(
  'CngxButtonHostState',
);
