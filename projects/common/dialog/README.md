# @cngx/common/dialog

Dialog system built on the native `<dialog>` element. Reactive lifecycle, deterministic focus and scroll-lock, nested dialog stacking. No CDK Overlay, no z-index management.

## When you reach for it

You need a dialog and want the browser to do the heavy lifting:

- A confirmation modal where the user picks one of two outcomes.
- A form that should stay open while saving and close itself when the save succeeds - or stay open with an error annotation when it fails.
- A wizard or multi-step flow where you re-open the same dialog as the user advances.
- A non-modal popover that floats above the page without trapping focus.
- A nested dialog (a confirm on top of an editor) that should not double-stack the backdrop.
- A mobile bottom sheet with a slide-up animation and swipe-to-dismiss.
- A draggable, persistent panel anchored to viewport coordinates.

If you want a small inline overlay anchored to a trigger - popover, tooltip, hovercard - that is `@cngx/common/popover`, not this entry.

## Two modes

Both modes share the same primitives and the same lifecycle. Pick the mode that matches how the dialog is authored, not what it does.

- **Declarative.** Place `<dialog cngxDialog>` directly in the template. Get a typed reference with `#dlg="cngxDialog"` and drive it from the surrounding template. No service, no boilerplate, no late wiring. The right default when the dialog markup belongs to one component and is opened from the same component.
- **Programmatic.** Inject `CngxDialogOpener` and call `open(MyDialogComponent, config)` from code. The right choice for dialogs that fan out from many call sites, are rendered from a route guard, or carry isolated content components. The API mirrors `MatDialog` so migrations stay mechanical.

## Lifecycle as UX

Every dialog walks through `closed → opening → open → closing → closed`. The transition states are part of the public surface, not internal animation bookkeeping that consumers should ignore.

Why they exist:

- **`opening` and `closing` give CSS time.** Animations run on the transition states; the dialog does not finalize until the browser reports `transitionend`. There is no hardcoded `setTimeout` waiting for fade-out to "probably be done." Disable transitions and the finalization is immediate.
- **Focus restoration is automatic.** The element that was focused when `open()` was called is captured. On close, focus returns there. If the trigger has been removed from the DOM in the meantime, focus falls back to a consumer-supplied element.
- **Scroll lock is ref-counted.** Modal dialogs lock `<html>` scrolling for the duration. Two concurrent modals coordinate so the lock only releases when the last one closes - closing one of two stacked dialogs does not let the page scroll out from under the user.

The `result()` signal is `undefined` while the dialog is open, becomes the close value once it settles, or becomes the literal string `'dismissed'` when the user closed without picking a value. Reading the result reactively is the standard pattern - no `subscribe`, no manual cleanup.

## Async submit

`[submitAction]` turns a form dialog into a transactional surface. When the user clicks save, the action runs while the dialog stays open. The dialog blocks close and announces `aria-busy` while pending; on success it auto-closes with the result; on error it stays open, applies an error class, and surfaces the error to the screen reader.

Bind the dialog's `submitState` to a `[cngxToastOn]` or `[cngxBannerOn]` outside the dialog and the feedback layer wires itself with no extra plumbing - the dialog is a producer of `CngxAsyncState` like any other.

If the consumer wants to own the lifecycle entirely (custom retry-with-backoff, optimistic local cache update, etc.), bind `[state]` directly and skip `[submitAction]`. The external state takes precedence.

## Nested dialogs

Open a dialog from inside another dialog and the stack just works. The topmost dialog renders its backdrop; the ones underneath suppress theirs so the user never sees a tower of overlapping semi-transparent layers darkening into opaqueness. Closing the top dialog returns the backdrop to the one below it, and so on, ref-counted down to zero.

There is no consumer configuration for this. Open dialogs nest correctly out of the box. For isolated stacking (a portal subtree that should not see the outer stack), the stack service can be provided locally.

## Bottom sheet and draggable

Two opt-in directives extend the base dialog without forking it:

- **`CngxBottomSheet`** anchors a modal dialog to the viewport bottom, animates slide-up, and renders a drag-affordance handle. Combined with `CngxSwipeDismiss` on the same host, swipe-to-dismiss is auto-wired - the consumer does not bind a `(swiped)` event.
- **`CngxDialogDraggable`** turns any dialog into a draggable panel. Position is exposed as CSS custom properties so the theme applies the transform; keyboard navigation is wired automatically (arrows for fine moves, Shift+arrows for coarse, Home to reset). Optional grid snap and viewport-clamp inputs cover the common ergonomic requests.

## Non-modal

`[modal]="false"` opens the dialog via the native `show()` method instead of `showModal()`. No backdrop, no focus trap, no scroll lock, no `aria-modal`. The browser also does not announce that a non-modal dialog opened - a sibling `aria-live` region near the trigger is the consumer's responsibility, and a dev-mode warning fires when one is missing.

Use non-modal for floating panels that should not preempt the page. Most product dialogs are modal; reach for non-modal deliberately.

## Accessibility

The dialog system is built around the native `<dialog>` element, which is the only WAI-ARIA conformant primitive for modal dialogs in current browsers. The implications you should know:

- **`aria-labelledby` and `aria-describedby` are wired automatically** from `[cngxDialogTitle]` and `[cngxDialogDescription]` content children. Place them in the template; the linkage is reactive.
- **Title announcement.** When a modal dialog transitions to `'open'`, the title text is announced through a polite live region. Screen-reader users hear the dialog purpose without an explicit `aria-live` element.
- **Icon-only close buttons** need an explicit `aria-label`. The library does not invent labels.
- **Multi-step content** - wizards, tabbed dialogs, paginated forms - is the consumer's responsibility. The dialog moves focus once on open. After that, calling `.focus()` on the first element of the new step is on you.
- **Error state.** Bind `[error]` to apply `aria-invalid="true"` and the `cngx-dialog--error` class. Pair with a `cngx-form-errors` block (or any `role="alert"` region) inside the dialog for WCAG-compliant form-error announcements.
- **Reduced motion.** The theme honors `prefers-reduced-motion: reduce` - open and close transitions disable themselves automatically.

## See also

- Directive selectors, signals, methods, inputs, and CSS custom properties in the **API** tab of the generated docs.
- Migration mapping from `MatDialog` (provider, data token, ref token, result type) in the API tab - every `Mat*` symbol has a `Cngx*` equivalent.
- Live demos under `examples/stories/common/dialog/` cover declarative, programmatic, submit-action, bottom sheet, draggable, and nested patterns.

