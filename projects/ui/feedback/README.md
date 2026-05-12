# @cngx/ui/feedback

The communication surfaces of cngx — toasts, banners, alerts, loading indicators, and the async-container molecule. The bridge between an async state and the user's eyes.

## When you reach for it

You have a piece of async state (loading a list, saving a form, retrying a request) and want the user to see what is happening without you wiring four signals into four templates:

- **Loading indicators** — spinner, bar, dots, text — whenever a region is busy.
- **An async-aware container** that swaps between skeleton, content, empty, and error views with a single binding.
- **Toasts** for ephemeral success and error notifications.
- **Banners** for persistent top-of-page errors that should clear themselves on the next success.
- **Alerts** for inline messages bound to a specific area of the page.

The transition bridges (`[cngxToastOn]`, `[cngxAlertOn]`, `[cngxBannerOn]`) are the headline ergonomics: declarative attribute directives that watch a `CngxAsyncState` and fire feedback on the right transition without you writing an `effect()` for each one.

## Mental model

`@cngx/ui/feedback` is the consumer half of the async state machine. `@cngx/core/utils` defines the state interface; producer factories in `@cngx/common/data` create the state; this entry **renders** it. Skeletons, alerts, banners, and toasts are all reactive readers of the same shape.

Two patterns make the whole feedback layer feel cohesive:

- **State precedence.** Every consumer accepts a `[state]` input that wins over equivalent boolean inputs. Wire state once, every surface stays in sync.
- **Discovery through DI.** When a transition bridge has no `[state]` binding, it falls back to the `CNGX_STATEFUL` token from its host or any ancestor. Components that own async state (the select family, action button, dialog with submit action, async container) provide that token, so a bare `<button cngxToastOn>` inside them just works.

## Bootstrap requirement

Toast, banner, and alerter services are **not** `providedIn: 'root'`. Provide them via `provideFeedback(...)` in your application bootstrap, and render the outlets once at the application root. This is intentional — feedback presentation is application-level, not library-level, and forcing the consumer to opt in keeps a tree-shake-friendly footprint when only a subset of surfaces is in use.

## See also

- Outlet components, services, bridge directives, slot directives, and `with*` config features in the **API** tab.
- Conceptual deep dive: the "Async State Machine" chapter in the docs sidebar.
