// Not in lib.dom yet; Chromium only (Android back gesture, Escape).
interface CloseWatcherLike {
  onclose: (() => void) | null;
  destroy(): void;
}
type CloseWatcherCtor = new () => CloseWatcherLike;

/**
 * Handle returned by {@link createCloseWatcher}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/close-watcher.ts
 * @since 0.1.0
 */
export interface CngxCloseWatcher {
  /**
   * Creates a platform close watcher when none is armed. Idempotent. A watcher
   * is spent after it fires, so call `arm()` again to intercept the next back
   * gesture.
   */
  arm(): void;
  /** Destroys the armed watcher, if any. Idempotent. */
  disarm(): void;
}

function globalWindow(): Window | null {
  return typeof window === 'undefined' ? null : window;
}

/**
 * Wraps the platform `CloseWatcher` so a transient surface (sheet, drawer,
 * overlay) closes on the Android back gesture instead of leaving the page.
 *
 * Feature-detected on `win.CloseWatcher`: where the platform has none (iOS
 * Safari, Firefox, SSR) `arm()` and `disarm()` are no-ops. `onClose` runs once
 * per armed watcher; the watcher is spent afterwards, so a surface that stays
 * open (a blocked close) calls `arm()` again from `onClose`. Arm inside the
 * opening call: Chromium groups watchers created without user activation.
 *
 * Pure factory, no injection context. Pass the window from `injectWindow()`
 * so tests and SSR can swap it.
 *
 * @param onClose - Runs when the armed watcher fires.
 * @param win - Window to read `CloseWatcher` from. Defaults to the global window.
 * @returns A handle with `arm()` and `disarm()`.
 *
 * @example
 * ```ts
 * const watcher = createCloseWatcher(() => this.close(), injectWindow());
 * open() { watcher.arm(); }
 * close() { watcher.disarm(); }
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/close-watcher.ts
 * @since 0.1.0
 */
export function createCloseWatcher(
  onClose: () => void,
  win: Window | null = globalWindow(),
): CngxCloseWatcher {
  let current: CloseWatcherLike | null = null;

  const arm = (): void => {
    if (current !== null) {
      return;
    }
    const Watcher = (win as { CloseWatcher?: CloseWatcherCtor } | null)?.CloseWatcher;
    if (typeof Watcher !== 'function') {
      return;
    }
    const watcher = new Watcher();
    watcher.onclose = () => {
      // A destroyed watcher can still deliver a queued close; only the armed
      // one speaks for the surface.
      if (current !== watcher) {
        return;
      }
      current = null;
      onClose();
    };
    current = watcher;
  };

  const disarm = (): void => {
    const watcher = current;
    current = null;
    watcher?.destroy();
  };

  return { arm, disarm };
}
