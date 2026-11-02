/**
 * Manifests for `api-doc-coverage.test.mjs`.
 *
 * Kept beside the guard rather than inside it: the ratchet is the auditable
 * artefact of the doc coverage program, it changes on a different cadence than
 * the scanner, and a reviewer should be able to read it without paging past
 * the fixtures.
 *
 * A row is keyed by `entry` + `owner` + `kind` + `member`, never by line - a
 * member that moves within its file is the same gap, and a ratchet keyed on
 * line numbers would fail on every unrelated edit above it.
 *
 * The gap list only shrinks. A new gap is fixed at its source with a JSDoc
 * (or `@internal` when the member implements an unexported contract or only
 * the own template / class calls it), never parked here.
 */

/**
 * One undocumented public API member.
 *
 * @typedef {object} ApiDocGap
 * @property {string} entry Entry point that exports the owner, e.g. `@cngx/forms/select`.
 * @property {string} owner Class, token or function name.
 * @property {'entry' | 'input' | 'output' | 'method' | 'accessor' | 'token' | 'function'} kind
 * @property {string} member Field or method name; the owner name for entry, token and function rows.
 * @property {string} [binding] Binding name when the input or output is aliased.
 * @property {2 | 3 | 4} phase Plan phase that closes the row.
 */

/**
 * One binding field that still carries `@internal` (decision A: the field is
 * the binding and stays documented). Keyed by file + member.
 *
 * @typedef {object} InternalBinding
 * @property {string} file Repo-relative path.
 * @property {string} owner Class that declares the field.
 * @property {string} member Field name.
 * @property {3 | 4} phase Plan phase that drops the tag.
 */

/** @type {readonly InternalBinding[]} */
export const INTERNAL_BINDINGS = [
  {
    file: 'projects/common/chart/chart/chart.component.ts',
    owner: 'CngxChart',
    member: 'dataInput',
    phase: 3,
  },
  {
    file: 'projects/common/display/tag-group/tag-group.component.ts',
    owner: 'CngxTagGroup',
    member: 'semanticListInput',
    phase: 3,
  },
  {
    file: 'projects/common/tabs/presenter.directive.ts',
    owner: 'CngxTabGroupPresenter',
    member: 'orientationInput',
    phase: 3,
  },
  {
    file: 'projects/common/tabs/presenter.directive.ts',
    owner: 'CngxTabGroupPresenter',
    member: 'loopInput',
    phase: 3,
  },
  {
    file: 'projects/common/tabs/presenter.directive.ts',
    owner: 'CngxTabGroupPresenter',
    member: 'commitActionInput',
    phase: 3,
  },
  {
    file: 'projects/common/tabs/presenter.directive.ts',
    owner: 'CngxTabGroupPresenter',
    member: 'commitModeInput',
    phase: 3,
  },
  {
    file: 'projects/ui/sidenav/sidenav-router-sync.directive.ts',
    owner: 'CngxSidenavRouterSync',
    member: 'paramInput',
    phase: 4,
  },
];

/**
 * Lowered in every commit that closes rows, so growth is a visible constant edit.
 */
export const CEILING = 68;

/** @type {readonly ApiDocGap[]} */
// prettier-ignore
export const RATCHET = [
  { entry: '@cngx/common/a11y', owner: 'CngxActiveDescendant', kind: 'method', member: 'highlightFirst', phase: 3 },
  { entry: '@cngx/common/a11y', owner: 'CngxActiveDescendant', kind: 'method', member: 'highlightLast', phase: 3 },
  { entry: '@cngx/common/a11y', owner: 'CngxActiveDescendant', kind: 'method', member: 'highlightNext', phase: 3 },
  { entry: '@cngx/common/a11y', owner: 'CngxActiveDescendant', kind: 'method', member: 'highlightPrev', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxDataSource', kind: 'method', member: 'connect', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxDataSource', kind: 'method', member: 'disconnect', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'errorMessageId', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'filterKey', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'filterRef', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'invalid', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'label', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'optionLabel', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'options', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'optionValue', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'orientation', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'required', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'input', member: 'state', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'output', member: 'invalid', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxFilterChips', kind: 'output', member: 'required', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxSmartDataSource', kind: 'method', member: 'connect', phase: 3 },
  { entry: '@cngx/common/data', owner: 'CngxSmartDataSource', kind: 'method', member: 'disconnect', phase: 3 },
  { entry: '@cngx/common/dialog', owner: 'CngxDialogOpener', kind: 'method', member: 'open', phase: 3 },
  { entry: '@cngx/core', owner: 'CngxContrast', kind: 'input', member: 'contrast', binding: 'cngxContrast', phase: 4 },
  { entry: '@cngx/core', owner: 'CngxDensity', kind: 'input', member: 'density', binding: 'cngxDensity', phase: 4 },
  { entry: '@cngx/core', owner: 'CngxDir', kind: 'input', member: 'direction', binding: 'cngxDir', phase: 4 },
  { entry: '@cngx/core', owner: 'CngxMotionScope', kind: 'input', member: 'motion', binding: 'cngxMotionScope', phase: 4 },
  { entry: '@cngx/core', owner: 'CngxTouchTarget', kind: 'input', member: 'touchTarget', binding: 'cngxTouchTarget', phase: 4 },
  { entry: '@cngx/core/utils', owner: 'createDefaultsFill', kind: 'function', member: 'createDefaultsFill', phase: 4 },
  { entry: '@cngx/core/utils', owner: 'createDefaultsFill', kind: 'function', member: 'createDefaultsFill', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'input', member: 'fields', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'input', member: 'value', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'output', member: 'value', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'addExpression', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'applyFieldChange', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'getFieldDef', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'getNodeAtPath', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'setField', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'setLogic', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'setOperator', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'setValue', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterBuilderPresenter', kind: 'method', member: 'toggleNegated', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterExpression', kind: 'input', member: 'path', binding: 'cngxFilterExpression', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterExpressionRow', kind: 'input', member: 'path', phase: 4 },
  { entry: '@cngx/forms/filter-builder', owner: 'CngxFilterGroup', kind: 'input', member: 'path', binding: 'cngxFilterGroup', phase: 4 },
  { entry: '@cngx/forms/input', owner: 'CngxInput', kind: 'method', member: 'focus', phase: 4 },
  { entry: '@cngx/forms/input', owner: 'CngxPhoneInput', kind: 'method', member: 'focus', phase: 4 },
  { entry: '@cngx/forms/input', owner: 'CngxRating', kind: 'method', member: 'focus', phase: 4 },
  { entry: '@cngx/ui/feedback', owner: 'CngxToast', kind: 'input', member: 'actionHandler', phase: 4 },
  { entry: '@cngx/ui/mat-tabs', owner: 'CngxMatTabError', kind: 'input', member: 'aggregator', binding: 'cngxMatTabError', phase: 4 },
  { entry: '@cngx/ui/mat-tabs', owner: 'CngxMatTabErrorFlag', kind: 'input', member: 'error', binding: 'cngxMatTabErrorFlag', phase: 4 },
  { entry: '@cngx/ui/mat-tabs', owner: 'CngxMatTabsRegistry', kind: 'method', member: 'getHandleSetup', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxDotStepper', kind: 'input', member: 'ariaLabel', binding: 'aria-label', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxDotStepper', kind: 'input', member: 'ariaLabelledBy', binding: 'aria-labelledby', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxProgressBarStepper', kind: 'input', member: 'ariaLabel', binding: 'aria-label', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxProgressBarStepper', kind: 'input', member: 'ariaLabelledBy', binding: 'aria-labelledby', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxStepper', kind: 'input', member: 'ariaLabel', binding: 'aria-label', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxStepper', kind: 'input', member: 'ariaLabelledBy', binding: 'aria-labelledby', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxStepper', kind: 'input', member: 'mobileIndicatorPosition', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxStepper', kind: 'method', member: 'contentTemplateFor', phase: 4 },
  { entry: '@cngx/ui/stepper', owner: 'CngxStepper', kind: 'method', member: 'labelTemplateFor', phase: 4 },
  { entry: '@cngx/ui/tabs', owner: 'CngxTabGroup', kind: 'input', member: 'ariaLabel', binding: 'aria-label', phase: 4 },
  { entry: '@cngx/ui/tabs', owner: 'CngxTabGroup', kind: 'input', member: 'ariaLabelledBy', binding: 'aria-labelledby', phase: 4 },
  { entry: '@cngx/ui/tabs', owner: 'CngxTabGroup', kind: 'method', member: 'contentTemplateFor', phase: 4 },
  { entry: '@cngx/ui/tabs', owner: 'CngxTabGroup', kind: 'method', member: 'labelTemplateFor', phase: 4 },
  { entry: '@cngx/ui/tabs', owner: 'CngxTabGroup', kind: 'method', member: 'selectById', phase: 4 },
  { entry: '@cngx/ui/tabs', owner: 'CngxTabGroup', kind: 'method', member: 'subLabelTemplateFor', phase: 4 },
  { entry: '@cngx/ui/tabs', owner: 'CngxTabNav', kind: 'input', member: 'ariaLabel', binding: 'aria-label', phase: 4 },
  { entry: '@cngx/ui/tabs', owner: 'CngxTabNav', kind: 'input', member: 'ariaLabelledBy', binding: 'aria-labelledby', phase: 4 },
];
