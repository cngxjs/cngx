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
  Injector,
  input,
} from '@angular/core';
import {
  CNGX_HOST_INTERACTION_STATE,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';
import { CNGX_DESCRIBED_BY, createDescribedByRegistry, injectLazySelf } from '@cngx/core/utils';
import { cngxDevWarn, CngxRuntimeError } from '@cngx/utils';

import { hasAccessibleName } from './accessible-name';
import { injectButtonCore } from './button-core';
import {
  CNGX_BUTTON_HOST,
  CNGX_BUTTON_HOST_STATE,
  type CngxButtonHostDescriptor,
} from './button-host.token';
import { injectButtonSpinner } from './button-spinner.token';
import { CNGX_BUTTON_STATE, type CngxButtonState } from './button-state.token';
import type {
  CngxButtonSize,
  CngxButtonTone,
  CngxButtonType,
  CngxButtonVariant,
} from './button.types';

/**
 * The state and ARIA contract of every cngx button, as a host directive. Declare it in
 * `hostDirectives` and name the host with `provideButtonHost`; the host keeps its template and
 * CSS. The attributes it writes and a full host are in the README, "Building a custom button
 * host".
 *
 * Provides `CNGX_BUTTON_STATE` (read by `cngxSplitButton`), `CNGX_HOST_INTERACTION_STATE` (read
 * by a co-hosted `cngxAsyncClick` or `cngxMenuTrigger`) and `CNGX_DESCRIBED_BY`.
 *
 * An `iconOnly` host without an accessible name after two stable cycles warns
 * [`CNGX1071`](/error-codes/cngx1071.md). A host without `provideButtonHost` throws
 * [`CNGX1075`](/error-codes/cngx1075.md).
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-brain.directive.ts
 * @since 0.1.0
 * @relatedTo provideButtonHost, CNGX_BUTTON_HOST_STATE, CNGX_BUTTON_STATE, CngxButton, CngxAsyncClick, CNGX_BUTTON_HOST, CngxIconButton, CngxCloseButton, CNGX_ASYNC_RUN_STATE, provideActionStatusHost
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
          name: injectButtonHostDescriptor().name,
          seed: inject(new HostAttributeToken('aria-describedby'), { optional: true }),
        }),
    },
  ],
  host: {
    '[attr.data-variant]': 'variantValue()',
    '[attr.data-tone]': 'toneValue()',
    '[attr.data-size]': 'sizeValue()',
    '[attr.data-busy]': 'busyAttr()',
    '[attr.data-pending]': 'pendingAttr()',
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
  /** Emphasis. Hosts alias it to their selector; `''` (bare attribute) falls through. */
  readonly variant = input<CngxButtonVariant | undefined, CngxButtonVariant | '' | undefined>(
    undefined,
    { transform: (v) => (v === '' ? undefined : v) },
  );

  /** Intent. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Size. */
  readonly size = input<CngxButtonSize | undefined>(undefined);

  /** Rendered as `aria-disabled`: stays focusable, activation is swallowed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Why the button is disabled; referenced through `aria-describedby` while `disabled` is set. */
  readonly disabledReason = input<string | undefined>(undefined);

  /**
   * Space-separated description ids. Bind runtime ids here, not through
   * `[attr.aria-describedby]`: the static attribute is read once at creation. Merged after the
   * static attribute, before the disabled reason and co-hosted contributors (`[cngxTooltip]`).
   */
  readonly describedBy = input<string | null>(null, { alias: 'cngxDescribedBy' });

  /** Native `type` on a `<button>` host, `'button'` by default; ignored on `<a>`. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  private readonly descriptor = injectButtonHostDescriptor();
  // Read on first use: the host's factory injects the host component, which
  // injects this brain, so an eager read is a cycle.
  private readonly hostState = injectLazySelf(CNGX_BUTTON_HOST_STATE, { optional: true });

  private readonly hostBusy = computed(() => this.hostState()?.busy?.() ?? false);

  /** `disabled`, the host's own refusal or a run the host reflects. */
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
  /** A co-hosted run is pending or the host reflects one. Ungated. */
  readonly busy = this.core.busy;
  /** The busy layer shows, gated on the `CNGX_LOADING_CONFIG` show delay and min-dwell. */
  readonly busyVisible = this.core.busyVisible;
  /**
   * Refusing, busy or refused by the co-hosted runner. Every click is swallowed except the one that
   * closes an expanded popup.
   */
  readonly blocked = this.core.blocked;
  /** Busy glyph from `provideButtonSpinner`, or `null` for the built-in spinner. */
  readonly spinner = injectButtonSpinner();

  /** Id the host template puts on its reason span. */
  readonly reasonId = this.core.reasonId;
  /** `reasonId` while `disabled` has a reason, else `null`. */
  readonly activeReasonId = this.core.activeReasonId;

  /**
   * Folded in by a co-hosted runner or trigger. Spread it when overriding
   * `CNGX_HOST_INTERACTION_STATE`.
   */
  readonly interaction: CngxHostInteractionState = {
    disabled: this.refusing,
    busy: this.hostBusy,
  };

  protected readonly busyAttr = this.core.busyAttr;
  protected readonly pendingAttr = this.core.pendingAttr;
  protected readonly ariaDisabled = this.core.ariaDisabled;
  protected readonly ariaBusy = this.core.ariaBusy;
  protected readonly describedByValue = this.core.describedBy;
  protected readonly hostType = this.core.hostType;

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode && this.descriptor.iconOnly) {
      // After the app is stable, not after the first render: a label bound
      // in a later pass is a name too. A miss is looked at once more on the
      // next stable cycle, so a label that lands after the first one does
      // not warn either.
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      const appRef = inject(ApplicationRef);
      const injector = inject(Injector);
      let destroyed = false;
      inject(DestroyRef).onDestroy(() => (destroyed = true));
      const onStableCycle = (check: () => void): void => {
        afterNextRender(() => void appRef.whenStable().then(check), { injector });
      };
      onStableCycle(() => {
        if (destroyed || hasAccessibleName(host)) {
          return;
        }
        onStableCycle(() => {
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

/** The host's `CNGX_BUTTON_HOST` descriptor, or throws `CNGX1075`. */
function injectButtonHostDescriptor(): CngxButtonHostDescriptor {
  const descriptor = inject(CNGX_BUTTON_HOST, { self: true, optional: true });
  if (descriptor) {
    return descriptor;
  }
  const tag = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName.toLowerCase();
  throw new CngxRuntimeError(
    'CNGX1075',
    typeof ngDevMode !== 'undefined' &&
      ngDevMode &&
      `[cngxButtonBrain] on <${tag}> has no host descriptor. Add provideButtonHost(name, { defaultVariant }) to the providers of the component or directive that declares CngxButtonBrain in its hostDirectives.`,
  );
}
