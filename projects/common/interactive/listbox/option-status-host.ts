import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

/**
 * Discriminated status entry rendered in `CngxOption`'s reserved internal
 * status slot.
 *
 * `kind` separates pending (in-flight commit) from error (failed commit) so
 * styling can branch on the host attribute `[attr.data-status]`. `tpl`
 * carries the actual glyph; the host MAY return `tpl: null` to reserve
 * layout space without rendering anything (rare - used for force-revealing
 * the slot during animation transitions).
 */
export interface CngxOptionStatus {
  readonly kind: 'pending' | 'error';
  readonly tpl: TemplateRef<unknown> | null;
}

/**
 * Pull-based contract a select-shell host implements so individual
 * `CngxOption` instances can render an infrastructure indicator (commit
 * pending spinner, commit error glyph) inside a reserved internal slot
 * AFTER the user's option content.
 *
 * Pull semantics keep the host stateless from the option's perspective:
 * the option calls `host.statusFor(value)` once and consumes the returned
 * `Signal<CngxOptionStatus | null>` reactively; the host owns the policy
 * for resolving which value gets which status at any given commit-id.
 */
export interface CngxOptionStatusHost {
  /**
   * Returns a reactive status entry for the given option value, or `null`
   * when the option carries no infrastructure indicator at this moment.
   */
  statusFor<T>(value: T): Signal<CngxOptionStatus | null>;
}

/**
 * DI token an option-projection root (e.g. `CngxSelectShell`) provides on
 * itself when commit-driven status indicators should reach individual
 * options without invading the consumer-authored option template.
 *
 * `CngxOption` injects this token with `{ optional: true }` - standalone
 * use (no host provides the token) results in a stable `null` status with
 * no DOM cost.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/listbox/option-status-host.ts
 * @since 0.1.0
 */
export const CNGX_OPTION_STATUS_HOST = new InjectionToken<CngxOptionStatusHost>(
  'CNGX_OPTION_STATUS_HOST',
);

/**
 * Attribute that marks option chrome: a status rendering inside the option
 * host (a commit-pending spinner, an error glyph) that must not count as
 * option text. `CngxOption` skips every subtree carrying it when it derives
 * its label from the projected text, so a status host that renders into the
 * option sets it on the wrapper element of that rendering.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/listbox/option-status-host.ts
 * @since 0.1.0
 * @relatedTo CNGX_OPTION_STATUS_HOST, CngxOption
 */
export const CNGX_OPTION_CHROME_ATTR = 'data-cngx-option-chrome';
