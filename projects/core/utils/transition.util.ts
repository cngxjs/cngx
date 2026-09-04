/**
 * Checks whether an element has any CSS transition applied.
 *
 * @returns `true` if at least one `transition-duration` value is greater than 0.
 *
 * @category core/utils
 * @since 0.1.0
 */
export function hasTransition(el: HTMLElement): boolean {
  const duration = getComputedStyle(el).transitionDuration;
  return duration.split(',').some((d) => Number.parseFloat(d.trim()) > 0);
}

/**
 * Handle for a pending {@link onTransitionDone} wait.
 *
 * `flush` completes the wait immediately: it removes the listener, clears the
 * fallback timer and invokes `onDone` (once - later calls and late events are
 * no-ops). `cancel` tears the wait down silently: listener and timer go away
 * and `onDone` never fires. Call `cancel` from a destroy hook so a directive
 * torn down mid-transition does not receive a late `onDone` from the fallback
 * timer.
 *
 * @category core/utils
 * @since 0.1.0
 */
export interface TransitionDoneHandle {
  /** Complete now: remove the listener, clear the timer, invoke `onDone` once. */
  flush(): void;
  /** Tear down silently: remove the listener and timer without invoking `onDone`. */
  cancel(): void;
}

/**
 * Listens for the longest CSS transition on an element, then invokes `onDone`.
 *
 * The longest transition is the property with the greatest
 * `transition-duration + transition-delay` total, so a themed delay extends
 * the wait instead of cutting it short. Automatically falls back to a timeout
 * if `transitionend` never fires.
 *
 * @returns A {@link TransitionDoneHandle} - `flush()` completes immediately,
 *   `cancel()` tears down without invoking `onDone`.
 *
 * @category core/utils
 * @since 0.1.0
 */
export function onTransitionDone(el: HTMLElement, onDone: () => void): TransitionDoneHandle {
  const style = getComputedStyle(el);
  const properties = style.transitionProperty.split(',').map((p) => p.trim());
  const durations = style.transitionDuration.split(',').map((d) => Number.parseFloat(d.trim()) * 1000);
  // Older mocks and edge cases may omit transition-delay; treat as zero.
  const delays = (style.transitionDelay || '0s').split(',').map((d) => Number.parseFloat(d.trim()) * 1000);

  // CSS repeats shorter duration/delay lists cyclically against the property
  // list; mirror that so each property gets its own duration + delay total.
  const totals = properties.map(
    (_, i) => (durations[i % durations.length] ?? 0) + (delays[i % delays.length] ?? 0),
  );
  const maxTotal = totals.length > 0 ? Math.max(...totals) : 0;
  const longestProp = properties[totals.indexOf(maxTotal)] ?? properties[0] ?? 'all';

  let done = false;
  const settle = (invoke: boolean) => {
    if (done) {
      return;
    }
    done = true;
    el.removeEventListener('transitionend', handleTransitionEnd);
    clearTimeout(fallbackTimer);
    if (invoke) {
      onDone();
    }
  };

  const handleTransitionEnd = (e: TransitionEvent) => {
    if (e.target !== el) {
      return;
    }
    if (longestProp !== 'all' && e.propertyName !== longestProp) {
      return;
    }
    settle(true);
  };

  const fallbackTimer = setTimeout(() => settle(true), maxTotal + 50);
  el.addEventListener('transitionend', handleTransitionEnd);

  return {
    flush: () => settle(true),
    cancel: () => settle(false),
  };
}
