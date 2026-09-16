# @cngx/core/tokens

DI seams that decouple atoms from organisms and feature libs from the UI layer. Tokens only - no services, no components, no controllers. Importing from here pulls one `InjectionToken` and one interface; the implementation lives elsewhere.

## When you reach for it

You are wiring something into the cngx DI graph and need the contract without the implementation:

- You are writing a custom form control and want it to plug into `<cngx-form-field>` - you provide `CNGX_FORM_FIELD_CONTROL` from your class and the field discovers it through a content query: your `focused` / `empty` / `disabled` / `errorState` signals drive the field's state classes and your `id` becomes the label's `for`-target.
- You are writing a sub-component that sits inside a cngx organism and needs to communicate with the host - you read `CNGX_FORM_FIELD_HOST` instead of injecting the concrete parent class (which would cyclically couple the two).
- You need a testable, SSR-safe handle on `window` or environment flags - `WINDOW` / `ENVIRONMENT` are the DI versions of those globals.

## Mental model

Tokens are the **contracts** of the cngx architecture. Every controller, every host surface, every replaceable behaviour ships behind a token - that is how the library stays composable and how the atomic-decompose schematic can split a component without breaking its connections. Importing only the tokens means your code expresses dependency on the **shape** of a feature, not on its implementation.

The split between `@cngx/core/tokens` (contracts) and `@cngx/core/utils` (primitives + factories) is intentional: pull in the token where you implement, pull in the factory where you compose.

## ENVIRONMENT

`ENVIRONMENT` is a consumer-app utility, not something cngx reads itself: a typed DI handle on your `environment.ts` object, so app code depends on the injector instead of a hardcoded module import and tests can swap the value per `TestBed`.

It has no default factory. An `inject(ENVIRONMENT)` without `provideEnvironment(environment)` in the bootstrap providers throws a `NullInjectorError` - missing wiring fails loudly instead of handing you an empty object. Code that must tolerate an absent environment reads `inject(ENVIRONMENT, { optional: true })` and handles the `null`.

## See also

- The exact token names, their interfaces, and the `provide*` helpers are in the **API** tab.
