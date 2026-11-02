<!-- @aiGenerated Claude -->

# Testing

<aside class="cc-tldr">

`@cngx/core/testing` makes specs that render cngx deterministic and lets them assert three things: what a component shows at a given status, which statuses it went through, and what a screen reader is expected to hear. Every helper is runner-agnostic. `@cngx/core/testing/vitest` adds two optional Vitest matchers on top.

</aside>

cngx components wait on purpose. Loading surfaces debounce their indicator and hold it for a minimum dwell, `CngxLiveAnnouncer` writes 16 ms after `announce()`, and the active locale and direction come from the document. Each of these is right in an app and a source of flaky specs. The testing entry pins what can be pinned and documents the rest as a recipe, because moving a fake clock belongs to your runner, not to cngx.

Import it from spec files and test setup only. Nothing in it belongs in an application bundle.

| Need | Helper |
|-|-|
| Deterministic `TestBed` environment | `provideCngxTesting()` |
| Drive a component's `[state]` input | `createAsyncStateMock<T>()` |
| Assert the status sequence | `injectTransitionLog(source)` |
| Assert what a screen reader hears | `createAnnouncementCapture()` |
| Readable Vitest assertions on it | `cngxAnnouncementMatchers` from `@cngx/core/testing/vitest` |

---

## provideCngxTesting()

One provider, no options. It sets the show delay and min dwell of loading surfaces to `0`, installs the English pack with locale `en`, pins direction to `ltr`, and writes nothing to `<html>`, so nothing leaks into later specs that share the document.

```ts
TestBed.configureTestingModule({
  providers: [provideCngxTesting()],
});
```

List it first. A provider for the same token listed after it wins, which is how one spec overrides one piece:

```ts
// real loading timing
providers: [provideCngxTesting(), provideLoadingConfig(withShowDelay(200))]

// German copy
providers: [
  provideCngxTesting(),
  provideCngxI18n(withPack(de), withDocumentLanguage('off')),
]
```

Keep `withDocumentLanguage('off')` in a pack override. Without it, `provideCngxI18n` writes the pack's language and direction to `<html>` again.

---

## Driving `[state]`: createAsyncStateMock()

Components that accept `[state]` read the `CngxAsyncState<T>` interface, never a producer. The mock is a `CngxAsyncState<T>` whose signals a spec sets directly, including combinations a real producer would not reach in one step.

```ts
@Component({
  selector: 'app-results',
  template: `
    @if (state().isLoading()) {
      <p>Loading</p>
    } @else {
      <p>{{ state().data()?.length }} results</p>
    }
  `,
})
class Results {
  readonly state = input.required<CngxAsyncState<string[]>>();
}

const state = createAsyncStateMock<string[]>();
const fixture = TestBed.createComponent(Results);
fixture.componentRef.setInput('state', state);

state.set({ status: 'loading' });
fixture.detectChanges();
expect(fixture.nativeElement.textContent).toContain('Loading');

state.set({ status: 'success', data: ['a', 'b'] });
fixture.detectChanges();
expect(fixture.nativeElement.textContent).toContain('2 results');
```

`set({ status, firstLoad, empty, data, error, progress, lastUpdated })` drives it. Every derived flag (`isLoading`, `isBusy`, `isPending`, ...) comes from the same kernel the real producers use, so the mock cannot drift from them. Emptiness is the `empty` flag you set, not derived from `data`. Pass the component's data type (`createAsyncStateMock<string[]>()`) so the mock binds under strict templates.

---

## The status sequence: injectTransitionLog()

An end-state assertion cannot tell a component that went `idle -> loading -> success` from one that jumped to `success`. The log records the distinct values a signal settled on:

```ts
const state = createAsyncStateMock();
const log = TestBed.runInInjectionContext(() => injectTransitionLog(state.status));
TestBed.tick(); // records the starting 'idle'

state.set({ status: 'loading' });
TestBed.tick();
state.set({ status: 'success' });
TestBed.tick();

expect(log.values()).toEqual(['idle', 'loading', 'success']);
```

Values are observed per effect flush, not per write. Signals coalesce synchronous changes: `loading` then `success` set in one task without a flush between them records only `success`. Flush (`TestBed.tick()`, or `fixture.detectChanges()` for a component) after each step you want to see. Outside an injection context, pass `{ injector }`. `stop()` ends recording before the injector is destroyed.

---

## Loading timings

There is no helper that advances the clock. Read the timings through DI and advance your runner's clock by their sum plus one millisecond:

```ts
const { showDelay, minDwell } = TestBed.runInInjectionContext(injectLoadingConfig);

state.set({ status: 'loading' });
vi.advanceTimersByTime(showDelay + minDwell + 1); // indicator shown, min dwell over

state.set({ status: 'success' });
fixture.detectChanges(); // indicator gone
```

The min-dwell timer is only scheduled once the indicator shows, so one advance has to cover both. The extra millisecond matters when both are `0`, as under `provideCngxTesting()`: a zero-delay timer scheduled while the clock advances runs only once the clock moves past it. With real timers, let two macrotasks pass. Timings bound on one component (`[showDelay]`, `[minDwell]`) are not in the config read; use the values you bound.

---

## What a screen reader hears: createAnnouncementCapture()

The capture observes every live region in the DOM while a spec runs. `heard()` is the assertion target; `entries()` holds every recorded write, heard or not.

```ts
const capture = createAnnouncementCapture();
TestBed.inject(CngxLiveAnnouncer).announce('Saved');
vi.advanceTimersByTime(16);
await Promise.resolve();

expect(capture.heard()).toEqual(['Saved']);
capture.stop();
```

Start it after mounting and before acting: text already in a region when it starts is not recorded. Stop it in `afterEach`, or the observer keeps running into later specs.

Timing: `CngxLiveAnnouncer` writes 16 ms after `announce()`, and the capture sees a write one microtask later. Advance the clock first, then await. With real timers, await a timeout longer than 16 ms. A write straight into a region, such as a template binding after change detection, needs only the microtask.

### The heard rule

What counts as heard is decided in one place, `resolveHeardAnnouncements` in `@cngx/core/utils`. `resolveUnheardReason(entry)` names why an entry is left out.

| Recorded write | Heard | Reason when not |
|-|-|-|
| Text change in a live region | yes | |
| Text a region exposes when `aria-busy` clears | yes | |
| `role="alert"` region inserted with its text, or made live while holding it | yes | |
| Inside `hidden`, `aria-hidden="true"` or `inert`, or outside an open `aria-modal="true"` element | no | `'suppressed'` |
| Written while the region or an ancestor is `aria-busy="true"` | no | `'busy'` |
| `status`, `log` or bare `aria-live` region inserted with its text, or made live while holding it | no | `'unreliable-insertion'` |

The reasons are checked in table order: an entry that fails several reports the first.

A text change made under `aria-busy` is not lost: the text the region exposes once busy clears is recorded as its own entry and heard. A `status` region that appears under `aria-busy` is not replayed when busy clears; it stays unheard.

The last row is deliberate. Screen readers announce a `status` region that appears already holding its text inconsistently; a persistent, empty region that is filled later is announced reliably. A success toast renders as such a `status` region, so it shows up in `entries()` but not in `heard()`. An error toast is a `role="alert"` region and is heard.

What the rule cannot see: layout-based hiding (`display: none`, `visibility: hidden`), a native `<dialog>` opened with `showModal()` but without `aria-modal`, regions inside shadow roots, and which of two stacked modals is on top. jsdom has no layout and no top layer, so these are left to a real browser.

---

## Vitest matchers

`@cngx/core/testing/vitest` exports `cngxAnnouncementMatchers`. Importing the entry registers nothing; register the matchers once in your Vitest setup file:

```ts
// vitest setup file
import { expect } from 'vitest';
import { cngxAnnouncementMatchers } from '@cngx/core/testing/vitest';

expect.extend(cngxAnnouncementMatchers);
```

The same import brings the matchers' type augmentation into your TypeScript program, so specs compiled together with the setup file type-check the calls:

```ts
expect(capture).toHaveHeard('Saved');
expect(capture).toHaveHeardInOrder(['Loading', /^\d+ results$/]);
expect(capture).not.toHaveHeard('Upload failed');
```

`toHaveHeard` compares a string exactly and tests a RegExp. `toHaveHeardInOrder` passes when the heard texts contain the expected ones in this order, with other texts allowed between them.

A failure lists what was heard and, for every recorded entry that matches but was not heard, why:

```text
expected the capture to have heard "Saved"
heard: "Save failed"
"Saved" was recorded but not heard: role="status" region inserted with its content; only role="alert" is announced reliably when it appears
```

A value that is not a capture, an expectation that is neither a string nor a RegExp, and an empty `toHaveHeardInOrder` list throw a `TypeError`, also under `.not`.

`vitest` is an optional peer dependency of `@cngx/core`, used for types only: the entry loads nothing from it at runtime, and a project that never imports the entry never resolves it.

---

## Vitest and Jasmine side by side

The helpers use no runner globals, so they work the same under Vitest, Jasmine / Karma and Jest. Only the clock and the assertion change:

| Step | Vitest | Jasmine |
|-|-|-|
| Advance a fake clock | `vi.advanceTimersByTime(16)` | `jasmine.clock().tick(16)` |
| Assert a heard text | `expect(capture).toHaveHeard('Saved')` | `expect(capture.heard()).toContain('Saved')` |
| Assert the heard sequence | `expect(capture).toHaveHeardInOrder(['Loading', 'Saved'])` (other texts may come between) | `expect(capture.heard()).toEqual(['Loading', 'Saved'])` (the whole list) |
| Assert the status sequence | `expect(log.values()).toEqual(['idle', 'loading', 'success'])` | same |
| Stop in teardown | `afterEach(() => capture.stop())` | same |

Jasmine has no equivalent of the matchers. Assert on `heard()`, and call `resolveUnheardReason(entry)` on `entries()` when a text you expected is missing.

---

## Browser-mode suites

`provideCngxTesting()` does not pin motion: no cngx runtime reads the motion preference under jsdom, so pinning it would change nothing. A suite that runs in a real browser and wants reduced motion adds `provideMotion('reduced')` itself. That sets `<html data-motion>` and leaves it in place when the test module is torn down, so remove the attribute after the spec.

`onTransitionDone` keeps its fallback timer either way: the computed transition time plus 50 ms, which is 50 ms under jsdom.
