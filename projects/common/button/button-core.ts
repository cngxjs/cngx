import { computed, ElementRef, inject, type Signal } from '@angular/core';
import { CNGX_ASYNC_RUN_STATE } from '@cngx/common/interactive';
import {
  CNGX_DESCRIBED_BY,
  createVisibilityGate,
  injectActivationGuard,
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
 * Input signals handed to {@link injectButtonCore}. Signal inputs must be class field
 * initialisers, so the class declares them.
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
  /** A run the host reflects that the runner does not own; folded into `busy`. */
  readonly hostBusy?: Signal<boolean>;
}

/**
 * Host fallbacks below the config.
 *
 * @internal
 */
export interface CngxButtonCoreDefaults {
  readonly variant: CngxButtonVariant;
  /** Axes pinned right after the input, ahead of the group and the config. */
  readonly fixed?: CngxButtonHostDescriptor['fixed'];
}

/** @internal */
export interface CngxButtonCore {
  readonly variant: Signal<CngxButtonVariant>;
  readonly tone: Signal<CngxButtonTone>;
  readonly size: Signal<CngxButtonSize>;
  /** A co-hosted run or a host-reflected run is in flight. Ungated. */
  readonly busy: Signal<boolean>;
  /**
   * The busy layer shows. The co-hosted runner's gate decides; without one, a gate over
   * `hostBusy` on the `CNGX_LOADING_CONFIG` timing.
   */
  readonly busyVisible: Signal<boolean>;
  /** Disabled, busy or refused by the co-hosted runner. The activation guard keys on it. */
  readonly blocked: Signal<boolean>;
  /** From `busyVisible`. */
  readonly busyAttr: Signal<'true' | null>;
  /** From `busy`. */
  readonly pendingAttr: Signal<'true' | null>;
  /** The co-hosted runner's value, else `blocked`. */
  readonly ariaDisabled: Signal<'true' | null>;
  /** Run, runner busy override, host run or held busy visual; matches the runner's value. */
  readonly ariaBusy: Signal<'true' | null>;
  /** The merged `aria-describedby`. */
  readonly describedBy: Signal<string | null>;
  readonly reasonId: string;
  /** `reasonId` while `disabled` has a reason, else `null`. */
  readonly activeReasonId: Signal<string | null>;
  /** The input or `'button'` on a `<button>`, `null` on an `<a>`. */
  readonly hostType: Signal<CngxButtonType | null>;
}

const DEFAULT_TONE: CngxButtonTone = 'neutral';
const DEFAULT_SIZE: CngxButtonSize = 'md';

/**
 * `input ?? group ?? config ?? md`, shared with the group addon so it sits on the buttons' row.
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
 * Derivation behind `CngxButtonBrain`. The activation guard is a capture-phase `click` /
 * `auxclick` listener: while `blocked` it stops every same-element handler (`RouterLink`,
 * `CngxAsyncClick` included) and prevents the default, implicit form submission included. A
 * click on an expanded popup trigger (`aria-expanded="true"`) passes, so it can close the popup.
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
  const asyncClickRefuses = computed(() => runState()?.enabled() === false);
  // What is painted busy refuses activation: the busy visual holds the block
  // through its dwell, after the run itself has settled.
  const blocked = computed(
    () => inputs.disabled() || busy() || busyVisible() || asyncClickRefuses(),
  );
  const busyAttr = computed<'true' | null>(() => (busyVisible() ? 'true' : null));
  const pendingAttr = computed<'true' | null>(() => (busy() ? 'true' : null));
  // The runner binds aria-disabled on the same host. When one is co-hosted
  // the button renders the runner's own value rather than an independently
  // computed equal one, so the two host bindings share a single source and
  // can never diverge whatever the write order. Without a runner the button
  // is the sole writer and uses its own blocked state. The fallback also
  // covers a runner that does not fold the host's refusal in (CngxAsyncClick
  // does, so for it the fallback never fires): blocked always reads disabled.
  const ownAriaDisabled = computed<'true' | null>(() => (blocked() ? 'true' : null));
  const ariaDisabled = computed<'true' | null>(
    () => runState()?.ariaDisabledAttr() ?? ownAriaDisabled(),
  );
  // Held with the busy visual, so what is painted busy reads busy and never
  // as a bare disabled through the dwell. With a runner it is the value the
  // runner renders on the same host (its run, its held busy visual, its
  // `[busy]` override and the host's run), so the two writers agree.
  const ariaBusy = computed<'true' | null>(() =>
    busy() || busyVisible() || (runState()?.busy() ?? false) ? 'true' : null,
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
  injectActivationGuard(() => blocked() && host.getAttribute('aria-expanded') !== 'true');

  return {
    variant,
    tone,
    size,
    busy,
    busyVisible,
    blocked,
    busyAttr,
    pendingAttr,
    ariaDisabled,
    ariaBusy,
    describedBy,
    reasonId,
    activeReasonId: reasonIds,
    hostType,
  };
}
