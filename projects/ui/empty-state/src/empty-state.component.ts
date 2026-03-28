import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { type CngxAsyncState, nextUid } from '@cngx/core/utils';

/**
 * Empty-state display atom for grids, tables, lists, and dashboards.
 *
 * Communicates why a view is empty and what the user can do next.
 * Supports three UX contexts via the parent's `emptyReason`:
 * - **first-use** — onboarding, show what's possible
 * - **no-results** — recovery, offer filter reset or search change
 * - **cleared** — confirmation, everything is done
 *
 * Icon is provided via the `[cngxEmptyStateIcon]` content slot — no Material
 * dependency. Consumers project `<mat-icon>`, `<svg>`, or any icon system.
 *
 * @usageNotes
 *
 * ```html
 * <cngx-empty-state title="No results" description="Try a different search term">
 *   <mat-icon cngxEmptyStateIcon>search_off</mat-icon>
 *   <button cngxEmptyStateAction (click)="resetSearch()">Reset</button>
 * </cngx-empty-state>
 * ```
 *
 * @category ui
 */
@Component({
  selector: 'cngx-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-empty-state',
    role: 'status',
    'aria-live': 'polite',
    '[attr.aria-labelledby]': 'titleId',
    '[attr.aria-describedby]': 'description() ? descriptionId : null',
    '[attr.hidden]': 'shouldHide() || null',
  },
  template: `
    <div class="cngx-empty-state__icon-slot">
      <ng-content select="[cngxEmptyStateIcon]" />
    </div>
    <svg
      class="cngx-empty-state__default-icon"
      aria-hidden="true"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 8V21H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
    <ng-content select="[cngxEmptyStateIllustration]" />
    <h3 [id]="titleId" class="cngx-empty-state__title">{{ title() }}</h3>
    @if (description()) {
      <p [id]="descriptionId" class="cngx-empty-state__description">
        {{ description() }}
      </p>
    }
    <div class="cngx-empty-state__actions">
      <ng-content select="[cngxEmptyStateAction]" />
    </div>
    <ng-content select="[cngxEmptyStateSecondary]" />
  `,
})
export class CngxEmptyState {
  private readonly uid = nextUid('cngx-empty');

  /** Primary message — what state the user is in. */
  readonly title = input.required<string>();

  /** Supporting detail — clarifies context and suggests next steps. */
  readonly description = input<string | undefined>(undefined);

  /** Bind an async state — auto-hides when data is not empty. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /** @internal — hidden when state is bound and data is not empty or still loading. */
  protected readonly shouldHide = computed(() => {
    const s = this.state();
    if (!s) {
      return false;
    }
    // Hide during loading (skeleton handles that phase) and when data is present
    return s.isLoading() || !s.isEmpty();
  });

  /** @internal */
  protected readonly titleId = `${this.uid}-title`;
  /** @internal */
  protected readonly descriptionId = `${this.uid}-desc`;
}
