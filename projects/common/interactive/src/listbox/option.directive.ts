import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

import { CNGX_AD_ITEM, CngxActiveDescendant, type CngxAdItemHandle } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';

import { CNGX_OPTION_CONTAINER } from './option-container';

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
  private readonly selectedState = signal(false);

  /** Whether this option is currently highlighted by the surrounding AD. */
  readonly isHighlighted = computed<boolean>(() => this.ad?.activeId() === this.id);

  /**
   * Whether this option is selected. Driven externally by the enclosing listbox
   * via `markSelected()`. Standalone use (without a listbox) always returns `false`.
   */
  readonly isSelected = this.selectedState.asReadonly();

  /**
   * Resolved label: explicit `label` input, otherwise trimmed `textContent`.
   * Not a `computed()` — the textContent fallback is intentionally recomputed
   * on every access so it reacts to runtime DOM changes.
   */
  readonly resolvedLabel = (): string => {
    const explicit = this.labelInput();
    if (explicit) {
      return explicit;
    }
    const el = this.elementRef.nativeElement as HTMLElement;
    return (el.textContent ?? '').trim();
  };

  /** @internal Handle shape for `CngxActiveDescendant`. */
  readonly label = this.resolvedLabel;

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
