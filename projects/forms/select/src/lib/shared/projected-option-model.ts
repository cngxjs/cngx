import { computed, InjectionToken, type Signal } from '@angular/core';

import type { ActiveDescendantItem } from '@cngx/common/a11y';
import type {
  CngxOption,
  CngxOptionContainer,
  CngxOptionGroup,
} from '@cngx/common/interactive';

import {
  isCngxSelectOptionGroupDef,
  type CngxSelectOptionDef,
  type CngxSelectOptionGroupDef,
  type CngxSelectOptionsInput,
} from './option.model';

/**
 * Factory input for {@link createProjectedOptionModel}. Drives the
 * shell's hierarchy-aware option model from a content-projected
 * `CNGX_OPTION_CONTAINER` query (leaves + groups).
 *
 * @category interactive
 */
export interface ProjectedOptionModelInput<T> {
  /**
   * Live list of `CNGX_OPTION_CONTAINER` directives discovered via
   * `contentChildren(CNGX_OPTION_CONTAINER, { descendants: false })`
   * on the projection-shell host.
   */
  readonly containers: Signal<readonly CngxOptionContainer[]>;
  /**
   * Active search term — drives `visibleProjectedOptions` filtering.
   * Empty string short-circuits to the unfiltered list (same reference
   * preserved so downstream listbox `[explicitOptions]` doesn't
   * cascade).
   */
  readonly searchTerm: Signal<string>;
  /**
   * Match policy invoked for each option when the search term is
   * non-empty. Receives the option's value, resolved plain-text label,
   * and the term; returns `true` when the option should remain
   * visible. The shell forwards its `searchMatchFn` input default
   * (case-insensitive substring) here; consumers can swap in fuzzy /
   * locale-aware matchers via per-instance input or via the
   * {@link CNGX_PROJECTED_OPTION_MODEL_FACTORY} override.
   */
  readonly matches: (value: T, label: string, term: string) => boolean;
}

/**
 * Output bundle of {@link createProjectedOptionModel}. The four signals
 * are reference-stable across unrelated input flips:
 *
 * - `derivedOptions` uses a deep structural equal (length + per-entry
 *   value/label/disabled compare for leaves, label + child-recursion
 *   for groups).
 * - `projectedOptions` / `visibleProjectedOptions` use length +
 *   per-entry identity equal (CngxOption directive instances are
 *   identity-stable while mounted).
 * - `adItems` uses length + per-entry id/value/label/disabled equal
 *   so the listbox's `[items]` binding doesn't cascade through AD's
 *   keyboard-nav memoisation on every CD pass.
 *
 * @category interactive
 */
export interface ProjectedOptionModel<T> {
  readonly derivedOptions: Signal<CngxSelectOptionsInput<T>>;
  readonly projectedOptions: Signal<readonly CngxOption[]>;
  readonly visibleProjectedOptions: Signal<readonly CngxOption[]>;
  readonly adItems: Signal<ActiveDescendantItem[]>;
}

/**
 * Default factory: hierarchy-preserving option model derived from
 * projected DOM. Leaves stay leaves, groups stay groups —
 * `createSelectCore` reflattens for AD lookup and reuses the structure
 * for the panel-shell renderer.
 *
 * Plain-text labels — `option.label()` is the shared `Signal<string>`
 * projection; closed-trigger rendering reads it via `{{ ... }}` text
 * interpolation only, never `[innerHTML]`.
 *
 * @category interactive
 */
export function createProjectedOptionModel<T>(
  input: ProjectedOptionModelInput<T>,
): ProjectedOptionModel<T> {
  const derivedOptions = computed<CngxSelectOptionsInput<T>>(
    () => {
      const items: (CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>)[] = [];
      for (const c of input.containers()) {
        if (c.kind === 'option') {
          // CNGX_OPTION_CONTAINER is provided via `useExisting: CngxOption` —
          // the runtime instance carries the full directive surface even
          // though the structural token type is intentionally narrow.
          const opt = c as CngxOption;
          items.push({
            value: opt.value() as T,
            label: opt.label(),
            disabled: opt.disabled(),
          });
        } else {
          const grp = c as CngxOptionGroup;
          const children: CngxSelectOptionDef<T>[] = [];
          for (const o of grp.options()) {
            children.push({
              value: o.value() as T,
              label: o.label(),
              disabled: o.disabled(),
            });
          }
          items.push({ label: grp.label(), children });
        }
      }
      return items;
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          const x = a[i];
          const y = b[i];
          if (x === y) {
            continue;
          }
          const xIsGroup = isCngxSelectOptionGroupDef(x);
          const yIsGroup = isCngxSelectOptionGroupDef(y);
          if (xIsGroup !== yIsGroup) {
            return false;
          }
          if (xIsGroup && yIsGroup) {
            if (x.label !== y.label) {
              return false;
            }
            if (x.children.length !== y.children.length) {
              return false;
            }
            for (let j = 0; j < x.children.length; j++) {
              const xj = x.children[j];
              const yj = y.children[j];
              if (
                xj.value !== yj.value ||
                xj.label !== yj.label ||
                (xj.disabled ?? false) !== (yj.disabled ?? false)
              ) {
                return false;
              }
            }
          } else if (!xIsGroup && !yIsGroup) {
            if (
              x.value !== y.value ||
              x.label !== y.label ||
              (x.disabled ?? false) !== (y.disabled ?? false)
            ) {
              return false;
            }
          }
        }
        return true;
      },
    },
  );

  const projectedOptions = computed<readonly CngxOption[]>(
    () => {
      const out: CngxOption[] = [];
      for (const c of input.containers()) {
        if (c.kind === 'option') {
          out.push(c as CngxOption);
        } else {
          const grp = c as CngxOptionGroup;
          for (const o of grp.options()) {
            out.push(o);
          }
        }
      }
      return out;
    },
    {
      equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
    },
  );

  const visibleProjectedOptions = computed<readonly CngxOption[]>(
    () => {
      const all = projectedOptions();
      const term = input.searchTerm();
      if (!term) {
        return all;
      }
      return all.filter((opt) =>
        input.matches(opt.value() as T, opt.label(), term),
      );
    },
    {
      equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
    },
  );

  const adItems = computed<ActiveDescendantItem[]>(
    () => {
      const opts = visibleProjectedOptions();
      const items: ActiveDescendantItem[] = [];
      for (const opt of opts) {
        items.push({
          id: opt.id,
          value: opt.value(),
          label: opt.label(),
          disabled: opt.disabled(),
        });
      }
      return items;
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          const x = a[i];
          const y = b[i];
          if (
            x.id !== y.id ||
            x.value !== y.value ||
            x.label !== y.label ||
            x.disabled !== y.disabled
          ) {
            return false;
          }
        }
        return true;
      },
    },
  );

  return { derivedOptions, projectedOptions, visibleProjectedOptions, adItems };
}

/**
 * Factory-signature type — mirrors {@link createProjectedOptionModel}
 * so DI overrides match the exact shape of the default.
 *
 * @category interactive
 */
export type CngxProjectedOptionModelFactory = <T>(
  input: ProjectedOptionModelInput<T>,
) => ProjectedOptionModel<T>;

/**
 * DI token resolving the factory the projection-shell uses to derive
 * its option model from content-projected `CNGX_OPTION_CONTAINER`
 * children. Defaults to {@link createProjectedOptionModel}; override
 * app-wide via
 * `providers: [{ provide: CNGX_PROJECTED_OPTION_MODEL_FACTORY, useValue: customFactory }]`
 * or per-component via `viewProviders` to plug custom value extraction
 * (read from `data-*` attributes on `<cngx-option>`, fold custom
 * group sub-types, async-loaded labels) without forking the shell.
 *
 * Symmetrical to `CNGX_PANEL_RENDERER_FACTORY` /
 * `CNGX_SEARCH_EFFECTS_FACTORY` — every Level-3 composite that turns
 * projected DOM into a derived signal graph routes through a factory
 * token so consumers can swap implementations.
 *
 * @category interactive
 */
export const CNGX_PROJECTED_OPTION_MODEL_FACTORY =
  new InjectionToken<CngxProjectedOptionModelFactory>(
    'CngxProjectedOptionModelFactory',
    {
      providedIn: 'root',
      factory: () => createProjectedOptionModel,
    },
  );
