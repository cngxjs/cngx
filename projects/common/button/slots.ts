import { Directive } from '@angular/core';

/**
 * Marks content projected before the label of a `cngxButton`: an icon, an
 * avatar, a badge or a `<kbd>`. Sized in `em`, so it follows the button's
 * font size; a filled start slot trims the inline-start padding.
 *
 * ```html
 * <button cngxButton><cngx-icon cngxButtonStart name="save" /> Save</button>
 * ```
 *
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/slots.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonEnd
 * <example-url>http://localhost:4200/#/common/button/button/start-and-end-slots</example-url>
 */
@Directive({
  selector: '[cngxButtonStart]',
  standalone: true,
  host: { class: 'cngx-button__slot cngx-button__slot--start' },
})
export class CngxButtonStart {}

/**
 * Marks content projected after the label of a `cngxButton`: a caret, a
 * count badge or a shortcut hint. A filled end slot trims the inline-end
 * padding.
 *
 * ```html
 * <button cngxButton>Export <kbd cngxButtonEnd>E</kbd></button>
 * ```
 *
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/slots.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonStart
 * <example-url>http://localhost:4200/#/common/button/button/start-and-end-slots</example-url>
 */
@Directive({
  selector: '[cngxButtonEnd]',
  standalone: true,
  host: { class: 'cngx-button__slot cngx-button__slot--end' },
})
export class CngxButtonEnd {}
