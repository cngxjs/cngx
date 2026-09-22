import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * The five interaction strings the dialog family renders on its own behalf.
 * Every one is a fallback the consumer cannot reach declaratively: the close
 * affordance only names itself when the trigger has no text of its own, the
 * error fallback only fires when the thrown value is not a string, and the
 * drag handle is labelled imperatively because the directive may promote any
 * element to a handle.
 *
 * @category common/dialog/config
 */
export interface CngxDialogLabels {
  /** Implicit accessible name of `CngxDialogClose` when the trigger carries no text. */
  readonly close: string;
  /** Live-region text when a dialog error carries no message of its own. */
  readonly errorFallback: string;
  /** `aria-label` set on a promoted drag handle. */
  readonly dragHandle: string;
  /** `aria-roledescription` set on a promoted drag handle. */
  readonly dragHandleRoleDescription: string;
  /** Visually hidden keyboard-drag instruction the handle is described by. */
  readonly dragInstructions: string;
}

/**
 * App-wide dialog defaults, populated via {@link provideDialogConfig} in the
 * root providers (or {@link provideDialogConfigAt} in a component's
 * `viewProviders` for a sub-tree scope).
 *
 * Distinct from `CngxDialogConfig`, which is the per-open option bag passed to
 * `CngxDialogOpener.open()`. This one carries defaults for every dialog in the
 * scope; that one configures a single dialog instance.
 *
 * Only `labels` today. Size / backdrop / close-on-escape / focus-fallback
 * defaults are deliberately absent - no consumer has asked for them, and a key
 * with no caller is configuration for its own sake.
 *
 * @category common/dialog/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/config/dialog-config.ts
 * @since 0.1.0
 */
export interface CngxDialogDefaults {
  readonly labels: CngxDialogLabels;
}

const DIALOG_LABEL_DEFAULTS: CngxDialogLabels = {
  close: 'Close dialog',
  errorFallback: 'An error occurred',
  dragHandle: 'Move dialog',
  dragHandleRoleDescription: 'draggable',
  dragInstructions: 'Use arrow keys to move the dialog; Shift for larger steps',
};

/**
 * DI token carrying the merged {@link CngxDialogDefaults}. `providedIn: 'root'`
 * with the English defaults, so a consumer who provides nothing keeps today's
 * behaviour exactly.
 *
 * @category common/dialog/config
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/config/dialog-config.ts
 * @since 0.1.0
 * @relatedTo CngxDialog, CngxDialogClose, CngxDialogDraggable
 */
export const CNGX_DIALOG_DEFAULTS = new InjectionToken<CngxDialogDefaults>('CngxDialogDefaults', {
  providedIn: 'root',
  factory: (): CngxDialogDefaults => ({ labels: DIALOG_LABEL_DEFAULTS }),
});

/**
 * Feature returned by a `with*` function - merged by
 * {@link provideDialogConfig}.
 *
 * @category common/dialog/config
 */
export interface CngxDialogConfigFeature {
  /** @internal */
  readonly labels?: Partial<CngxDialogLabels>;
}

/**
 * Override dialog interaction strings. Unset keys keep the English default,
 * and two calls merge rather than replace.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideDialogConfig(
 *       withDialogLabels({ close: 'Dialog schließen', dragHandle: 'Dialog verschieben' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/dialog/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/config/dialog-config.ts
 * @since 0.1.0
 */
export function withDialogLabels(overrides: Partial<CngxDialogLabels>): CngxDialogConfigFeature {
  return { labels: overrides };
}

/**
 * Register app-wide dialog defaults composed from `with*` features.
 *
 * @category common/dialog/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/config/dialog-config.ts
 * @since 0.1.0
 */
export function provideDialogConfig(...features: CngxDialogConfigFeature[]): Provider[] {
  const labels = features.reduce<CngxDialogLabels>(
    (acc, feature) => ({ ...acc, ...feature.labels }),
    DIALOG_LABEL_DEFAULTS,
  );
  return [{ provide: CNGX_DIALOG_DEFAULTS, useValue: { labels } }];
}

/**
 * Sub-tree variant - use in `viewProviders` so the defaults only apply to
 * dialogs opened from descendants of this component.
 *
 * @category common/dialog/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/config/dialog-config.ts
 * @since 0.1.0
 */
export function provideDialogConfigAt(...features: CngxDialogConfigFeature[]): Provider[] {
  return provideDialogConfig(...features);
}

/**
 * Inject the currently-resolved dialog defaults. Safe in any injection
 * context; falls back to the English bundle when nothing is provided.
 *
 * @category common/dialog/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/config/dialog-config.ts
 * @since 0.1.0
 */
export function injectDialogConfig(): CngxDialogDefaults {
  return inject(CNGX_DIALOG_DEFAULTS);
}
