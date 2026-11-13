import { InjectionToken, type Provider, type Signal } from '@angular/core';

import type { CngxButtonSize, CngxButtonTone, CngxButtonVariant } from './button.types';

/**
 * Static facts about a button host that `CngxButtonBrain` reads: the
 * selector name it reports in development diagnostics and in the `aria-describedby`
 * registry, the variant it falls back to, the axes it pins and whether it
 * is icon-only.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo provideButtonHost, CngxButtonBrain
 */
export interface CngxButtonHostDescriptor {
  /**
   * Public selector name of the host, e.g. `'cngxIconButton'`. Development
   * diagnostics print it in brackets (`[cngxIconButton]`).
   */
  readonly name: string;
  /** Variant after the input, the pinned axes, the group and the config. */
  readonly defaultVariant: CngxButtonVariant;
  /** Axes pinned against the group and the config; the input still wins. */
  readonly fixed?: {
    readonly variant?: CngxButtonVariant;
    readonly tone?: CngxButtonTone;
    readonly size?: CngxButtonSize;
  };
  /**
   * `true` for a host without visible text. The brain then checks the
   * accessible name once the app is stable and warns [`CNGX1071`](/error-codes/cngx1071.md) without one.
   */
  readonly iconOnly?: boolean;
}

/**
 * Host contract token of `CngxButtonBrain`: every element that declares the
 * brain as a host directive provides its descriptor here, through
 * {@link provideButtonHost}. A static host fact, not a consumer option.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonBrain, provideButtonHost, CNGX_BUTTON_HOST_STATE
 */
export const CNGX_BUTTON_HOST = new InjectionToken<CngxButtonHostDescriptor>('CngxButtonHost');

/**
 * Provides the {@link CNGX_BUTTON_HOST} descriptor of a button host. Goes in the `providers` of
 * the component or directive that declares `CngxButtonBrain` in its `hostDirectives`. The full
 * custom-host example is in the package README, section "Building a custom button host".
 *
 * ```ts
 * providers: [provideButtonHost('appChipButton', { defaultVariant: 'outline' })]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonBrain, CNGX_BUTTON_HOST
 */
export function provideButtonHost(
  name: string,
  descriptor: Omit<CngxButtonHostDescriptor, 'name'>,
): Provider {
  return { provide: CNGX_BUTTON_HOST, useValue: { ...descriptor, name } };
}

/**
 * Refusal and a run a host adds on top of the brain's own inputs, e.g. the
 * caret of a split button blocked by its main action, or an action button
 * reflecting an external run.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_HOST_STATE, CngxButtonBrain, CngxSplitCaret
 */
export interface CngxButtonHostState {
  /**
   * `true` while the host refuses activation for a reason of its own. Folded
   * into `blocked`, the activation guard and the co-hosted runner's
   * disabled state; it never references the disabled reason.
   */
  readonly refusing: Signal<boolean>;
  /**
   * `true` while the host reflects a run the co-hosted runner does not own. It reads as busy
   * (`data-pending`, `aria-busy`, `CNGX_HOST_INTERACTION_STATE.busy`) and refuses activation
   * without `refusing` being set. Without a co-hosted runner it also opens `busyVisible()` and
   * `data-busy` on the `CNGX_LOADING_CONFIG` show delay and min-dwell.
   */
  readonly busy?: Signal<boolean>;
}

/**
 * Optional host state a button host provides on its own element. The brain
 * reads it on first use, so a factory that injects the host component is
 * safe.
 *
 * ```ts
 * providers: [
 *   { provide: CNGX_BUTTON_HOST_STATE, useFactory: () => inject(AppCaret).hostState },
 * ]
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-host.token.ts
 * @since 0.1.0
 * @relatedTo CngxButtonBrain, CNGX_BUTTON_HOST
 */
export const CNGX_BUTTON_HOST_STATE = new InjectionToken<CngxButtonHostState>(
  'CngxButtonHostState',
);
