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
 * Input for {@link createProjectedOptionModel}.
 *
 * @category forms/select/state
 */
export interface ProjectedOptionModelInput<T> {
  readonly containers: Signal<readonly CngxOptionContainer[]>;
  /** Empty string short-circuits to the unfiltered reference. */
  readonly searchTerm: Signal<string>;
  /** Per-option match policy when `searchTerm` is non-empty. */
  readonly matches: (value: T, label: string, term: string) => boolean;
}

/**
 * Output of {@link createProjectedOptionModel}. Each signal carries a
 * structural `equal` so unrelated CD passes don't cascade.
 *
 * @category forms/select/state
 */
export interface ProjectedOptionModel<T> {
  readonly derivedOptions: Signal<CngxSelectOptionsInput<T>>;
  readonly projectedOptions: Signal<readonly CngxOption[]>;
  readonly visibleProjectedOptions: Signal<readonly CngxOption[]>;
  readonly adItems: Signal<ActiveDescendantItem[]>;
}

/**
 * Hierarchy-preserving option model derived from projected DOM. Leaves
 * stay leaves, groups stay groups; `createSelectCore` reflattens for AD
 * lookup. Labels are plain-text via `{{ }}` interpolation.
 *
 * @category forms/select/state
 */
export function createProjectedOptionModel<T>(
  input: ProjectedOptionModelInput<T>,
): ProjectedOptionModel<T> {
  const derivedOptions = computed<CngxSelectOptionsInput<T>>(
    () => {
      const items: (CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>)[] = [];
      for (const c of input.containers()) {
        if (c.kind === 'option') {
          // CNGX_OPTION_CONTAINER is `useExisting: CngxOption` — the
          // runtime instance is the directive.
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
 * Factory signature for {@link CNGX_PROJECTED_OPTION_MODEL_FACTORY}.
 *
 * @category forms/select/state
 */
export type CngxProjectedOptionModelFactory = <T>(
  input: ProjectedOptionModelInput<T>,
) => ProjectedOptionModel<T>;

/**
 * Factory token. Default {@link createProjectedOptionModel}. Override
 * for custom value extraction, async labels, or fold-in of custom
 * group sub-types.
 *
 * @category forms/select/state
 */
export const CNGX_PROJECTED_OPTION_MODEL_FACTORY =
  new InjectionToken<CngxProjectedOptionModelFactory>(
    'CngxProjectedOptionModelFactory',
    {
      providedIn: 'root',
      factory: () => createProjectedOptionModel,
    },
  );
