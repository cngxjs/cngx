import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The filter-builder section of a {@link CngxLanguagePack}: the copy of every
 * `@cngx/forms/filter-builder` component, directive and live-region
 * announcement. It feeds the `i18n` bundle of `CNGX_FILTER_BUILDER_CONFIG`; a
 * key set through `withFilterBuilderI18n` still wins. Messages use `{name}`
 * placeholders taken from the flat argument objects of the bundle functions.
 *
 * @category forms/filter-builder/i18n
 * @since 0.1.0
 * @relatedTo CNGX_FILTER_BUILDER_CONFIG, withFilterBuilderI18n
 */
export interface CngxFilterBuilderLanguageSection {
  /** Add-filter button and the empty row's field-picker placeholder. */
  readonly addFilter: string;
  /** Add-group button. */
  readonly addGroup: string;
  /** Accessible name of a row's remove button. */
  readonly removeFilter: string;
  /** Accessible name of a group's remove button. */
  readonly removeGroup: string;
  /** The `and` logic word, filled into `{logic}`. */
  readonly and: string;
  /** The `or` logic word, filled into `{logic}`. */
  readonly or: string;
  /** The `xor` logic word, filled into `{logic}`. */
  readonly xor: string;
  /** Accessible name of a group's logic radiogroup. */
  readonly logicLabel: string;
  /** The negation toggle. */
  readonly negate: string;
  /** Empty-state text of a builder without filters. */
  readonly emptyState: string;
  /** Operator labels by operator key. A key without a label reads `unnamedOperator`. */
  readonly operators: Readonly<Record<string, string>>;
  /** Label of an operator that has neither an `operators` entry nor a definition label. */
  readonly unnamedOperator: string;
  /** Filled into `{operator}` of `expressionLabel` when a row has no operator yet. */
  readonly noOperator: string;
  /** `{logic}`: accessible name of a nested group. */
  readonly groupLabel: CngxMessage;
  /** `{logic}`, `{negated}`: accessible name of a negated nested group. */
  readonly groupLabelNegated: CngxMessage;
  /** `{logic}`: accessible name of the root group. */
  readonly rootGroupLabel: CngxMessage;
  /** `{logic}`, `{negated}`: accessible name of the negated root group. */
  readonly rootGroupLabelNegated: CngxMessage;
  /** `{field}`, `{operator}`: accessible name of an expression row. */
  readonly expressionLabel: CngxMessage;
  /** Accessible name of a row without a field, and the field of its announcements. */
  readonly unboundFilterLabel: string;
  /** The negation marker, filled into `{negated}` of the group labels. */
  readonly negatedTag: string;
  /** Spoken form of a `true` filter value. */
  readonly booleanTrue: string;
  /** Spoken form of a `false` filter value. */
  readonly booleanFalse: string;
  /** `{value}`: a text filter value in announcements, quoted. */
  readonly quotedValue: CngxMessage;
  /** `{field}`: announced when a filter is added. */
  readonly announceFilterAdded: CngxMessage;
  /** `{field}`, `{operator}`, `{value}`: announced when a filter is removed. */
  readonly announceFilterRemoved: CngxMessage;
  /** `{field}`, `{operator}`: a removed filter without a value. */
  readonly announceFilterRemovedNoValue: CngxMessage;
  /** `{field}`, `{value}`: a removed filter without an operator. */
  readonly announceFilterRemovedNoOperator: CngxMessage;
  /** `{field}`: a removed filter with neither operator nor value. */
  readonly announceFilterRemovedFieldOnly: CngxMessage;
  /** Announced when a group is added. */
  readonly announceGroupAdded: string;
  /** Announced when a group is removed. */
  readonly announceGroupRemoved: string;
  /** `{logic}`: announced when a group's logic changes. */
  readonly announceLogicChanged: CngxMessage;
  /** Announced when a group is negated. */
  readonly announceGroupNegated: string;
  /** Announced when a group's negation is removed. */
  readonly announceGroupUnnegated: string;
  /** `{field}`: announced when a row's field changes. */
  readonly announceFieldChanged: CngxMessage;
  /** `{operator}`: announced when a row's operator changes. */
  readonly announceOperatorChanged: CngxMessage;
  /** `{value}`: announced when a row's value changes. */
  readonly announceValueChanged: CngxMessage;
  /** Announced when a row's value is cleared. */
  readonly announceValueChangedNoValue: string;
  /** Announced when every filter is cleared. */
  readonly announceFiltersCleared: string;
}

/**
 * The English filter-builder section: the single source of the filter-builder
 * entry's English copy. The `CNGX_FILTER_BUILDER_CONFIG` `i18n` bundle
 * defaults to it.
 *
 * @category forms/filter-builder/i18n
 * @since 0.1.0
 * @relatedTo CNGX_FILTER_BUILDER_CONFIG
 */
export const CNGX_FILTER_BUILDER_LANGUAGE_EN: CngxFilterBuilderLanguageSection = {
  addFilter: 'Add filter',
  addGroup: 'Add group',
  removeFilter: 'Remove filter',
  removeGroup: 'Remove filter group',
  and: 'AND',
  or: 'OR',
  xor: 'XOR',
  logicLabel: 'Combine filters with',
  negate: 'Negate',
  emptyState: 'No filters defined',
  operators: {
    contains: 'Contains',
    eq: 'Equals',
    neq: 'Not equals',
    startsWith: 'Starts with',
    endsWith: 'Ends with',
    isEmpty: 'Is empty',
    isNotEmpty: 'Is not empty',
    gt: 'Greater than',
    gte: 'Greater than or equal',
    lt: 'Less than',
    lte: 'Less than or equal',
    between: 'Between',
    in: 'In',
    notIn: 'Not in',
  },
  unnamedOperator: 'Unnamed operator',
  noOperator: '(no operator)',
  groupLabel: 'Filter group ({logic})',
  groupLabelNegated: 'Filter group ({logic}, {negated})',
  rootGroupLabel: 'Root filter group ({logic})',
  rootGroupLabelNegated: 'Root filter group ({logic}, {negated})',
  expressionLabel: 'Filter: {field} {operator}',
  unboundFilterLabel: 'Unbound filter',
  negatedTag: 'negated',
  booleanTrue: 'true',
  booleanFalse: 'false',
  quotedValue: '"{value}"',
  announceFilterAdded: 'Filter added: {field}',
  announceFilterRemoved: 'Filter removed: {field} {operator} {value}',
  announceFilterRemovedNoValue: 'Filter removed: {field} {operator}',
  announceFilterRemovedNoOperator: 'Filter removed: {field} {value}',
  announceFilterRemovedFieldOnly: 'Filter removed: {field}',
  announceGroupAdded: 'Filter group added',
  announceGroupRemoved: 'Filter group removed',
  announceLogicChanged: 'Logic changed to {logic}',
  announceGroupNegated: 'Group negated',
  announceGroupUnnegated: 'Group negation removed',
  announceFieldChanged: 'Field changed to {field}',
  announceOperatorChanged: 'Operator changed to {operator}',
  announceValueChanged: 'Value changed to {value}',
  announceValueChangedNoValue: 'Value changed',
  announceFiltersCleared: 'Filters cleared',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly filterBuilder: CngxFilterBuilderLanguageSection;
  }
}
