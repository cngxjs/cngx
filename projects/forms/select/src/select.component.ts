import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import type { CngxAsyncState } from '@cngx/core/utils';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';

import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxTrigger,
  CngxOption,
} from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFieldRef,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CngxSelectAnnouncer } from './shared/announcer';
import { type CngxSelectAnnouncerConfig } from './shared/config';
import {
  flattenSelectOptions,
  isCngxSelectOptionGroupDef,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from './shared/option.model';
import { resolveSelectConfig } from './shared/resolve-config';
import {
  CngxSelectCaret,
  CngxSelectCheck,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectLoading,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionLabel,
  CngxSelectPlaceholder,
  CngxSelectRefreshing,
  CngxSelectTriggerLabel,
} from './shared/template-slots';

type CompareFn<T> = (a: T | undefined, b: T | undefined) => boolean;
const defaultCompare: CompareFn<unknown> = (a, b) => Object.is(a, b);

/**
 * Change event emitted by {@link CngxSelect.selectionChange} and related
 * outputs when the user (not programmatic writes) picks a value.
 *
 * @category interactive
 */
export interface CngxSelectChange<T = unknown> {
  readonly source: CngxSelect<T>;
  readonly value: T | undefined;
  readonly option: CngxSelectOptionDef<T> | null;
}

/**
 * Native-feeling single-select dropdown. Behaves like `<select>`, exceeds
 * `mat-select` on a11y, and composes on top of the Level-2 atoms
 * `CngxListbox` + `CngxListboxTrigger` + `CngxPopover`.
 *
 * Full API summary — all inputs, outputs, methods, template slots, and config
 * hooks — lives in compodoc / `.internal/architektur/select-family-architecture.md`.
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-select',
  exportAs: 'cngxSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxClickOutside,
    CngxListbox,
    CngxListboxTrigger,
    CngxOption,
    CngxPopover,
    CngxPopoverTrigger,
    NgTemplateOutlet,
  ],
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSelect }],
  host: {
    '[id]': 'resolvedId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <div
      class="cngx-select__root"
      cngxClickOutside
      [enabled]="panelOpen()"
      (clickOutside)="handleClickOutside()"
    >
    <button
      #triggerBtn
      type="button"
      class="cngx-select__trigger"
      [cngxPopoverTrigger]="pop"
      [haspopup]="'listbox'"
      [cngxListboxTrigger]="lb"
      [popover]="pop"
      [closeOnSelect]="true"
      [disabled]="disabled()"
      [attr.tabindex]="effectiveTabIndex()"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-labelledby]="resolvedAriaLabelledBy()"
      [attr.aria-invalid]="ariaInvalid()"
      [attr.aria-required]="resolvedAriaRequired()"
      [attr.aria-busy]="ariaBusy()"
      (click)="handleTriggerClick()"
      (focus)="handleFocus()"
      (blur)="handleBlur()"
      (keydown)="handleTriggerKeydown($event)"
    >
      <span class="cngx-select__label">
        @if (hasTriggerLabelTemplate() && !isEmpty()) {
          <ng-container
            *ngTemplateOutlet="
              triggerLabelTpl()!.templateRef;
              context: { $implicit: selectedOption(), selected: selectedOption() }
            "
          />
        } @else if (isEmpty()) {
          @if (placeholderTpl(); as tpl) {
            <ng-container
              *ngTemplateOutlet="
                tpl.templateRef;
                context: { $implicit: placeholder(), placeholder: placeholder() }
              "
            />
          } @else {
            {{ placeholder() || label() }}
          }
        } @else {
          {{ triggerText() }}
        }
      </span>
      @if (clearable() && !isEmpty() && !disabled()) {
        <button
          type="button"
          class="cngx-select__clear"
          [attr.aria-label]="clearButtonAriaLabel()"
          (click)="handleClearClick($event)"
        >
          ✕
        </button>
      }
      @if (resolvedShowCaret()) {
        @if (caretTpl(); as tpl) {
          <ng-container
            *ngTemplateOutlet="tpl.templateRef; context: { $implicit: panelOpen(), open: panelOpen() }"
          />
        } @else {
          <span aria-hidden="true" class="cngx-select__caret">&#9662;</span>
        }
      }
    </button>
    <div
      cngxPopover
      #pop="cngxPopover"
      placement="bottom"
      class="cngx-select__panel"
      [class]="panelClassList()"
      [style.--cngx-select-panel-min-width]="panelWidthCss()"
    >
      <div
        cngxListbox
        #lb="cngxListbox"
        [label]="resolvedListboxLabel()"
        [compareWith]="listboxCompareWith()"
        [(value)]="value"
      >
        @switch (activeView()) {
          @case ('skeleton') {
            @if (loadingTpl(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl.templateRef" />
            } @else {
              <div class="cngx-select__loading" role="status">Lädt…</div>
            }
          }
          @case ('empty') {
            @if (emptyTpl(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl.templateRef" />
            } @else {
              <div class="cngx-select__empty">Keine Optionen</div>
            }
          }
          @case ('none') {
            @if (emptyTpl(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl.templateRef" />
            } @else {
              <div class="cngx-select__empty">Keine Optionen</div>
            }
          }
          @case ('error') {
            @if (errorTpl(); as tpl) {
              <ng-container
                *ngTemplateOutlet="tpl.templateRef; context: errorContext()"
              />
            } @else {
              <div class="cngx-select__error" role="alert">
                <span class="cngx-select__error-message">Laden fehlgeschlagen</span>
                <button
                  type="button"
                  class="cngx-select__error-retry"
                  (click)="handleRetry()"
                >
                  Nochmal versuchen
                </button>
              </div>
            }
          }
          @default {
            @if (showInlineError()) {
              @if (errorTpl(); as tpl) {
                <ng-container
                  *ngTemplateOutlet="tpl.templateRef; context: errorContext()"
                />
              } @else {
                <div class="cngx-select__error cngx-select__error--inline" role="alert">
                  <span class="cngx-select__error-message">Aktualisieren fehlgeschlagen</span>
                  <button
                    type="button"
                    class="cngx-select__error-retry"
                    (click)="handleRetry()"
                  >
                    Nochmal versuchen
                  </button>
                </div>
              }
            }
            @if (showRefreshIndicator()) {
              @if (refreshingTpl(); as tpl) {
                <ng-container *ngTemplateOutlet="tpl.templateRef" />
              } @else {
                <div
                  class="cngx-select__refreshing"
                  role="status"
                  aria-live="polite"
                  aria-label="Aktualisiere"
                ></div>
              }
            }
            @for (item of effectiveOptions(); track $index) {
            @if (isGroup(item)) {
              <div class="cngx-select__group" role="group" [attr.aria-label]="item.label">
                @if (optgroupTpl(); as tpl) {
                  <ng-container
                    *ngTemplateOutlet="tpl.templateRef; context: { $implicit: item, group: item }"
                  />
                } @else {
                  <div class="cngx-select__group-header" aria-hidden="true">{{ item.label }}</div>
                }
                @for (opt of item.children; track opt.value) {
                  <div
                    cngxOption
                    [value]="opt.value"
                    [disabled]="!!opt.disabled || !!item.disabled"
                    class="cngx-select__option"
                    [class.cngx-select__option--selected]="isSelected(opt)"
                  >
                    @if (resolvedShowSelectionIndicator()) {
                      @if (checkTpl(); as tpl) {
                        <ng-container
                          *ngTemplateOutlet="
                            tpl.templateRef;
                            context: { $implicit: opt, option: opt, selected: isSelected(opt) }
                          "
                        />
                      } @else if (isSelected(opt)) {
                        <span aria-hidden="true" class="cngx-select__check">&#10003;</span>
                      }
                    }
                    @if (optionLabelTpl(); as tpl) {
                      <ng-container
                        *ngTemplateOutlet="
                          tpl.templateRef;
                          context: {
                            $implicit: opt,
                            option: opt,
                            selected: isSelected(opt),
                            highlighted: false
                          }
                        "
                      />
                    } @else {
                      {{ opt.label }}
                    }
                  </div>
                }
              </div>
            } @else {
              <div
                cngxOption
                [value]="item.value"
                [disabled]="!!item.disabled"
                class="cngx-select__option"
                [class.cngx-select__option--selected]="isSelected(item)"
              >
                @if (resolvedShowSelectionIndicator()) {
                  @if (checkTpl(); as tpl) {
                    <ng-container
                      *ngTemplateOutlet="
                        tpl.templateRef;
                        context: { $implicit: item, option: item, selected: isSelected(item) }
                      "
                    />
                  } @else if (isSelected(item)) {
                    <span aria-hidden="true" class="cngx-select__check">&#10003;</span>
                  }
                }
                @if (optionLabelTpl(); as tpl) {
                  <ng-container
                    *ngTemplateOutlet="
                      tpl.templateRef;
                      context: {
                        $implicit: item,
                        option: item,
                        selected: isSelected(item),
                        highlighted: false
                      }
                    "
                  />
                } @else {
                  {{ item.label }}
                }
              </div>
            }
          }
        }
        }
      </div>
    </div>
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      position: relative;
      font: inherit;
      min-width: var(--cngx-select-min-width, 10rem);
    }
    .cngx-select__root {
      display: contents;
    }
    .cngx-select__trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--cngx-select-gap, 0.5rem);
      width: 100%;
      padding: var(--cngx-select-padding, 0.5rem 0.75rem);
      border: var(--cngx-select-border, 1px solid var(--cngx-border, #c4c4c4));
      border-radius: var(--cngx-select-radius, 0.25rem);
      background: var(--cngx-select-bg, transparent);
      color: var(--cngx-select-color, inherit);
      font: inherit;
      cursor: pointer;
      text-align: start;
      justify-content: space-between;
    }
    .cngx-select__trigger:focus-visible {
      outline: var(--cngx-select-focus-outline, 2px solid var(--cngx-focus-ring, #1976d2));
      outline-offset: var(--cngx-select-focus-offset, 2px);
    }
    .cngx-select__trigger[disabled] {
      opacity: var(--cngx-select-disabled-opacity, 0.5);
      cursor: not-allowed;
    }
    .cngx-select__label {
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    .cngx-select__caret {
      flex: 0 0 auto;
      opacity: 0.7;
    }
    .cngx-select__clear {
      flex: 0 0 auto;
      appearance: none;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      padding: 0 0.25rem;
      font: inherit;
      opacity: 0.6;
    }
    .cngx-select__clear:hover {
      opacity: 1;
    }
    .cngx-select__clear:focus-visible {
      outline: 2px solid var(--cngx-focus-ring, #1976d2);
      border-radius: 0.125rem;
    }
    .cngx-select__panel {
      border: var(--cngx-select-panel-border, 1px solid var(--cngx-border, #c4c4c4));
      border-radius: var(--cngx-select-panel-radius, 0.25rem);
      background: var(--cngx-select-panel-bg, var(--cngx-surface, #fff));
      box-shadow: var(--cngx-select-panel-shadow, 0 4px 12px rgba(0, 0, 0, 0.12));
      padding: var(--cngx-select-panel-padding, 0.25rem);
      margin: 0;
      min-width: var(--cngx-select-panel-min-width, anchor-size(width));
      max-height: var(--cngx-select-panel-max-height, 16rem);
      overflow-y: auto;
      position-try-fallbacks:
        flip-block,
        flip-inline,
        flip-block flip-inline;
    }
    .cngx-select__group-header {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .cngx-select__option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: var(--cngx-select-option-padding, 0.375rem 0.5rem);
      cursor: pointer;
      border-radius: var(--cngx-select-option-radius, 0.125rem);
    }
    /* CngxSelect owns its selected-indicator visual. Suppress any inherited
       ::after checkmark (e.g. from demo / global stylesheets) so consumers
       don't end up with a double-check. */
    .cngx-select__option::after,
    .cngx-select__option::before {
      content: none;
    }
    .cngx-select__option[aria-disabled='true'] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cngx-select__option.cngx-option--highlighted {
      background: var(--cngx-select-option-highlight-bg, rgba(25, 118, 210, 0.1));
    }
    .cngx-select__check {
      color: var(--cngx-select-check-color, var(--cngx-focus-ring, #1976d2));
      font-weight: 700;
    }
    .cngx-select__loading,
    .cngx-select__empty {
      padding: 0.5rem 0.75rem;
      font-style: italic;
      opacity: 0.7;
    }
    .cngx-select__error {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--cngx-select-error-gap, 0.5rem);
      padding: var(--cngx-select-error-padding, 0.5rem 0.75rem);
      color: var(--cngx-select-error-color, var(--cngx-error, #b71c1c));
    }
    .cngx-select__error--inline {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: var(--cngx-select-error-inline-padding, 0.375rem 0.5rem);
      margin-bottom: 0.25rem;
      border: 1px solid currentColor;
      border-radius: var(--cngx-select-error-inline-radius, 0.125rem);
      font-size: 0.875rem;
    }
    .cngx-select__error-message {
      font-weight: 500;
    }
    .cngx-select__error-retry {
      appearance: none;
      border: var(--cngx-select-error-retry-border, 1px solid currentColor);
      background: transparent;
      color: inherit;
      font: inherit;
      padding: 0.25rem 0.5rem;
      border-radius: 0.125rem;
      cursor: pointer;
    }
    .cngx-select__error-retry:focus-visible {
      outline: 2px solid var(--cngx-focus-ring, #1976d2);
      outline-offset: 2px;
    }
    .cngx-select__refreshing {
      height: var(--cngx-select-refreshing-height, 2px);
      margin: calc(-1 * var(--cngx-select-panel-padding, 0.25rem))
        calc(-1 * var(--cngx-select-panel-padding, 0.25rem)) 0;
      background: linear-gradient(
        90deg,
        transparent,
        var(--cngx-select-refreshing-color, var(--cngx-focus-ring, #1976d2)),
        transparent
      );
      background-size: 200% 100%;
      animation: cngx-select-refresh 1.1s linear infinite;
    }
    @keyframes cngx-select-refresh {
      from { background-position: 100% 0; }
      to { background-position: -100% 0; }
    }
  `,
})
export class CngxSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly announcer = inject(CngxSelectAnnouncer);
  private readonly config = resolveSelectConfig();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // ── Inputs ─────────────────────────────────────────────────────────

  /** Accessible label for the listbox region. Also used as the trigger's fallback a11y name when no form-field is around. */
  readonly label = input<string>('');

  /**
   * Options in data-driven mode (flat or grouped).
   *
   * Optional: leave unset and project `<cngx-option>` / `<cngx-optgroup>` /
   * `<cngx-select-divider>` children for declarative composition.
   */
  readonly options = input<CngxSelectOptionsInput<T>>([] as CngxSelectOptionsInput<T>);

  /** Placeholder shown on the trigger when no value is selected. */
  readonly placeholder = input<string>('');

  /** Disabled state. Merges with `presenter.disabled()` if inside a form-field. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** Required state (standalone). Merges with `presenter.required()` if inside a form-field. */
  readonly requiredInput = input<boolean>(false, { alias: 'required' });

  /** Equality function used to match the selected value to an option. Defaults to `Object.is`. */
  readonly compareWith = input<CompareFn<T>>(defaultCompare as CompareFn<T>);

  /** Custom id. Defaults to the presenter-generated ID inside form-field, else auto. */
  readonly idInput = input<string | null>(null, { alias: 'id' });

  /** Explicit `aria-label` on the trigger. Takes precedence over the form-field label when set. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Explicit `aria-labelledby` on the trigger. Takes precedence over the form-field label when set. */
  readonly ariaLabelledBy = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Trigger tab index. Defaults to `0`. */
  readonly tabIndex = input<number>(0);

  /** Classes applied to the panel root. Merged with the library default. */
  readonly panelClass = input<string | readonly string[] | null>(null);

  /** Panel width strategy — overrides `withPanelWidth()` from config. */
  readonly panelWidth = input<'trigger' | number | null>(this.config.panelWidth);

  /** Typeahead debounce override — defaults to config. */
  readonly typeaheadDebounceInterval = input<number>(this.config.typeaheadDebounceInterval);

  /** Hide the default checkmark indicator on this instance. */
  readonly hideSelectionIndicator = input<boolean>(!this.config.showSelectionIndicator);

  /** Hide the default dropdown caret glyph on this instance. */
  readonly hideCaret = input<boolean>(!this.config.showCaret);

  /** Render a clear-button when a value is selected. */
  readonly clearable = input<boolean>(false);

  /** A11y label for the clear button. */
  readonly clearButtonAriaLabel = input<string>('Auswahl entfernen');

  /** Display a loading state inside the panel. */
  readonly loading = input<boolean>(false);

  /**
   * Async-state source for options — when bound, replaces `[options]` during
   * loading/error/refreshing states and drives the panel's visual mode.
   *
   * `[state]` is the primary source when set. `[options]` remains the
   * fallback for the static-array case. Both together: `[state]` wins.
   */
  readonly state = input<CngxAsyncState<CngxSelectOptionsInput<T>> | null>(null);

  /**
   * Callback invoked when the user clicks the default retry-button in the
   * error panel (or calls `retry` on the error template). `(retry)` also
   * fires in both cases.
   */
  readonly retryFn = input<(() => void) | null>(null);

  /** Per-instance announcer override. */
  readonly announceChanges = input<boolean | undefined>(undefined);

  /** Per-instance formatter override for the announcer message. */
  readonly announceTemplate = input<CngxSelectAnnouncerConfig['format'] | null>(null);

  /** Two-way single-value binding. */
  readonly value = model<T | undefined>(undefined);

  // ── Outputs ────────────────────────────────────────────────────────

  /** Fires when the user selects an option (not on programmatic writes). */
  readonly selectionChange = output<CngxSelectChange<T>>();

  /** Fires whenever the panel open state changes. */
  readonly openedChange = output<boolean>();

  /** Fires on panel open. */
  readonly opened = output<void>();

  /** Fires on panel close. */
  readonly closed = output<void>();

  /** Fires with the selected option (null for clear) — sibling to `selectionChange`. */
  readonly optionSelected = output<CngxSelectOptionDef<T> | null>();

  /**
   * Fires when the user triggers a retry from the error panel (either the
   * default retry-button or a custom `[cngxSelectError]` template).
   */
  readonly retry = output<void>();

  // ── Content templates ──────────────────────────────────────────────

  /** @internal */
  protected readonly checkTpl = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  /** @internal */
  protected readonly caretTpl = contentChild<CngxSelectCaret>(CngxSelectCaret);
  /** @internal */
  protected readonly optgroupTpl = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  /** @internal */
  protected readonly placeholderTpl = contentChild<CngxSelectPlaceholder>(CngxSelectPlaceholder);
  /** @internal */
  protected readonly emptyTpl = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  /** @internal */
  protected readonly loadingTpl = contentChild<CngxSelectLoading>(CngxSelectLoading);
  /** @internal */
  protected readonly triggerLabelTpl = contentChild<CngxSelectTriggerLabel<T>>(
    CngxSelectTriggerLabel,
  );
  /** @internal */
  protected readonly optionLabelTpl = contentChild<CngxSelectOptionLabel<T>>(
    CngxSelectOptionLabel,
  );
  /** @internal */
  protected readonly errorTpl = contentChild(CngxSelectError);
  /** @internal */
  protected readonly refreshingTpl = contentChild(CngxSelectRefreshing);

  // ── ViewChildren ───────────────────────────────────────────────────

  private readonly triggerBtn = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);


  // ── Public Signals (mat-select parity) ─────────────────────────────

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /** Currently selected option, resolved against `options`. `null` when empty. */
  readonly selected = computed<CngxSelectOptionDef<T> | null>(() => this.selectedOption());

  /** Human-readable label displayed on the trigger (resolves custom trigger template first). */
  readonly triggerValue = computed<string>(() => this.triggerText());

  // ── CngxFormFieldControl implementation ────────────────────────────

  readonly id = computed<string>(() => this.resolvedId() ?? '');

  readonly disabled = computed<boolean>(
    () => this.disabledInput() || (this.presenter?.disabled() ?? false),
  );

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  readonly empty = computed<boolean>(() => this.isEmpty());

  // ── Internal: ARIA projection ──────────────────────────────────────

  /** @internal */
  protected readonly describedBy = computed(() => this.presenter?.describedBy() ?? null);
  /** @internal */
  protected readonly ariaInvalid = computed(() => (this.errorState() ? true : null));
  /** @internal */
  protected readonly ariaBusy = computed(() => (this.presenter?.pending() ? true : null));
  /** @internal */
  protected readonly ariaReadonly = computed(() => (this.presenter?.readonly() ? true : null));
  /** @internal */
  protected readonly ariaErrorMessage = computed(() =>
    this.errorState() ? (this.presenter?.errorId() ?? null) : null,
  );

  /** @internal */
  protected readonly resolvedId = computed<string>(() => {
    const override = this.idInput();
    if (override) {
      return override;
    }
    return this.presenter?.inputId() ?? '';
  });

  /** @internal */
  protected readonly resolvedAriaLabel = computed<string | null>(() => {
    const explicit = this.ariaLabel();
    if (explicit) {
      return explicit;
    }
    if (this.resolvedAriaLabelledBy()) {
      return null;
    }
    return this.label() || null;
  });

  /** @internal */
  protected readonly resolvedAriaLabelledBy = computed<string | null>(
    () => this.ariaLabelledBy() ?? this.presenter?.labelId() ?? null,
  );

  /** @internal */
  protected readonly resolvedAriaRequired = computed<boolean | null>(() =>
    this.requiredInput() || this.presenter?.required() ? true : null,
  );

  /** @internal */
  protected readonly effectiveTabIndex = computed<number | null>(() =>
    this.disabled() ? -1 : this.tabIndex(),
  );

  /** @internal */
  protected readonly resolvedShowSelectionIndicator = computed<boolean>(
    () => !this.hideSelectionIndicator(),
  );

  /** @internal */
  protected readonly resolvedShowCaret = computed<boolean>(() => !this.hideCaret());

  /** @internal */
  protected readonly resolvedListboxLabel = computed<string>(() => {
    const label = this.label();
    if (label.length > 0) {
      return label;
    }
    const aria = this.ariaLabel();
    if (aria && aria.length > 0) {
      return aria;
    }
    const placeholder = this.placeholder();
    if (placeholder.length > 0) {
      return placeholder;
    }
    return 'Options';
  });

  /** @internal */
  protected readonly panelClassList = computed<string | readonly string[] | null>(() => {
    const global = this.config.panelClass;
    const local = this.panelClass();
    if (!global && !local) {
      return null;
    }
    if (!global) {
      return local;
    }
    if (!local) {
      return global;
    }
    const globalArr: readonly string[] = Array.isArray(global)
      ? (global as readonly string[])
      : [global as string];
    const localArr: readonly string[] = Array.isArray(local)
      ? (local as readonly string[])
      : [local as string];
    return [...globalArr, ...localArr];
  });

  /** @internal */
  protected readonly panelWidthCss = computed<string | null>(() => {
    const w = this.panelWidth();
    if (w === null) {
      return 'auto';
    }
    if (w === 'trigger') {
      return 'anchor-size(width)';
    }
    return `${w}px`;
  });

  /**
   * @internal — resolved options source: `state.data()` when `[state]` is
   * bound and has data, else `[options]`.
   */
  protected readonly effectiveOptions = computed<CngxSelectOptionsInput<T>>(() => {
    const s = this.state();
    const fromState = s?.data();
    if (fromState) {
      return fromState;
    }
    return this.options();
  });

  /** @internal — flattened option list for matcher / trigger-label lookups. */
  protected readonly flatOptions = computed<CngxSelectOptionDef<T>[]>(() =>
    flattenSelectOptions(this.effectiveOptions()),
  );

  /**
   * @internal — resolved view mode for the panel, derived from the bound
   * state (or a simple `loading()`/`options()` fallback when no state is
   * bound). Encodes the shared async state machine via `resolveAsyncView`.
   */
  protected readonly activeView = computed<AsyncView>(() => {
    const s = this.state();
    if (s) {
      return resolveAsyncView(s.status(), s.isFirstLoad(), s.isEmpty());
    }
    if (this.loading()) {
      return 'skeleton';
    }
    if (this.effectiveOptions().length === 0) {
      return 'empty';
    }
    return 'content';
  });

  /** @internal — subtle refreshing indicator (options stay visible). */
  protected readonly showRefreshIndicator = computed<boolean>(() => {
    const s = this.state();
    if (!s) {
      return false;
    }
    const status = s.status();
    return status === 'refreshing' || (status === 'loading' && !s.isFirstLoad());
  });

  /**
   * @internal — inline error banner on top of stale options (`'content+error'`
   * view). Renders the same `[cngxSelectError]` template or the default
   * error banner, only above the options instead of replacing them.
   */
  protected readonly showInlineError = computed<boolean>(
    () => this.activeView() === 'content+error',
  );

  /** @internal — error context passed to a `[cngxSelectError]` template. */
  protected readonly errorContext = computed(() => ({
    $implicit: this.state()?.error(),
    error: this.state()?.error(),
    retry: (): void => this.handleRetry(),
  }));

  /** @internal */
  protected readonly selectedOption = computed<CngxSelectOptionDef<T> | null>(() => {
    const v = this.value();
    if (v === undefined || v === null) {
      return null;
    }
    const eq = this.compareWith();
    return this.flatOptions().find((o) => eq(o.value, v)) ?? null;
  });

  /** @internal */
  protected readonly triggerText = computed<string>(() => {
    const fallback = this.placeholder() || this.label();
    return this.selectedOption()?.label ?? fallback;
  });

  /** @internal */
  protected readonly hasTriggerLabelTemplate = computed<boolean>(
    () => this.triggerLabelTpl() != null,
  );

  /** @internal */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  // ── Template helpers ───────────────────────────────────────────────

  protected isGroup(
    item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>,
  ): item is CngxSelectOptionGroupDef<T> {
    return isCngxSelectOptionGroupDef(item);
  }

  protected isSelected(opt: CngxSelectOptionDef<T>): boolean {
    const v = this.value();
    if (v === undefined || v === null) {
      return false;
    }
    return this.compareWith()(opt.value, v);
  }

  protected isEmpty(): boolean {
    const v = this.value();
    return v === undefined || v === null;
  }

  constructor() {
    // Bridge AD activations into popover-close and selectionChange output.
    effect((onCleanup) => {
      const lb = this.listboxRef();
      const pop = this.popoverRef();
      if (!lb || !pop) {
        return;
      }
      const sub = lb.ad.activated.subscribe((raw: unknown) => {
        untracked(() => {
          const value = raw as T;
          const eq = this.compareWith();
          const opt =
            this.flatOptions().find((o) => eq(o.value, value)) ?? null;
          this.selectionChange.emit({
            source: this,
            value,
            option: opt,
          });
          this.optionSelected.emit(opt);
          this.maybeAnnounce(opt);
          if (pop.isVisible()) {
            pop.hide();
          }
        });
      });
      onCleanup(() => sub.unsubscribe());
    });

    // Panel open/close lifecycle events.
    effect(() => {
      const open = this.panelOpen();
      untracked(() => {
        this.openedChange.emit(open);
        if (open) {
          this.opened.emit();
        } else {
          this.closed.emit();
          if (this.config.restoreFocus) {
            queueMicrotask(() => this.triggerBtn()?.nativeElement.focus());
          }
        }
      });
    });

    // Field → Select: mirror bound field value into our model signal.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef: CngxFieldRef = presenter.fieldState();
      const fieldValue: unknown = fieldRef.value();
      const eq = this.compareWith() as CompareFn<unknown>;
      const current: unknown = untracked(() => this.value());
      if (!eq(current, fieldValue)) {
        this.value.set(fieldValue as T | undefined);
      }
    });

    // Select → Field: push selection back into bound field.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef = presenter.fieldState();
      const selectValue: unknown = this.value();
      const current: unknown = untracked(() => fieldRef.value());
      const eq = this.compareWith() as CompareFn<unknown>;
      if (eq(current, selectValue)) {
        return;
      }
      writeFieldValue(fieldRef, selectValue);
    });
  }

  // ── Public API (mat-select parity) ─────────────────────────────────

  /** Open the panel. */
  open(): void {
    this.popoverRef()?.show();
  }

  /** Close the panel. */
  close(): void {
    this.popoverRef()?.hide();
  }

  /** Toggle the panel. */
  toggle(): void {
    this.popoverRef()?.toggle();
  }

  /** Focus the trigger button. */
  focus(options?: FocusOptions): void {
    this.triggerBtn()?.nativeElement.focus(options);
  }

  // ── Event handlers ─────────────────────────────────────────────────

  /** @internal */
  protected handleTriggerClick(): void {
    this.toggle();
  }

  /** @internal — closes the panel on outside click (config-driven). */
  protected handleClickOutside(): void {
    const mode = this.config.dismissOn;
    if (mode === 'outside' || mode === 'both') {
      if (this.popoverRef()?.isVisible()) {
        this.close();
      }
    }
  }

  /** @internal — runs the retry callback and emits `(retry)`. */
  protected handleRetry(): void {
    const fn = this.retryFn();
    if (fn) {
      fn();
    }
    this.retry.emit();
  }

  /** @internal */
  protected handleClearClick(event: Event): void {
    event.stopPropagation();
    const eq = this.compareWith();
    const current = this.value();
    if (current === undefined || current === null) {
      return;
    }
    this.value.set(undefined);
    this.selectionChange.emit({ source: this, value: undefined, option: null });
    this.optionSelected.emit(null);
    this.maybeAnnounce(null);
    void eq;
  }

  /** @internal */
  protected handleFocus(): void {
    this.focusedState.set(true);
    if (this.config.openOn === 'focus' || this.config.openOn === 'click+focus') {
      this.open();
    }
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusedState.set(false);
    this.presenter?.fieldState().markAsTouched();
  }

  /** @internal */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
    // Typeahead-while-closed parity with native <select>.
    if (!this.panelOpen() && this.config.typeaheadWhileClosed) {
      const key = event.key;
      if (key.length === 1 && /\S/.exec(key)) {
        event.preventDefault();
        const eq = this.compareWith();
        const flat = this.flatOptions();
        const start =
          flat.findIndex((o) => {
            const v = this.value();
            return v !== undefined && v !== null && eq(o.value, v);
          }) + 1;
        const lower = key.toLowerCase();
        for (let i = 0; i < flat.length; i++) {
          const idx = (start + i) % flat.length;
          const candidate = flat[idx];
          if (candidate.disabled) {
            continue;
          }
          if (candidate.label.toLowerCase().startsWith(lower)) {
            this.value.set(candidate.value);
            this.selectionChange.emit({
              source: this,
              value: candidate.value,
              option: candidate,
            });
            this.optionSelected.emit(candidate);
            this.maybeAnnounce(candidate);
            return;
          }
        }
      }
    }

    // PageUp / PageDown — open and jump ±10.
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault();
      const lb = this.listboxRef();
      const pop = this.popoverRef();
      if (!pop || !lb) {
        return;
      }
      if (!pop.isVisible()) {
        pop.show();
      }
      const step = event.key === 'PageDown' ? 10 : -10;
      const ad = lb.ad;
      const total = lb.options().length;
      const currentLabel = ad.activeId();
      const currentIdx = lb
        .options()
        .findIndex((o) => o.id === currentLabel);
      const target = Math.max(
        0,
        Math.min(total - 1, (currentIdx < 0 ? 0 : currentIdx) + step),
      );
      ad.highlightByIndex(target);
    }
  }

  private maybeAnnounce(option: CngxSelectOptionDef<T> | null): void {
    const announcerConfig = this.config.announcer;
    const perInstance = this.announceChanges();
    const enabled = perInstance ?? announcerConfig.enabled ?? true;
    if (!enabled) {
      return;
    }
    const format = this.announceTemplate() ?? announcerConfig.format;
    const label = this.label();
    const ariaLabel = this.ariaLabel();
    let fieldLabel = 'Auswahl';
    if (label.length > 0) {
      fieldLabel = label;
    } else if (ariaLabel && ariaLabel.length > 0) {
      fieldLabel = ariaLabel;
    }
    const message = format({
      selectedLabel: option?.label ?? null,
      fieldLabel,
      multi: false,
    });
    this.announcer.announce(message, announcerConfig.politeness);
    // Suppress "unused" — host ref is kept for future extensions.
    void this.host;
  }
}

function writeFieldValue(fieldRef: CngxFieldRef, value: unknown): void {
  const signalLike = fieldRef.value as unknown;
  if (
    typeof signalLike === 'function' &&
    'set' in signalLike &&
    typeof (signalLike as { set: unknown }).set === 'function'
  ) {
    (signalLike as { set: (v: unknown) => void }).set(value);
  }
}
