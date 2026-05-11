import type { Signal, TemplateRef } from '@angular/core';
import type { CngxCellTpl, CngxHeaderTpl } from './column-template.directive';
import type { CngxCellTplContext } from './models';

/**
 * Resolves a custom cell template for the given column key, or returns `null`
 * when no matching template is projected.
 */
export function resolveCellTpl<T>(
  col: string,
  tpls: Signal<readonly CngxCellTpl[]>,
): TemplateRef<CngxCellTplContext<T>> | null {
  return (tpls().find((t) => t.column() === col)?.template ?? null) as TemplateRef<
    CngxCellTplContext<T>
  > | null;
}

/**
 * Resolves a custom header template for the given column key, or returns `null`
 * when no matching template is projected.
 */
export function resolveHeaderTpl(
  col: string,
  tpls: Signal<readonly CngxHeaderTpl[]>,
): TemplateRef<void> | null {
  return tpls().find((t) => t.column() === col)?.template ?? null;
}
