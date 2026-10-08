import {
  computed,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Optional,
  SkipSelf,
  type EnvironmentProviders,
  type Provider,
  type Signal,
} from '@angular/core';
import type {
  CngxContrastPreference,
  CngxDensityValue,
  CngxMotionPreference,
  CngxTextScaleValue,
} from '@cngx/core';
import { coerceSignal, createDefaultsFill, createNestedOverrideMerge } from '@cngx/core/utils';

import { injectA11yPanelSiteCopy, type CngxA11yPanelOptionLabels } from './i18n/a11y-panel-i18n';

/**
 * The four accessibility axes the panel can render a control group for.
 * Each maps 1:1 onto a writable signal returned by `injectA11yPreferences()`.
 *
 * @category ui/a11y
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export type CngxA11yPanelAxis = 'density' | 'textScale' | 'motion' | 'contrast';

/**
 * One selectable option in an axis control group: the value written to the
 * axis signal plus the visible/toggle label. `V` is the axis' own value union
 * (e.g. `CngxDensityValue`), so a misspelled value fails to compile rather
 * than reaching the global preference signal. An option without a `label`
 * reads it from the `a11yPanel` section of the language pack, by value.
 *
 * @category ui/a11y
 * @relatedTo withA11yPanelAxes
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export interface CngxA11yPanelAxisOption<V extends string = string> {
  /** Value written to the axis signal - a valid member of that axis' union. */
  readonly value: V;
  /**
   * Toggle-button label. Leave it out to read the label for `value` from the
   * `a11yPanel` section of the language pack (English without one), so the
   * option follows a language switch. A label set here wins.
   */
  readonly label?: string;
}

/**
 * A rendered axis control group: which axis, its ordered options, and the
 * value Reset restores (the axis' own library default). This is a
 * discriminated union on `axis`, so `options` and `reset` are typed to that
 * axis' value union - a `{ axis: 'density', reset: 'x' }` is a compile error,
 * not a garbage value written to `<html data-density>`. Reorder or drop axes
 * by supplying a subset via `withA11yPanelAxes`.
 *
 * @category ui/a11y
 * @relatedTo withA11yPanelAxes
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export type CngxA11yPanelAxisSpec =
  | {
      readonly axis: 'density';
      readonly options: readonly CngxA11yPanelAxisOption<CngxDensityValue>[];
      readonly reset: CngxDensityValue;
    }
  | {
      readonly axis: 'textScale';
      readonly options: readonly CngxA11yPanelAxisOption<CngxTextScaleValue>[];
      readonly reset: CngxTextScaleValue;
    }
  | {
      readonly axis: 'motion';
      readonly options: readonly CngxA11yPanelAxisOption<CngxMotionPreference>[];
      readonly reset: CngxMotionPreference;
    }
  | {
      readonly axis: 'contrast';
      readonly options: readonly CngxA11yPanelAxisOption<CngxContrastPreference>[];
      readonly reset: CngxContrastPreference;
    };

/**
 * Panel text: per-axis group labels, the Reset control label, the default
 * heading (shown when no `[cngxA11yPanelHeader]` is projected), and the
 * live-region message announced on Reset. The defaults come from the
 * `a11yPanel` section of the language pack (English without one); override
 * single keys via {@link withA11yPanelLabels}.
 *
 * @category ui/a11y
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export interface CngxA11yPanelLabels {
  /** Group label (the accessible name) per axis. */
  readonly axes: Readonly<Record<CngxA11yPanelAxis, string>>;
  /** Reset control label. */
  readonly reset: string;
  /** Default heading, shown when no `[cngxA11yPanelHeader]` slot is projected. */
  readonly heading: string;
  /** Live-announced when Reset restores every axis. */
  readonly resetMessage: string;
}

/**
 * Resolved panel configuration - the text overrides plus the ordered axis
 * list. Merged from the library defaults and any `with*` features by the
 * reducer in {@link provideA11yPanelConfig}.
 *
 * `labels` holds overrides only: unset by default, a value or a `Signal` once
 * {@link withA11yPanelLabels} ran; every key it leaves out reads the
 * `a11yPanel` section of the language pack. `axes` accepts a value or a
 * `Signal`; its option labels are optional and default to the section. Read
 * both through {@link injectA11yPanelLabels} and {@link injectA11yPanelAxes}.
 *
 * @category ui/a11y
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export interface CngxA11yPanelConfig {
  readonly labels?: CngxA11yPanelLabelsOverride | Signal<CngxA11yPanelLabelsOverride>;
  readonly axes: readonly CngxA11yPanelAxisSpec[] | Signal<readonly CngxA11yPanelAxisSpec[]>;
}

/**
 * Partial text override accepted by `withA11yPanelLabels`. The `axes`
 * record merges key-by-key, so a consumer can relabel one axis group without
 * restating the rest.
 *
 * @category ui/a11y
 * @relatedTo withA11yPanelLabels
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export interface CngxA11yPanelLabelsOverride {
  readonly axes?: Partial<Record<CngxA11yPanelAxis, string>>;
  readonly reset?: string;
  readonly heading?: string;
  readonly resetMessage?: string;
}

/**
 * Library defaults: the four axes in their default order, each with its reset
 * value. Carries no copy - the text and the option labels are the `a11yPanel`
 * section of the language pack. Override via {@link provideA11yPanelConfig}.
 */
export const CNGX_A11Y_PANEL_DEFAULTS: CngxA11yPanelConfig & {
  readonly axes: readonly CngxA11yPanelAxisSpec[];
} = {
  axes: [
    {
      axis: 'density',
      reset: 'comfortable',
      options: [{ value: 'compact' }, { value: 'comfortable' }, { value: 'spacious' }],
    },
    {
      axis: 'textScale',
      reset: 'md',
      options: [{ value: 'sm' }, { value: 'md' }, { value: 'lg' }],
    },
    {
      axis: 'motion',
      reset: 'auto',
      options: [{ value: 'full' }, { value: 'reduced' }, { value: 'auto' }],
    },
    {
      axis: 'contrast',
      reset: 'auto',
      options: [{ value: 'normal' }, { value: 'more' }, { value: 'auto' }],
    },
  ],
};

const NO_LABELS: CngxA11yPanelLabelsOverride = {};

/**
 * Configuration cascade token. Resolution priority (high to low):
 * `provideA11yPanelConfigAt(...)` in a component's `viewProviders`, then
 * `provideA11yPanelConfig(...)` at the application root, then the library
 * defaults.
 *
 * @category ui/a11y
 * @relatedTo provideA11yPanelConfig
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export const CNGX_A11Y_PANEL_CONFIG = new InjectionToken<CngxA11yPanelConfig>(
  'CngxA11yPanelConfig',
  {
    providedIn: 'root',
    factory: () => CNGX_A11Y_PANEL_DEFAULTS,
  },
);

/**
 * A single configuration override produced by a `with*` feature factory. The
 * reducer in {@link provideA11yPanelConfig} matches on `kind`: `labels` deep-
 * merges the text bundle, `axes` replaces the axis list wholesale.
 *
 * @category ui/a11y
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export type CngxA11yPanelConfigFeature =
  | {
      readonly kind: 'labels';
      readonly payload: CngxA11yPanelLabelsOverride | Signal<CngxA11yPanelLabelsOverride>;
    }
  | {
      readonly kind: 'axes';
      readonly payload: readonly CngxA11yPanelAxisSpec[] | Signal<readonly CngxA11yPanelAxisSpec[]>;
    };

/** Reduce a feature list onto a base config, merging text and axes in isolation. */
function applyFeatures(
  base: CngxA11yPanelConfig,
  features: readonly CngxA11yPanelConfigFeature[],
): CngxA11yPanelConfig {
  let labels = base.labels;
  let axes = base.axes;
  for (const feature of features) {
    if (feature.kind === 'labels') {
      labels = createNestedOverrideMerge(labels ?? NO_LABELS, feature.payload, 'axes');
    } else {
      axes = feature.payload;
    }
  }
  return { labels, axes };
}

/**
 * Override any subset of the panel text - axis group labels, the Reset label,
 * the default heading, or the Reset announcement. The `axes` record merges
 * key-by-key, so a single axis can be relabelled in isolation. Pass a `Signal`
 * to switch the language at runtime.
 *
 * ```ts
 * provideA11yPanelConfig(
 *   withA11yPanelLabels({
 *     heading: 'Barrierefreiheit',
 *     axes: { motion: 'Bewegung' },
 *     resetMessage: 'Einstellungen zurueckgesetzt',
 *   }),
 * );
 * ```
 *
 * @category ui/a11y
 * @relatedTo provideA11yPanelConfig
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export function withA11yPanelLabels(
  payload: CngxA11yPanelLabelsOverride | Signal<CngxA11yPanelLabelsOverride>,
): CngxA11yPanelConfigFeature {
  return { kind: 'labels', payload };
}

/**
 * Replace the rendered axis list - reorder groups, drop an axis, or restrict
 * the options a group offers. Supplying a subset renders only those groups.
 * Leave an option's `label` out and it reads the `a11yPanel` section of the
 * language pack, so the options translate without restating the list; pass a
 * `Signal` to relabel options you set yourself on a runtime language switch.
 *
 * ```ts
 * provideA11yPanelConfig(
 *   withA11yPanelAxes([
 *     { axis: 'textScale', reset: 'md', options: [
 *       { value: 'md' },
 *       { value: 'lg', label: 'Bigger' },
 *     ] },
 *   ]),
 * );
 * ```
 *
 * @category ui/a11y
 * @relatedTo provideA11yPanelConfig
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export function withA11yPanelAxes(
  payload: readonly CngxA11yPanelAxisSpec[] | Signal<readonly CngxA11yPanelAxisSpec[]>,
): CngxA11yPanelConfigFeature {
  return { kind: 'axes', payload };
}

/**
 * Application-root configuration cascade for the accessibility panel. Pass any
 * combination of `with*` features in `bootstrapApplication`'s providers;
 * supplied features merge with the library defaults, so consumers only declare
 * what they override.
 *
 * @category ui/a11y
 * @relatedTo withA11yPanelLabels
 * @relatedTo withA11yPanelAxes
 * @relatedTo injectA11yPanelConfig
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export function provideA11yPanelConfig(
  ...features: CngxA11yPanelConfigFeature[]
): EnvironmentProviders {
  // Empty-features: leave the root default reference untouched so downstream
  // identity comparisons stay stable.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  return makeEnvironmentProviders([
    {
      provide: CNGX_A11Y_PANEL_CONFIG,
      useValue: applyFeatures(CNGX_A11Y_PANEL_DEFAULTS, features),
    },
  ]);
}

/**
 * Component-scoped configuration override. Pass into a component's or
 * directive's `viewProviders`; features merge on top of the parent config (an
 * enclosing scope or the application root), so one panel can re-scope its axis
 * subset or labels without disturbing the rest of the app. This is the
 * component-scope tier of the resolution cascade: `provideA11yPanelConfigAt`
 * (nearest) wins over `provideA11yPanelConfig` (root), which wins over the
 * library defaults.
 *
 * ```ts
 * @Component({
 *   viewProviders: [
 *     provideA11yPanelConfigAt(withA11yPanelAxes([
 *       { axis: 'textScale', reset: 'md', options: [
 *         { value: 'md', label: 'Default' },
 *         { value: 'lg', label: 'Large' },
 *       ] },
 *     ])),
 *   ],
 * })
 * ```
 *
 * @category ui/a11y
 * @relatedTo provideA11yPanelConfig
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export function provideA11yPanelConfigAt(...features: CngxA11yPanelConfigFeature[]): Provider[] {
  return [
    {
      provide: CNGX_A11Y_PANEL_CONFIG,
      useFactory: (parent: CngxA11yPanelConfig | null) =>
        applyFeatures(parent ?? CNGX_A11Y_PANEL_DEFAULTS, features),
      deps: [[new SkipSelf(), new Optional(), CNGX_A11Y_PANEL_CONFIG]],
    },
  ];
}

/**
 * Convenience accessor for the resolved panel configuration. Runs in an
 * injection context; resolves through the cascade. Equivalent to
 * `inject(CNGX_A11Y_PANEL_CONFIG)`.
 *
 * @category ui/a11y
 * @relatedTo provideA11yPanelConfig
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export function injectA11yPanelConfig(): CngxA11yPanelConfig {
  return inject(CNGX_A11Y_PANEL_CONFIG);
}

/**
 * The resolved text bundle of the panel config in scope, as a Signal that
 * follows a runtime language switch: the config overrides over the `a11yPanel`
 * section of the active pack, the `axes` record merged key by key. A key the
 * config leaves unset, `null` or `undefined` reads the section. Runs in an
 * injection context; read it inside a `computed()`, a template or a handler.
 *
 * @category ui/a11y
 * @relatedTo withA11yPanelLabels
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export function injectA11yPanelLabels(): Signal<CngxA11yPanelLabels> {
  const section = injectA11yPanelSiteCopy().labels;
  return createDefaultsFill<CngxA11yPanelLabels, 'axes'>(
    createNestedOverrideMerge<CngxA11yPanelLabels, 'axes'>(
      section,
      injectA11yPanelConfig().labels,
      'axes',
    ),
    section,
    'axes',
  );
}

/** Options keyed by their array, then by the option-label record they were resolved against. */
const RESOLVED_OPTIONS = new WeakMap<
  readonly CngxA11yPanelAxisOption[],
  WeakMap<object, readonly CngxA11yPanelAxisOption[]>
>();

/** `options` with every missing label read from `labels`, by value. Memoized per input pair. */
function resolveOptions(
  options: readonly CngxA11yPanelAxisOption[],
  labels: Readonly<Record<string, string>>,
): readonly CngxA11yPanelAxisOption[] {
  let byLabels = RESOLVED_OPTIONS.get(options);
  if (!byLabels) {
    byLabels = new WeakMap();
    RESOLVED_OPTIONS.set(options, byLabels);
  }
  let resolved = byLabels.get(labels);
  if (!resolved) {
    resolved = options.map((option) =>
      option.label === undefined ? { ...option, label: labels[option.value] } : option,
    );
    byLabels.set(labels, resolved);
  }
  return resolved;
}

/** Axis lists are equal when every spec keeps its axis, reset target and options array. */
function sameAxes(
  a: readonly CngxA11yPanelAxisSpec[],
  b: readonly CngxA11yPanelAxisSpec[],
): boolean {
  return (
    a.length === b.length &&
    a.every(
      (spec, i) =>
        spec.axis === b[i].axis && spec.reset === b[i].reset && spec.options === b[i].options,
    )
  );
}

/** Resolved axis lists, memoized per config object and option-label signal. */
const RESOLVED_AXES = new WeakMap<
  CngxA11yPanelConfig,
  WeakMap<Signal<CngxA11yPanelOptionLabels>, Signal<readonly CngxA11yPanelAxisSpec[]>>
>();

/** The axis list with every option label filled. Kept out of a field initializer for compodocx. */
function resolveAxes(
  axes: readonly CngxA11yPanelAxisSpec[],
  optionLabels: CngxA11yPanelOptionLabels,
): readonly CngxA11yPanelAxisSpec[] {
  return axes.map(
    (spec) =>
      ({
        ...spec,
        options: resolveOptions(spec.options, optionLabels[spec.axis]),
      }) as CngxA11yPanelAxisSpec,
  );
}

/**
 * The resolved axis list of the panel config in scope (values, option labels
 * and reset targets), as a Signal that follows a runtime language switch.
 * Every option without its own `label` carries the label for its value from
 * the `a11yPanel` section of the active pack. Runs in an injection context.
 *
 * @category ui/a11y
 * @relatedTo withA11yPanelAxes
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/a11y/a11y-panel.config.ts
 * @since 0.1.0
 */
export function injectA11yPanelAxes(): Signal<readonly CngxA11yPanelAxisSpec[]> {
  const config = injectA11yPanelConfig();
  const optionLabels = injectA11yPanelSiteCopy().options;
  let byLabels = RESOLVED_AXES.get(config);
  if (!byLabels) {
    byLabels = new WeakMap();
    RESOLVED_AXES.set(config, byLabels);
  }
  const cached = byLabels.get(optionLabels);
  if (cached) {
    return cached;
  }
  const axes = coerceSignal(config.axes);
  const resolved = computed(() => resolveAxes(axes(), optionLabels()), { equal: sameAxes });
  byLabels.set(optionLabels, resolved);
  return resolved;
}
