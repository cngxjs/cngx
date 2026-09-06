import type { TemplateRef } from '@angular/core';

import type {
  CngxTagColor,
  CngxTagSize,
  CngxTagVariant,
} from '../tag.directive';
import type {
  CngxTagGroupAlign,
  CngxTagGroupGap,
} from '../../tag-group/tag-group.component';

/**
 * App-wide cascade for `CngxTag` + `CngxTagGroup` defaults, colour
 * palette, slot templates, and ARIA-string fallbacks.
 *
 * Resolution priority (high → low):
 *   1. Per-instance Input binding (e.g. `[variant]="'subtle'"`).
 *   2. `provideTagConfigAt(...)` in a parent component's
 *      `viewProviders` (component-scoped override).
 *   3. `provideTagConfig(...)` at the application root.
 *   4. Library defaults (English; merged in via `CNGX_TAG_DEFAULTS`).
 *
 * Every key is optional - partial overrides are deep-merged with
 * the library defaults so consumers only declare the keys they want
 * to override.
 *
 * @category common/display
 */
export interface CngxTagConfig {
  /** Default values for `CngxTag` inputs when no per-instance binding wins. */
  readonly defaults?: {
    readonly variant?: CngxTagVariant;
    readonly color?: CngxTagColor;
    readonly size?: CngxTagSize;
    readonly truncate?: boolean;
    readonly maxWidth?: string | null;
  };

  /** Default values for `CngxTagGroup` inputs when no per-instance binding wins. */
  readonly groupDefaults?: {
    readonly gap?: CngxTagGroupGap;
    readonly align?: CngxTagGroupAlign;
    readonly semanticList?: boolean;
  };

  /**
   * Consumer-defined colour map. A registered key is emitted by the
   * directive as element-level `--cngx-tag-bg/-color/-border` values
   * whenever `color` resolves to it. Predefined keys (`neutral`/
   * `success`/`warning`/`error`/`info`) ship in `tag.css` and are not
   * part of this map - entries under a predefined key are a no-op.
   */
  readonly colors?: Readonly<
    Record<
      string,
      Readonly<{
        readonly bg: string;
        readonly color: string;
        readonly border: string;
      }>
    >
  >;

  /**
   * App-wide template overrides for the five Tag-family slots.
   * Resolved in tier 2 of the slot cascade (instance directive wins;
   * config templates are the middle tier; the host's `<ng-template>`
   * default body is the floor).
   */
  readonly templates?: {
    readonly label?: TemplateRef<unknown> | null;
    readonly prefix?: TemplateRef<unknown> | null;
    readonly suffix?: TemplateRef<unknown> | null;
    readonly header?: TemplateRef<unknown> | null;
    readonly accessory?: TemplateRef<unknown> | null;
  };
}
