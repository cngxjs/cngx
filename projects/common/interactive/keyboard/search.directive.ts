import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  Renderer2,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, fromEvent, map, merge, of, Subject, switchMap, tap, timer } from 'rxjs';

/**
 * Debounced search term tracker for `<input>` elements.
 *
 * Converts the DOM `input` event stream into a debounced Signal. The raw
 * Observable is never exposed - signal at the API boundary.
 *
 * ### Basic usage
 * ```html
 * <input cngxSearch #search="cngxSearch" placeholder="Search..." />
 * <button (click)="search.clear()">Clear</button>
 * ```
 *
 * ### Settling a pending term
 * A host that reacts to keys while a term waits out its debounce settles it
 * explicitly: `flush()` emits the pending term at once (Enter picks against the
 * term the user typed), `cancel()` drops it (a closing panel must not receive a
 * late write). Both return whether a term was pending. A `debounceMs` of `0` or
 * less emits synchronously on every `input` event, so nothing is ever pending.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/search.directive.ts
 * @since 0.1.0
 * @relatedTo CngxKeyboardShortcut, CngxListboxSearch
 * @axis level molecule
 */
@Directive({
  selector: 'input[cngxSearch]',
  exportAs: 'cngxSearch',
  standalone: true,
})
export class CngxSearch {
  /**
   * Debounce delay in milliseconds. `0` or less emits on every `input` event,
   * synchronously. @defaultValue 300
   */
  readonly debounceMs = input<number>(300);

  private readonly termState = signal('');
  /** The current (debounced) search term. */
  readonly term = this.termState.asReadonly();
  /** `true` when the search term is non-empty. */
  readonly hasValue = computed(() => this.termState().length > 0);

  /** Emitted after each debounced input event with the new term. */
  readonly searchChange = output<string>();

  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  /**
   * `clear()` / `flush()` / `cancel()` notifier: switches the pipeline away
   * from a pending debounce.
   */
  private readonly settled = new Subject<void>();
  /** The typed term still waiting out its debounce, `null` when none is. */
  private pendingTerm: string | null = null;

  constructor() {
    const typed = fromEvent<InputEvent>(this.el.nativeElement as HTMLInputElement, 'input').pipe(
      map((e) => (e.target as HTMLInputElement).value),
      tap((value) => (this.pendingTerm = value)),
    );
    merge(typed, this.settled.pipe(map(() => null)))
      .pipe(
        switchMap((value) => {
          if (value === null) {
            return EMPTY;
          }
          const delay = this.debounceMs();
          return delay <= 0 ? of(value) : timer(delay).pipe(map(() => value));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => this.commit(term));
  }

  /**
   * Emits the pending term at once instead of after the debounce window.
   * Returns `true` when a term was pending, `false` (and emits nothing) when
   * none was.
   */
  flush(): boolean {
    const pending = this.pendingTerm;
    if (pending === null) {
      return false;
    }
    this.settled.next();
    this.commit(pending);
    return true;
  }

  /**
   * Drops the pending term: it never reaches `term` or `searchChange`. The
   * input element keeps its text; a host that wants it back in line with
   * `term` resets it. Returns `true` when a term was pending.
   */
  cancel(): boolean {
    if (this.pendingTerm === null) {
      return false;
    }
    this.pendingTerm = null;
    this.settled.next();
    return true;
  }

  /** Clears the search term and resets the input element value. */
  clear(): void {
    this.pendingTerm = null;
    this.settled.next();
    this.termState.set('');
    this.renderer.setProperty(this.el.nativeElement, 'value', '');
    this.searchChange.emit('');
  }

  private commit(term: string): void {
    this.pendingTerm = null;
    this.termState.set(term);
    this.searchChange.emit(term);
  }
}
