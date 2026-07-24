# @cngx/core/utils

Angular-aware primitives that do not render. The home of the async state machine, transition tracker, selection controller, the loading-timing config cascade and visibility gate, the measured-latency probe, and the discovery token that lets feedback bridges find ambient state.

## When you reach for it

This entry is the engine room of the cngx feedback and selection layers. You touch it when you are building a component (your own or a contribution to the library) that needs:

- A standard shape for "value that arrives over time" - load, refresh, commit, error. The `CngxAsyncState<T>` interface is consumed by every cngx surface that displays loading, empty, and error states (skeletons, dialogs, tables, the select panel).
- A way to react to **status transitions**, not status values, without writing your own previous-state bookkeeping or infinite-loop dance with `effect()`.
- A signal-native selection engine for "the user has picked some subset of these things" - with stable signal identity per value so OnPush children do not thrash.
- The minimal contract that lets descendant feedback bridges (`[cngxToastOn]`, `[cngxBannerOn]`, `[cngxAlertOn]`) discover your component's state without explicit binding.
- Debounced show / min-dwell timing for any loading surface, so fast operations never flash a placeholder and shown indicators never flicker out - `createVisibilityGate` plus the `CNGX_LOADING_CONFIG` cascade (`provideLoadingConfig`, `withShowDelay`, `withMinDwell`, `withSpinnerVsSkeletonCutoff`).
- Measuring how long the previous busy window lasted so an indicator can pick spinner-vs-skeleton from observed latency - `createLatencyProbe`.

## Mental model

This is the layer just above `@cngx/utils`. Pure functions and signal factories - no rendering, no templates, no styles. The shapes here are **the architecture of communication** in cngx: every higher layer agrees on what an async state looks like, how a selection controller behaves, and how transient state propagates through DI.

The most load-bearing pieces are `CngxAsyncState<T>` (the bundle-of-signals interface - every consumer reads only the fields it cares about) and `createTransitionTracker` (the sanctioned way to fire a side effect on a status change without falling into the `linkedSignal`-in-effect trap).

The loading-timing primitives sit here too: `createVisibilityGate` turns a busy signal into a debounced `visible` signal, and `createLatencyProbe` stamps the duration of each busy window. Both are signal factories that write from inside an `effect` - the gate defers its write through a timer, the probe writes a measurement synchronously - so both are documented, sanctioned write-in-effect patterns rather than the trap rule 2 warns about.

## See also

- The full type and factory list is in the **API** tab.
- Conceptual deep dive: the "Async State Machine" chapter in the docs sidebar.

## Peer dependencies

`@angular/core`.
