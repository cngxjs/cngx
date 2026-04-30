import type { CngxTagConfig } from './tag.config';
import type { CngxTagConfigFeature } from './provide-tag-config';

/**
 * Override the default `CngxTag` input values (`variant`, `color`,
 * `size`, `truncate`, `maxWidth`). Per-instance bindings still win
 * over the cascade — this only sets the *fallback* per directive.
 *
 * @example
 * ```ts
 * provideTagConfig(
 *   withTagDefaults({ variant: 'subtle', size: 'sm' }),
 * );
 * ```
 *
 * @category display
 */
export function withTagDefaults(
  payload: NonNullable<CngxTagConfig['defaults']>,
): CngxTagConfigFeature {
  return { kind: 'defaults', payload };
}

/**
 * Override the default `CngxTagGroup` input values (`gap`, `align`,
 * `semanticList`). Per-instance bindings still win.
 *
 * @example
 * ```ts
 * provideTagConfig(
 *   withTagGroupDefaults({ gap: 'md', semanticList: true }),
 * );
 * ```
 *
 * @category display
 */
export function withTagGroupDefaults(
  payload: NonNullable<CngxTagConfig['groupDefaults']>,
): CngxTagConfigFeature {
  return { kind: 'groupDefaults', payload };
}

/**
 * Register consumer-defined colour entries. Each key adds a
 * `[data-color="<key>"]` cascade entry resolved through
 * `--cngx-tag-bg/-color/-border` custom properties at the consumer's
 * own CSS layer.
 *
 * The five predefined keys (`neutral`/`success`/`warning`/`error`/
 * `info`) ship in `tag.css` and are NOT part of this map; passing
 * them here is a no-op against the predefined cascade. Consumer
 * keys composed via `data-color="my-brand"` resolve through the
 * registered entry.
 *
 * @example
 * ```ts
 * provideTagConfig(
 *   withTagColors({
 *     'my-brand': {
 *       bg: '#4f46e5',
 *       color: '#ffffff',
 *       border: 'transparent',
 *     },
 *   }),
 * );
 * ```
 *
 * @category display
 */
export function withTagColors(
  payload: NonNullable<CngxTagConfig['colors']>,
): CngxTagConfigFeature {
  return { kind: 'colors', payload };
}

/**
 * Register app-wide template overrides for the five Tag-family
 * slots. Resolved in tier 2 of the slot cascade — instance
 * directives still win, the host's `<ng-template>` default body is
 * the floor.
 *
 * @example
 * ```ts
 * @Component({
 *   template: `
 *     <ng-template #brandLabel let-color="color">
 *       <strong>{{ color }}</strong>
 *     </ng-template>
 *   `,
 * })
 * class AppShell {
 *   readonly brandLabel = viewChild.required<TemplateRef<unknown>>('brandLabel');
 * }
 *
 * // Then in providers:
 * provideTagConfig(withTagSlots({ label: shell.brandLabel() }));
 * ```
 *
 * @category display
 */
export function withTagSlots(
  payload: NonNullable<CngxTagConfig['templates']>,
): CngxTagConfigFeature {
  return { kind: 'templates', payload };
}
