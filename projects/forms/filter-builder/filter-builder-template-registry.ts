import { computed, inject, InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import { injectFilterBuilderConfig } from './filter-builder.config';
import {
  type CngxFilterBuilderAddFilterButton,
  type CngxFilterBuilderAddFilterButtonContext,
  type CngxFilterBuilderAddGroupButton,
  type CngxFilterBuilderAddGroupButtonContext,
  type CngxFilterBuilderEmpty,
  type CngxFilterBuilderEmptyContext,
  type CngxFilterBuilderExpressionTemplate,
  type CngxFilterBuilderExpressionTemplateContext,
  type CngxFilterBuilderGroupTemplate,
  type CngxFilterBuilderGroupTemplateContext,
  type CngxFilterBuilderLogicToggle,
  type CngxFilterBuilderLogicToggleContext,
  type CngxFilterBuilderNegationToggle,
  type CngxFilterBuilderNegationToggleContext,
  type CngxFilterBuilderRemoveButton,
  type CngxFilterBuilderRemoveButtonContext,
  type CngxFilterBuilderTemplates,
} from './filter-builder-slots';
import type {
  CngxFilterBuilderValueEditor,
  CngxFilterBuilderValueEditorContext,
} from './filter-builder-value-editor.slot';

/** @internal */
interface TemplateRefHolder<Ctx> {
  readonly templateRef: TemplateRef<Ctx>;
}

/**
 * Raw `contentChild` queries passed to {@link createFilterBuilderTemplateRegistry}.
 * Each entry is the signal returned by `contentChild(CngxFilterBuilder<Slot>)`.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderTemplateRegistryQueries {
  readonly empty: Signal<CngxFilterBuilderEmpty | undefined>;
  readonly expressionTemplate: Signal<CngxFilterBuilderExpressionTemplate | undefined>;
  readonly groupTemplate: Signal<CngxFilterBuilderGroupTemplate | undefined>;
  readonly addFilterButton: Signal<CngxFilterBuilderAddFilterButton | undefined>;
  readonly addGroupButton: Signal<CngxFilterBuilderAddGroupButton | undefined>;
  readonly removeButton: Signal<CngxFilterBuilderRemoveButton | undefined>;
  readonly logicToggle: Signal<CngxFilterBuilderLogicToggle | undefined>;
  readonly negationToggle: Signal<CngxFilterBuilderNegationToggle | undefined>;
  readonly valueEditor: Signal<CngxFilterBuilderValueEditor | undefined>;
}

/**
 * Resolved slot registry: each entry is the result of the 3-stage cascade
 * `instance contentChild → CONFIG.templates.<key> → null`.
 *
 * @category forms/filter-builder/slots
 */
export interface CngxFilterBuilderTemplateRegistry {
  readonly empty: Signal<TemplateRef<CngxFilterBuilderEmptyContext> | null>;
  readonly expressionTemplate: Signal<TemplateRef<CngxFilterBuilderExpressionTemplateContext> | null>;
  readonly groupTemplate: Signal<TemplateRef<CngxFilterBuilderGroupTemplateContext> | null>;
  readonly addFilterButton: Signal<TemplateRef<CngxFilterBuilderAddFilterButtonContext> | null>;
  readonly addGroupButton: Signal<TemplateRef<CngxFilterBuilderAddGroupButtonContext> | null>;
  readonly removeButton: Signal<TemplateRef<CngxFilterBuilderRemoveButtonContext> | null>;
  readonly logicToggle: Signal<TemplateRef<CngxFilterBuilderLogicToggleContext> | null>;
  readonly negationToggle: Signal<TemplateRef<CngxFilterBuilderNegationToggleContext> | null>;
  readonly valueEditor: Signal<TemplateRef<CngxFilterBuilderValueEditorContext<unknown>> | null>;
}

/**
 * Factory signature carried by `CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY`.
 *
 * @category forms/filter-builder/slots
 */
export type CngxFilterBuilderTemplateRegistryFactory = (
  queries: CngxFilterBuilderTemplateRegistryQueries,
) => CngxFilterBuilderTemplateRegistry;

type TemplateKey = keyof CngxFilterBuilderTemplates;

/** @internal */
function resolveTemplate<Ctx>(
  directive: Signal<TemplateRefHolder<Ctx> | undefined>,
  configKey: TemplateKey,
  config: ReturnType<typeof injectFilterBuilderConfig>,
): Signal<TemplateRef<Ctx> | null> {
  return computed<TemplateRef<Ctx> | null>(() => {
    const instance = directive()?.templateRef;
    if (instance) {
      return instance;
    }
    const fromConfig = config.templates[configKey] as TemplateRef<Ctx> | null | undefined;
    return fromConfig ?? null;
  });
}

/**
 * Wires every slot query through the documented three-stage cascade.
 * Must be called inside an Angular injection context (the helper resolves
 * `CNGX_FILTER_BUILDER_CONFIG` lazily and the `contentChild` signals were
 * already created in the caller's context).
 *
 * The default factory is registered behind
 * `CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY` so consumers can wrap
 * the resolution path (telemetry, dynamic theme swapping, etc.) without
 * forking the component.
 *
 * @category forms/filter-builder/slots
 */
export function createFilterBuilderTemplateRegistry(
  queries: CngxFilterBuilderTemplateRegistryQueries,
): CngxFilterBuilderTemplateRegistry {
  const config = injectFilterBuilderConfig();
  return {
    empty: resolveTemplate(queries.empty, 'empty', config),
    expressionTemplate: resolveTemplate(queries.expressionTemplate, 'expressionTemplate', config),
    groupTemplate: resolveTemplate(queries.groupTemplate, 'groupTemplate', config),
    addFilterButton: resolveTemplate(queries.addFilterButton, 'addFilterButton', config),
    addGroupButton: resolveTemplate(queries.addGroupButton, 'addGroupButton', config),
    removeButton: resolveTemplate(queries.removeButton, 'removeButton', config),
    logicToggle: resolveTemplate(queries.logicToggle, 'logicToggle', config),
    negationToggle: resolveTemplate(queries.negationToggle, 'negationToggle', config),
    valueEditor: resolveTemplate(queries.valueEditor, 'valueEditor', config),
  };
}

/**
 * DI token for the template-registry factory. Default resolves to `createFilterBuilderTemplateRegistry`.
 *
 * @category forms/filter-builder/slots
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-template-registry.ts
 * @since 0.1.0
 */
export const CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY = new InjectionToken<CngxFilterBuilderTemplateRegistryFactory>(
  'CngxFilterBuilderTemplateRegistryFactory',
  { providedIn: 'root', factory: () => createFilterBuilderTemplateRegistry },
);

/**
 * Inject-context helper that resolves the registry factory through the DI
 * token and invokes it with the caller's `contentChild` queries. The
 * `<cngx-filter-builder>` component is the canonical caller.
 *
 * @category forms/filter-builder/slots
 */
export function injectFilterBuilderTemplateRegistry(
  queries: CngxFilterBuilderTemplateRegistryQueries,
): CngxFilterBuilderTemplateRegistry {
  return inject(CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY)(queries);
}
