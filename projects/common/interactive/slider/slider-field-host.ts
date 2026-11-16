import { computed, inject, Injector, type Signal } from '@angular/core';

import { CNGX_FORM_FIELD_CONTROL, CNGX_FORM_FIELD_HOST } from '@cngx/core/tokens';

/**
 * What a slider track takes from a surrounding `cngx-form-field`.
 * @internal
 */
export interface CngxSliderFieldHost {
  /** The field's `aria-describedby` ids while it bridges this track, else `null`. */
  readonly describedBy: Signal<string | null>;
  /** Whether the field that bridges this track is disabled. */
  readonly disabled: Signal<boolean>;
}

/**
 * Reads the surrounding field for a slider track. The field applies only
 * while the control it discovered sits on the track's own element (a
 * `cngxSliderFieldBridge` next to the track); a bare slider that merely sits
 * in a field takes nothing. The control is looked up lazily: the bridge
 * injects the track, so resolving it during construction would be a cycle.
 *
 * Keeps the track the single writer of `aria-describedby` and lets a
 * consumer `[disabled]` stay in force while the field toggles its own.
 * Must run in an injection context.
 * @internal
 */
export function injectSliderFieldHost(): CngxSliderFieldHost {
  const host = inject(CNGX_FORM_FIELD_HOST, { optional: true });
  const injector = inject(Injector);
  let own: object | null | undefined;
  const isFieldControl = computed(() => {
    const control = host?.control?.();
    if (!control) {
      return false;
    }
    own ??= injector.get(CNGX_FORM_FIELD_CONTROL, null, { self: true, optional: true });
    return control === own;
  });
  return {
    describedBy: computed(() => {
      const ids = isFieldControl() ? (host?.describedBy?.() ?? '') : '';
      return ids === '' ? null : ids;
    }),
    disabled: computed(() => isFieldControl() && host?.disabled?.() === true),
  };
}
