---
name: cngx-async
description: How to wire loading, error, and success states with cngx - the async state machine, projecting a branch, and bridging transitions to toasts/alerts/banners. Use when a task involves a fetch, a save, a retry, a loading spinner, an error banner, a "show a toast when it fails", or any code that reads a request's status in an app that imports any @cngx/* package.
---

# Wiring async state with cngx

Async state is the surface consumers get wrong most often, and it is the one
cngx has the strongest opinion about. A request is not a boolean `loading` flag
and a separate `error` string that you keep in sync by hand. It is a single state
machine, and the UI plus the ARIA graph derive from it. This skill is the
procedure; confirm the exact symbol shapes against `get_api` before you wire.

## The state machine

Every async operation moves through one status:

```
idle -> loading -> pending -> refreshing -> success -> error
```

The whole point of the machine is that you never track these transitions
yourself. You hold one `CngxAsyncState`, and everything the user sees - the
spinner, the disabled button, the `aria-busy` attribute, the error region - is a
`computed()` off its status. Do not mirror the status into a second signal; that
is Pillar 1 (derive, do not manage) and the reason the machine exists.

## The three steps

**1. Produce the state.** Create it with `createAsyncState` (from a source you
drive), `injectAsyncState` (DI-provided, the common case in a component), or
`createManualState` when you set the status by hand. Confirm the exact factory
signature with `get_api` before calling it. These live in `@cngx/common/data`.

**2. Project the branch.** Do not write `@if (status === 'loading')` ladders.
Let `resolveAsyncView` pick the view model for the current status, and let
`CngxAsyncContainer` render the matching branch (loading / error / empty /
success) with the ARIA wiring already in place. The container is the one place in
cngx that is allowed to write a signal inside an effect - you never need to
replicate that.

**3. Bridge transitions to feedback.** To fire a toast, alert, or banner when the
status changes, attach `CngxToastOn` / `CngxAlertOn` / `CngxBannerOn` to the
state. They watch the transition (`pending -> error`, `idle -> success`) and call
the feedback service for you.

## The one rule you must not miss

Inside a bridge effect, the call to the feedback service **must** be wrapped in
`untracked()`:

```ts
effect(() => {
  const status = state.status();       // tracked: the trigger
  untracked(() => {
    if (status === 'error') {
      toaster.error('...');            // service call: never tracked
    }
  });
});
```

Without `untracked()`, the effect subscribes to the service's own internal
signals (the toast queue, the dedup set) and re-fires every time they change - a
reactive loop that freezes the tab. The `CngxToastOn` / `CngxAlertOn` /
`CngxBannerOn` directives already do this correctly; the rule matters the moment
you hand-roll a bridge. This is the canonical async trap. If you write an
`effect()` that both reads a signal and calls a service, wrap the call.

## Composing the feedback surface

The feedback services are not `providedIn: 'root'`. You opt in at the application
root with `provideFeedback(...)`, passing the `withToasts()` / `withAlerts()` /
`withBanners()` features for the channels you use. Confirm the current feature
list with `get_config` on `feedback` before wiring the bootstrap - it returns the
config token, the provider functions, and every `with*` feature the surface
accepts.

## Recipes

Read the recipe whose symbols match what you are building before writing the
composition yourself:

- `pack/recipes/ui-feedback-toast.md` - transient toast on a transition.
- `pack/recipes/ui-feedback-alert.md` - inline alert on a transition.
- `pack/recipes/ui-feedback-async-container.md` - the container projecting a branch.
- `pack/recipes/common-data-async-boundary.md` - an async boundary around a data read.
- `pack/recipes/common-interactive-async-click.md` - an action whose click is async.
- `pack/recipes/common-interactive-retry.md` - a retry affordance on the error branch.

## Never guess

Ground every `@cngx/*` symbol against `get_api` or the published docs
(`https://cngxjs.github.io/cngx/llms.txt` index, `llms-full.txt` full text)
before you use it. Do not guess a factory signature or a feature-function name.
