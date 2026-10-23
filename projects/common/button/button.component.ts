import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CNGX_HOST_INTERACTION_STATE } from '@cngx/common/interactive';

import { injectButtonCore } from './button-core';
import type {
  CngxButtonSize,
  CngxButtonTone,
  CngxButtonType,
  CngxButtonVariant,
} from './button.types';
import { CngxButtonEnd, CngxButtonStart } from './slots';

/**
 * The cngx base button. Sits on the native `<button>` or `<a>`, so native
 * semantics, forms and `routerLink` keep working and every attribute the
 * consumer writes lands on the real element.
 *
 * Two orthogonal axes plus a size: `variant` (emphasis: `solid`,
 * `secondary`, `outline`, `ghost`, `link`) is the selector's own value,
 * `tone` (intent: `neutral`, `primary`, `danger`) and `size`
 * (`xs`..`lg`) are inputs. `variant` and `size` resolve `input ?? group ??
 * config ?? default`; `tone` skips the group, which passes only variant and
 * size. Density, text scale, touch floor, motion and contrast come from
 * the preference axes in `@cngx/core`, not from inputs.
 *
 * `disabled` renders `aria-disabled="true"` instead of the native
 * attribute, so the button stays focusable and a `disabledReason` can be
 * read through `aria-describedby`. Activation is swallowed while disabled:
 * `(click)`, `routerLink`, link navigation and form submission do not run.
 *
 * Co-host `cngxAsyncClick` for an async action: the label stays in place
 * (width stable) under a busy layer while the action runs, and the
 * directive keeps owning `aria-busy` and the announcement.
 *
 * ```html
 * <button cngxButton="outline" tone="primary">Save draft</button>
 * <button [cngxButton]="variant()" type="submit">Submit</button>
 * <a cngxButton="link" routerLink="/help">Help</a>
 * <button cngxButton [cngxAsyncClick]="save">
 *   <cngx-icon cngxButtonStart name="save" /> Save
 * </button>
 * ```
 *
 * @category common/button
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.component.ts
 * @since 0.1.0
 * @relatedTo CngxIconButton, CngxButtonStart, CngxButtonEnd, CngxAsyncClick, provideButtonConfig
 * <example-url>http://localhost:4200/#/common/button/button/variants</example-url>
 * <example-url>http://localhost:4200/#/common/button/button/tones</example-url>
 * <example-url>http://localhost:4200/#/common/button/button/sizes</example-url>
 * <example-url>http://localhost:4200/#/common/button/button/start-and-end-slots</example-url>
 * <example-url>http://localhost:4200/#/common/button/button/disabled-with-reason</example-url>
 * <example-url>http://localhost:4200/#/common/button/button/async-click-busy</example-url>
 * <example-url>http://localhost:4200/#/common/button/button/aligned-with-inputs</example-url>
 * <example-url>http://localhost:4200/#/common/button/button/link-host</example-url>
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button / anchor)
  selector: 'button[cngxButton], a[cngxButton]',
  standalone: true,
  exportAs: 'cngxButton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: CNGX_HOST_INTERACTION_STATE, useExisting: CngxButton }],
  host: {
    class: 'cngx-button',
    '[attr.data-variant]': 'core.variant()',
    '[attr.data-tone]': 'core.tone()',
    '[attr.data-size]': 'core.size()',
    '[attr.data-busy]': 'core.busy() ? "true" : null',
    '[attr.data-start]': 'startSlot() ? "" : null',
    '[attr.data-end]': 'endSlot() ? "" : null',
    '[attr.aria-disabled]': 'core.ariaDisabled()',
    '[attr.aria-describedby]': 'core.describedBy()',
    '[attr.type]': 'core.hostType()',
    // A static `disabled` attribute would make the native element
    // unfocusable; the input renders it as aria-disabled instead.
    '[attr.disabled]': 'null',
  },
  template: `
    <ng-content select="[cngxButtonStart]" />
    <span class="cngx-button__label"><ng-content /></span>
    <ng-content select="[cngxButtonEnd]" />
    @if (core.busy()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="core.reasonId" hidden>{{ disabledReason() }}</span>
  `,
  styleUrl: './button.component.css',
})
export class CngxButton {
  /**
   * Emphasis. Bound through the selector itself: `cngxButton="outline"` and
   * `[cngxButton]="variant()"` both land here; the bare attribute falls
   * through to the group, the config and the default `solid`.
   */
  readonly variant = input<CngxButtonVariant | undefined, CngxButtonVariant | '' | undefined>(
    undefined,
    { alias: 'cngxButton', transform: (v) => (v === '' ? undefined : v) },
  );

  /** Intent. Falls through to the config and the default `neutral`. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Size. `md` matches the form-control row. Falls through to the group, the config and `md`. */
  readonly size = input<CngxButtonSize | undefined>(undefined);

  /** Rendered as `aria-disabled`; the element stays focusable and activation is swallowed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Why the button is disabled; referenced through `aria-describedby` while disabled. */
  readonly disabledReason = input<string | undefined>(undefined);

  /** Native `type` on a `<button>` host. Defaults to `'button'`; ignored on `<a>`. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  /** @internal */
  protected readonly core = injectButtonCore(
    {
      variant: this.variant,
      tone: this.tone,
      size: this.size,
      disabled: this.disabled,
      disabledReason: this.disabledReason,
      type: this.type,
    },
    { variant: 'solid' },
  );
}
