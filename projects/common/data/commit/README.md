# Commit Controller

Generic async-commit state machine. Every cngx feature with a "user clicks, we fire an async write, we react to the outcome" flow funnels through it: the select family, the stepper, future wizards. Owns the `pending` slot, the intended-value signal, and monotonic supersede semantics. Plain factory function (no class, no `@Injectable`), so it works in any injection context including headless tests.

The controller does not touch external value signals, panel open state, or component outputs. It updates its own `CngxAsyncState<T | undefined>` and calls the begin-time `onSuccess` / `onError` handlers. Routing the committed value back into the consumer's source-of-truth is the caller's job.

## Import

```ts
import {
  createCommitController,
  CNGX_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitController,
  type CngxCommitRunner,
  type CngxCommitHandle,
  type CngxCommitBeginHandlers,
  type CngxCommitControllerFactory,
} from '@cngx/common/data';
```

## Quick start

```ts
import { createCommitController } from '@cngx/common/data';

class StepperBrain<T> {
  private readonly commit = createCommitController<T>();

  readonly state = this.commit.state;
  readonly isCommitting = this.commit.isCommitting;
  readonly intended = this.commit.intendedValue;

  goTo(next: T, current: T) {
    this.commit.begin(
      ({ onSuccess, onError }) => {
        const sub = this.runStepAction(next).subscribe({
          next: onSuccess,
          error: onError,
        });
        return { cancel: () => sub.unsubscribe() };
      },
      next,
      current,
      {
        onSuccess: (committed) => this.activeStep.set(committed ?? next),
        onError: (_err, previous) => this.activeStep.set(previous!),
      },
    );
  }

  ngOnDestroy() {
    this.commit.cancel();
  }
}
```

Two contracts to honour. The runner closes over the async source and returns whatever cancel handle that source needs (RxJS `unsubscribe`, `AbortController.abort`, plain flag). The begin handlers route the outcome back into the consumer's state.

## Lifecycle

`state` is a read-only `CngxAsyncState<T | undefined>`. The controller drives status transitions only on the writes it owns.

| Trigger | `status` |
|-|-|
| Construction | `idle` |
| `begin(...)` | `pending` |
| Runner calls `onSuccess` (current commit) | `success`, data is the committed value |
| Runner calls `onError` (current commit) | `error` |
| `begin(...)` called again before settle | previous runner's `cancel()` fires; status stays `pending`, `commitId` advances |
| Runner of a superseded commit calls back late | ignored, no state change, no handler fires |
| `cancel()` | runner's cancel fires, `commitId` advances, status untouched |

Supersede is monotonic: every `begin(...)` bumps an internal id, and outcome callbacks compare their captured id against the current one before firing. A stale callback is a no-op. That guarantee is what makes it safe to fire-and-forget commits during fast user interaction.

## API

### `createCommitController<T>(): CngxCommitController<T>`

Factory. No injection context required. Allocates the writable async-state slot, the intended-value signal, and the commit-id counter. Returns the read-only controller.

### `CngxCommitController<T>`

| Member | Type | Purpose |
|-|-|-|
| `state` | `CngxAsyncState<T \| undefined>` | Read-only view of the commit lifecycle. Pass straight to `CNGX_STATEFUL` bridges, `*cngxSelectCommitError`, or any `[state]`-aware UI. |
| `isCommitting` | `Signal<boolean>` | True while `status === 'pending'`. |
| `intendedValue` | `Signal<T \| undefined>` | The value passed as `intended` on the latest `begin(...)`. Drives the pending-row spinner and the commit-error template context. |
| `begin(runner, intended, previous, handlers)` | `void` | Start a new commit. Supersedes any in-flight commit synchronously. |
| `cancel()` | `void` | Abort the in-flight commit without firing handlers. Use on host destroy or when the commit-action input changes mid-flight. |

### `CngxCommitRunner<T>`

```ts
type CngxCommitRunner<T> = (handlers: {
  readonly onSuccess: (committed: T | undefined) => void;
  readonly onError: (err: unknown) => void;
}) => CngxCommitHandle;
```

Receives the controller's success and error routes. Returns a `CngxCommitHandle` whose `cancel()` tears the work down. The runner is opaque: Observable subscription, `AbortController`, plain flag, all work as long as `cancel()` stops further `onSuccess` / `onError` calls.

### `CngxCommitBeginHandlers<T>`

```ts
interface CngxCommitBeginHandlers<T> {
  readonly onSuccess: (committed: T | undefined) => void;
  readonly onError: (err: unknown, previous: T | undefined) => void;
}
```

Caller-supplied routes. Exactly one fires per commit lifecycle, never both, never twice. A superseded commit fires neither.

## DI override: `CNGX_COMMIT_CONTROLLER_FACTORY`

`InjectionToken<CngxCommitControllerFactory>` with `providedIn: 'root'`. Default factory is `createCommitController`. Override globally or per component-subtree to inject retry-with-backoff, offline queueing, telemetry, or any other enterprise-specific commit lifecycle without forking the features that consume it.

```ts
bootstrapApplication(App, {
  providers: [
    {
      provide: CNGX_COMMIT_CONTROLLER_FACTORY,
      useValue: <T>() => createRetryingCommitController<T>({ attempts: 3 }),
    },
  ],
});
```

The select-side token `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` (`@cngx/forms/select`) delegates to this one by default, so a single override here cascades into every select variant transparently.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for type details.
- `@cngx/common/data/async-state` for the `CngxAsyncState` shape this controller fills.
- `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` (`@cngx/forms/select`) as the select-side delegation point.
- Consumers: every `CngxSelect` variant, `CngxStepper`.
