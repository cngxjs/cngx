import type { AsyncStatus } from '@cngx/core/utils';

/** Possible view states for async content rendering. */
export type AsyncView = 'none' | 'skeleton' | 'content' | 'empty' | 'error' | 'content+error';

/**
 * Pure function that resolves which view to show based on async state.
 *
 * Encodes the state machine as a lookup table — no branching:
 *
 * | status      | firstLoad | empty | view          |
 * |-------------|-----------|-------|---------------|
 * | idle        | true      | *     | none          |
 * | loading     | true      | *     | skeleton      |
 * | refreshing  | true      | *     | skeleton      |
 * | pending     | true      | *     | skeleton      |
 * | error       | true      | *     | error         |
 * | success     | *         | true  | empty         |
 * | error       | false     | *     | content+error |
 * | (all other) | *         | *     | content       |
 */
export function resolveAsyncView(
  status: AsyncStatus,
  firstLoad: boolean,
  empty: boolean,
): AsyncView {
  if (firstLoad) {
    switch (status) {
      case 'idle':
        return 'none';
      case 'loading':
      case 'refreshing':
      case 'pending':
        return 'skeleton';
      case 'error':
        return 'error';
    }
  }

  if (status === 'success' && empty) {
    return 'empty';
  }

  if (status === 'error') {
    return 'content+error';
  }

  return 'content';
}
