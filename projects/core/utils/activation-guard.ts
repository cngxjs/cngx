import { DestroyRef, ElementRef, inject } from '@angular/core';

/**
 * Swallows every `click` and `auxclick` on the injection host while
 * `refuses()` returns `true`.
 *
 * Reach for it on a host that renders its disabled state as `aria-disabled`
 * instead of the native `disabled` attribute. The element stays focusable,
 * so the reason it is disabled can be reached by keyboard and announced on
 * focus, but the browser no longer blocks activation on its own: a click,
 * and the click a browser synthesises for Space or Enter on a `<button>`,
 * still dispatches. This guard restores the refusal.
 *
 * The listener runs in the capture phase on the host itself. It is
 * registered when the host's injection context runs, before any template
 * `(click)` binding or co-located directive listener on the same element,
 * so `stopImmediatePropagation()` keeps all of them (consumer handlers,
 * `RouterLink`) from acting on an element that reads as disabled.
 * `preventDefault()` cancels the default action: link navigation, form
 * submission and the implicit submission a click on the default button
 * triggers.
 *
 * `refuses` is read at event time, never tracked, so it may read a signal,
 * a DOM attribute or a mix of both. Pass a `Signal<boolean>` directly when
 * the refusal is a single signal. Both listeners are removed when the host
 * is destroyed.
 *
 * Call it in an injection context that owns an `ElementRef`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/activation-guard.ts
 * @relatedTo injectDescribedByContribution
 * @since 0.1.0
 */
export function injectActivationGuard(refuses: () => boolean): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const guard = (event: Event): void => {
    if (!refuses()) {
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
}
