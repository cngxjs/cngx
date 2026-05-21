# @cngx/utils/rxjs-interop

RxJS-aware helpers that coerce mixed value/observable inputs into a single observable shape. Kept in a separate secondary entry so consumers of `@cngx/utils` who do not use RxJS pay no bundle cost.

## When you reach for it

You are writing a function whose input may be either a plain value (e.g. a string) or an `Observable<string>`, and you want a uniform observable downstream without branching on `isObservable` at every call site. Common in form-field validators, async pipes for label resolution, and any "accept either" API surface where one coercion at the API edge is cheaper than branching at every call site.

## Mental model

RxJS lives at the **boundary** of the cngx stack - HTTP, WebSocket, CDK internals, third-party libraries. Inside the library, everything is signals. This entry is the seam: it accepts the boundary form and produces the boundary form, so the rest of your code can stay one-paradigm.
