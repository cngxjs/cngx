import type { CngxTagConfig } from './tag.config';
import type { CngxTagConfigFeature } from './provide-tag-config';

/**
 * Override the default `CngxTag` input values (`variant`, `color`,
 * `size`, `truncate`, `maxWidth`). Per-instance bindings still win
 * over the cascade - this only sets the *fallback* per directive.
 *
 * ```ts
 * provideTagConfig(
 *   withTagDefaults({ variant: 'subtle', size: 'sm' }),
 * );
 * ```
 *
 * @category common/display
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
 * ```ts
 * provideTagConfig(
 *   withTagGroupDefaults({ gap: 'md', semanticList: true }),
 * );
 * ```
 *
 * @category common/display
 */
export function withTagGroupDefaults(
  payload: NonNullable<CngxTagConfig['groupDefaults']>,
): CngxTagConfigFeature {
  return { kind: 'groupDefaults', payload };
}

/**
 * Register consumer-defined colour entries. When a tag's `color`
 * resolves to a registered key, the directive emits the entry as
 * element-level `--cngx-tag-bg` / `--cngx-tag-color` /
 * `--cngx-tag-border` values (border wrapped as `1px solid <color>`
 * to mirror the predefined cascade). The entry applies uniformly
 * across variants - config colours carry no per-variant surfaces.
 *
 * The five predefined keys (`neutral`/`success`/`warning`/`error`/
 * `info`) ship in `tag.css` and are NOT part of this map; passing
 * them here is a no-op against the predefined cascade. Unregistered
 * consumer keys emit nothing, so authoring plain
 * `[data-color="my-brand"]` CSS remains a first-class alternative -
 * the emitter never shadows it with an element style.
 *
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
 * @category common/display
 */
export function withTagColors(
  payload: NonNullable<CngxTagConfig['colors']>,
): CngxTagConfigFeature {
  return { kind: 'colors', payload };
}

/**
 * Register app-wide template overrides for the five Tag-family
 * slots. Resolved in tier 2 of the slot cascade - instance
 * directives still win, the host's `<ng-template>` default body is
 * the floor.
 *
 * **Staging note.** This factory ships ahead of a documented second
 * consumer - the headless `CngxTag` + `CngxTagGroup` are the only
 * current consumers. The staging is intentional and tracked in
 * `display-accepted-debt.md §2` (Material organism deferral): a
 * future `cngx-mat-tag` / `cngx-mat-tag-group` wrapper inherits the
 * cascade for free without forking. If §2 is rejected outright,
 * `withTagSlots` re-evaluates as a sunsetting candidate at the same
 * time. Per the cngx-review architecture lens, the surface is
 * tracked rather than left silent.
 *
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
 * @category common/display
 */
export function withTagSlots(
  payload: NonNullable<CngxTagConfig['templates']>,
): CngxTagConfigFeature {
  return { kind: 'templates', payload };
}
