# @cngx/core/testing

Test kits for specs that render cngx. Nothing here belongs in an application bundle: import it from spec files and test setup only.

## What it is

- **`provideCngxTesting()`** - one provider that makes cngx deterministic under `TestBed`: zero show delay and min dwell for loading surfaces, the English pack with locale `en`, direction `ltr`, and no writes to `<html>`. The pinned locale outranks `LOCALE_ID`, also one provided on a component; override it with `provideLocale` or a pack.
- **`createAsyncStateMock<T>()`** - a hand-driven `CngxAsyncState<T>` for components that take a `[state]` input. `set({ status, firstLoad, empty, data, error, progress, lastUpdated })` drives it; every derived flag comes from the same kernel real producers use (`buildAsyncStateView`), so it cannot drift from them. Emptiness is the spec-driven `empty` flag, not derived from `data`.
- **`injectTransitionLog(source, { injector?, equal? })`** - records the distinct values a signal settles on, so a spec asserts the sequence (`['idle', 'loading', 'success']`), not only the end state. Values are observed per effect flush: flush after each step you want to see.

More kits land in this entry as they ship.

## When you reach for it

Your spec renders a cngx component and you want to assert what it shows without racing its timing. Loading surfaces debounce their indicator and hold it for a minimum dwell; under `provideCngxTesting()` both are `0`, so there is no delay to compute. Both are still timers, though: see "Loading timings" for the one advance that shows the skeleton or spinner and lets it hide on the flush after the state settles.

## Usage

Add it first in the testing module's `providers`. Anything listed after it wins, which is how a spec overrides one piece.

```ts
TestBed.configureTestingModule({
  providers: [provideCngxTesting()],
});
```

Testing real timing in one spec:

```ts
providers: [provideCngxTesting(), provideLoadingConfig(withShowDelay(200))]
```

Testing German copy:

```ts
providers: [
  provideCngxTesting(),
  provideCngxI18n(withPack(de), withDocumentLanguage('off')),
]
```

Keep `withDocumentLanguage('off')` in that override. Without it, `provideCngxI18n` writes the pack's language and direction to `<html>`, which leaks into later specs when the runner shares one document.

## Loading timings

There is no helper that advances the clock for you: moving a fake clock is runner API, and the timings are already readable through DI. Read them, then advance your runner's own clock:

```ts
const { showDelay, minDwell } = TestBed.runInInjectionContext(injectLoadingConfig);

state.set({ status: 'loading' });
vi.advanceTimersByTime(showDelay + minDwell + 1); // indicator shown, min dwell over

state.set({ status: 'success' });
fixture.detectChanges(); // indicator gone
```

The min-dwell timer is only scheduled when the indicator shows, so one advance has to cover both timers. The extra millisecond matters when a timer is `0`, as under `provideCngxTesting()`: a zero-delay timer scheduled while the clock advances runs only once the clock moves past it, so an advance of exactly `showDelay + minDwell` leaves the indicator up after the state settles. Under Jasmine or `fakeAsync`, make the same advance with `jasmine.clock().tick` or `tick`. With real timers, let two macrotasks pass.

Timing inputs bound on a single component (for example `[showDelay]` / `[minDwell]` on an async container) are not part of the config read; use the values you bound in the same sum.

## Runners

The helpers use no runner globals, so they work the same under Vitest, Jasmine / Karma and Jest. Advancing a fake clock stays with your runner (`vi.advanceTimersByTime`, `jasmine.clock().tick`, `tick` from `fakeAsync`).

## What it does not pin

- **Motion.** No cngx runtime reads the motion preference token, so pinning it changes nothing under jsdom. A browser-mode suite that wants reduced motion adds `provideMotion('reduced')` itself; that sets `<html data-motion>` and leaves it in place when the test module is torn down, so remove it after the spec.
- **Transition settle time.** `onTransitionDone` keeps its fallback timer: the computed transition time plus 50 ms, which is 50 ms under jsdom.

## Peer dependencies

`@angular/core`.
