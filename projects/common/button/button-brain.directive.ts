import {
  afterNextRender,
  ApplicationRef,
  booleanAttribute,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
} from '@angular/core';
import {
  CNGX_HOST_INTERACTION_STATE,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';
import { CNGX_DESCRIBED_BY, createDescribedByRegistry, injectLazySelf } from '@cngx/core/utils';
import { cngxDevWarn } from '@cngx/utils';

import { hasAccessibleName } from './accessible-name';
import { injectButtonCore } from './button-core';
import { CNGX_BUTTON_HOST, CNGX_BUTTON_HOST_STATE } from './button-host.token';
import { CNGX_BUTTON_STATE, type CngxButtonState } from './button-state.token';
import type {
  CngxButtonSize,
  CngxButtonTone,
  CngxButtonType,
  CngxButtonVariant,
} from './button.types';

/**
 * The state and ARIA contract of every cngx button, as a host directive. A
 * host declares it in `hostDirectives`, names itself through
 * `provideButtonHost`, and keeps only its template, CSS and its own
 * behaviour; the brain owns the rest on the host element.
 *
 * It resolves the axes (`input ?? fixed ?? group ?? config ?? default`;
 * tone skips the group) into `data-variant` / `data-tone` / `data-size`,
 * renders `disabled` as `aria-disabled` so the element stays focusable,
 * swallows activation in the capture phase while refusing, renders
 * `aria-busy` while a run is in flight (the co-hosted runner's or the
 * host's, with the same value the runner writes), and owns
 * `aria-describedby` through `CNGX_DESCRIBED_BY` (static ids, the
 * `cngxDescribedBy` ids, the reason while disabled, co-hosted contributors
 * such as `[cngxTooltip]`). A co-hosted runner is read through
 * `CNGX_ASYNC_RUN_STATE`: `data-pending` follows its run (the brain is the
 * only writer), `data-busy` its busy gate. A host adds refusal or a run of
 * its own through `CNGX_BUTTON_HOST_STATE`.
 *
 * Provides `CNGX_BUTTON_STATE` (read by `cngxSplitButton`),
 * `CNGX_HOST_INTERACTION_STATE` (read by a co-hosted `cngxAsyncClick` or
 * `cngxMenuTrigger`) and `CNGX_DESCRIBED_BY`. An `iconOnly` host is checked
 * for an accessible name once the app is stable and warns `CNGX1071`
 * without one.
 *
 * The host template renders the busy layer from `busyVisible()` and the
 * reason span with `[id]="brain.reasonId"`.
 *
 * ```ts
 * @Component({
 *   selector: 'button[appChipButton]',
 *   hostDirectives: [
 *     {
 *       directive: CngxButtonBrain,
 *       inputs: ['variant: appChipButton', 'tone', 'size', 'disabled', 'disabledReason', 'cngxDescribedBy', 'type'],
 *     },
 *   ],
 *   providers: [provideButtonHost('appChipButton', { defaultVariant: 'outline' })],
 *   template: `<ng-content /><span [id]="brain.reasonId" hidden>{{ brain.disabledReason() }}</span>`,
 * })
 * class AppChipButton {
 *   protected readonly brain = inject(CngxButtonBrain);
 * }
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-brain.directive.ts
 * @since 0.1.0
 * @relatedTo provideButtonHost, CNGX_BUTTON_HOST_STATE, CNGX_BUTTON_STATE, CngxButton, CngxAsyncClick
 * <example-url>/#/common/button/composition/custom-host</example-url>
 * @axis level molecule
 */
@Directive({
  standalone: true,
  exportAs: 'cngxButtonBrain',
  providers: [
    { provide: CNGX_BUTTON_STATE, useExisting: CngxButtonBrain },
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => inject(CngxButtonBrain).interaction,
    },
    {
      provide: CNGX_DESCRIBED_BY,
      useFactory: () =>
        createDescribedByRegistry({
          name: inject(CNGX_BUTTON_HOST).name,
          seed: inject(new HostAttributeToken('aria-describedby'), { optional: true }),
        }),
    },
  ],
  host: {
    '[attr.data-variant]': 'variantValue()',
    '[attr.data-tone]': 'toneValue()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-busy]': 'busyVisible() ? "true" : null',
    '[attr.data-pending]': 'busy() ? "true" : null',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-busy]': 'ariaBusy()',
    '[attr.aria-describedby]': 'describedByValue()',
    '[attr.type]': 'hostType()',
    // A static `disabled` attribute would make the native element
    // unfocusable; the input renders it as aria-disabled instead.
    '[attr.disabled]': 'null',
  },
})
export class CngxButtonBrain implements CngxButtonState {
  /**
   * Emphasis. Hosts alias it to their selector (`'variant: cngxButton'`),
   * so `cngxButton="outline"` lands here; `''` (the bare attribute) falls
   * through to the group, the config and the host default.
   */
  readonly variant = input<CngxButtonVariant | undefined, CngxButtonVariant | '' | undefined>(
    undefined,
    { transform: (v) => (v === '' ? undefined : v) },
  );

  /** Intent. Falls through to the pinned tone, the config and `neutral`. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Size. Falls through to the pinned size, the group, the config and `md`. */
  readonly size = input<CngxButtonSize | undefined>(undefined);

  /** Rendered as `aria-disabled`; the element stays focusable and activation is swallowed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Why the button is disabled; referenced through `aria-describedby` while `disabled` is set. */
  readonly disabledReason = input<string | undefined>(undefined);

  /**
   * Ids of external description elements, space-separated, joined into the
   * element's `aria-describedby` after a static `aria-describedby` and
   * before the disabled reason and co-hosted contributors. `null` removes
   * them.
   */
  readonly describedBy = input<string | null>(null, { alias: 'cngxDescribedBy' });

  /** Native `type` on a `<button>` host. Defaults to `'button'`; ignored on `<a>`. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  private readonly descriptor = inject(CNGX_BUTTON_HOST);
  // Read on first use: the host's factory injects the host component, which
  // injects this brain, so an eager read is a cycle.
  private readonly hostState = injectLazySelf(CNGX_BUTTON_HOST_STATE, { optional: true });

  private readonly hostBusy = computed(() => this.hostState()?.busy?.() ?? false);

  /**
   * `true` while activation is swallowed: `disabled`, the host's own
   * refusal or a run the host reflects.
   */
  readonly refusing = computed(
    () => this.disabled() || (this.hostState()?.refusing() ?? false) || this.hostBusy(),
  );

  private readonly core = injectButtonCore(
    {
      variant: this.variant,
      tone: this.tone,
      size: this.size,
      disabled: this.refusing,
      // The reason describes the own `disabled` only, never the host's refusal.
      disabledReason: computed(() => (this.disabled() ? this.disabledReason() : undefined)),
      describedBy: this.describedBy,
      type: this.type,
      hostBusy: this.hostBusy,
    },
    { variant: this.descriptor.defaultVariant, fixed: this.descriptor.fixed },
  );

  /** Resolved emphasis. */
  readonly variantValue = this.core.variant;
  /** Resolved intent. */
  readonly toneValue = this.core.tone;
  /** Resolved size. */
  readonly sizeValue = this.core.size;
  /** `true` while the co-hosted run is pending or the host reflects a run; the immediate truth. */
  readonly busy = this.core.busy;
  /** `true` while the busy layer shows (the runner's show delay and min-dwell applied). */
  readonly busyVisible = this.core.busyVisible;
  /** `true` while the button refuses activation: refusing, busy or refused by the co-hosted runner. */
  readonly blocked = this.core.blocked;
  /** Id the host template puts on its reason span. */
  readonly reasonId = this.core.reasonId;
  /** `reasonId` while it describes the element (`disabled` with a reason), else `null`. */
  readonly activeReasonId = computed(() =>
    this.disabled() && this.disabledReason() ? this.reasonId : null,
  );

  /**
   * What a co-hosted runner or trigger folds in. A host that overrides
   * `CNGX_HOST_INTERACTION_STATE` spreads it.
   */
  readonly interaction: CngxHostInteractionState = {
    disabled: this.refusing,
    busy: this.hostBusy,
  };

  protected readonly ariaDisabled = this.core.ariaDisabled;
  protected readonly ariaBusy = this.core.ariaBusy;
  protected readonly describedByValue = this.core.describedBy;
  protected readonly hostType = this.core.hostType;

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode && this.descriptor.iconOnly) {
      // After the app is stable, not after the first render: a label bound
      // in a later pass is a name too.
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      const appRef = inject(ApplicationRef);
      let destroyed = false;
      inject(DestroyRef).onDestroy(() => (destroyed = true));
      afterNextRender(() => {
        void appRef.whenStable().then(() => {
          if (destroyed || hasAccessibleName(host)) {
            return;
          }
          cngxDevWarn(
            'CNGX1071',
            `[${this.descriptor.name}] has no accessible name. Set aria-label, aria-labelledby or title on the host; the glyph alone is silent to assistive technology.`,
            host,
          );
        });
      });
    }
  }
}
