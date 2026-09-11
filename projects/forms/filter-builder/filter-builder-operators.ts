/**
 * Pure operator definitions - zero Angular dependency, zero `inject()`.
 * The single source of truth for what an operator key *means* at
 * evaluation time. `evaluateExpression` resolves every operator through
 * this registry (or a consumer-extended map from
 * `CNGX_FILTER_BUILDER_CONFIG.operators`), so an operator a consumer can
 * register is an operator that also evaluates - no silent-false switch
 * arms.
 */

declare const ngDevMode: boolean | undefined;

/**
 * Evaluation context handed to every {@link CngxFilterOperatorDef.evaluate}
 * call. `caseInsensitive` reflects the config knob from
 * `withCaseInsensitiveStrings` - the builtin substring trio folds both
 * sides via `toLowerCase()` when set; custom definitions are free to
 * honour or ignore it.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterOperatorContext {
  readonly caseInsensitive: boolean;
}

/**
 * One operator definition: how the operator evaluates an item value
 * against the expression value, an optional default `label` for the
 * operator picker (resolution order: `i18n.operators[key]` ?? `def.label`
 * ?? raw key), and `valueless` for operators that are complete without an
 * expression value (`isEmpty` / `isNotEmpty` family) - a valueless
 * operator is exempt from the empty-value no-op short-circuit.
 *
 * Register custom definitions through `withOperators({...})`; the key
 * only appears in a row's operator picker when a `FilterFieldDef.operators`
 * list or a `withDefaultOperators` entry names it.
 *
 * @category forms/filter-builder/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-operators.ts
 * @since 0.1.0
 * @relatedTo withOperators, evaluateExpression, toFilterPredicate
 */
export interface CngxFilterOperatorDef {
  readonly label?: string;
  readonly valueless?: boolean;
  evaluate(itemValue: unknown, exprValue: unknown, ctx: CngxFilterOperatorContext): boolean;
}

/**
 * @internal Three-way comparison backing the ordering operators. Returns
 * `NaN` for nullish operands and for mixed/unsupported type pairs, so
 * every ordering comparison against `NaN` collapses to `false` - the
 * conservative "no match" default for uncomparable values.
 */
function compare(a: unknown, b: unknown): number {
  if (a == null || b == null) {
    return Number.NaN;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return Number.NaN;
}

/** @internal */
function fold(value: string, ctx: CngxFilterOperatorContext): string {
  return ctx.caseInsensitive ? value.toLowerCase() : value;
}

/** @internal */
function substringDef(
  test: (itemValue: string, exprValue: string) => boolean,
): CngxFilterOperatorDef {
  return {
    evaluate: (itemValue, exprValue, ctx) =>
      typeof itemValue === 'string' &&
      typeof exprValue === 'string' &&
      test(fold(itemValue, ctx), fold(exprValue, ctx)),
  };
}

/**
 * The 14 builtin operator definitions: the 11 historical switch arms
 * re-expressed as data, plus the opt-in `between` / `in` / `notIn`
 * family. Default value of the `CNGX_FILTER_BUILDER_CONFIG.operators`
 * slice and the fallback registry `evaluateExpression` resolves against
 * when no options are passed - keeping the no-options evaluation path
 * bit-identical to the historical closed switch.
 *
 * The opt-in trio is deliberately absent from `DEFAULT_OPERATORS`: no
 * field grows a picker entry its native editor cannot serve. Expose the
 * keys per field via `FilterFieldDef.operators` (or per editor type via
 * `withDefaultOperators`) together with a value editor that produces the
 * matching array shape - `[min, max]` for `between`, a value list for
 * `in` / `notIn`.
 *
 * @category forms/filter-builder/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-operators.ts
 * @since 0.1.0
 * @relatedTo CngxFilterOperatorDef, withOperators
 */
export const CNGX_FILTER_BUILTIN_OPERATOR_DEFS: ReadonlyMap<string, CngxFilterOperatorDef> =
  new Map<string, CngxFilterOperatorDef>([
    // Labels for the builtins live in the default i18n bundle
    // (DEFAULT_I18N.operators) - def.label is the tier for
    // consumer-registered keys only, so the string exists once.
    ['eq', { evaluate: (itemValue, exprValue) => Object.is(itemValue, exprValue) }],
    ['neq', { evaluate: (itemValue, exprValue) => !Object.is(itemValue, exprValue) }],
    ['isEmpty', { valueless: true, evaluate: (itemValue) => itemValue == null || itemValue === '' }],
    [
      'isNotEmpty',
      { valueless: true, evaluate: (itemValue) => itemValue != null && itemValue !== '' },
    ],
    ['contains', substringDef((a, b) => a.includes(b))],
    ['startsWith', substringDef((a, b) => a.startsWith(b))],
    ['endsWith', substringDef((a, b) => a.endsWith(b))],
    ['gt', { evaluate: (a, b) => compare(a, b) > 0 }],
    ['gte', { evaluate: (a, b) => compare(a, b) >= 0 }],
    ['lt', { evaluate: (a, b) => compare(a, b) < 0 }],
    ['lte', { evaluate: (a, b) => compare(a, b) <= 0 }],
    [
      'between',
      {
        // Value shape [min, max]. A non-array (or wrong-arity) value is a
        // wiring bug -> conservative false; a nullish bound means the range
        // editor is half-filled -> no-op true, mirroring the empty-value
        // guard that cannot see inside arrays.
        evaluate: (itemValue, exprValue) => {
          if (!Array.isArray(exprValue) || exprValue.length !== 2) {
            return false;
          }
          const [min, max] = exprValue as [unknown, unknown];
          if (min == null || max == null) {
            return true;
          }
          return compare(itemValue, min) >= 0 && compare(itemValue, max) <= 0;
        },
      },
    ],
    [
      'in',
      {
        // An empty list is an unfilled editor, not "match nothing" - the
        // no-op guard cannot see inside arrays, so the def honours the
        // unfilled-row contract itself (mirrors the between bound guard).
        evaluate: (itemValue, exprValue) => {
          if (!Array.isArray(exprValue)) {
            return false;
          }
          if (exprValue.length === 0) {
            return true;
          }
          return exprValue.some((v) => Object.is(v, itemValue));
        },
      },
    ],
    [
      'notIn',
      {
        evaluate: (itemValue, exprValue) => {
          if (!Array.isArray(exprValue)) {
            return false;
          }
          if (exprValue.length === 0) {
            return true;
          }
          return !exprValue.some((v) => Object.is(v, itemValue));
        },
      },
    ],
  ]);

/**
 * Resolve an operator key against a registry, defaulting to the builtin
 * map when none is supplied. Returns `undefined` for unknown keys - the
 * evaluation path turns that into a one-shot dev warning plus a `false`
 * result.
 *
 * @category forms/filter-builder/config
 */
export function resolveOperatorDef(
  operator: string,
  operators?: ReadonlyMap<string, CngxFilterOperatorDef>,
): CngxFilterOperatorDef | undefined {
  return (operators ?? CNGX_FILTER_BUILTIN_OPERATOR_DEFS).get(operator);
}

/** @internal One warning per unknown operator key per application lifetime. */
const warnedUnknownOperators = new Set<string>();

/**
 * @internal Dev-mode guard for the unknown-operator evaluation path.
 * Warns exactly once per key so a large filtered list does not flood the
 * console; the evaluation result stays a conservative `false` either way.
 */
export function warnUnknownFilterOperatorOnce(operator: string): void {
  if (typeof ngDevMode !== 'undefined' && !ngDevMode) {
    return;
  }
  if (warnedUnknownOperators.has(operator)) {
    return;
  }
  warnedUnknownOperators.add(operator);
  console.warn(
    `[CngxFilterBuilder] unknown operator "${operator}" - the expression evaluates to false ` +
      `for every item. Register an evaluation via withOperators({ ${operator}: { evaluate: ... } }).`,
  );
}
