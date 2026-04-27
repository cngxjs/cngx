import {
  afterNextRender,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  isDevMode,
  signal,
  type Signal,
} from '@angular/core';

import { CNGX_AD_ITEM, CngxActiveDescendant, type CngxAdItemHandle } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';

import { CNGX_OPTION_CONTAINER } from './option-container';
import { CNGX_OPTION_FILTER_HOST } from './option-filter-host';
import { CNGX_OPTION_STATUS_HOST, type CngxOptionStatus } from './option-status-host';

/**
 * A single selectable option registered with a surrounding `CngxActiveDescendant`.
 *
 * Click highlights + activates, `pointerenter` highlights only. Provides a stable
 * unique id on the host element for `aria-activedescendant` resolution.
 *
 * Selection state (`isSelected`) is driven externally by the enclosing listbox.
 * In V1 of the stack, `CngxListbox` reads `value()` via the AD item list and
 * exposes its own selection through `CngxOption.isSelected()`.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxOption]',
  exportAs: 'cngxOption',
  standalone: true,
  providers: [
    { provide: CNGX_AD_ITEM, useExisting: CngxOption },
    { provide: CNGX_OPTION_CONTAINER, useExisting: CngxOption },
  ],
  host: {
    role: 'option',
    '[id]': 'id',
    '[class.cngx-option--selected]': 'isSelected()',
    '[class.cngx-option--highlighted]': 'isHighlighted()',
    '[class.cngx-option--disabled]': 'disabled()',
    '[attr.aria-selected]': 'isSelected()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-status]': 'statusSignal()?.kind ?? null',
    '[class.cngx-option--hidden]': 'hidden()',
    '[attr.hidden]': 'hidden() || null',
    '(click)': 'handleClick()',
    '(pointerenter)': 'handlePointerEnter()',
  },
})
export class CngxOption implements CngxAdItemHandle {
  /** Discriminator for `CNGX_OPTION_CONTAINER` consumers. */
  readonly kind = 'option' as const;
  /** Opaque value emitted on activation. */
  readonly value = input<unknown>(undefined);
  /** Disabled options are skipped in navigation and reject clicks. */
  readonly disabled = input<boolean>(false);
  /** Optional explicit label used by typeahead. Falls back to trimmed `textContent`. */
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  /** Stable unique id set on the host, used by `aria-activedescendant`. */
  readonly id = nextUid('cngx-option');

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ad = inject(CngxActiveDescendant, { optional: true });
  private readonly statusHost = inject(CNGX_OPTION_STATUS_HOST, { optional: true });
  private readonly filterHost = inject(CNGX_OPTION_FILTER_HOST, { optional: true });
  private readonly selectedState = signal(false);
  /**
   * Snapshot of `nativeElement.textContent` taken in `afterNextRender`. The
   * `textContent` getter is not a signal, so a reactive `label` cannot
   * subscribe to it directly; the snapshot bridges DOM state into the
   * reactive graph once the first render has populated text.
   */
  private readonly textContentSnapshot = signal('');

  /** Whether this option is currently highlighted by the surrounding AD. */
  readonly isHighlighted = computed<boolean>(() => this.ad?.activeId() === this.id);

  /**
   * Reactive infrastructure-status entry resolved via the optional
   * `CNGX_OPTION_STATUS_HOST` host. `null` when no host is provided or the
   * host returns `null` for this option's value.
   *
   * `CngxSelectOption` (declarative wrapper) renders the status template
   * AFTER the user's `<ng-content/>` in a reserved internal slot, so the
   * indicator never invades the consumer-authored option content.
   */
  readonly statusSignal = computed<CngxOptionStatus | null>(
    () => this.statusHost?.statusFor(this.value())() ?? null,
    {
      equal: (a, b) =>
        a === b || (!!a && !!b && a.kind === b.kind && a.tpl === b.tpl),
    },
  );

  /**
   * Whether this option is selected. Driven externally by the enclosing listbox
   * via `markSelected()`. Standalone use (without a listbox) always returns `false`.
   */
  readonly isSelected = this.selectedState.asReadonly();

  /**
   * Reactive visibility derived from the optional `CNGX_OPTION_FILTER_HOST`
   * host's `searchTerm` and `matches` policy. `false` when no host is
   * provided or the term is empty; `true` only when the host's policy
   * explicitly rejects the option for the current term.
   *
   * Boolean — default `Object.is` equality is sufficient.
   */
  readonly hidden = computed<boolean>(() => {
    const host = this.filterHost;
    if (!host) {
      return false;
    }
    const term = host.searchTerm();
    if (!term) {
      return false;
    }
    return !host.matches(this.value(), this.label(), term);
  });

  /**
   * Resolved label as a Signal — explicit `label` input wins, falling back to
   * the host element's trimmed `textContent` (the W3C-defined plain-text
   * projection of the subtree). Plain text by construction; never reads
   * `innerHTML`. Consumers can text-interpolate this safely on a closed
   * trigger (`{{ option.label() }}`) without an XSS surface.
   *
   * The textContent fallback is captured as a post-render snapshot
   * (`afterNextRender`), so the signal is reactive on `labelInput` while
   * still giving callers a non-empty value for static-text declarative
   * options. Consumers with dynamic option text should bind `[label]`
   * explicitly rather than relying on the projection.
   */
  readonly label: Signal<string> = computed(() => {
    const explicit = this.labelInput();
    if (explicit) {
      return explicit;
    }
    return this.textContentSnapshot();
  });

  /**
   * Back-compat callable alias — `CngxAdItemHandle.label` accepts both
   * `Signal<string>` and `() => string`, so this arrow keeps any
   * consumer that called `option.resolvedLabel()` imperatively working
   * unchanged.
   */
  readonly resolvedLabel = (): string => this.label();

  constructor() {
    afterNextRender(() => {
      const el = this.elementRef.nativeElement as HTMLElement;
      this.textContentSnapshot.set((el.textContent ?? '').trim());
      if (isDevMode() && !this.label()) {
        console.error(
          `<cngx-option> at ${this.id} has no label and no textContent. ` +
            `Label is required for AT and trigger display.`,
        );
      }
    });
  }

  /** @internal Used by `CngxListbox` to sync selection state. */
  markSelected(selected: boolean): void {
    this.selectedState.set(selected);
  }

  protected handleClick(): void {
    if (this.disabled()) {
      return;
    }
    const ad = this.ad;
    if (!ad) {
      return;
    }
    ad.highlightByValue(this.value());
    ad.activateCurrent();
  }

  protected handlePointerEnter(): void {
    if (this.disabled()) {
      return;
    }
    this.ad?.highlightByValue(this.value());
  }
}
