import {
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';

import { CNGX_AD_ITEM, CngxActiveDescendant, type CngxAdItemHandle } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';

import { CngxMenuAnnouncer } from './menu-announcer';
import { injectMenuConfig } from './menu-config';

/**
 * A single action menuitem registered with a surrounding `CngxActiveDescendant`.
 * Unlike `CngxOption`, menu items carry no selection state — activation fires
 * the AD's `activated` output and the consumer dispatches the action.
 *
 * Click activates (honouring the disabled state). `pointerenter` highlights
 * without activating, matching native menu behaviour.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMenuItem]',
  exportAs: 'cngxMenuItem',
  standalone: true,
  providers: [{ provide: CNGX_AD_ITEM, useExisting: CngxMenuItem }],
  host: {
    role: 'menuitem',
    '[id]': 'id',
    '[class.cngx-menu-item--highlighted]': 'isHighlighted()',
    '[class.cngx-menu-item--disabled]': 'disabled()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.tabindex]': '-1',
    '(click)': 'handleClick()',
    '(pointerenter)': 'handlePointerEnter()',
  },
})
export class CngxMenuItem<T = unknown> implements CngxAdItemHandle {
  readonly value = input<T | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly labelInput = input<string | undefined>(undefined, { alias: 'label' });

  readonly id = nextUid('cngx-menu-item');

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ad = inject(CngxActiveDescendant, { optional: true });
  private readonly announcer = inject(CngxMenuAnnouncer);
  private readonly menuConfig = injectMenuConfig();

  readonly isHighlighted = (): boolean => this.ad?.activeId() === this.id;

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
    ad.activateCurrent();
  }

  protected handlePointerEnter(): void {
    if (this.disabled()) {
      return;
    }
    this.ad?.highlightByValue(this.value());
  }
}
