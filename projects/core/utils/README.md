# @cngx/core/utils

Angular-aware primitives that do not render. The home of the async state machine, transition tracker, selection controller, and the discovery token that lets feedback bridges find ambient state.

## When you reach for it

This entry is the engine room of the cngx feedback and selection layers. You touch it when you are building a component (your own or a contribution to the library) that needs:

- A standard shape for "value that arrives over time" - load, refresh, commit, error. The `CngxAsyncState<T>` interface is consumed by every cngx surface that displays loading, empty, and error states (skeletons, dialogs, tables, the select panel).
- A way to react to **status transitions**, not status values, without writing your own previous-state bookkeeping or infinite-loop dance with `effect()`.
- A signal-native selection engine for "the user has picked some subset of these things" - with stable signal identity per value so OnPush children do not thrash.
- The minimal contract that lets descendant feedback bridges (`[cngxToastOn]`, `[cngxBannerOn]`, `[cngxAlertOn]`) discover your component's state without explicit binding.

## Mental model

This is the layer just above `@cngx/utils`. Pure functions and signal factories - no rendering, no templates, no styles. The shapes here are **the architecture of communication** in cngx: every higher layer agrees on what an async state looks like, how a selection controller behaves, and how transient state propagates through DI.

The most load-bearing pieces are `CngxAsyncState<T>` (the bundle-of-signals interface - every consumer reads only the fields it cares about) and `createTransitionTracker` (the only sanctioned way to fire a side effect on a status change without falling into the `linkedSignal`-in-effect trap).

## See also

- The full type and factory list is in the **API** tab.
- Conceptual deep dive: the "Async State Machine" chapter in the docs sidebar.

## Peer dependencies

`@angular/core`.
