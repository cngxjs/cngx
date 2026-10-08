import {
  afterNextRender,
  effect,
  type ElementRef,
  inject,
  Injector,
  signal,
  type WritableSignal,
} from '@angular/core';
import { DefaultValueAccessor, NgControl } from '@angular/forms';

/**
 * The disabled flag `CngxFormBridge.setDisabledState` writes through
 * `CNGX_CONTROL_VALUE`, applied to the host input. Writes only on a change: an
 * initially disabled control lands here as `true` before the first run, while a
 * static `disabled` attribute on an unbridged input is never touched
 * (`false === false`). Never expose the result as `disabled`: `[formField]`
 * binds custom-control members by name.
 * @internal
 */
export function injectFormDisabled(el: ElementRef<HTMLInputElement>): WritableSignal<boolean> {
  const formDisabled = signal(false);
  let applied = false;
  effect(() => {
    const disabled = formDisabled();
    if (disabled === applied) {
      return;
    }
    applied = disabled;
    el.nativeElement.disabled = disabled;
  });
  return formDisabled;
}

/**
 * Warns when the host input landed on Angular's `DefaultValueAccessor` instead of
 * `CngxFormBridge`. Call it inside an `ngDevMode` guard, so production builds drop
 * the message text along with the check.
 * @internal
 */
export function injectDefaultAccessorWarning(message: string): void {
  const injector = inject(Injector);
  // Resolved lazily: injecting NgControl at construction cycles through
  // NG_VALUE_ACCESSOR -> CngxFormBridge -> CNGX_CONTROL_VALUE -> the host directive.
  afterNextRender(() => {
    const ngControl = injector.get(NgControl, null, { self: true });
    if (ngControl?.valueAccessor instanceof DefaultValueAccessor) {
      console.warn(message);
    }
  });
}
