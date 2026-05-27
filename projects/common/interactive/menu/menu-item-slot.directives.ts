import { Directive } from '@angular/core';

/**
 * Marker directive for the leading icon position inside a `[cngxMenuItem]`.
 * Applies `cngx-menu-item__icon` to the host element and defaults the host
 * to `aria-hidden="true"` — the slot is decorative, the item's accessible
 * name comes from the projected label. Consumers needing a screen-reader
 * label on the icon override the default with `[attr.aria-hidden]="null"`.
 *
 * @category common/interactive/menu
 * <example-url>http://localhost:4200/#/common/interactive/menu/base/action-menu-with-separator</example-url>
 */
@Directive({
  selector: '[cngxMenuItemIcon]',
  exportAs: 'cngxMenuItemIcon',
  standalone: true,
  host: {
    class: 'cngx-menu-item__icon',
    'aria-hidden': 'true',
  },
})
export class CngxMenuItemIcon {}

/**
 * Marker directive for the primary label position inside a
 * `[cngxMenuItem]`. Applies `cngx-menu-item__label`. No `aria-hidden`
 * default — the label is the menu item's accessible name and must reach
 * assistive technology.
 *
 * @category common/interactive/menu
 * <example-url>http://localhost:4200/#/common/interactive/menu/base/action-menu-with-separator</example-url>
 */
@Directive({
  selector: '[cngxMenuItemLabel]',
  exportAs: 'cngxMenuItemLabel',
  standalone: true,
  host: { class: 'cngx-menu-item__label' },
})
export class CngxMenuItemLabel {}

/**
 * Marker directive for a trailing detail slot inside a `[cngxMenuItem]`
 * — secondary text or a status pill that sits between the label and the
 * keyboard-shortcut hint. Applies `cngx-menu-item__suffix` and defaults
 * the host to `aria-hidden="true"`. The slot is supplemental, the
 * primary name belongs to the label. Override with
 * `[attr.aria-hidden]="null"` when the suffix carries meaning AT needs
 * (status text, semantic badge).
 *
 * @category common/interactive/menu
 * <example-url>http://localhost:4200/#/common/interactive/menu/base/action-menu-with-separator</example-url>
 */
@Directive({
  selector: '[cngxMenuItemSuffix]',
  exportAs: 'cngxMenuItemSuffix',
  standalone: true,
  host: {
    class: 'cngx-menu-item__suffix',
    'aria-hidden': 'true',
  },
})
export class CngxMenuItemSuffix {}

/**
 * Marker directive for the keyboard-shortcut hint position inside a
 * `[cngxMenuItem]`. Applies `cngx-menu-item__kbd` and defaults the host
 * to `aria-hidden="true"` — the visual hint duplicates the underlying
 * accelerator already wired to the consumer's command, AT readout of the
 * hint would just repeat the label. Typically placed on a `<kbd>`.
 * Override with `[attr.aria-hidden]="null"` if the hint is a consumer's
 * primary affordance.
 *
 * @category common/interactive/menu
 * <example-url>http://localhost:4200/#/common/interactive/menu/base/action-menu-with-separator</example-url>
 */
@Directive({
  selector: '[cngxMenuItemKbd]',
  exportAs: 'cngxMenuItemKbd',
  standalone: true,
  host: {
    class: 'cngx-menu-item__kbd',
    'aria-hidden': 'true',
  },
})
export class CngxMenuItemKbd {}
