import { computed, Directive, input, output, signal } from '@angular/core';

/**
 * Generic expand/collapse (disclosure) behavior.
 *
 * Applied to the **trigger** element (button, heading, etc.). Manages
 * `aria-expanded` and `aria-controls` host attributes directly — no need
 * to compose `CngxAriaExpanded` separately.
 *
 * Supports controlled (`[cngxDisclosureOpened]`) and uncontrolled modes,
 * following the same pattern as `CngxDrawer` and `CngxSort`.
 *
 * The consumer decides how to render/hide the content. Two approaches:
 *
 * **DOM removal** (simplest, no animation):
 * ```html
 * @if (group.opened()) { <div id="content">…</div> }
 * ```
 *
 * **Hidden attribute** (enables CSS transitions):
 * ```html
 * <div id="content" [hidden]="!group.opened()">…</div>
 * ```
 *
 * @usageNotes
 *
 * ### FAQ accordion
 * ```html
 * <button cngxDisclosure #faq="cngxDisclosure" [controls]="'answer-1'">
 *   Question 1
 * </button>
 * @if (faq.opened()) {
 *   <div id="answer-1">Answer to question 1.</div>
 * }
 * ```
 *
 * ### Nav group with animation
 * ```html
 * <button cngxDisclosure #group="cngxDisclosure" [controls]="'nav-items'">
 *   Settings
 * </button>
 * <div id="nav-items" [hidden]="!group.opened()" class="collapsible">
 *   <a href="/general">General</a>
 *   <a href="/security">Security</a>
 * </div>
 * ```
 */
@Directive({
  selector: '[cngxDisclosure]',
  exportAs: 'cngxDisclosure',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'opened()',
    '[attr.aria-controls]': 'controls() ?? null',
    '(click)': 'toggle()',
    '(keydown.enter)': 'toggle()',
    '(keydown.space)': 'toggle(); $event.preventDefault()',
  },
})
export class CngxDisclosure {
  /** Controlled opened state. When bound, takes precedence over internal state. */
  readonly openedInput = input<boolean | undefined>(undefined, { alias: 'cngxDisclosureOpened' });

  /** The `id` of the controlled content element. Sets `aria-controls`. */
  readonly controls = input<string | undefined>(undefined);

  private readonly openedState = signal(false);

  /** Resolved opened state — controlled input wins over internal state. */
  readonly opened = computed(() => this.openedInput() ?? this.openedState());

  /** Emitted when the opened state changes. */
  readonly openedChange = output<boolean>();

  /** Opens the disclosure. */
  open(): void {
    this.openedState.set(true);
    this.openedChange.emit(true);
  }

  /** Closes the disclosure. */
  close(): void {
    if (!this.opened()) {
      return;
    }
    this.openedState.set(false);
    this.openedChange.emit(false);
  }

  /** Toggles the disclosure between open and closed. */
  toggle(): void {
    if (this.opened()) {
      this.close();
    } else {
      this.open();
    }
  }
}
