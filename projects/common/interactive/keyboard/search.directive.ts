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
import { EMPTY, fromEvent, map, merge, Subject, switchMap, timer } from 'rxjs';

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
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/keyboard/search.directive.ts
 * @since 0.1.0
 * @relatedTo CngxKeyboardShortcut, CngxListboxSearch
 */
@Directive({
  selector: 'input[cngxSearch]',
  exportAs: 'cngxSearch',
  standalone: true,
})
export class CngxSearch {
  /** Debounce delay in milliseconds. @defaultValue 300 */
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
  /** `clear()` notifier: switches the pipeline away from a pending debounce. */
  private readonly cleared = new Subject<void>();

  constructor() {
    const typed = fromEvent<InputEvent>(this.el.nativeElement as HTMLInputElement, 'input').pipe(
      map((e) => (e.target as HTMLInputElement).value),
    );
    merge(typed, this.cleared.pipe(map(() => null)))
      .pipe(
        switchMap((value) =>
          value === null ? EMPTY : timer(this.debounceMs()).pipe(map(() => value)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => {
        this.termState.set(term);
        this.searchChange.emit(term);
      });
  }

  /** Clears the search term and resets the input element value. */
  clear(): void {
    this.cleared.next();
    this.termState.set('');
    this.renderer.setProperty(this.el.nativeElement, 'value', '');
    this.searchChange.emit('');
  }
}
