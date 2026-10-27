/**
 * Swipe direction - matches drawer positions for natural composition.
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Axis a swipe gesture is allowed to register on. `'x'` accepts
 * left/right, `'y'` accepts up/down, `'both'` accepts any dominant axis.
 */
export type SwipeAxis = 'x' | 'y' | 'both';
