/**
 * Checks whether an element has any CSS transition applied.
 *
 * @returns `true` if at least one `transition-duration` value is greater than 0.
 */
export function hasTransition(el: HTMLElement): boolean {
  const duration = getComputedStyle(el).transitionDuration;
  return duration.split(',').some((d) => Number.parseFloat(d.trim()) > 0);
}

/**
 * Listens for the longest CSS transition on an element, then invokes `onDone`.
 *
 * Automatically falls back to a timeout if `transitionend` never fires.
 *
 * @returns A cleanup function that removes the listener and clears the fallback timer.
 */
export function onTransitionDone(el: HTMLElement, onDone: () => void): () => void {
  const style = getComputedStyle(el);
  const durations = style.transitionDuration.split(',');
  const properties = style.transitionProperty.split(',').map((p) => p.trim());
  const parsedDurations = durations.map((d) => Number.parseFloat(d.trim()) * 1000);
  const maxDuration = Math.max(...parsedDurations);

  const longestPropIndex = parsedDurations.indexOf(maxDuration);
  const longestProp = properties[longestPropIndex] ?? properties[0] ?? 'all';

  let done = false;
  const finishOnce = () => {
    if (done) {
      return;
    }
    done = true;
    el.removeEventListener('transitionend', handleTransitionEnd);
    clearTimeout(fallbackTimer);
    onDone();
  };

  const handleTransitionEnd = (e: TransitionEvent) => {
    if (e.target !== el) {
      return;
    }
    if (longestProp !== 'all' && e.propertyName !== longestProp) {
      return;
    }
    finishOnce();
  };

  const fallbackTimer = setTimeout(finishOnce, maxDuration + 50);
  el.addEventListener('transitionend', handleTransitionEnd);

  return finishOnce;
}
