import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { injectAsyncState } from '@cngx/common/data';
import {
  CngxAsyncContainer,
  CngxAsyncContentTpl,
  CngxAsyncEmptyTpl,
  CngxAsyncErrorTpl,
  CngxAsyncSkeletonTpl,
} from '@cngx/ui/feedback';

/**
 * Async-container data flow — one signal, four view states.
 *
 * `injectAsyncState` wraps a simulated HTTP call that re-fires whenever
 * a tracked signal (the filter) changes. The returned `ReactiveAsyncState`
 * is fed into `<cngx-async-container>` via `[state]`, and four projected
 * templates (`cngxAsyncSkeleton`, `cngxAsyncContent`, `cngxAsyncEmpty`,
 * `cngxAsyncError`) render the appropriate view — no manual `@if` chains.
 * The first load shows the skeleton; subsequent refetches show the existing
 * content plus a top-bar refresh indicator. Empty results route to the
 * empty template; errors to the error template with the thrown value.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxAsyncContainer,
    CngxAsyncSkeletonTpl,
    CngxAsyncContentTpl,
    CngxAsyncEmptyTpl,
    CngxAsyncErrorTpl,
  ],
  template: `
    <p style="margin: 0 0 12px; opacity: 0.8; font-size: 0.875rem">
      Type into the filter — <code>injectAsyncState</code> re-fires the
      query, and <code>&lt;cngx-async-container&gt;</code> switches between
      skeleton, content, empty, and error views from a single
      <code>[state]</code> input.
    </p>
    <label style="display: flex; flex-direction: column; gap: 4px; max-width: 320px">
      <span>Filter names</span>
      <input
        type="text"
        [value]="filter()"
        (input)="filter.set($any($event.target).value)"
        placeholder="type to filter…"
      />
    </label>

    <cngx-async-container [state]="people" aria-label="People list">
      <ng-template cngxAsyncSkeleton>
        <p style="opacity: 0.6">Loading…</p>
      </ng-template>

      <ng-template cngxAsyncContent let-items>
        <ul>
          @for (item of items; track item) {
            <li>{{ item }}</li>
          }
        </ul>
      </ng-template>

      <ng-template cngxAsyncEmpty>
        <p>No results.</p>
      </ng-template>

      <ng-template cngxAsyncError let-err>
        <p style="color: #b00020">Error: {{ err }}</p>
      </ng-template>
    </cngx-async-container>
  `,
})
export class DataFlowExample {
  protected readonly filter = signal('');

  protected readonly people = injectAsyncState<string[]>(() => {
    const query = this.filter().toLowerCase();
    return new Promise<string[]>((resolve) =>
      setTimeout(() => {
        const all = ['Alice', 'Bob', 'Charlie', 'Diana'];
        resolve(query ? all.filter((n) => n.toLowerCase().includes(query)) : all);
      }, 1200),
    );
  });
}
