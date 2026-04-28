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
 * Declarative-mode search element — projects an `<input type="search">`
 * into a parent `<cngx-select-shell>`'s panel as the first item, above
 * the listbox.
 *
 * Two-way binds the parent shell's `searchTerm` model via
 * {@link CNGX_SELECT_SHELL_SEARCH_HOST}, and forwards keyboard
 * navigation (`ArrowUp` / `ArrowDown` / `Home` / `End` / `Enter` /
 * `Escape`) into the listbox AD so the user can filter and pick
 * without leaving the input.
 *
 * **Intended usage:** as a direct child of `<cngx-select-shell>`,
 * authored alongside the projected options. The shell projects this
 * element into a dedicated `<ng-content select="cngx-select-search" />`
 * slot above the listbox.
 *
 * @example
 * ```html
 * <cngx-select-shell [(value)]="city">
 *   <cngx-select-search [placeholder]="'Filter cities…'" />
 *   @for (city of cities; track city) {
 *     <cngx-option [value]="city">{{ city }}</cngx-option>
 *   }
 * </cngx-select-shell>
 * ```
 *
 * @category interactive
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
  styles: `
    :host {
      display: block;
      padding: var(--cngx-select-search-padding, 0.5rem);
      border-bottom: var(
        --cngx-select-search-divider,
        1px solid var(--cngx-border, #e5e7eb)
      );
    }
    .cngx-select-search__input {
      width: 100%;
      padding: var(--cngx-select-search-input-padding, 0.375rem 0.5rem);
      border: var(
        --cngx-select-search-input-border,
        1px solid var(--cngx-border, #cbd5e1)
      );
      border-radius: var(--cngx-select-search-input-radius, 0.25rem);
      background: var(--cngx-select-search-input-bg, transparent);
      color: inherit;
      font: inherit;
    }
    .cngx-select-search__input:focus-visible {
      outline: var(
        --cngx-select-search-focus-outline,
        2px solid var(--cngx-focus-ring, #1976d2)
      );
      outline-offset: var(--cngx-select-search-focus-offset, 1px);
    }
  `,
})
export class CngxSelectSearch {
  /** Placeholder text on the input. */
  readonly placeholder = input<string>('Search…');

  /**
   * Optional ARIA label override. Three-stage cascade:
   * per-instance `[aria-label]` → injected
   * `CNGX_SELECT_CONFIG.ariaLabels.searchInput` → `null` (the input
   * falls through to its placeholder for AT naming).
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** @internal */
  protected readonly host = inject(CNGX_SELECT_SHELL_SEARCH_HOST);
  private readonly config = resolveSelectConfig();

  /**
   * Resolved ARIA label per the cascade documented on {@link ariaLabel}.
   * Returns `null` when no instance input is bound and the config
   * leaves `searchInput` unset — the input then exposes only the
   * `placeholder` to AT, matching the native `<input>` default.
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
   * Forward navigation keys into the listbox AD while the user keeps
   * focus in the search input. Mirrors the shared trigger keyboard
   * contract: ArrowUp/Down move highlight, Home/End jump to ends,
   * Enter activates the current item, Escape closes the panel and
   * returns focus to the trigger.
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
