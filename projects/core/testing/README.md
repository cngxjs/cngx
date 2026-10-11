# @cngx/core/testing

Test kits for specs that render cngx. Nothing here belongs in an application bundle: import it from spec files and test setup only.

## What it is

- **`provideCngxTesting()`** - one provider that makes cngx deterministic under `TestBed`: zero show delay and min dwell for loading surfaces, the English pack with locale `en`, direction `ltr`, and no writes to `<html>`.

More kits land in this entry as they ship.

## When you reach for it

Your spec renders a cngx component and you want to assert what it shows without racing its timing. Loading surfaces debounce their indicator and hold it for a minimum dwell; under `provideCngxTesting()` both are `0`, so the skeleton or spinner appears on the flush the state turns busy and disappears on the flush it settles.

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

## Runners

The helpers use no runner globals, so they work the same under Vitest, Jasmine / Karma and Jest. Advancing a fake clock stays with your runner (`vi.advanceTimersByTime`, `jasmine.clock().tick`, `tick` from `fakeAsync`).

## What it does not pin

- **Motion.** No cngx runtime reads the motion preference token, so pinning it changes nothing under jsdom. A browser-mode suite that wants reduced motion adds `provideMotion('reduced')` itself; that sets `<html data-motion>` and never removes it.
- **Transition settle time.** `onTransitionDone` keeps its 50 ms fallback timer.

## Peer dependencies

`@angular/core`.
