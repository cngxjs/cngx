import { computed, DestroyRef, ElementRef, inject, type Signal } from '@angular/core';
import { CNGX_ASYNC_RUN_STATE } from '@cngx/common/interactive';
import {
  CNGX_DESCRIBED_BY,
  createVisibilityGate,
  injectDescribedByContribution,
  injectLazySelf,
  injectLoadingConfig,
  nextUid,
} from '@cngx/core/utils';

import { injectButtonConfig, type CngxButtonConfig } from './button-config';
import { CNGX_BUTTON_GROUP, type CngxButtonGroupContext } from './button-group.token';
import type { CngxButtonHostDescriptor } from './button-host.token';
import type {
  CngxButtonSize,
  CngxButtonTone,
  CngxButtonType,
  CngxButtonVariant,
} from './button.types';

/**
 * Input signals a button class hands to {@link injectButtonCore}. Signal
 * inputs must be field initialisers on the class, so the class declares
 * them and the core derives everything else.
 *
 * @internal
 */
export interface CngxButtonCoreInputs {
  readonly variant: Signal<CngxButtonVariant | undefined>;
  readonly tone: Signal<CngxButtonTone | undefined>;
  readonly size: Signal<CngxButtonSize | undefined>;
  readonly disabled: Signal<boolean>;
  readonly disabledReason: Signal<string | undefined>;
  readonly describedBy: Signal<string | null>;
  readonly type: Signal<CngxButtonType | undefined>;
  /**
   * A run the host reflects that the co-hosted runner does not own; folded
   * into `busy`. `CngxButtonBrain` passes `CNGX_BUTTON_HOST_STATE.busy`.
   */
  readonly hostBusy?: Signal<boolean>;
}

/**
 * Class-level fallbacks used when neither input, group nor config sets an
 * axis.
 *
 * @internal
 */
export interface CngxButtonCoreDefaults {
  readonly variant: CngxButtonVariant;
  /** Axes pinned right after the input, ahead of the group and the config. */
  readonly fixed?: CngxButtonHostDescriptor['fixed'];
}

/**
 * Everything a button class binds on its host.
 *
 * @internal
 */
export interface CngxButtonCore {
  readonly variant: Signal<CngxButtonVariant>;
  readonly tone: Signal<CngxButtonTone>;
  readonly size: Signal<CngxButtonSize>;
  /** `true` while a co-hosted runner runs its action or the host reflects a run. */
  readonly busy: Signal<boolean>;
  /**
   * `true` while the busy layer is showing: the run after the show delay,
   * held for the min-dwell. With a co-hosted runner its gate decides
   * (`CngxAsyncClick.busyVisible`); without one, a gate over `hostBusy` on
   * the `CNGX_LOADING_CONFIG` timing. `busy` stays the immediate truth.
   */
  readonly busyVisible: Signal<boolean>;
  /**
   * `true` while the button refuses activation: disabled, busy or refused by
   * the co-hosted `CngxAsyncClick`. The activation guard keys on it, so
   * `aria-disabled="true"` always means no activation.
   */
  readonly blocked: Signal<boolean>;
  /** `aria-disabled` rendered from `blocked`. */
  readonly ariaDisabled: Signal<'true' | null>;
  /**
   * `aria-busy`: the co-hosted run, the runner's own busy override or the
   * host's run. The same value the runner renders, so the two writers agree.
   */
  readonly ariaBusy: Signal<'true' | null>;
  /**
   * The element's merged `aria-describedby`: the consumer's static ids, the
   * `cngxDescribedBy` ids, the reason id while disabled with a reason, and
   * the ids of co-hosted contributors such as `[cngxTooltip]`.
   */
  readonly describedBy: Signal<string | null>;
  readonly reasonId: string;
  /** `reasonId` while it describes the element (`disabled` with a reason), else `null`. */
  readonly activeReasonId: Signal<string | null>;
  /** `type` attribute value: the input or `'button'` on a `<button>`, `null` on an `<a>`. */
  readonly hostType: Signal<CngxButtonType | null>;
}

const DEFAULT_TONE: CngxButtonTone = 'neutral';
const DEFAULT_SIZE: CngxButtonSize = 'md';

/**
 * The size chain every member of a button group resolves:
 * `input ?? group ?? config ?? md`. Shared by the button core and the group
 * addon, so an addon always sits on the row of the buttons beside it.
 *
 * @internal
 */
export function resolveButtonSize(
  input: CngxButtonSize | undefined,
  group: CngxButtonGroupContext | null,
  config: CngxButtonConfig,
): CngxButtonSize {
  return input ?? group?.size() ?? config.size ?? DEFAULT_SIZE;
}

/**
 * Derivation behind `CngxButtonBrain`. Resolves the three visual axes
 * (`input ?? fixed ?? group ?? config ?? default`; tone skips the group),
 * renders `disabled` as `aria-disabled` so the element stays focusable, swallows activation while
 * blocked and reads a co-hosted run through `CNGX_ASYNC_RUN_STATE`.
 *
 * The activation guard is a capture-phase listener on the host: while
 * `blocked` it runs before any bubbling `(click)` handler on the same
 * element (consumer handlers, `RouterLink`, `CngxAsyncClick`), stops them
 * and prevents the default action (link navigation, form submission,
 * including the implicit submission a browser triggers through a click on
 * the default button). The one click it lets through is the one on an
 * expanded popup trigger (`aria-expanded="true"`), which closes the popup.
 *
 * @internal
 */
export function injectButtonCore(
  inputs: CngxButtonCoreInputs,
  defaults: CngxButtonCoreDefaults,
): CngxButtonCore {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const group = inject(CNGX_BUTTON_GROUP, { optional: true });
  const config = injectButtonConfig();
  // Resolved on first read, not at construction: the co-hosted runner injects
  // the CNGX_HOST_INTERACTION_STATE this button provides, so an eager inject
  // in either direction is a cycle.
  const runState = injectLazySelf(CNGX_ASYNC_RUN_STATE, { optional: true });
  const reasonId = nextUid('cngx-button-reason-');
  const describedByKey = nextUid('cngx-button-describedby-');
  const isButtonHost = host.tagName === 'BUTTON';

  const fixed = defaults.fixed;
  const variant = computed<CngxButtonVariant>(
    () =>
      inputs.variant() ?? fixed?.variant ?? group?.variant() ?? config.variant ?? defaults.variant,
  );
  const tone = computed<CngxButtonTone>(
    () => inputs.tone() ?? fixed?.tone ?? config.tone ?? DEFAULT_TONE,
  );
  const size = computed<CngxButtonSize>(() =>
    resolveButtonSize(inputs.size() ?? fixed?.size, group, config),
  );
  const hostBusy = inputs.hostBusy;
  const busy = computed(() => (runState()?.pending() ?? false) || (hostBusy?.() ?? false));
  // Without a co-hosted runner nothing gates a run the host reflects, so the
  // core opens its own gate on the loading-config timing. With a runner its
  // gate stays the source (it already folds the host's run in).
  const loadingConfig = injectLoadingConfig();
  const ownBusyVisible = createVisibilityGate(
    computed(() => runState() === null && (hostBusy?.() ?? false)),
    computed(() => loadingConfig.showDelay),
    computed(() => loadingConfig.minDwell),
  );
  const busyVisible = computed(() => {
    const run = runState();
    return run ? run.busyVisible() : ownBusyVisible();
  });
  // CngxAsyncClick binds aria-disabled on the same host and only rewrites it
  // when its own value changes, so the button folds the runner's
  // `[enabled]="false"` in; otherwise a disabled -> enabled flip here writes
  // null while the runner still refuses clicks.
  const asyncClickRefuses = computed(() => runState()?.enabled() === false);
  const blocked = computed(() => inputs.disabled() || busy() || asyncClickRefuses());
  const ariaDisabled = computed<'true' | null>(() => (blocked() ? 'true' : null));
  const ariaBusy = computed<'true' | null>(() =>
    busy() || (runState()?.busy() ?? false) ? 'true' : null,
  );
  const reasonIds = computed(() =>
    inputs.disabled() && inputs.disabledReason() ? reasonId : null,
  );
  // Contributed before the reason: the registry keeps registration order,
  // so the consumer's dynamic ids sit between the static seed and the reason.
  injectDescribedByContribution(describedByKey, inputs.describedBy);
  injectDescribedByContribution(reasonId, reasonIds);
  // CngxButtonBrain provides the registry on its own element.
  const describedBy = inject(CNGX_DESCRIBED_BY, { self: true }).value;
  const hostType = computed<CngxButtonType | null>(() =>
    isButtonHost ? (inputs.type() ?? 'button') : null,
  );

  // Keyed on `blocked`, not on the own refusal: a runner that refuses or
  // runs renders aria-disabled too, and a co-located listener (RouterLink, a
  // consumer handler) must not act on an element that reads as disabled.
  // A click on an expanded popup trigger only closes what it opened, so it
  // passes: a run started by the opening click never leaves a menu that
  // cannot be clicked shut.
  const guard = (event: Event): void => {
    if (!blocked() || host.getAttribute('aria-expanded') === 'true') {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  host.addEventListener('click', guard, { capture: true });
  host.addEventListener('auxclick', guard, { capture: true });
  inject(DestroyRef).onDestroy(() => {
    host.removeEventListener('click', guard, { capture: true });
    host.removeEventListener('auxclick', guard, { capture: true });
  });

  return {
    variant,
    tone,
    size,
    busy,
    busyVisible,
    blocked,
    ariaDisabled,
    ariaBusy,
    describedBy,
    reasonId,
    activeReasonId: reasonIds,
    hostType,
  };
}
