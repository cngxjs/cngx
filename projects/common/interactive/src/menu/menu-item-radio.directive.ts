import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

import { CNGX_AD_ITEM, CngxActiveDescendant, type CngxAdItemHandle } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';

import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';
import { CNGX_MENU_RADIO_GROUP } from './menu-radio-controller';

/**
 * Radio-style menu item (`role="menuitemradio"`). Mutual exclusion is scoped
 * to the enclosing `CngxMenuGroup` — only one radio per group is checked at
 * a time.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuItemRadio]',
  exportAs: 'cngxMenuItemRadio',
  standalone: true,
  providers: [{ provide: CNGX_AD_ITEM, useExisting: CngxMenuItemRadio }],
  host: {
    role: 'menuitemradio',
    '[id]': 'id',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[class.cngx-menu-item--highlighted]': 'isHighlighted()',
    '[class.cngx-menu-item--disabled]': 'disabled()',
    '[class.cngx-menu-item--checked]': 'checked()',
    '[attr.tabindex]': '-1',
    '(click)': 'handleClick()',
    '(pointerenter)': 'handlePointerEnter()',
  },
})
export class CngxMenuItemRadio<T = unknown> implements CngxAdItemHandle {
  readonly value = input.required<T>();
  readonly disabled = input<boolean>(false);
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  readonly id = nextUid('cngx-menu-item');

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ad = inject(CngxActiveDescendant, { optional: true });
  private readonly group = inject(CNGX_MENU_RADIO_GROUP, { optional: true });
  private readonly announcer = inject(CNGX_MENU_ANNOUNCER_FACTORY)();
  private readonly menuConfig = injectMenuConfig();

  readonly isHighlighted = computed<boolean>(() => this.ad?.activeId() === this.id);

  /** Whether this radio is the currently selected value in its group. */
  readonly checked = computed<boolean>(() => {
    const group = this.group;
    if (!group) {
      return false;
    }
    return Object.is(group.selectedValue(), this.value());
  });

  readonly label = (): string => {
    const explicit = this.labelInput();
    if (explicit) {
      return explicit;
    }
    const el = this.elementRef.nativeElement as HTMLElement;
    return (el.textContent ?? '').trim();
  };

  protected handleClick(): void {
    if (this.disabled()) {
      this.announcer.announce(this.menuConfig.ariaLabels.itemDisabled);
      return;
    }
    const ad = this.ad;
    if (!ad) {
      return;
    }
    ad.highlightByValue(this.value());
    this.group?.select(this.value());
    ad.activateCurrent();
  }

  protected handlePointerEnter(): void {
    if (this.disabled()) {
      return;
    }
    this.ad?.highlightByValue(this.value());
  }
}
