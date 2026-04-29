import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  model,
} from '@angular/core';

import { CNGX_AD_ITEM, CngxActiveDescendant, type CngxAdItemHandle } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';

import { CngxMenuAnnouncer } from './menu-announcer';
import { injectMenuConfig } from './menu-config';

/**
 * Checkable menu item (`role="menuitemcheckbox"`). Activation toggles
 * `checked` and emits `checkedChange`. Unlike `CngxMenuItem`, the item
 * carries its own selection state.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuItemCheckbox]',
  exportAs: 'cngxMenuItemCheckbox',
  standalone: true,
  providers: [{ provide: CNGX_AD_ITEM, useExisting: CngxMenuItemCheckbox }],
  host: {
    role: 'menuitemcheckbox',
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
export class CngxMenuItemCheckbox<T = unknown> implements CngxAdItemHandle {
  readonly value = input<T | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });
  readonly checked = model<boolean>(false);

  readonly id = nextUid('cngx-menu-item');

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ad = inject(CngxActiveDescendant, { optional: true });
  private readonly announcer = inject(CngxMenuAnnouncer);
  private readonly menuConfig = injectMenuConfig();

  readonly isHighlighted = computed<boolean>(() => this.ad?.activeId() === this.id);

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
    this.checked.update((c) => !c);
    ad.activateCurrent();
  }

  protected handlePointerEnter(): void {
    if (this.disabled()) {
      return;
    }
    this.ad?.highlightByValue(this.value());
  }
}
