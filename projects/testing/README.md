# @cngx/testing

Internal test utilities and helpers for the cngx component library. Not published to npm — consumed directly from source via tsconfig paths.

## Import

```typescript
import {
  createDirectiveFixture,
  spyOnOutput,
  updateAndFlush,
  cngxMatchers,
  createMatchMediaMock,
  createResizeObserverMock,
} from '@cngx/testing';
```

## Overview

`@cngx/testing` provides a suite of helpers and mocks specifically designed for testing cngx components and directives in vitest. The library encapsulates common testing patterns like fixture creation, signal mutation, async state flushing, and browser API mocking.

All utilities assume:
- **vitest** as the test runner
- **Angular TestBed** for fixture setup
- **Signal-based architecture** with `TestBed.flushEffects()`
- **Standalone components** as the primary test targets

## Utilities

### createDirectiveFixture

Creates a minimal test fixture for a directive.

```typescript
async function createDirectiveFixture<D, H>(
  directive: Type<D>,
  hostType: Type<H>,
  options?: DirectiveFixtureOptions<H>,
): Promise<DirectiveFixture<D, H>>
```

#### Parameters

- `directive` — The directive class to test.
- `hostType` — A pre-defined standalone host component class with signal inputs.
- `options` — Optional configuration object.

#### Options

```typescript
interface DirectiveFixtureOptions<H> {
  imports?: Type<unknown>[];           // Additional imports for the host component
  inputs?: Partial<Record<keyof H, unknown>>;  // Initial input values
  providers?: unknown[];               // Additional TestBed providers
}
```

#### Returns

```typescript
interface DirectiveFixture<D, H> {
  fixture: ComponentFixture<H>;        // The test fixture
  directive: D;                        // The directive instance under test
  element: HTMLElement;                // The host element carrying the directive
  host: H;                             // The host component instance
  flush: () => void;                   // Shorthand: detectChanges + flushEffects
}
```

#### Example

```typescript
@Component({
  selector: 'test-host',
  template: '<div cngxHoverable [disabled]="disabled()"></div>',
  imports: [CngxHoverable],
})
class HostComponent {
  readonly disabled = signal(false);
}

const { directive, element, flush } = await createDirectiveFixture(
  CngxHoverable,
  HostComponent,
);

element.dispatchEvent(new MouseEvent('mouseenter'));
flush();
expect(directive.hovered()).toBe(true);
```

### spyOnOutput

Subscribes a vitest spy to an Angular `output()` and returns a typed wrapper.

```typescript
function spyOnOutput<T>(output: OutputRef<T>): OutputSpy<T>
```

#### Parameters

- `output` — Angular `output()` signal to spy on.

#### Returns

```typescript
interface OutputSpy<T> {
  fn: Mock<(value: T) => void>;        // The underlying vi.fn() mock
  lastValue: () => T | undefined;      // Last emitted value or undefined
  callCount: () => number;             // Number of emissions
  values: () => T[];                   // All emitted values in order
  destroy: () => void;                 // Unsubscribe from output
}
```

#### Example

```typescript
const spy = spyOnOutput(directive.sortChange);
directive.setSort('name', 'desc');
expect(spy.callCount()).toBe(1);
expect(spy.lastValue()).toEqual({ active: 'name', direction: 'desc' });
spy.destroy();
```

### updateAndFlush

Sets a signal value, runs change detection, and flushes effects in one call.

```typescript
function updateAndFlush<T>(
  fixture: ComponentFixture<unknown>,
  signal: WritableSignal<T>,
  value: T,
): void
```

#### Parameters

- `fixture` — The component fixture.
- `signal` — The writable signal to update.
- `value` — The new value to set.

#### Example

```typescript
const { fixture, host, element } = await createDirectiveFixture(...);

updateAndFlush(fixture, host.activeIndex, 2);
expect(element.classList.contains('active')).toBe(true);
```

### cngxMatchers

Custom vitest matchers for DOM element assertions.

```typescript
const cngxMatchers = {
  toHaveClass(received: HTMLElement, className: string),
  toHaveAttribute(received: HTMLElement, name: string, value?: string),
  toHaveCSSVariable(received: HTMLElement, name: string, value: string),
}
```

#### Setup

Register matchers in your test setup file:

```typescript
import { cngxMatchers } from '@cngx/testing';
expect.extend(cngxMatchers);
```

#### Matchers

- **`toHaveClass(className: string)`** — Asserts the element has the given CSS class.
- **`toHaveAttribute(name: string, value?: string)`** — Asserts the element has the given attribute, optionally with a specific value.
- **`toHaveCSSVariable(name: string, value: string)`** — Asserts the element has a CSS custom property with the given value.

#### Example

```typescript
expect(element).toHaveClass('active');
expect(element).toHaveAttribute('aria-busy', 'true');
expect(element).toHaveCSSVariable('--cngx-gap-md', '16px');
```

### createMatchMediaMock

Creates a mock for `window.matchMedia` that captures the listener and allows programmatic triggering of match changes.

```typescript
function createMatchMediaMock(initialMatches?: boolean): MatchMediaMock

interface MatchMediaMock {
  install: (win: Window) => void;
  trigger: (matches: boolean) => void;
  restore: (win: Window) => void;
}
```

#### Parameters

- `initialMatches` — Initial `matches` value (default: `false`).

#### Methods

- **`install(win)`** — Install the mock on the given window object.
- **`trigger(matches)`** — Trigger a media query change event with the new `matches` value.
- **`restore(win)`** — Restore the original `matchMedia`.

#### Example

```typescript
const mock = createMatchMediaMock(true);  // Start with query matching
mock.install(window);

const { flush } = await createDirectiveFixture(CngxResponsive, HostComponent);

mock.trigger(false);  // Simulate query no longer matching
flush();
expect(directive.mode()).toBe('overlay');

mock.restore(window);
```

### createResizeObserverMock

Creates a mock for `ResizeObserver` that captures the callback and allows programmatic triggering of resize events.

```typescript
function createResizeObserverMock(): ResizeObserverMock

interface ResizeObserverMock {
  install: (win: Window) => void;
  triggerResize: (entry: Partial<ResizeObserverEntry>) => void;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  restore: (win: Window) => void;
}
```

#### Methods

- **`install(win)`** — Install the mock on the given window object.
- **`triggerResize(entry)`** — Trigger a resize callback with a partial entry.
- **`restore(win)`** — Restore the original `ResizeObserver`.

#### Spies

- **`observe`** — Vitest spy on `observe()` calls.
- **`disconnect`** — Vitest spy on `disconnect()` calls.

#### Example

```typescript
const mock = createResizeObserverMock();
mock.install(window);

const { element, flush } = await createDirectiveFixture(...);

mock.triggerResize({
  contentRect: { width: 500, height: 300 } as DOMRectReadOnly,
});
flush();

expect(directive.size()).toEqual({ width: 500, height: 300 });
expect(mock.observe.mock.calls.length).toBe(1);

mock.restore(window);
```

## Testing Patterns

### Testing Signals and Effects

```typescript
const { fixture, host, element, flush } = await createDirectiveFixture(
  CngxMyDirective,
  HostComponent,
);

// Mutate a signal
host.value.set(42);
// Flush change detection and effects
flush();
// Assert derived state
expect(element.getAttribute('data-value')).toBe('42');
```

### Testing Event Handlers

```typescript
const spy = spyOnOutput(directive.valueChange);
element.dispatchEvent(new Event('input'));
flush();
expect(spy.callCount()).toBeGreaterThan(0);
```

### Testing Media Queries

```typescript
const mock = createMatchMediaMock(false);
mock.install(window);

const { flush } = await createDirectiveFixture(CngxResponsive, HostComponent);

expect(directive.mode()).toBe('over');  // mobile mode (query not matching)

mock.trigger(true);  // Simulate large screen
flush();

expect(directive.mode()).toBe('side');  // desktop mode (query matching)

mock.restore(window);
```

### Testing ResizeObserver

```typescript
const mock = createResizeObserverMock();
mock.install(window);

const { element, flush } = await createDirectiveFixture(CngxTruncate, Host);

mock.triggerResize({
  contentRect: { width: 200, height: 100 } as DOMRectReadOnly,
});
flush();

expect(directive.truncated()).toBe(true);
expect(mock.observe).toHaveBeenCalled();

mock.restore(window);
```

### Testing with Fake Timers

```typescript
it('debounces input', async () => {
  vi.useFakeTimers();

  const { element, flush } = await createDirectiveFixture(...);
  const spy = spyOnOutput(directive.search);

  element.dispatchEvent(new InputEvent('input'));
  expect(spy.callCount()).toBe(0);  // Not fired yet

  vi.runAllTimers();  // Advance timers
  flush();

  expect(spy.callCount()).toBe(1);  // Fired after debounce

  vi.useRealTimers();
});
```

## Best Practices

1. **Always use `flush()`** after signal mutations and event dispatches to ensure effects run and DOM updates are detected.

2. **Scope mocks to the test** — Always restore mocks (`mock.restore()`) at test end via `afterEach()` or explicit cleanup.

3. **Use `createDirectiveFixture`** for directive tests — it handles TestBed setup, signal input binding, and provides a convenient `flush()` shorthand.

4. **Spy early, assert late** — Create spies before triggering events, then assert after flushing.

5. **Test the public API** — Use `directive.signal()` and `directive.method()`, not private internals.

6. **Use fake timers for debounce/throttle** — Combine `vi.useFakeTimers()` and `vi.runAllTimers()` to control timing-sensitive behavior.

## See Also

- [vitest Documentation](https://vitest.dev/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [TestBed API Reference](https://angular.io/api/core/testing/TestBed)
- cngx library tests: `projects/*/src/**/*.spec.ts`
