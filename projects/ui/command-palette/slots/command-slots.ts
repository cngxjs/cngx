import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxCommandGroup, CngxRankedCommand } from '@cngx/common/command';

/**
 * Context for the {@link CngxCommandRow} slot. Region granularity: the whole
 * row is one slot, so the consumer lays out icon / label / shortcut-hint
 * inside its own template. `data` is the command's opaque payload, narrowed at
 * the use-site; `active` reflects the current `aria-activedescendant`.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
export interface CngxCommandRowContext {
  readonly $implicit: CngxRankedCommand;
  readonly term: string;
  readonly data: unknown;
  readonly active: boolean;
}

/** Context for the {@link CngxCommandGroupHeader} slot. Recents is a group. */
export interface CngxCommandGroupHeaderContext {
  readonly $implicit: CngxCommandGroup;
}

/** Context for the {@link CngxCommandPaletteEmpty} slot. */
export interface CngxCommandPaletteEmptyContext {
  readonly term: string;
}

/** Context for the {@link CngxCommandPaletteLoading} slot. */
export type CngxCommandPaletteLoadingContext = Record<string, never>;

/** Context for the {@link CngxCommandPaletteError} slot. */
export interface CngxCommandPaletteErrorContext {
  readonly error: unknown;
  readonly retry: () => void;
}

/** Context for the {@link CngxCommandPaletteFooter} slot. */
export type CngxCommandPaletteFooterContext = Record<string, never>;

/**
 * Overrides the default command row. Project as content of
 * `<cngx-command-palette>`:
 *
 * ```html
 * <cngx-command-palette>
 *   <ng-template cngxCommandRow let-entry let-active="active">
 *     <my-icon [name]="entry.command.icon" />
 *     <span>{{ entry.command.label }}</span>
 *   </ng-template>
 * </cngx-command-palette>
 * ```
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
@Directive({ selector: '[cngxCommandRow]', standalone: true })
export class CngxCommandRow {
  readonly templateRef = inject<TemplateRef<CngxCommandRowContext>>(TemplateRef);
  static ngTemplateContextGuard(_dir: CngxCommandRow, ctx: unknown): ctx is CngxCommandRowContext {
    return true;
  }
}

/**
 * Overrides the default group header.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
@Directive({ selector: '[cngxCommandGroupHeader]', standalone: true })
export class CngxCommandGroupHeader {
  readonly templateRef = inject<TemplateRef<CngxCommandGroupHeaderContext>>(TemplateRef);
  static ngTemplateContextGuard(
    _dir: CngxCommandGroupHeader,
    ctx: unknown,
  ): ctx is CngxCommandGroupHeaderContext {
    return true;
  }
}

/**
 * Overrides the default empty state.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
@Directive({ selector: '[cngxCommandPaletteEmpty]', standalone: true })
export class CngxCommandPaletteEmpty {
  readonly templateRef = inject<TemplateRef<CngxCommandPaletteEmptyContext>>(TemplateRef);
  static ngTemplateContextGuard(
    _dir: CngxCommandPaletteEmpty,
    ctx: unknown,
  ): ctx is CngxCommandPaletteEmptyContext {
    return true;
  }
}

/**
 * Overrides the default first-load skeleton.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
@Directive({ selector: '[cngxCommandPaletteLoading]', standalone: true })
export class CngxCommandPaletteLoading {
  readonly templateRef = inject<TemplateRef<CngxCommandPaletteLoadingContext>>(TemplateRef);
  static ngTemplateContextGuard(
    _dir: CngxCommandPaletteLoading,
    ctx: unknown,
  ): ctx is CngxCommandPaletteLoadingContext {
    return true;
  }
}

/**
 * Overrides the default error state. Wire `retry` to your reload path.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
@Directive({ selector: '[cngxCommandPaletteError]', standalone: true })
export class CngxCommandPaletteError {
  readonly templateRef = inject<TemplateRef<CngxCommandPaletteErrorContext>>(TemplateRef);
  static ngTemplateContextGuard(
    _dir: CngxCommandPaletteError,
    ctx: unknown,
  ): ctx is CngxCommandPaletteErrorContext {
    return true;
  }
}

/**
 * Overrides the default keyboard-legend footer.
 *
 * @category ui/command-palette
 * @since 0.1.0
 */
@Directive({ selector: '[cngxCommandPaletteFooter]', standalone: true })
export class CngxCommandPaletteFooter {
  readonly templateRef = inject<TemplateRef<CngxCommandPaletteFooterContext>>(TemplateRef);
  static ngTemplateContextGuard(
    _dir: CngxCommandPaletteFooter,
    ctx: unknown,
  ): ctx is CngxCommandPaletteFooterContext {
    return true;
  }
}
