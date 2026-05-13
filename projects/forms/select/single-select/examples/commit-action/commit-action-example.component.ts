import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Observable } from 'rxjs';

import {
  CngxSelect,
  CngxSelectCommitError,
  type CngxSelectCommitAction,
  type CngxSelectOptionDef,
} from '@cngx/forms/select';

/**
 * CngxSelect commit-action — optimistic / pessimistic with rollback.
 *
 * `[commitAction]` runs an async save operation before the selection
 * actually commits. In `optimistic` mode the option is selected
 * immediately, the panel closes, and an error rolls the value back
 * (with the previously selected option restored). In `pessimistic`
 * mode the panel stays open and a per-row spinner shows on the intended
 * option until the action resolves; the panel only closes on success.
 *
 * Toggle "Simulate error" and the mode buttons to exercise all four
 * quadrants. The `*cngxSelectCommitError` slot template controls the
 * inline error UI inside the panel — by default a banner above the
 * options carries `error.message`.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxSelect, CngxSelectCommitError],
  template: `
    <p style="margin: 0 0 12px; opacity: 0.8; font-size: 0.875rem">
      Pick a status — the commit-action simulates a server save. Tick
      "Simulate error" and watch the rollback (optimistic) or the panel
      staying open with the per-row spinner (pessimistic).
    </p>
    <div
      style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap"
    >
      <label>
        <input
          type="checkbox"
          [checked]="shouldFail()"
          (change)="shouldFail.set($any($event.target).checked)"
        />
        Simulate error
      </label>
      <button
        type="button"
        (click)="mode.set('optimistic')"
        [style.fontWeight]="mode() === 'optimistic' ? 'bold' : 'normal'"
      >
        optimistic
      </button>
      <button
        type="button"
        (click)="mode.set('pessimistic')"
        [style.fontWeight]="mode() === 'pessimistic' ? 'bold' : 'normal'"
      >
        pessimistic
      </button>
    </div>

    <cngx-select
      label="Status"
      placeholder="Pick a status…"
      [options]="options"
      [(value)]="value"
      [commitAction]="commitAction"
      [commitMode]="mode()"
    >
      <ng-template cngxSelectCommitError let-error>
        {{ error?.message }}
      </ng-template>
    </cngx-select>

    <p style="margin-top: 12px">Selected: {{ value() ?? '–' }}</p>
  `,
})
export class CommitActionExample {
  protected readonly options: CngxSelectOptionDef<string>[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'review', label: 'In Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'published', label: 'Published' },
  ];

  protected readonly value = signal<string | undefined>(undefined);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly shouldFail = signal(false);

  protected readonly commitAction: CngxSelectCommitAction<string> = (intended) =>
    new Observable<string | undefined>((sub) => {
      const handle = setTimeout(() => {
        if (this.shouldFail()) {
          sub.error(new Error('Server rejected: ' + intended));
        } else {
          sub.next(intended);
          sub.complete();
        }
      }, 900);
      return () => clearTimeout(handle);
    });
}
