import { type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

/** Options for {@link createDirectiveFixture}. */
export interface DirectiveFixtureOptions<H> {
  /** Additional imports for the test host component. */
  imports?: Type<unknown>[];
  /** Initial input values to set on the host before first detectChanges. */
  inputs?: Partial<Record<keyof H, unknown>>;
  /** Additional TestBed providers. */
  providers?: unknown[];
}

/** Return type of {@link createDirectiveFixture}. */
export interface DirectiveFixture<D, H> {
  /** The test fixture. */
  fixture: ComponentFixture<H>;
  /** The directive instance under test. */
  directive: D;
  /** The host element that carries the directive. */
  element: HTMLElement;
  /** The host component instance. */
  host: H;
  /** Shorthand: detectChanges + flushEffects. */
  flush: () => void;
}

/**
 * Creates a minimal test fixture for a directive.
 *
 * @param directive The directive class to test.
 * @param template The template string — must include the directive's selector.
 * @param hostType A pre-defined host component class with signal inputs.
 * @param options Additional configuration.
 *
 * @example
 * ```typescript
 * @Component({ template: '<div cngxHoverable>', imports: [CngxHoverable] })
 * class Host {}
 *
 * const { directive, element, flush } = await createDirectiveFixture(CngxHoverable, Host);
 * ```
 */
export async function createDirectiveFixture<D, H>(
  directive: Type<D>,
  hostType: Type<H>,
  options: DirectiveFixtureOptions<H> = {},
): Promise<DirectiveFixture<D, H>> {
  await TestBed.configureTestingModule({
    imports: [hostType, ...(options.imports ?? [])],
    providers: (options.providers ?? []) as never[],
  }).compileComponents();

  const fixture = TestBed.createComponent(hostType);
  const host = fixture.componentInstance;

  if (options.inputs) {
    for (const [key, value] of Object.entries(options.inputs)) {
      fixture.componentRef.setInput(key, value);
    }
  }

  fixture.detectChanges();
  TestBed.flushEffects();

  const debugEl = fixture.debugElement.query(By.directive(directive));
  if (!debugEl) {
    throw new Error(`Directive ${directive.name} not found in template.`);
  }

  return {
    fixture,
    directive: debugEl.injector.get(directive),
    element: debugEl.nativeElement as HTMLElement,
    host,
    flush: () => {
      fixture.detectChanges();
      TestBed.flushEffects();
    },
  };
}
