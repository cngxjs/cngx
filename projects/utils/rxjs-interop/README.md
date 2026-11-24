# @cngx/utils/rxjs-interop

RxJS-aware helpers that coerce mixed value/observable inputs into a single observable shape. Kept in a separate secondary entry so consumers of `@cngx/utils` who do not use RxJS pay no bundle cost.

## When you reach for it

You are writing a function whose input may be either a plain value (e.g. a string) or an `Observable<string>`, and you want a uniform observable downstream without branching on `isObservable` at every call site. Common in form-field validators, async pipes for label resolution, and any "accept either" API surface where one coercion at the API edge is cheaper than branching at every call site.

## Mental model

RxJS lives at the **boundary** of the cngx stack - HTTP, WebSocket, CDK internals, third-party libraries. Inside the library, everything is signals. This entry is the seam: it accepts the boundary form and produces the boundary form, so the rest of your code can stay one-paradigm.

## `settleAction` (internal)

`settleAction(run, { onValue, onEmpty, onError })` settles one action result exactly once and returns a `{ cancel }` handle. It is `@internal`: the cngx async-state factories share it, consumer code should not import it.

- `run` is called inside the helper; a synchronous throw goes to `onError`.
- A plain value settles synchronously, a thenable on fulfilment or rejection.
- An Observable settles on its first emission, and the source is stopped from inside that emission, so a synchronous source emits exactly one value.
- An Observable that completes without a value takes the `onEmpty` route. The caller decides what an empty action means: the async-state factories of `@cngx/common` treat it as success with `undefined`.
- `cancel()` unsubscribes an Observable and silences every later handler call; a Promise keeps running, its outcome is dropped and a rejection is still observed.
