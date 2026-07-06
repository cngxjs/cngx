import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  type OnInit,
} from '@angular/core';

import { CNGX_ACCORDION } from './accordion.token';
import type { CngxAccordionHeaderHandle } from './accordion-keyboard-nav';

/**
 * Accordion header. Put `cngxAccordionPanel` on the header `<button>`; the
 * directive mirrors `aria-expanded` from the coordinator, points
 * `aria-controls` at the region, and toggles the panel on click. It registers
 * a header handle with the coordinator on init (and deregisters on destroy),
 * binds its own roving `tabindex`, and routes `keydown` through the
 * coordinator's keyboard-nav factory - so arrow/Home/End navigation works even
 * when a skin renders the header inside its own component view (registration is
 * immune to the `contentChildren` view boundary).
 *
 * Expansion state is never owned here: `aria-expanded` is a `computed()` over
 * the coordinator's open-set, so single-open arbitration is pure derivation,
 * not sibling syncing (Pillar 1). Use a native `<button>` so Enter / Space
 * activate it through the browser's own click synthesis.
 *
 * @category common/interactive/accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/accordion/accordion-panel.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAccordion, createAccordionKeyboardNav
 */
@Directive({
  selector: '[cngxAccordionPanel]',
  exportAs: 'cngxAccordionPanel',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'expanded()',
    '[attr.aria-controls]': 'controls() ?? null',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.tabindex]': 'tabindex()',
    '(click)': 'toggle()',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class CngxAccordionPanel implements OnInit {
  /** Stable id identifying this panel within its accordion. */
  readonly panelId = input.required<string>();
  /** `id` of the region this header controls, bound to `aria-controls`. */
  readonly controls = input<string | undefined>(undefined);
  /**
   * Disabled header: skipped by roving, reports `tabindex="-1"` +
   * `aria-disabled="true"`, and its click never flips the panel open. The
   * visually-hidden `aria-describedby` reason element is a skin concern owned
   * by the organism, not this brain directive.
   */
  readonly disabled = input<boolean>(false);

  private readonly accordion = inject(CNGX_ACCORDION);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  private handle: CngxAccordionHeaderHandle | null = null;

  /** `aria-expanded`, derived from the coordinator's open-set. */
  protected readonly expanded = computed(() => this.accordion.isOpen(this.panelId()));

  /**
   * Roving `tabindex` for this header, derived from the coordinator's single
   * `rovingActiveId` source (Pillar 1). `-1` until the handle registers.
   */
  protected readonly tabindex = computed(() =>
    this.handle ? this.accordion.nav.headerTabindex(this.handle) : -1,
  );

  ngOnInit(): void {
    // Register in ngOnInit, not the constructor: the bound `[panelId]` input is
    // not applied until the first change detection, and the id is the registry
    // key the coordinator roves and unregisters by.
    const handle: CngxAccordionHeaderHandle = {
      id: this.panelId(),
      element: this.element,
      disabled: this.disabled,
    };
    this.handle = handle;
    this.accordion.registerHeader(handle);
    this.destroyRef.onDestroy(() => this.accordion.unregisterHeader(handle));
  }

  protected handleKeydown(event: KeyboardEvent): void {
    this.accordion.nav.handleKeydown(event);
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.accordion.toggle(this.panelId());
  }
}
