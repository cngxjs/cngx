import type { CngxCommitController } from '../commit-controller.token';
import { commitLedgerFor } from './commit-ledger';

/**
 * Anything that can replay the commit it started: the commit handlers and
 * the tree toggle dispatch.
 *
 * @internal
 */
export interface CngxCommitRetryOwner {
  retryLast(): void;
}

/**
 * Routes the commit-error Retry to the commit source that started the last
 * commit on one controller.
 *
 * @internal
 */
export interface CommitRetryRouter {
  /**
   * Returns a view of `handler` whose `begins` methods first claim the next
   * commit for `handler`. A composite with more than one commit source wraps
   * each one, so Retry reaches the handler that started the failed commit,
   * also when a consumer swapped it through its factory token.
   */
  route<H extends CngxCommitRetryOwner>(handler: H, begins: readonly (keyof H)[]): H;
  /**
   * Marks `owner` as the starter of the commit about to begin and drops the
   * ledger record, which names an earlier commit until `owner`'s begin (when
   * it runs through the ledger) writes a new one.
   */
  claim(owner: CngxCommitRetryOwner): void;
  /** Replays the last commit through the owner that claimed it. No-op before any claim. */
  retry(): void;
}

function createCommitRetryRouter<TCommit>(
  controller: CngxCommitController<TCommit>,
): CommitRetryRouter {
  let owner: CngxCommitRetryOwner | null = null;

  const claim = (next: CngxCommitRetryOwner): void => {
    owner = next;
    commitLedgerFor(controller).release();
  };

  const route = <H extends CngxCommitRetryOwner>(handler: H, begins: readonly (keyof H)[]): H => {
    // Prototype view: untouched members (and `this`-bound class handlers)
    // keep working; defineProperty also shadows a frozen handler's method.
    const routed = Object.create(handler) as H;
    for (const key of begins) {
      const begin = handler[key];
      if (typeof begin !== 'function') {
        continue;
      }
      Object.defineProperty(routed, key, {
        value: (...args: unknown[]): unknown => {
          claim(handler);
          return (begin as (...a: unknown[]) => unknown).apply(handler, args);
        },
      });
    }
    return routed;
  };

  return { route, claim, retry: () => owner?.retryLast() };
}

const ROUTERS = new WeakMap<object, CommitRetryRouter>();

/**
 * The retry router bound to `controller`, created on first use. Every commit
 * source on one controller (the core's handlers, the tree dispatch) shares it,
 * the same way they share {@link commitLedgerFor}.
 *
 * @internal
 */
export function commitRetryFor<TCommit>(
  controller: CngxCommitController<TCommit>,
): CommitRetryRouter {
  const existing = ROUTERS.get(controller);
  if (existing) {
    return existing;
  }
  const router = createCommitRetryRouter(controller);
  ROUTERS.set(controller, router);
  return router;
}
