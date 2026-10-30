import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  type Signal,
  untracked,
} from '@angular/core';

import { CNGX_AD_ITEM, CngxActiveDescendant, type CngxAdItemHandle } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';
import { cngxDevError } from '@cngx/utils';

import { CNGX_OPTION_CONTAINER } from './option-container';
import { CNGX_OPTION_FILTER_HOST } from './option-filter-host';
import { CNGX_OPTION_INTERACTION_HOST } from './option-interaction-host';
import {
  CNGX_OPTION_CHROME_ATTR,
  CNGX_OPTION_STATUS_HOST,
  type CngxOptionStatus,
} from './option-status-host';

const CHROME_SELECTOR = `[${CNGX_OPTION_CHROME_ATTR}]`;

// Plain-text projection of the option, minus chrome subtrees (a status glyph
// rendered into the host must not become part of the name).
function readOptionText(el: HTMLElement): string {
  if (!el.querySelector(CHROME_SELECTOR)) {
    return (el.textContent ?? '').trim();
  }
  const collect = (node: Node): string => {
    let text = '';
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === child.TEXT_NODE) {
        text += child.textContent ?? '';
      } else if (
        child.nodeType === child.ELEMENT_NODE &&
        !(child as Element).hasAttribute(CNGX_OPTION_CHROME_ATTR)
      ) {
        text += collect(child);
      }
    }
    return text;
  };
  return collect(el).trim();
}

/**
 * A single selectable option registered with a surrounding `CngxActiveDescendant`.
 *
 * Click highlights + activates, `pointerenter` highlights only. Provides a stable
 * unique id on the host element for `aria-activedescendant` resolution.
 *
 * An option never takes DOM focus. A mouse press keeps focus where it is: on
 * the external owner (a select trigger, a combobox or search input), or on the
 * enclosing `role="listbox"` when that listbox is its own tab stop
 * (`tabindex="0"`), which the press focuses if focus is elsewhere. Focusable
 * content inside an option, or a `tabindex` placed on the option itself, does
 * not receive focus from a click.
 *
 * Selection state (`isSelected`) is driven externally by the enclosing listbox.
 * In V1 of the stack, `CngxListbox` reads `value()` via the AD item list and
 * exposes its own selection through `CngxOption.isSelected()`.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/listbox/option.directive.ts
 * @since 0.1.0
 * @relatedTo CngxListbox, CngxOptionGroup, CngxActiveDescendant
 * <example-url>/#/common/interactive/listbox/search/command-palette</example-url>
 * <example-url>/#/common/interactive/listbox/trigger/select-dropdown</example-url>
 * <example-url>/#/common/interactive/listbox/base/multi-select</example-url>
 * <example-url>/#/common/interactive/listbox/base/single-select</example-url>
 * <example-url>/#/common/interactive/option/flat-options-with-ad</example-url>
 * <example-url>/#/common/interactive/option/grouped-options</example-url>
 * <example-url>/#/forms/field/listbox-forms/material-mat-select-via-cngxbindfield</example-url>
 * <example-url>/#/forms/field/listbox-forms/reactive-forms-adapted-via-adaptformcontrol</example-url>
 * <example-url>/#/forms/field/listbox-forms/signal-forms-multi-select-min-2</example-url>
 * <example-url>/#/forms/field/listbox-forms/signal-forms-single-select</example-url>
 * @axis level atom
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
    '(mousedown)': 'handleMouseDown($event)',
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
  /**
   * Optional explicit label used by typeahead. Without it the label is the
   * current trimmed text of the option, re-read whenever that text changes.
   */
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  /** Stable unique id set on the host, used by `aria-activedescendant`. */
  readonly id = nextUid('cngx-option');

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ad = inject(CngxActiveDescendant, { optional: true });
  private readonly interactionHost = inject(CNGX_OPTION_INTERACTION_HOST, { optional: true });
  private readonly statusHost = inject(CNGX_OPTION_STATUS_HOST, { optional: true });
  private readonly filterHost = inject(CNGX_OPTION_FILTER_HOST, { optional: true });
  private readonly selectedState = signal(false);
  /**
   * Bumped whenever the host text may have changed: once in `afterNextRender`,
   * then by the MutationObserver while no `[label]` is bound. The
   * `textContent` getter is not a signal, so `label` reads the DOM and tracks
   * this version instead of a written text copy.
   */
  private readonly textVersion = signal(0);
  private readonly rendered = signal(false);

  /**
   * Whether this option is currently highlighted. Reads the surrounding
   * `CngxActiveDescendant` when available; falls back to the optional
   * {@link CNGX_OPTION_INTERACTION_HOST} contract for content-projected
   * options whose authoring view has no AD in scope (e.g. children of
   * `CngxSelectShell`).
   */
  readonly isHighlighted = computed<boolean>(() => {
    const id = this.ad?.activeId() ?? this.interactionHost?.activeId() ?? null;
    return id === this.id;
  });

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
      equal: (a, b) => a === b || (!!a && !!b && a.kind === b.kind && a.tpl === b.tpl),
    },
  );

  /**
   * Whether this option is selected. Driven externally by the enclosing listbox
   * via `markSelected()`. Standalone use (without a listbox) always returns `false`.
   */
  readonly isSelected = this.selectedState.asReadonly();

  /**
   * Reactive visibility derived from the optional `CNGX_OPTION_FILTER_HOST`
   * host's `searchTerm` and `matches` policy (called with this option as the
   * fourth argument). `false` when no host is
   * provided or the term is empty; `true` only when the host's policy
   * explicitly rejects the option for the current term.
   *
   * Boolean - default `Object.is` equality is sufficient.
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
    return !host.matches(this.value(), this.label(), term, this);
  });

  /**
   * Resolved label as a Signal - explicit `label` input wins, falling back to
   * the host element's trimmed `textContent` (the W3C-defined plain-text
   * projection of the subtree). Plain text by construction; never reads
   * `innerHTML`. Consumers can text-interpolate this safely on a closed
   * trigger (`{{ option.label() }}`) without an XSS surface.
   *
   * The text fallback is live: while no `[label]` is bound, a
   * MutationObserver on the host re-reads the text after every change
   * (an interpolation, a language flip), so typeahead, filtering, the
   * active-descendant items and a trigger echo follow the current name.
   * Subtrees marked with {@link CNGX_OPTION_CHROME_ATTR} are not part of it.
   * With `[label]` bound the observer is disconnected.
   */
  readonly label: Signal<string> = computed(() => {
    const explicit = this.labelInput();
    if (explicit) {
      return explicit;
    }
    this.textVersion();
    return readOptionText(this.elementRef.nativeElement as HTMLElement);
  });

  /**
   * Back-compat callable alias - `CngxAdItemHandle.label` accepts both
   * `Signal<string>` and `() => string`, so this arrow keeps any
   * consumer that called `option.resolvedLabel()` imperatively working
   * unchanged.
   */
  readonly resolvedLabel = (): string => this.label();

  constructor() {
    const el = this.elementRef.nativeElement as HTMLElement;
    const bumpText = (): void => this.textVersion.update((v) => v + 1);
    let observer: MutationObserver | null = null;
    const disconnect = (): void => {
      observer?.disconnect();
      observer = null;
    };

    // Observe only while the text is the label source; `rendered` keeps the
    // observer browser-only and after the first render. Text changed while a
    // label was bound needs no catch-up: clearing `[label]` re-runs `label`,
    // which reads the DOM fresh.
    effect(() => {
      const textIsLabel = this.rendered() && !this.labelInput();
      untracked(() => {
        if (!textIsLabel) {
          disconnect();
          return;
        }
        if (observer || typeof MutationObserver === 'undefined') {
          return;
        }
        observer = new MutationObserver(bumpText);
        observer.observe(el, { characterData: true, childList: true, subtree: true });
      });
    });
    inject(DestroyRef).onDestroy(disconnect);

    afterNextRender(() => {
      bumpText();
      this.rendered.set(true);
      if (typeof ngDevMode !== 'undefined' && ngDevMode && !this.label()) {
        cngxDevError(
          'CNGX1023',
          `[cngxOption] option ${this.id} has no label and no textContent. ` +
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
    if (ad) {
      ad.highlightByValue(this.value());
      ad.activateCurrent();
      return;
    }
    this.interactionHost?.activate(this.value());
  }

  // The focus default of mousedown would pull focus off the owner (a select
  // trigger, a search input) and the owner reads that blur as "left the field".
  // A listbox that is its own tab stop still gets the focus the click gave it.
  protected handleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    const host = this.elementRef.nativeElement as HTMLElement;
    const listbox = host.closest<HTMLElement>('[role="listbox"]');
    if (!listbox?.hasAttribute('tabindex') || listbox.tabIndex < 0) {
      return;
    }
    if (!listbox.contains(host.ownerDocument.activeElement)) {
      listbox.focus();
    }
  }

  protected handlePointerEnter(): void {
    if (this.disabled()) {
      return;
    }
    if (this.ad) {
      this.ad.highlightByValue(this.value());
      return;
    }
    this.interactionHost?.highlight(this.value());
  }
}
