import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';
import { CNGX_CHART_I18N } from '../i18n/chart-i18n';

/**
 * Internal SR-only data-table view. The parent `<cngx-chart>` mounts
 * one of these and links it via `aria-describedby`. The element is
 * always present in the DOM — visibility flips through `aria-hidden`
 * controlled by the chart's `tableActive` predicate. This is the
 * Pillar-2 always-in-DOM contract: the linked id never disappears
 * from the host, only the row content's accessibility-tree visibility
 * does.
 *
 * V1 surface is single-column ("Value") backed by the chart's
 * `summary`-projected numeric values. Phase 4+ may widen to one
 * column per layer accessor; the column header derivation is
 * intentionally minimal until that lands.
 *
 * @internal
 */
@Component({
  selector: 'cngx-chart-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[id]': 'resolvedId()',
    '[attr.aria-hidden]': 'hidden() ? "true" : "false"',
  },
  template: `
    <table class="cngx-chart-data-table__table">
      <caption>{{ caption() }}</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">{{ valueColumnLabel() }}</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.index) {
          <tr>
            <th scope="row">{{ row.index + 1 }}</th>
            <td>{{ row.value }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      cngx-chart-data-table {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `,
  ],
})
export class CngxChartDataTable {
  readonly values = input.required<readonly number[]>();
  readonly hidden = input.required<boolean>();
  /**
   * Stable id consumed by the chart's `aria-describedby` binding.
   * Optional input — when omitted, falls back to a per-instance
   * `nextUid`-allocated default. Two standalone tables without an
   * explicit `[id]` therefore receive different ids; the always-in-
   * DOM rule cannot be violated by an unset input.
   */
  readonly id = input<string | undefined>(undefined);

  private readonly defaultId = nextUid('cngx-chart-data-table');
  private readonly i18n = inject(CNGX_CHART_I18N);

  /**
   * Resolved host id — the explicit `[id]` input wins over the
   * per-instance default. The host binding reads this signal so
   * external `aria-describedby` references stay live across input
   * changes.
   */
  protected readonly resolvedId = computed(() => this.id() ?? this.defaultId);

  protected readonly caption = computed(() => this.i18n.dataTable());
  protected readonly valueColumnLabel = computed(() => this.i18n.valueColumnLabel());

  protected readonly rows = computed<readonly { index: number; value: number }[]>(
    () => {
      const vs = this.values();
      const out = new Array<{ index: number; value: number }>(vs.length);
      for (let i = 0; i < vs.length; i++) {
        out[i] = { index: i, value: vs[i] };
      }
      return out;
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (a[i].index !== b[i].index || !Object.is(a[i].value, b[i].value)) {
            return false;
          }
        }
        return true;
      },
    },
  );
}
