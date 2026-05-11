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
import { fromEvent, map, switchMap, timer } from 'rxjs';

/**
 * Debounced search term tracker for `<input>` elements.
 *
 * Converts the DOM `input` event stream into a debounced Signal. The raw
 * Observable is never exposed — signal at the API boundary.
 *
 * @usageNotes
 *
 * ### Basic usage
 * ```html
 * <input cngxSearch #search="cngxSearch" placeholder="Search..." />
 * <button (click)="search.clear()">Clear</button>
 * ```
 *
 * @category interactive
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

  constructor() {
    // fromEvent is the correct RxJS usage here: external DOM event stream.
    fromEvent<InputEvent>(this.el.nativeElement as HTMLInputElement, 'input')
      .pipe(
        map((e) => (e.target as HTMLInputElement).value),
        switchMap((value) => timer(this.debounceMs()).pipe(map(() => value))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => {
        this.termState.set(term);
        this.searchChange.emit(term);
      });
  }

  /** Clears the search term and resets the input element value. */
  clear(): void {
    this.termState.set('');
    this.renderer.setProperty(this.el.nativeElement, 'value', '');
    this.searchChange.emit('');
  }
}
