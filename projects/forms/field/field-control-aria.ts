import { computed, signal, type Signal } from '@angular/core';

import type { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Options for {@link createFieldControlAria}.
 *
 * @category forms/field
 */
export interface FieldControlAriaOptions {
  /** Host id when no surrounding field supplies one. Default `''`. */
  readonly fallbackId?: string;
  /**
   * Control-local disabled knob OR'd with the field's disabled state
   * (the `CngxRating` / `CngxPhoneInput` pattern). Omit for bridges whose
   * disabled derives from the field alone.
   */
  readonly localDisabled?: () => boolean;
  /**
   * Disabled-reason `aria-describedby` gating. The reason id is appended
   * only while the control is disabled *with* a reason. accname 1.2 §2A
   * traverses a directly-referenced hidden node, so emitting the id
   * whenever a reason is merely set would announce the reason on an
   * enabled control (a `disabledReason` bound statically while `disabled`
   * is false), the same gating CngxCard uses.
   */
  readonly disabledReason?: {
    readonly id: string;
    readonly reason: () => string;
  };
}

/**
 * Signals and handlers returned from {@link createFieldControlAria}.
 *
 * @category forms/field
 */
export interface FieldControlAria {
  /** Presenter `inputId`, else the configured fallback. */
  readonly id: Signal<string>;
  /** Field disabled, OR'd with `localDisabled` when configured. */
  readonly disabled: Signal<boolean>;
  /** Presenter `showError`, `false` without a field. */
  readonly errorState: Signal<boolean>;
  readonly focused: Signal<boolean>;
  /** Field-supplied ids plus the gated disabled-reason id. */
  readonly describedBy: Signal<string | null>;
  readonly labelledBy: Signal<string | null>;
  readonly ariaInvalid: Signal<true | null>;
  readonly ariaRequired: Signal<true | null>;
  readonly ariaBusy: Signal<true | null>;
  readonly ariaErrorMessage: Signal<string | null>;
  readonly ariaReadonly: Signal<true | null>;
  readonly ariaDisabled: Signal<true | null>;
  readonly handleFocusIn: () => void;
  /**
   * Same-element bridge blur: unfocus unconditionally and mark the field
   * as touched.
   */
  readonly handleFocusOut: () => void;
  /**
   * Composite-host blur: unfocus only when focus leaves the host subtree
   * (internal focus moves between parts keep the focused state). Does not
   * touch the field - composite hosts own their touched semantics.
   */
  readonly handleFocusOutWithin: (event: FocusEvent, host: Node) => void;
}

/**
 * Field-control ARIA scaffolding shared by every control that provides
 * `CNGX_FORM_FIELD_CONTROL` against a surrounding `cngx-form-field`:
 * id/disabled/errorState/focused plus the ARIA projection
 * (describedby/labelledby/invalid/required/busy/errormessage/readonly/
 * disabled) and the focus handlers. Sibling of {@link createFieldSync};
 * unlike the sync it needs no injection context - the caller passes its
 * (optional) presenter.
 *
 * The host still owns its bindings: each directive binds only the
 * signals its host template declares, and control-specific surfaces
 * (`empty`, `aria-label` fallbacks) stay in the control.
 *
 * @category forms/field
 * @since 0.1.0
 * @relatedTo CngxFormFieldPresenter, CNGX_FORM_FIELD_CONTROL, createFieldSync
 */
export function createFieldControlAria(
  presenter: CngxFormFieldPresenter | null,
  options: FieldControlAriaOptions = {},
): FieldControlAria {
  const fallbackId = options.fallbackId ?? '';
  const focusedState = signal(false);

  const id = computed<string>(() => presenter?.inputId() ?? fallbackId);
  const disabled = computed<boolean>(
    () => (options.localDisabled?.() ?? false) || (presenter?.disabled() ?? false),
  );
  const errorState = computed<boolean>(() => presenter?.showError() ?? false);

  const describedBy = computed<string | null>(() => {
    const fieldIds = presenter?.describedBy() ?? null;
    const reason = options.disabledReason;
    const reasonId = reason && disabled() && reason.reason() ? reason.id : null;
    return [fieldIds, reasonId].filter(Boolean).join(' ') || null;
  });

  return {
    id,
    disabled,
    errorState,
    focused: focusedState.asReadonly(),
    describedBy,
    labelledBy: computed(() => presenter?.labelId() ?? null),
    ariaInvalid: computed(() => (errorState() ? true : null)),
    ariaRequired: computed(() => (presenter?.required() ? true : null)),
    ariaBusy: computed(() => (presenter?.pending() ? true : null)),
    ariaErrorMessage: computed(() => (errorState() ? (presenter?.errorId() ?? null) : null)),
    ariaReadonly: computed(() => (presenter?.readonly() ? true : null)),
    ariaDisabled: computed(() => (disabled() ? true : null)),
    handleFocusIn: () => {
      focusedState.set(true);
    },
    handleFocusOut: () => {
      focusedState.set(false);
      presenter?.fieldState().markAsTouched();
    },
    handleFocusOutWithin: (event, host) => {
      const next = event.relatedTarget as Node | null;
      if (!host.contains(next)) {
        focusedState.set(false);
      }
    },
  };
}
