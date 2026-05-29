import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxFilterBuilderValueEditorContext } from './filter-builder-value-editor.slot';
import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
} from './filter-builder.types';

/**
 * Slot-directive bundle for `<cngx-filter-builder>` (Phase 5). Each
 * directive is a `<ng-template>`-only marker; the component locates them
 * via `contentChild` and falls through to
 * `CNGX_FILTER_BUILDER_CONFIG.templates.<key>` and finally to the default
 * rendering when neither is present (three-stage cascade,
 * `architecture-summary.md` slot system).
 *
 * Each context interface is the snapshot value passed at render time -
 * not signals. The component re-stamps slot outlets on every relevant
 * state change via `*ngTemplateOutlet`-with-context.
 */

/**
 * Context passed to the `cngxFilterBuilderEmpty` slot when the root group is empty.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderEmptyContext {
  readonly addFilter: () => void;
  readonly addGroup: () => void;
}

/**
 * Context passed to a consumer-supplied expression-row template (full row override).
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderExpressionTemplateContext {
  readonly expression: FilterExpression;
  readonly fieldDef: FilterFieldDef | undefined;
  readonly availableOperators: readonly string[];
  readonly value: unknown;
  readonly setField: (key: string) => void;
  readonly setOperator: (operator: string) => void;
  readonly setValue: (value: unknown) => void;
  readonly remove: () => void;
}

/**
 * Context passed to a consumer-supplied group template (full group override).
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderGroupTemplateContext {
  readonly group: FilterGroup;
  readonly logic: FilterLogic;
  readonly isRoot: boolean;
  readonly setLogic: (logic: FilterLogic) => void;
  readonly toggleNegated: () => void;
  readonly addFilter: () => void;
  readonly addGroup: () => void;
  readonly remove: () => void;
}

/**
 * Context passed to the `cngxFilterBuilderAddFilterButton` slot.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderAddFilterButtonContext {
  readonly add: () => void;
  readonly label: string;
  readonly disabled: boolean;
}

/**
 * Context passed to the `cngxFilterBuilderAddGroupButton` slot.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderAddGroupButtonContext {
  readonly add: () => void;
  readonly label: string;
  readonly disabled: boolean;
}

/**
 * Context passed to the `cngxFilterBuilderRemoveButton` slot - shared by expression rows and group headers.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderRemoveButtonContext {
  readonly remove: () => void;
  readonly label: string;
}

/**
 * Context passed to the `cngxFilterBuilderLogicToggle` slot - drives the AND/OR/XOR picker.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderLogicToggleContext {
  readonly logic: FilterLogic;
  readonly options: readonly FilterLogic[];
  readonly setLogic: (logic: FilterLogic) => void;
}

/**
 * Context passed to the `cngxFilterBuilderNegationToggle` slot - only rendered when `withNegation(true)`.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderNegationToggleContext {
  readonly negated: boolean;
  readonly toggle: () => void;
  readonly label: string;
}

/**
 * Marker directive for the empty-state slot template.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-slots.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderAddFilterButton, CngxFilterBuilderAddGroupButton, CngxFilterBuilder
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderEmpty]',
  exportAs: 'cngxFilterBuilderEmpty',
  standalone: true,
})
export class CngxFilterBuilderEmpty {
  readonly templateRef = inject<TemplateRef<CngxFilterBuilderEmptyContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderEmpty,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderEmptyContext {
    return true;
  }
}

/**
 * Marker directive for a full expression-row override template.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-slots.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderGroupTemplate, CngxFilterBuilderValueEditor, CngxFilterBuilder
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderExpressionTemplate]',
  exportAs: 'cngxFilterBuilderExpressionTemplate',
  standalone: true,
})
export class CngxFilterBuilderExpressionTemplate {
  readonly templateRef =
    inject<TemplateRef<CngxFilterBuilderExpressionTemplateContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderExpressionTemplate,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderExpressionTemplateContext {
    return true;
  }
}

/**
 * Marker directive for a full group-shell override template.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-slots.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderExpressionTemplate, CngxFilterBuilderLogicToggle, CngxFilterBuilder
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderGroupTemplate]',
  exportAs: 'cngxFilterBuilderGroupTemplate',
  standalone: true,
})
export class CngxFilterBuilderGroupTemplate {
  readonly templateRef = inject<TemplateRef<CngxFilterBuilderGroupTemplateContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderGroupTemplate,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderGroupTemplateContext {
    return true;
  }
}

/**
 * Marker directive for the add-filter button slot.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-slots.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderAddGroupButton, CngxFilterBuilderRemoveButton, CngxFilterBuilderEmpty
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderAddFilterButton]',
  exportAs: 'cngxFilterBuilderAddFilterButton',
  standalone: true,
})
export class CngxFilterBuilderAddFilterButton {
  readonly templateRef = inject<TemplateRef<CngxFilterBuilderAddFilterButtonContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderAddFilterButton,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderAddFilterButtonContext {
    return true;
  }
}

/**
 * Marker directive for the add-group button slot.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-slots.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderAddFilterButton, CngxFilterBuilderRemoveButton, CngxFilterBuilderEmpty
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderAddGroupButton]',
  exportAs: 'cngxFilterBuilderAddGroupButton',
  standalone: true,
})
export class CngxFilterBuilderAddGroupButton {
  readonly templateRef = inject<TemplateRef<CngxFilterBuilderAddGroupButtonContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderAddGroupButton,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderAddGroupButtonContext {
    return true;
  }
}

/**
 * Marker directive for the remove-button slot.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-slots.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderAddFilterButton, CngxFilterBuilderAddGroupButton, CngxFilterBuilder
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderRemoveButton]',
  exportAs: 'cngxFilterBuilderRemoveButton',
  standalone: true,
})
export class CngxFilterBuilderRemoveButton {
  readonly templateRef = inject<TemplateRef<CngxFilterBuilderRemoveButtonContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderRemoveButton,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderRemoveButtonContext {
    return true;
  }
}

/**
 * Marker directive for the logic-toggle (AND/OR/XOR) slot.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-slots.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderNegationToggle, CngxFilterBuilderGroupTemplate, CngxFilterGroup
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderLogicToggle]',
  exportAs: 'cngxFilterBuilderLogicToggle',
  standalone: true,
})
export class CngxFilterBuilderLogicToggle {
  readonly templateRef = inject<TemplateRef<CngxFilterBuilderLogicToggleContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderLogicToggle,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderLogicToggleContext {
    return true;
  }
}

/**
 * Marker directive for the negation-toggle slot. Only rendered when negation is enabled.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-slots.ts
 * @since 0.1.0
 * @relatedTo CngxFilterBuilderLogicToggle, CngxFilterBuilderGroupTemplate, CngxFilterGroup
 */
@Directive({
  selector: 'ng-template[cngxFilterBuilderNegationToggle]',
  exportAs: 'cngxFilterBuilderNegationToggle',
  standalone: true,
})
export class CngxFilterBuilderNegationToggle {
  readonly templateRef = inject<TemplateRef<CngxFilterBuilderNegationToggleContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFilterBuilderNegationToggle,
    _ctx: unknown,
  ): _ctx is CngxFilterBuilderNegationToggleContext {
    return true;
  }
}

/**
 * Lookup-style template registry - used by `CngxFilterBuilderConfig.templates`.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderTemplates {
  readonly empty?: TemplateRef<CngxFilterBuilderEmptyContext> | null;
  readonly expressionTemplate?: TemplateRef<CngxFilterBuilderExpressionTemplateContext> | null;
  readonly groupTemplate?: TemplateRef<CngxFilterBuilderGroupTemplateContext> | null;
  readonly addFilterButton?: TemplateRef<CngxFilterBuilderAddFilterButtonContext> | null;
  readonly addGroupButton?: TemplateRef<CngxFilterBuilderAddGroupButtonContext> | null;
  readonly removeButton?: TemplateRef<CngxFilterBuilderRemoveButtonContext> | null;
  readonly logicToggle?: TemplateRef<CngxFilterBuilderLogicToggleContext> | null;
  readonly negationToggle?: TemplateRef<CngxFilterBuilderNegationToggleContext> | null;
  readonly valueEditor?: TemplateRef<CngxFilterBuilderValueEditorContext<unknown>> | null;
}
