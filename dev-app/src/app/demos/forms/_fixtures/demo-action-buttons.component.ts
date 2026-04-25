import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Context bundle the `<demo-action-buttons>` fixture wires into its
 * OK / Cancel buttons. Mirrors the subset of `CngxSelectActionContext`
 * the demos most often consume — so action-select / action-multi-select
 * `*cngxSelectAction` slots can drop the fixture in without ceremony.
 */
export interface DemoActionContext {
  readonly commit: () => void;
  readonly close: () => void;
  readonly isPending: boolean;
  readonly dirty: boolean;
}

/**
 * Shared OK / Cancel button pair for the `*cngxSelectAction` slot of
 * `CngxActionSelect` / `CngxActionMultiSelect` demos. Drops the
 * ~15 lines of inline-styled markup the demos used to duplicate
 * verbatim while still letting consumers tweak labels via inputs.
 *
 * **Internal demo fixture only.** Not part of `@cngx/forms/select`'s
 * public API — kept under `dev-app/.../_fixtures/` so it never leaks
 * into the published bundle. Future demos that exercise the action-
 * host slot should drop `<demo-action-buttons />` in instead of
 * re-duplicating the styled `<button>` pair.
 *
 * @example
 * ```html
 * <cngx-action-select [(value)]="value" [quickCreateAction]="create">
 *   <ng-template cngxSelectAction let-commit="commit" let-close="close" let-pending="isPending" let-dirty="dirty">
 *     <demo-action-buttons
 *       [commitLabel]="'Anlegen'"
 *       [context]="{ commit, close, isPending: pending, dirty }"
 *     />
 *   </ng-template>
 * </cngx-action-select>
 * ```
 */
@Component({
  selector: 'demo-action-buttons',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="demo-action-buttons"
      style="
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        border-top: 1px solid var(--cngx-border, #e5e7eb);
        justify-content: flex-end;
      "
    >
      @if (showCancel()) {
        <button
          type="button"
          (click)="handleCancel()"
          [disabled]="context().isPending"
          style="
            padding: 0.4rem 0.75rem;
            border: 1px solid var(--cngx-border, #e5e7eb);
            background: transparent;
            border-radius: 4px;
            cursor: pointer;
            font: inherit;
          "
        >
          {{ cancelLabel() }}
        </button>
      }
      <button
        type="button"
        (click)="handleCommit()"
        [disabled]="context().isPending || (requireDirty() && !context().dirty)"
        style="
          padding: 0.4rem 0.75rem;
          border: 0;
          background: var(--cngx-primary, #1976d2);
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font: inherit;
        "
      >
        @if (context().isPending) {
          <span aria-hidden="true">⏳</span>
        }
        {{ commitLabel() }}
      </button>
    </div>
  `,
})
export class DemoActionButtons {
  /** Action context from the `*cngxSelectAction` slot. */
  readonly context = input.required<DemoActionContext>();

  /** Label for the primary commit button. Default `'OK'`. */
  readonly commitLabel = input<string>('OK');

  /** Label for the secondary cancel button. Default `'Abbrechen'`. */
  readonly cancelLabel = input<string>('Abbrechen');

  /** Hide the cancel button when only a single action is meaningful. */
  readonly showCancel = input<boolean>(true);

  /** Disable the commit button until the action context reports `dirty`. */
  readonly requireDirty = input<boolean>(false);

  /** Fires after the commit button delegates to `context().commit()`. */
  readonly committed = output<void>();

  /** Fires after the cancel button delegates to `context().close()`. */
  readonly cancelled = output<void>();

  protected handleCommit(): void {
    this.context().commit();
    this.committed.emit();
  }

  protected handleCancel(): void {
    this.context().close();
    this.cancelled.emit();
  }
}
