import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
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
  type Signal,
  type TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';

import { CNGX_STATEFUL, type CngxAsyncState, type AsyncStatus } from '@cngx/core/utils';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';

import {
  CngxClickOutside,
  CngxListbox,
  CngxListboxTrigger,
} from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';

import { CngxSelectPanel } from '../shared/panel/panel.component';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFieldRef,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

import { CngxSelectAnnouncer } from '../shared/announcer';
import {
  CNGX_SELECT_COMMIT_CONTROLLER_FACTORY,
  type CngxCommitController,
} from '../shared/commit-controller';
import { CNGX_SELECT_PANEL_HOST } from '../shared/panel-host';
import type {
  CngxSelectCommitAction,
  CngxSelectCommitErrorDisplay,
  CngxSelectCommitMode,
} from '../shared/commit-action.types';
import {
  type CngxSelectAnnouncerConfig,
  type CngxSelectLoadingVariant,
  type CngxSelectRefreshingVariant,
} from '../shared/config';
import {
  flattenSelectOptions,
  isCngxSelectOptionGroupDef,
  isOptionDisabled,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from '../shared/option.model';
import { resolveSelectConfig } from '../shared/resolve-config';
import {
  CngxSelectCaret,
  type CngxSelectCaretContext,
  CngxSelectCheck,
  type CngxSelectCheckContext,
  CngxSelectCommitError,
  type CngxSelectCommitErrorContext,
  CngxSelectEmpty,
  type CngxSelectEmptyContext,
  CngxSelectError,
  type CngxSelectErrorContext,
  CngxSelectLoading,
  type CngxSelectLoadingContext,
  CngxSelectOptgroupTemplate,
  type CngxSelectOptgroupContext,
  CngxSelectOptionLabel,
  type CngxSelectOptionLabelContext,
  CngxSelectPlaceholder,
  type CngxSelectPlaceholderContext,
  CngxSelectRefreshing,
  type CngxSelectRefreshingContext,
  CngxSelectTriggerLabel,
  type CngxSelectTriggerLabelContext,
} from '../shared/template-slots';

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
    CngxPopover,
    CngxPopoverTrigger,
    CngxSelectPanel,
    NgTemplateOutlet,
  ],
  providers: [
    { provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSelect },
    {
      provide: CNGX_STATEFUL,
      useFactory: (): { readonly state: CngxAsyncState<unknown> } => {
        const self = inject(CngxSelect);
        return { state: self.commitState };
      },
    },
    // Provide ourselves as the panel-host contract. Panel sub-component
    // injects this token and reads the surface defined in shared/panel-host.ts
    // — avoids a cyclic type dependency between this file and panel.component.ts.
    { provide: CNGX_SELECT_PANEL_HOST, useExisting: CngxSelect },
  ],
  host: {
    '[id]': 'resolvedId()',
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
      [attr.aria-label]="triggerAria().label"
      [attr.aria-labelledby]="triggerAria().labelledBy"
      [attr.aria-describedby]="triggerAria().describedBy"
      [attr.aria-errormessage]="triggerAria().errorMessage"
      [attr.aria-expanded]="triggerAria().expanded"
      [attr.aria-disabled]="triggerAria().disabled"
      [attr.aria-invalid]="triggerAria().invalid"
      [attr.aria-required]="triggerAria().required"
      [attr.aria-busy]="triggerAria().busy"
      (click)="handleTriggerClick()"
      (focus)="handleFocus()"
      (blur)="handleBlur()"
      (keydown)="handleTriggerKeydown($event)"
    >
      <span class="cngx-select__label">
        @if (triggerLabelTpl(); as tpl) {
          @if (!isEmpty()) {
            <ng-container
              *ngTemplateOutlet="
                tpl;
                context: { $implicit: selectedOption(), selected: selectedOption() }
              "
            />
          } @else if (placeholderTpl(); as phTpl) {
            <ng-container
              *ngTemplateOutlet="
                phTpl;
                context: { $implicit: placeholder(), placeholder: placeholder() }
              "
            />
          } @else {
            {{ placeholder() || label() }}
          }
        } @else if (isEmpty()) {
          @if (placeholderTpl(); as tpl) {
            <ng-container
              *ngTemplateOutlet="
                tpl;
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
            *ngTemplateOutlet="tpl; context: { $implicit: panelOpen(), open: panelOpen() }"
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
        [externalActivation]="externalActivation()"
        [explicitOptions]="panelRef.options()"
        [items]="panelRef.items()"
        [(value)]="value"
      >
        <!--
          Panel body — see panel.component.ts + shared/panel-host.ts.
          Options live in the sub-component's view; content-projection
          scoping hides them from this listbox's contentChildren, so we
          forward them via explicitOptions so AD registration + typeahead
          still work.
        -->
        <cngx-select-panel #panelRef="cngxSelectPanel" />
      </div>
    </div>
    </div>
  `,
  // Styles split into two files:
  // - shared/select-base.css: structural rules shared across the whole
  //   select family (panel frame, option rows, skeletons, spinners,
  //   shimmer animations, error banners, refreshing indicators). Stays
  //   linked from the library after Atomic Decompose — or gets flattened
  //   into the consumer's ejected component at schematic-run time.
  // - select.component.css: CngxSelect-only trigger button + host
  //   layout — the parts a multi-select / combobox will replace.
  styleUrls: ['../shared/select-base.css', './select.component.css'],
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

  /**
   * Auto-focuses the trigger on first render. Complements the native
   * `autofocus` attribute pattern — useful inside dialogs and wizards
   * where the select should receive focus on open.
   *
   * **Evaluated once at first render.** Later changes of the bound
   * expression do not re-trigger focus — matches the native `autofocus`
   * attribute's one-shot semantic. Use `.focus()` imperatively to focus
   * the trigger from outside the initialization path.
   */
  readonly autofocus = input<boolean>(false);

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
   * First-load indicator variant: `'spinner'` (default), `'skeleton'`, `'bar'`, or `'text'`.
   * Falls back to `CNGX_SELECT_CONFIG.loadingVariant`. A projected
   * `*cngxSelectLoading` template always wins over this input.
   */
  readonly loadingVariant = input<CngxSelectLoadingVariant>(this.config.loadingVariant);

  /** Number of skeleton rows when `loadingVariant === 'skeleton'`. */
  readonly skeletonRowCount = input<number>(this.config.skeletonRowCount);

  /**
   * Subsequent-load indicator variant: `'bar'` (default), `'spinner'`,
   * `'dots'`, or `'none'`. Falls back to `CNGX_SELECT_CONFIG.refreshingVariant`.
   * A projected `*cngxSelectRefreshing` template always wins over this input.
   */
  readonly refreshingVariant = input<CngxSelectRefreshingVariant>(this.config.refreshingVariant);

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

  /**
   * Async write handler invoked on user selection. Receives the intended
   * value and returns a Promise/Observable/sync value resolving to the
   * committed value (typically same as intended; may be a server-normalised
   * variant). When bound, selection-change + field-value-write are deferred
   * until commit success. Supersede semantics: a subsequent pick aborts the
   * in-flight commit. See `[commitMode]`.
   */
  readonly commitAction = input<CngxSelectCommitAction<T> | null>(null);

  /**
   * Commit UX mode: `'optimistic'` (default) closes the panel immediately
   * and rolls back on error; `'pessimistic'` keeps the panel open with a
   * pending indicator on the intended option.
   */
  readonly commitMode = input<CngxSelectCommitMode>('optimistic');

  /**
   * Where `commitAction` errors are rendered in the absence of a
   * `*cngxSelectCommitError` template. Falls back to
   * `CNGX_SELECT_CONFIG.commitErrorDisplay`.
   */
  readonly commitErrorDisplay = input<CngxSelectCommitErrorDisplay>(
    this.config.commitErrorDisplay,
  );

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

  /** Fires with the rejected error when a `commitAction` transitions to error. */
  readonly commitError = output<unknown>();

  /** Fires on every `commitState` status transition. */
  readonly stateChange = output<AsyncStatus>();

  // ── Content templates (instance-level directive queries) ──────────

  private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
  private readonly caretDirective = contentChild<CngxSelectCaret>(CngxSelectCaret);
  private readonly optgroupDirective = contentChild<CngxSelectOptgroupTemplate<T>>(
    CngxSelectOptgroupTemplate,
  );
  private readonly placeholderDirective = contentChild<CngxSelectPlaceholder>(
    CngxSelectPlaceholder,
  );
  private readonly emptyDirective = contentChild<CngxSelectEmpty>(CngxSelectEmpty);
  private readonly loadingDirective = contentChild<CngxSelectLoading>(CngxSelectLoading);
  private readonly triggerLabelDirective = contentChild<CngxSelectTriggerLabel<T>>(
    CngxSelectTriggerLabel,
  );
  private readonly optionLabelDirective = contentChild<CngxSelectOptionLabel<T>>(
    CngxSelectOptionLabel,
  );
  private readonly errorDirective = contentChild(CngxSelectError);
  private readonly refreshingDirective = contentChild(CngxSelectRefreshing);
  private readonly commitErrorDirective = contentChild<CngxSelectCommitError<T>>(
    CngxSelectCommitError,
  );

  // ── Resolved template refs (3-stage cascade) ──────────────────────
  //
  // Resolution order (highest → lowest):
  //   1. Instance content-child (consumer-projected `*cngxSelect*`)
  //   2. Global `CNGX_SELECT_CONFIG.templates.<slot>`
  //   3. Library default (inline in the panel / trigger template)
  //
  // Signals expose the final `TemplateRef | null`, so the panel and
  // trigger templates stay free of cascade logic.

  /** @internal */
  protected readonly checkTpl = computed<TemplateRef<CngxSelectCheckContext<T>> | null>(
    () => this.checkDirective()?.templateRef ?? (this.config.templates.check as TemplateRef<CngxSelectCheckContext<T>> | null | undefined) ?? null,
  );
  /** @internal */
  protected readonly caretTpl = computed<TemplateRef<CngxSelectCaretContext> | null>(
    () => this.caretDirective()?.templateRef ?? this.config.templates.caret ?? null,
  );
  /** @internal */
  protected readonly optgroupTpl = computed<TemplateRef<CngxSelectOptgroupContext<T>> | null>(
    () => this.optgroupDirective()?.templateRef ?? (this.config.templates.optgroup as TemplateRef<CngxSelectOptgroupContext<T>> | null | undefined) ?? null,
  );
  /** @internal */
  protected readonly placeholderTpl = computed<TemplateRef<CngxSelectPlaceholderContext> | null>(
    () => this.placeholderDirective()?.templateRef ?? this.config.templates.placeholder ?? null,
  );
  /** @internal */
  protected readonly emptyTpl = computed<TemplateRef<CngxSelectEmptyContext> | null>(
    () => this.emptyDirective()?.templateRef ?? this.config.templates.empty ?? null,
  );
  /** @internal */
  protected readonly loadingTpl = computed<TemplateRef<CngxSelectLoadingContext> | null>(
    () => this.loadingDirective()?.templateRef ?? this.config.templates.loading ?? null,
  );
  /** @internal */
  protected readonly triggerLabelTpl = computed<TemplateRef<CngxSelectTriggerLabelContext<T>> | null>(
    () => this.triggerLabelDirective()?.templateRef ?? (this.config.templates.triggerLabel as TemplateRef<CngxSelectTriggerLabelContext<T>> | null | undefined) ?? null,
  );
  /** @internal */
  protected readonly optionLabelTpl = computed<TemplateRef<CngxSelectOptionLabelContext<T>> | null>(
    () => this.optionLabelDirective()?.templateRef ?? (this.config.templates.optionLabel as TemplateRef<CngxSelectOptionLabelContext<T>> | null | undefined) ?? null,
  );
  /** @internal */
  protected readonly errorTpl = computed<TemplateRef<CngxSelectErrorContext> | null>(
    () => this.errorDirective()?.templateRef ?? this.config.templates.error ?? null,
  );
  /** @internal */
  protected readonly refreshingTpl = computed<TemplateRef<CngxSelectRefreshingContext> | null>(
    () => this.refreshingDirective()?.templateRef ?? this.config.templates.refreshing ?? null,
  );
  /** @internal */
  protected readonly commitErrorTpl = computed<TemplateRef<CngxSelectCommitErrorContext<T>> | null>(
    () => this.commitErrorDirective()?.templateRef ?? (this.config.templates.commitError as TemplateRef<CngxSelectCommitErrorContext<T>> | null | undefined) ?? null,
  );

  // ── ViewChildren ───────────────────────────────────────────────────

  private readonly triggerBtn = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);


  // ── Public Signals (mat-select parity) ─────────────────────────────

  /** Whether the panel is currently open. */
  readonly panelOpen = computed<boolean>(() => this.popoverRef()?.isVisible() ?? false);

  /**
   * DOM id of the option currently highlighted via `CngxActiveDescendant`,
   * or `null` when nothing is highlighted. Surfaced through the
   * panel-host contract so the panel's option-row template can pass a
   * real `highlighted` flag into `*cngxSelectOptionLabel` contexts.
   *
   * @internal
   */
  readonly activeId = computed<string | null>(
    () => this.listboxRef()?.ad.activeId() ?? null,
  );

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

  /**
   * @internal — bundled ARIA projection for the trigger button.
   *
   * Every individual ARIA attribute on the trigger is already a
   * `computed()` — the bundle exists so the template (and, crucially,
   * anything a consumer ejects via Atomic-Decompose) reads ONE named
   * source instead of a scattered list of `[attr.aria-*]` bindings.
   * Keeping the logic in one place also makes it trivial to diff when
   * ARIA semantics evolve.
   */
  protected readonly triggerAria = computed(
    () => ({
      label: this.resolvedAriaLabel(),
      labelledBy: this.resolvedAriaLabelledBy(),
      describedBy: this.describedBy(),
      errorMessage: this.ariaErrorMessage(),
      expanded: this.panelOpen(),
      disabled: this.disabled() || null,
      invalid: this.ariaInvalid(),
      required: this.resolvedAriaRequired(),
      busy: this.ariaBusy(),
    }),
    {
      equal: (a, b) =>
        a.label === b.label &&
        a.labelledBy === b.labelledBy &&
        a.describedBy === b.describedBy &&
        a.errorMessage === b.errorMessage &&
        a.expanded === b.expanded &&
        a.disabled === b.disabled &&
        a.invalid === b.invalid &&
        a.required === b.required &&
        a.busy === b.busy,
    },
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
  protected readonly panelClassList = computed<string | readonly string[] | null>(
    () => {
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
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        const aArr = Array.isArray(a) ? a : a == null ? null : [a];
        const bArr = Array.isArray(b) ? b : b == null ? null : [b];
        if (aArr === null && bArr === null) {
          return true;
        }
        if (aArr === null || bArr === null) {
          return false;
        }
        if (aArr.length !== bArr.length) {
          return false;
        }
        for (let i = 0; i < aArr.length; i++) {
          if (aArr[i] !== bArr[i]) {
            return false;
          }
        }
        return true;
      },
    },
  );

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
  protected readonly flatOptions = computed<CngxSelectOptionDef<T>[]>(
    () => flattenSelectOptions(this.effectiveOptions()),
    {
      // Reference-wise equal when length + every entry is identity-equal.
      // Prevents downstream computed cascades from re-running on stable
      // option arrays (e.g. when the source array was re-emitted without
      // semantic change).
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (!Object.is(a[i], b[i])) {
            return false;
          }
        }
        return true;
      },
    },
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

  /** @internal — `[0, 1, 2, ...]` used to repeat the skeleton-row template. */
  protected readonly skeletonIndices = computed<number[]>(
    () => Array.from({ length: Math.max(1, this.skeletonRowCount()) }, (_, i) => i),
    { equal: (a, b) => a.length === b.length },
  );

  // ── Commit action state ─────────────────────────────────────────────

  /**
   * All commit-lifecycle plumbing lives in a dedicated controller — see
   * `shared/commit-controller.ts` for the rationale. The component owns
   * exactly one instance, reads its state for `CNGX_STATEFUL` / template
   * queries, and delegates `begin` / `cancel` orchestration to it.
   *
   * Previously this class held five interdependent private fields
   * (state slot, id counter, active-handle, last intended, last committed)
   * plus a skip-on-pending effect. Extracting them removed ~40 lines from
   * the component body and produced a state machine that CngxMultiSelect
   * / CngxCombobox can reuse verbatim.
   */
  private readonly commitController: CngxCommitController<T> =
    inject(CNGX_SELECT_COMMIT_CONTROLLER_FACTORY)<T>();

  /** Read-only view of the commit lifecycle. */
  readonly commitState: CngxAsyncState<T | undefined> = this.commitController.state;

  /** `true` while a commit is in flight. */
  readonly isCommitting: Signal<boolean> = this.commitController.isCommitting;

  /**
   * Rollback target for a commit in flight — simply `value()` at the
   * moment of activation. Because the listbox runs in
   * `[externalActivation]` mode whenever a `commitAction` is bound, the
   * listbox does NOT write through two-way binding before our
   * `ad.activated` handler runs, so `value()` is still the pre-pick
   * value when we read it. No skip-on-pending effect required.
   */
  private lastCommittedValue: T | undefined = undefined;

  /**
   * @internal — drives `[externalActivation]` on the inner listbox. When a
   * commit action is bound we take over value-writing so we can capture
   * the pre-pick value before it's overwritten. Otherwise the listbox
   * stays self-contained (its existing default).
   */
  protected readonly externalActivation = computed<boolean>(() => this.commitAction() !== null);

  /** @internal — inline/banner surface for `commitState.isError()`. */
  protected readonly showCommitError = computed<boolean>(
    () => this.commitState.status() === 'error' && this.commitErrorDisplay() !== 'none',
  );

  /** @internal — context passed to a `[cngxSelectCommitError]` template. */
  protected readonly commitErrorContext = computed(
    () => {
      const eq = this.compareWith();
      // Read the intended value from the controller — single source of
      // truth. Previously this read a component-private signal that had
      // to be kept in sync with the commit flow manually.
      const intended = this.commitController.intendedValue();
      const option =
        intended === undefined
          ? null
          : (this.flatOptions().find((o) => eq(o.value, intended)) ?? null);
      return {
        $implicit: this.commitState.error(),
        error: this.commitState.error(),
        option,
        retry: (): void => this.retryCommit(),
      };
    },
    {
      // Stable context identity as long as error and option haven't moved.
      equal: (a, b) => Object.is(a.error, b.error) && Object.is(a.option, b.option),
    },
  );

  /**
   * @internal — true for the specific option currently being committed.
   * Drives the pessimistic-mode per-row spinner.
   */
  protected isCommittingOption(opt: CngxSelectOptionDef<T>): boolean {
    if (!this.isCommitting()) {
      return false;
    }
    const intended = this.commitController.intendedValue();
    if (intended === undefined) {
      return false;
    }
    return this.compareWith()(opt.value, intended);
  }

  /** @internal — error context passed to a `[cngxSelectError]` template. */
  protected readonly errorContext = computed(
    () => ({
      $implicit: this.state()?.error(),
      error: this.state()?.error(),
      retry: (): void => this.handleRetry(),
    }),
    {
      // Context object is recreated each run, but NgTemplateOutlet only
      // needs to diff when the error identity changes. `retry` is a bound
      // method reference — treat it as stable.
      equal: (a, b) => Object.is(a.error, b.error),
    },
  );

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
    // Seed the rollback target synchronously so a first-pick commit-error
    // rolls back to the bound initial value (not `undefined`). The
    // subsequent effect handles all later updates.
    this.lastCommittedValue = untracked(() => this.value());

    // Honor [autofocus] on first render — outside the reactive graph since
    // it's a one-shot DOM side effect, not signal-driven. Signal reads
    // inside afterNextRender are automatically untracked.
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focus();
      }
    });

    // Bridge AD activations into popover-close, selectionChange output,
    // and (when bound) the commit flow.
    //
    // AD-order invariant:
    //   When `externalActivation()` is true (commitAction is bound), the
    //   inner listbox suppresses its own write on activation, so by the
    //   time this subscriber runs `this.value()` is still the pre-pick
    //   value. That's the rollback target — we call `beginCommit` with
    //   it and then mutate value ourselves inside the commit flow.
    //
    //   When `externalActivation()` is false, the listbox wrote the
    //   intended value before our handler fires (same-tick, same Subject
    //   emit). We just call `finalizeSelection(intended)`.
    effect((onCleanup) => {
      const lb = this.listboxRef();
      const pop = this.popoverRef();
      if (!lb || !pop) {
        return;
      }
      const sub = lb.ad.activated.subscribe((raw: unknown) => {
        untracked(() => {
          const intended = raw as T;
          const action = this.commitAction();
          if (action) {
            // Listbox is in externalActivation mode — value() is still
            // the pre-pick value. Capture it as rollback target, then
            // let the commit flow mutate value itself on success.
            const previous = this.value();
            this.lastCommittedValue = previous;
            // For optimistic UX we write the intended value immediately
            // so the trigger shows the picked option. For pessimistic
            // the value stays at `previous` until commit success; the
            // pending spinner on the intended row conveys the attempt.
            if (this.commitMode() === 'optimistic') {
              this.value.set(intended);
            }
            this.beginCommit(intended, previous, action);
            return;
          }
          this.finalizeSelection(intended);
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

  /**
   * @internal — emit selectionChange/optionSelected/announcer for a picked
   * value. Used by the non-commit path and by commit success.
   */
  private finalizeSelection(value: T | undefined): void {
    const eq = this.compareWith();
    const opt =
      value === undefined
        ? null
        : (this.flatOptions().find((o) => eq(o.value, value)) ?? null);
    this.selectionChange.emit({ source: this, value, option: opt });
    this.optionSelected.emit(opt);
    this.maybeAnnounce(opt);
  }

  /**
   * @internal — start a commit. Delegates lifecycle state to the commit
   * controller; the component's job here is to route outcomes into its
   * own DOM + outputs (panel open/close, value.set, selectionChange,
   * commitError, announcer, stateChange).
   *
   * **Why the component still owns these outcomes.**
   * The controller is intentionally UI-agnostic so it can be reused by
   * CngxMultiSelect and CngxCombobox. The "what do we do on success"
   * (close panel, emit selectionChange, re-announce) differs per select
   * variant, so those stay here.
   */
  private beginCommit(
    intended: T | undefined,
    previous: T | undefined,
    action: CngxSelectCommitAction<T>,
  ): void {
    this.stateChange.emit('pending');

    const mode = this.commitMode();
    const pop = this.popoverRef();
    if (mode === 'optimistic' && pop?.isVisible()) {
      // Value was already set to intended via listbox [(value)]. Close panel.
      pop.hide();
    }
    // Pessimistic: leave value at intended so the option shows selected, but
    // keep panel open with pending spinner on the intended option.

    this.commitController.begin(action, intended, previous, {
      onSuccess: (committed) => {
        this.stateChange.emit('success');
        // Ensure value reflects the server-committed result (may differ).
        if (!Object.is(committed, this.value())) {
          this.value.set(committed);
        }
        if (mode === 'pessimistic' && pop?.isVisible()) {
          pop.hide();
        }
        this.finalizeSelection(committed);
      },
      onError: (err, rollbackTo) => {
        this.stateChange.emit('error');
        this.commitError.emit(err);
        // Roll back value to whatever was there before the user's pick.
        if (!Object.is(this.value(), rollbackTo)) {
          this.value.set(rollbackTo);
        }
        // Announce the failure to AT so the inline "!" glyph — which is
        // purely visual — doesn't leave screen-reader users without
        // feedback on the rolled-back write.
        this.announcer.announce(this.commitErrorMessage(err), 'assertive');
        // Pessimistic keeps panel open so user sees the error inline.
      },
    });
  }

  /**
   * @internal — re-invoke the last failed commit with the same intended
   * value. Accessible via the commit-error template's `retry` callback.
   */
  private retryCommit(): void {
    const intended = this.commitController.intendedValue();
    const action = this.commitAction();
    if (!action) {
      return;
    }
    this.beginCommit(intended, this.lastCommittedValue, action);
  }

  /** @internal */
  protected handleClearClick(event: Event): void {
    event.stopPropagation();
    const current = this.value();
    if (current === undefined || current === null) {
      return;
    }
    this.value.set(undefined);
    this.selectionChange.emit({ source: this, value: undefined, option: null });
    this.optionSelected.emit(null);
    this.maybeAnnounce(null);
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

    // PageUp / PageDown — open and jump ±10 (clamped, skipping disabled).
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
      const options = lb.options();
      const total = options.length;
      if (total === 0) {
        return;
      }
      const ad = lb.ad;
      const direction = event.key === 'PageDown' ? 1 : -1;
      const step = 10 * direction;
      const currentId = ad.activeId();
      const currentIdx = options.findIndex((o) => o.id === currentId);
      let target = Math.max(0, Math.min(total - 1, (currentIdx < 0 ? 0 : currentIdx) + step));
      // Scan toward the boundary in `direction` to find the nearest
      // non-disabled option. Fall back to scanning the other direction
      // if the boundary side is fully disabled.
      while (isOptionDisabled(options[target]) && target > 0 && target < total - 1) {
        target += direction;
      }
      if (isOptionDisabled(options[target])) {
        // Boundary row is disabled — scan the opposite direction for any
        // enabled option within the PageDown/Up window.
        let probe = target - direction;
        while (probe >= 0 && probe < total && isOptionDisabled(options[probe])) {
          probe -= direction;
        }
        if (probe >= 0 && probe < total) {
          target = probe;
        } else {
          return;
        }
      }
      ad.highlightByIndex(target);
    }
  }

  /**
   * Format a commit-error for live-region announcement. Falls back to
   * a generic message when the error isn't an `Error` instance.
   */
  private commitErrorMessage(err: unknown): string {
    const label = this.label() ?? this.ariaLabel() ?? 'Auswahl';
    const detail = err instanceof Error ? err.message : undefined;
    return detail
      ? `${label}: Speichern fehlgeschlagen — ${detail}`
      : `${label}: Speichern fehlgeschlagen`;
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
