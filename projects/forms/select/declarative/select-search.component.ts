import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { resolveSelectConfig } from '../shared/resolve-config';

import { CNGX_SELECT_SHELL_SEARCH_HOST } from './select-search-host';

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
 */
@Component({
  selector: 'cngx-select-search',
  exportAs: 'cngxSelectSearch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      type="search"
      class="cngx-select-search__input"
      [value]="host.searchTerm()"
      (input)="handleInput($event)"
      (keydown)="handleKeydown($event)"
      [attr.aria-label]="resolvedAriaLabel()"
      [placeholder]="placeholder()"
      autocomplete="off"
    />
  `,
  styleUrls: ['./select-search.component.css'],
})
export class CngxSelectSearch {
  /** Placeholder text on the input. */
  readonly placeholder = input<string>('Search…');

  /**
   * ARIA label override. Cascade: per-instance `[aria-label]` →
   * `CNGX_SELECT_CONFIG.ariaLabels.searchInput` → `null` (input
   * falls back to placeholder for AT naming).
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** @internal */
  protected readonly host = inject(CNGX_SELECT_SHELL_SEARCH_HOST);
  private readonly config = resolveSelectConfig();

  /**
   * Resolved ARIA label per the cascade above. `null` when neither
   * input nor config sets it — input then exposes only `placeholder`
   * to AT (native `<input>` default).
   *
   * @internal
   */
  protected readonly resolvedAriaLabel = computed<string | null>(
    () => this.ariaLabel() ?? this.config.ariaLabels?.searchInput ?? null,
  );

  /** @internal */
  protected handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.host.searchTerm.set(target.value);
  }

  /**
   * Forward navigation keys into the listbox AD while focus stays in
   * the search input. ArrowUp/Down move highlight, Home/End jump to
   * ends, Enter activates the current item, Escape closes and
   * restores focus.
   *
   * @internal
   */
  protected handleKeydown(event: KeyboardEvent): void {
    const lb = this.host.listboxRef();
    if (!lb) {
      return;
    }
    const ad = lb.ad;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        ad.highlightNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        ad.highlightPrev();
        break;
      case 'Home':
        event.preventDefault();
        ad.highlightFirst();
        break;
      case 'End':
        event.preventDefault();
        ad.highlightLast();
        break;
      case 'Enter':
        event.preventDefault();
        ad.activateCurrent();
        break;
      case 'Escape':
        event.preventDefault();
        this.host.close();
        this.host.focus();
        break;
    }
  }
}
