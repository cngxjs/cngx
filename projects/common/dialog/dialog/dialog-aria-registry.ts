import { InjectionToken, type Signal } from '@angular/core';

/**
 * Labelling handle a title or description source registers with the
 * dialog's ARIA registry.
 *
 * `id` feeds the dialog's `aria-labelledby` / `aria-describedby`
 * derivation; `textContent` (title only) is read at announce time so the
 * live region speaks the current DOM text, not a cached first read.
 */
export interface DialogLabelHandle {
  /** Element id referenced from the dialog host's ARIA attributes. */
  readonly id: Signal<string>;

  /** Fresh text read for the open announce. Optional - descriptions are never announced. */
  readonly textContent?: () => string;
}

/**
 * Registration contract between `CngxDialog` and its labelling sources.
 *
 * Content queries only see nodes declared in the projection template, so a
 * programmatically opened dialog (content created into the outlet's
 * `ViewContainerRef`) is invisible to `contentChild()`. Sources therefore
 * push their handles through this token instead of being pulled by query -
 * the same inversion as `CNGX_POPOVER_ARROW_BOUNDS`.
 *
 * `CngxDialog` provides the token via `useExisting` and stays the single
 * owner of the `aria-describedby` derivation: directives sharing the dialog
 * host must never bind `attr.aria-describedby` themselves (two host
 * bindings on one attribute clobber each other) - they register an id here
 * and the dialog merges it.
 *
 * Each `register*` call returns a release function (single-slot per kind:
 * one title, one description, N anonymous describedby ids) - tie it to
 * `DestroyRef.onDestroy`.
 *
 * Internal contract - intentionally not exported from `public-api.ts`.
 */
export interface CngxDialogAriaRegistry {
  /** Register the labelling source for `aria-labelledby` and the open announce. */
  registerTitle(handle: DialogLabelHandle): () => void;

  /** Register the primary description source for `aria-describedby`. */
  registerDescription(handle: DialogLabelHandle): () => void;

  /** Register a supplemental `aria-describedby` id (e.g. an interaction instruction). */
  registerDescribedBy(id: Signal<string>): () => void;
}

/**
 * Injection token for the dialog ARIA registry.
 *
 * Provided by `CngxDialog` (`useExisting`) on the dialog element and by
 * `CngxDialogOpener` on the programmatic content's child injector.
 */
export const CNGX_DIALOG_ARIA_REGISTRY = new InjectionToken<CngxDialogAriaRegistry>(
  'CngxDialogAriaRegistry',
);
