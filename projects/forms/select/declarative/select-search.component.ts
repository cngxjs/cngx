import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  Injector,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { CngxSearch } from '@cngx/common/interactive';

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
 * the user can filter and pick without leaving the input. The input carries
 * `CngxSearch`, so the shell's `searchDebounceMs` runs through the same
 * debounce as the input variants' `CngxListboxSearch`.
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
 * @relatedTo CngxSelectShell, CngxSelectOption, CngxSelectOptgroup, CngxSearch, withFallbackLabels
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
      cngxSearch
      class="cngx-select-search__input"
      role="combobox"
      aria-autocomplete="list"
      [value]="host.searchTerm()"
      [debounceMs]="debounceMs()"
      (searchChange)="host.searchTerm.set($event)"
      (keydown)="handleKeydown($event)"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-controls]="host.listboxId?.() ?? null"
      [attr.aria-expanded]="host.panelOpen?.() ?? false"
      [attr.aria-activedescendant]="activeId()"
      [placeholder]="resolvedPlaceholder()"
      autocomplete="off"
    />
  `,
  styleUrls: ['./select-search.component.css'],
  imports: [CngxSearch],
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
   * `CNGX_SELECT_CONFIG.ariaLabels.searchInput` (EN `'Search options'`). The
   * config default is a real string, so the input is named for AT out of the
   * box; only a config that sets `searchInput` to `null` leaves the input
   * named by its `placeholder` instead.
   */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /**
   * `aria-activedescendant` for the combobox input: the id of the listbox's
   * highlighted option, or `null` when nothing is highlighted.
   *
   * @internal
   */
  protected readonly activeId = computed<string | null>(
    () => this.host.listboxRef()?.ad.activeId() ?? null,
  );

  /** @internal */
  protected readonly host = injectSelectShellSearchHost();

  private readonly injector = inject(Injector);

  private readonly inputRef = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  // Optional: the panel-close effect can run before the first render.
  private readonly search = viewChild(CngxSearch);

  /**
   * How long a typed term waits before it reaches `host.searchTerm`, so the
   * shell's `searchTermChange` fires once per pause, not once per keystroke.
   * A host without `searchDebounceMs` gets a write on every keystroke.
   *
   * @internal
   */
  protected readonly debounceMs = computed<number>(() => this.host.searchDebounceMs?.() ?? 0);

  constructor() {
    // The element stays mounted while the panel is closed, so a close by Tab,
    // outside click, trigger click or pick must not let the write land later.
    effect(() => {
      const open = this.host.panelOpen?.() ?? true;
      if (!open) {
        untracked(() => this.dropPendingWrite());
      }
    });
    // Lead the mobile sheet: the shell makes this input its initial focus
    // once both views exist.
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const release = this.host.registerInitialFocus?.(this.inputRef().nativeElement);
      if (release) {
        destroyRef.onDestroy(release);
      }
    });
  }

  /**
   * Resolved ARIA label per the cascade above: the instance `[aria-label]`
   * else the config `ariaLabels.searchInput` (EN `'Search options'`). `null`
   * only when a config explicitly clears `searchInput` - the input then
   * exposes its `placeholder` to AT (native `<input>` default).
   *
   * @internal
   */
  protected readonly resolvedAriaLabel = computed<string | null>(
    () => this.ariaLabel() ?? this.config.ariaLabels().searchInput,
  );

  /**
   * Forward navigation keys into the listbox AD while focus stays in
   * the search input. ArrowUp/Down move highlight, Enter activates the
   * current item, Escape closes and restores focus. A debounced term still
   * waiting for its write settles first: Enter writes it at once and
   * activates after the next render, once the listbox holds the options the
   * term filters to, so the pick resolves against the flushed filter (an
   * active option the term hides is no longer active, and nothing is picked);
   * Escape drops it, as every other close of the panel does, so no write
   * lands after the panel closed.
   *
   * @internal
   */
  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.search()?.flush()) {
      event.preventDefault();
      // The listbox reads the filtered options through a template binding,
      // which refreshes on the next render, not on the term write.
      afterNextRender(() => this.host.listboxRef()?.ad.activateCurrent(), {
        injector: this.injector,
      });
      return;
    }
    if (event.key === 'Escape') {
      this.dropPendingWrite();
    }
    this.forwardKey(event);
  }

  private readonly forwardKey = createListboxKeyForward(
    this.host.listboxRef,
    () => {
      this.host.close();
      this.host.focus();
    },
    { homeEnd: 'listbox' },
  );

  // The input keeps the dropped text otherwise: `[value]` re-renders only when
  // `searchTerm` changes, and the dropped write never changes it.
  private dropPendingWrite(): void {
    if (!this.search()?.cancel()) {
      return;
    }
    this.inputRef().nativeElement.value = this.host.searchTerm();
  }
}
