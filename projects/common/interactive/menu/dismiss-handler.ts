import { InjectionToken, signal, type Signal } from '@angular/core';

import type { CngxMenuConfig } from './menu-config';

/**
 * Structural contract the menu dismiss handler reads from the popover.
 * Mirrors the inline `PopoverController` shape in
 * `menu-trigger.directive.ts` / `context-menu-trigger.directive.ts` to keep
 * `@cngx/common/interactive` free of `@cngx/common/popover` imports - the
 * popover module already depends on this entry-point and the reverse
 * import would close a circular ng-packagr dependency.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuDismissPopoverRef {
  readonly isVisible: () => boolean;
  hide(): void;
  readonly elementRef: { readonly nativeElement: HTMLElement };
}

/**
 * Identifier for the dismissal path that fired most recently.
 *
 * - `outside-click` - pointerdown outside both the popover and the trigger
 *   host.
 * - `scroll` - window scroll while the menu is open.
 * - `blur` - window blur (system notification, OS-native context menu
 *   overlaying the cngx menu).
 * - `pointer-cancel` - document pointercancel originating OUTSIDE the
 *   popover and host (palm rejection from outside the menu, gesture
 *   cancelled by the browser). In-menu palm rejections do not dismiss.
 * - `escape` - document `keydown` matching the `Escape` key while the
 *   popover is visible. Detected by the factory's capture-phase keydown
 *   listener so the source is recorded regardless of where DOM focus
 *   sits (trigger button, menu container, or elsewhere).
 *
 *   **Intent, not effect.** The factory records `'escape'` synchronously
 *   on the keystroke and does NOT call `popover.hide()`. Whether the
 *   menu actually closes is owned by `CngxPopover.closeOnEscape`:
 *   consumers who set `[closeOnEscape]="false"` keep their menu open
 *   even though `lastSource` reports `'escape'`. The other sources
 *   (`outside-click`, `scroll`, `blur`, `pointer-cancel`) call
 *   `popover.hide()` themselves and so always coincide with an actual
 *   close - `'escape'` is the one source where intent and effect can
 *   diverge.
 *
 * @category common/interactive/menu
 */
export type CngxMenuDismissSource =
  | 'outside-click'
  | 'scroll'
  | 'blur'
  | 'pointer-cancel'
  | 'escape';

/**
 * Options for {@link createMenuDismissHandler}.
 *
 * Each boolean toggles its listener (pair) independently. When
 * `dismissOnBlur` is `true`, both window `blur` and document
 * `pointercancel` listeners install together - they represent the same
 * "context lost" semantic and consumers who want one rarely want the
 * other off.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuDismissHandlerOptions {
  /** Popover whose `.hide()` runs when any dismissal source fires. */
  readonly popover: CngxMenuDismissPopoverRef;
  /**
   * Trigger host element. Pointerdown / pointercancel events whose
   * target lies inside this element are NOT treated as dismissal -
   * interactions with the trigger itself should never close the menu
   * it just opened.
   */
  readonly hostElement: HTMLElement;
  /** Install document `pointerdown` outside-click listener. */
  readonly dismissOnOutsideClick: boolean;
  /** Install window `scroll` listener (capture, passive). */
  readonly dismissOnScroll: boolean;
  /**
   * Install window `blur` AND document `pointercancel` listeners.
   * Bundled together because both signal context loss. `pointercancel`
   * events whose target lies inside the popover or trigger host are
   * filtered out (in-menu palm rejection must not dismiss).
   */
  readonly dismissOnBlur: boolean;
  /**
   * Synchronous callback invoked from the DOM event handler whenever a
   * dismissal source fires. Runs AFTER `popover.hide()` so consumers
   * observing the source see the post-close state. Used by
   * {@link createMenuTriggerDismissBinding} to write a reactive
   * `lastSource` signal from outside any Angular `effect()` context.
   */
  readonly onDismiss?: (source: CngxMenuDismissSource) => void;
  /**
   * Sources whose listeners should NOT install even when their toggle
   * is `true`. Lets a consumer keep `dismissOnBlur: true` but skip the
   * bundled `pointer-cancel` listener (or vice versa) with a one-line
   * factory wrapper:
   *
   * ```ts
   * providers: [{
   *   provide: CNGX_MENU_DISMISS_HANDLER_FACTORY,
   *   useValue: (opts) => createMenuDismissHandler({
   *     ...opts,
   *     skipSources: new Set(['pointer-cancel']),
   *   }),
   * }]
   * ```
   *
   * `'escape'` may be skipped too; the popover's global Escape listener
   * still owns the close path, so skipping only stops the source from
   * being recorded on `lastSource`.
   */
  readonly skipSources?: ReadonlySet<CngxMenuDismissSource>;
}

/**
 * Handler returned by {@link createMenuDismissHandler}. Call `attach()`
 * once per menu open; invoke the returned teardown on close.
 *
 * Source observation runs through
 * {@link CngxMenuDismissHandlerOptions.onDismiss}; the handler exposes
 * no reactive state of its own so the trigger directive can store it as
 * a plain field rather than a signal (avoids a signal write inside the
 * `isOpen` effect).
 *
 * @category common/interactive/menu
 */
export interface CngxMenuDismissHandler {
  /**
   * Install the listeners enabled by the options. Returns a teardown
   * closure that removes every installed listener. Each `attach()` must
   * be balanced by exactly one teardown call.
   */
  attach(): () => void;
}

/**
 * Factory signature for {@link CNGX_MENU_DISMISS_HANDLER_FACTORY}.
 *
 * @category common/interactive/menu
 */
export type CngxMenuDismissHandlerFactory = (
  opts: CngxMenuDismissHandlerOptions,
) => CngxMenuDismissHandler;

/**
 * Default factory. Pure closure over `opts` - no Angular DI. Mirrors the
 * shape of `@cngx/forms/select`'s `createDismissHandler` so future
 * cross-family consolidation has a clean target.
 *
 * Override via {@link CNGX_MENU_DISMISS_HANDLER_FACTORY} for
 * telemetry-wrapped or test-doubled dismissal.
 *
 * @category common/interactive/menu
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/dismiss-handler.ts
 * @since 0.1.0
 */
export function createMenuDismissHandler(
  opts: CngxMenuDismissHandlerOptions,
): CngxMenuDismissHandler {
  const isInsidePopoverOrHost = (target: EventTarget | null): boolean => {
    if (!(target instanceof Node)) {
      return false;
    }
    return (
      opts.popover.elementRef.nativeElement.contains(target) ||
      opts.hostElement.contains(target)
    );
  };

  const fire = (source: CngxMenuDismissSource): void => {
    if (!opts.popover.isVisible()) {
      return;
    }
    opts.popover.hide();
    opts.onDismiss?.(source);
  };

  const attach = (): (() => void) => {
    const teardowns: (() => void)[] = [];
    const doc = opts.hostElement.ownerDocument;
    const win = doc.defaultView;
    const skip = opts.skipSources;

    // Escape detection. Records the source without calling popover.hide() -
    // `CngxPopover.closeOnEscape` owns the actual close decision, so a
    // consumer that disables escape-close on the popover still sees the
    // user's intent surface on `lastSource`. Installed unconditionally
    // because Escape is the canonical menu-dismissal key (WAI-ARIA APG
    // Menu Pattern); skip only via `opts.skipSources`.
    if (!skip?.has('escape')) {
      const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') {
          return;
        }
        if (!opts.popover.isVisible()) {
          return;
        }
        opts.onDismiss?.('escape');
      };
      doc.addEventListener('keydown', onKeyDown, true);
      teardowns.push(() => {
        doc.removeEventListener('keydown', onKeyDown, true);
      });
    }

    if (opts.dismissOnOutsideClick && !skip?.has('outside-click')) {
      const onPointerDown = (event: PointerEvent): void => {
        if (!opts.popover.isVisible()) {
          return;
        }
        if (isInsidePopoverOrHost(event.target)) {
          return;
        }
        fire('outside-click');
      };
      doc.addEventListener('pointerdown', onPointerDown, true);
      teardowns.push(() => {
        doc.removeEventListener('pointerdown', onPointerDown, true);
      });
    }

    if (opts.dismissOnScroll && !skip?.has('scroll') && win) {
      const onScroll = (): void => fire('scroll');
      win.addEventListener('scroll', onScroll, { capture: true, passive: true });
      teardowns.push(() => {
        win.removeEventListener('scroll', onScroll, { capture: true });
      });
    }

    if (opts.dismissOnBlur) {
      if (win && !skip?.has('blur')) {
        const onBlur = (): void => fire('blur');
        win.addEventListener('blur', onBlur);
        teardowns.push(() => {
          win.removeEventListener('blur', onBlur);
        });
      }
      // Filter pointercancel against the popover and host so in-menu palm
      // rejection (touch noise inside the open menu) does not dismiss.
      // Outside-targeted cancellation still fires - matches the
      // "context lost" semantics the blur listener covers.
      if (!skip?.has('pointer-cancel')) {
        const onPointerCancel = (event: PointerEvent): void => {
          if (!opts.popover.isVisible()) {
            return;
          }
          if (isInsidePopoverOrHost(event.target)) {
            return;
          }
          fire('pointer-cancel');
        };
        doc.addEventListener('pointercancel', onPointerCancel);
        teardowns.push(() => {
          doc.removeEventListener('pointercancel', onPointerCancel);
        });
      }
    }

    return () => {
      for (const t of teardowns) {
        t();
      }
    };
  };

  return { attach };
}

/**
 * Factory token for {@link CngxMenuDismissHandler}. Default
 * {@link createMenuDismissHandler}. Override via
 * `{ provide: CNGX_MENU_DISMISS_HANDLER_FACTORY, useFactory: () => myHandler }`
 * at app root for telemetry instrumentation, or in `viewProviders` for a
 * single feature scope.
 *
 * @category common/interactive/menu
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/dismiss-handler.ts
 * @since 0.1.0
 */
export const CNGX_MENU_DISMISS_HANDLER_FACTORY = new InjectionToken<CngxMenuDismissHandlerFactory>(
  'CngxMenuDismissHandlerFactory',
  {
    providedIn: 'root',
    factory: () => createMenuDismissHandler,
  },
);

/**
 * Options for {@link createMenuTriggerDismissBinding}. The popover is
 * passed as a thunk because trigger directives resolve their popover
 * input lazily (after Angular binds inputs) - the binding cannot capture
 * the concrete reference at construction time.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuTriggerDismissBindingOptions {
  readonly popover: () => CngxMenuDismissPopoverRef;
  readonly hostElement: HTMLElement;
  readonly menuConfig: CngxMenuConfig;
  readonly factory: CngxMenuDismissHandlerFactory;
  /**
   * Synchronous notification invoked from the DOM event handler after
   * the binding's `lastSource` signal is updated. Trigger directives
   * use it to call `CngxMenuAnnouncer.announce(...)` so screen readers
   * hear which path closed the menu. Runs from the same call stack as
   * the source DOM event - safe for signal reads.
   */
  readonly onDismiss?: (source: CngxMenuDismissSource) => void;
}

/**
 * Trigger-side dismiss lifecycle. Owns the reactive `lastSource` signal
 * and the attach/detach pair both trigger directives invoke from their
 * `isOpen` effect. Extracted so `CngxMenuTrigger` and
 * `CngxContextMenuTrigger` share the same wiring without forking it.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuTriggerDismissBinding {
  /**
   * Resolve the popover thunk, instantiate the handler on first call,
   * and install its listeners. Idempotent within a single open cycle.
   */
  attach(): void;
  /** Remove the listeners installed by the last `attach()`. Idempotent. */
  detach(): void;
  /**
   * The dismissal source that closed the menu most recently. `null`
   * before the first close. Read by templates / telemetry sinks.
   */
  readonly lastSource: Signal<CngxMenuDismissSource | null>;
}

/**
 * Build the dismiss lifecycle for a menu-bearing trigger directive.
 * Lazily instantiates the handler on first `attach()` so the trigger's
 * popover input is bound before the factory reads it. The returned
 * `lastSource` signal is owned by this binding - the factory writes it
 * via its `onDismiss` callback, which runs from DOM event handlers
 * (never inside an Angular `effect()`).
 *
 * @category common/interactive/menu
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/dismiss-handler.ts
 * @since 0.1.0
 */
export function createMenuTriggerDismissBinding(
  opts: CngxMenuTriggerDismissBindingOptions,
): CngxMenuTriggerDismissBinding {
  const _lastSource = signal<CngxMenuDismissSource | null>(null);
  let handler: CngxMenuDismissHandler | null = null;
  let teardown: (() => void) | null = null;

  const attach = (): void => {
    if (teardown !== null) {
      return;
    }
    // Stable-input assumption: the popover thunk and menuConfig snapshot
    // resolve once at first open and are reused for the directive's
    // lifetime. Trigger directives bind popover via input.required (stable
    // post-mount) and read menuConfig once from injectMenuConfig(); a
    // future config-swap path would need to invalidate `handler` here.
    handler ??= opts.factory({
      popover: opts.popover(),
      hostElement: opts.hostElement,
      dismissOnOutsideClick: opts.menuConfig.dismissOnOutsideClick,
      dismissOnScroll: opts.menuConfig.dismissOnScroll,
      dismissOnBlur: opts.menuConfig.dismissOnBlur,
      onDismiss: (source) => {
        _lastSource.set(source);
        opts.onDismiss?.(source);
      },
    });
    teardown = handler.attach();
  };

  const detach = (): void => {
    if (teardown === null) {
      return;
    }
    teardown();
    teardown = null;
  };

  return {
    attach,
    detach,
    lastSource: _lastSource.asReadonly(),
  };
}
