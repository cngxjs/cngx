import { Directive } from '@angular/core';

/**
 * Content before the label: icon, avatar, badge or `<kbd>`. Trims the inline-start padding.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/slots.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonEnd, CngxMenuButton
 * <example-url>/#/common/button/button/start-and-end-slots</example-url>
 */
@Directive({
  selector: '[cngxButtonStart]',
  standalone: true,
  host: { class: 'cngx-button__slot cngx-button__slot--start' },
})
export class CngxButtonStart {}

/**
 * Content after the label: caret, count or shortcut hint. Trims the inline-end padding.
 *
 * ```html
 * <button cngxButton>Export <kbd cngxButtonEnd>E</kbd></button>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/slots.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonStart, CngxMenuButton
 * <example-url>/#/common/button/button/start-and-end-slots</example-url>
 */
@Directive({
  selector: '[cngxButtonEnd]',
  standalone: true,
  host: { class: 'cngx-button__slot cngx-button__slot--end' },
})
export class CngxButtonEnd {}
