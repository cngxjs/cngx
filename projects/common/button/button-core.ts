import {
  computed,
  DestroyRef,
  ElementRef,
  HostAttributeToken,
  inject,
  Injector,
  type Provider,
  type Signal,
} from '@angular/core';
import { CngxAsyncClick } from '@cngx/common/interactive';
import {
  CNGX_DESCRIBED_BY,
  createDescribedByRegistry,
  injectDescribedByContribution,
  nextUid,
} from '@cngx/core/utils';

import { injectButtonConfig, type CngxButtonConfig } from './button-config';
import { CNGX_BUTTON_GROUP, type CngxButtonGroupContext } from './button-group.token';
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
}

/**
 * Class-level fallbacks used when neither input, group nor config sets an
 * axis.
 *
 * @internal
 */
export interface CngxButtonCoreDefaults {
  readonly variant: CngxButtonVariant;
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
  /** `true` while a co-hosted `CngxAsyncClick` runs its action. */
  readonly busy: Signal<boolean>;
  /** `true` while the button refuses activation: disabled, busy or refused by the co-hosted `CngxAsyncClick`. */
  readonly blocked: Signal<boolean>;
  /** `aria-disabled` rendered from `blocked`. */
  readonly ariaDisabled: Signal<'true' | null>;
  /**
   * The element's merged `aria-describedby`: the consumer's static ids, the
   * `cngxDescribedBy` ids, the reason id while disabled with a reason, and
   * the ids of co-hosted contributors such as `[cngxTooltip]`.
   */
  readonly describedBy: Signal<string | null>;
  readonly reasonId: string;
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
 * Element-level `aria-describedby` owner of a button host. Seeds the
 * registry with the consumer's static `aria-describedby`, so those ids
 * survive the host binding, and lets a co-hosted `[cngxTooltip]` contribute
 * its id instead of overwriting the attribute.
 *
 * @internal
 */
export function provideButtonDescribedBy(name: string): Provider {
  return {
    provide: CNGX_DESCRIBED_BY,
    useFactory: () =>
      createDescribedByRegistry({
        name,
        seed: inject(new HostAttributeToken('aria-describedby'), { optional: true }),
      }),
  };
}

/**
 * Shared brain of the button family. Resolves the three visual axes
 * (`input ?? group ?? config ?? default`), renders `disabled` as
 * `aria-disabled` so the element stays focusable, swallows activation while
 * disabled and reads the busy bit of a co-hosted `CngxAsyncClick`.
 *
 * The activation guard is a capture-phase listener on the host: it runs
 * before any bubbling `(click)` handler on the same element (consumer
 * handlers, `RouterLink`, `CngxAsyncClick`), stops them and prevents the
 * default action (link navigation, form submission, including the implicit
 * submission a browser triggers through a click on the default button).
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
  // Resolved on first read, not at construction: CngxAsyncClick injects the
  // CNGX_HOST_INTERACTION_STATE this button provides, so an eager inject in
  // either direction is a cycle.
  const injector = inject(Injector);
  let asyncClick: CngxAsyncClick | null | undefined;
  const coHostedAsyncClick = (): CngxAsyncClick | null =>
    (asyncClick ??= injector.get(CngxAsyncClick, null, { self: true, optional: true }));
  const reasonId = nextUid('cngx-button-reason-');
  const describedByKey = nextUid('cngx-button-describedby-');
  const isButtonHost = host.tagName === 'BUTTON';

  const variant = computed<CngxButtonVariant>(
    () => inputs.variant() ?? group?.variant() ?? config.variant ?? defaults.variant,
  );
  const tone = computed<CngxButtonTone>(() => inputs.tone() ?? config.tone ?? DEFAULT_TONE);
  const size = computed<CngxButtonSize>(
    () => resolveButtonSize(inputs.size(), group, config),
  );
  const busy = computed(() => coHostedAsyncClick()?.pending() ?? false);
  // CngxAsyncClick binds aria-disabled on the same host and only rewrites it
  // when its own value changes, so the button folds the directive's
  // `[enabled]="false"` in; otherwise a disabled -> enabled flip here writes
  // null while the directive still refuses clicks.
  const asyncClickRefuses = computed(() => coHostedAsyncClick()?.enabled() === false);
  const blocked = computed(() => inputs.disabled() || busy() || asyncClickRefuses());
  const ariaDisabled = computed<'true' | null>(() => (blocked() ? 'true' : null));
  const reasonIds = computed(() =>
    inputs.disabled() && inputs.disabledReason() ? reasonId : null,
  );
  // Contributed before the reason: the registry keeps registration order,
  // so the consumer's dynamic ids sit between the static seed and the reason.
  injectDescribedByContribution(describedByKey, inputs.describedBy);
  // The host provides the registry (provideButtonDescribedBy), so the
  // fallback only covers a class that forgot it.
  const describedBy =
    injectDescribedByContribution(reasonId, reasonIds)?.value ??
    computed(() => [inputs.describedBy(), reasonIds()].filter(Boolean).join(' ') || null);
  const hostType = computed<CngxButtonType | null>(() =>
    isButtonHost ? (inputs.type() ?? 'button') : null,
  );

  const guard = (event: Event): void => {
    if (!inputs.disabled()) {
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

  return { variant, tone, size, busy, blocked, ariaDisabled, describedBy, reasonId, hostType };
}
