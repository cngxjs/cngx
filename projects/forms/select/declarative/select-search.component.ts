import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { createListboxKeyForward } from '../shared/internal/listbox-key-forward';
import { resolveSelectConfig } from '../shared/internal/resolve-config';

import { injectSelectShellSearchHost } from './select-search-host';

/**
 * Declarative-mode search element. Projects an `<input type="search">`
 * into the parent shell's panel above the listbox.
 *
 * Two-way binds the shell's `searchTerm` via
 * `CNGX_SELECT_SHELL_SEARCH_HOST` and forwards
 * `ArrowUp/Down`/`Home`/`End`/`Enter`/`Escape` into the listbox AD so
 * the user can filter and pick without leaving the input.
 *
 * **Usage:** direct child of `<cngx-select-shell>`. The shell projects
 * via `<ng-content select="cngx-select-search" />`.
 *
 * ```html
 * <cngx-select-shell [(value)]="city">
 *   <cngx-select-search [placeholder]="'Filter cities…'" />
 *   @for (city of cities; track city) {
 *     <cngx-option [value]="city">{{ city }}</cngx-option>
 *   }
 * </cngx-select-shell>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/declarative/select-search.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelectShell, CngxSelectOption, CngxSelectOptgroup
 * <example-url>/#/forms/select/declarative/search</example-url>
 * @axis level organism
 */
@Component({
  selector: 'cngx-select-search',
  exportAs: 'cngxSelectSearch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      type="search"
      #searchInput
      class="cngx-select-search__input"
      [value]="host.searchTerm()"
      (input)="handleInput($event)"
      (keydown)="handleKeydown($event)"
      [attr.aria-label]="resolvedAriaLabel()"
      [placeholder]="resolvedPlaceholder()"
      autocomplete="off"
    />
  `,
  styleUrls: ['./select-search.component.css'],
})
export class CngxSelectSearch {
  private readonly config = resolveSelectConfig();

  /**
   * Placeholder text on the input. Default:
   * `CNGX_SELECT_CONFIG.fallbackLabels.searchPlaceholder` (EN `'Search…'`), which
   * follows a runtime language switch while unbound.
   */
  readonly placeholder = input<string | undefined>(undefined);
  /** @internal Bound value, else the config copy; follows a language switch. */
  protected readonly resolvedPlaceholder = computed<string>(
    () => this.placeholder() ?? this.config.fallbackLabels().searchPlaceholder,
  );

  /**
   * ARIA label override. Cascade: per-instance `[aria-label]` →
   * `CNGX_SELECT_CONFIG.ariaLabels.searchInput` → `null` (input
   * falls back to placeholder for AT naming).
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** @internal */
  protected readonly host = injectSelectShellSearchHost();

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  /** Debounced term still waiting for its write into the host. */
  private pendingWrite: {
    readonly timer: ReturnType<typeof setTimeout>;
    readonly term: string;
  } | null = null;

  constructor() {
    // Lead the mobile sheet: the shell makes this input its initial focus
    // once both views exist.
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.cancelPendingWrite());
    afterNextRender(() => {
      const release = this.host.registerInitialFocus?.(this.inputRef().nativeElement);
      if (release) {
        destroyRef.onDestroy(release);
      }
    });
  }

  /**
   * Resolved ARIA label per the cascade above. `null` when neither
   * input nor config sets it - input then exposes only `placeholder`
   * to AT (native `<input>` default).
   *
   * @internal
   */
  protected readonly resolvedAriaLabel = computed<string | null>(
    () => this.ariaLabel() ?? this.config.ariaLabels().searchInput,
  );

  /**
   * Writes the typed term into the host after its `searchDebounceMs`, so the
   * shell's `searchTermChange` fires once per pause, not once per keystroke.
   *
   * @internal
   */
  protected handleInput(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.cancelPendingWrite();
    const delay = this.host.searchDebounceMs?.() ?? 0;
    if (delay <= 0) {
      this.host.searchTerm.set(term);
      return;
    }
    const timer = setTimeout(() => {
      this.pendingWrite = null;
      this.host.searchTerm.set(term);
    }, delay);
    this.pendingWrite = { timer, term };
  }

  /**
   * Forward navigation keys into the listbox AD while focus stays in
   * the search input. ArrowUp/Down move highlight, Enter activates the
   * current item, Escape closes and restores focus. A debounced term still
   * waiting for its write settles first: Enter writes it at once, so the pick
   * runs against the filter the user sees; Escape drops it, so no write lands
   * after the panel closed.
   *
   * @internal
   */
  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.flushPendingWrite();
    } else if (event.key === 'Escape') {
      this.dropPendingWrite();
    }
    this.forwardKey(event);
  }

  private readonly forwardKey = createListboxKeyForward(this.host.listboxRef, () => {
    this.host.close();
    this.host.focus();
  });

  private cancelPendingWrite(): void {
    if (this.pendingWrite) {
      clearTimeout(this.pendingWrite.timer);
      this.pendingWrite = null;
    }
  }

  private flushPendingWrite(): void {
    const pending = this.pendingWrite;
    if (!pending) {
      return;
    }
    this.cancelPendingWrite();
    this.host.searchTerm.set(pending.term);
  }

  // The input keeps the dropped text otherwise: `[value]` re-renders only when
  // `searchTerm` changes, and the dropped write never changes it.
  private dropPendingWrite(): void {
    if (!this.pendingWrite) {
      return;
    }
    this.cancelPendingWrite();
    this.inputRef().nativeElement.value = this.host.searchTerm();
  }
}
