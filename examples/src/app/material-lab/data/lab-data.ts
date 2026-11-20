import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';

import { CngxAxis, CngxBar, CngxChart, CngxLine } from '@cngx/common/chart';
import { CngxDelta, CngxGoal, CngxMetric, CngxTrend, createManualState } from '@cngx/common/data';
import { CngxTimelineItem, CngxTimelineItemTpl } from '@cngx/common/timeline';
import {
  type Node,
  CngxTreetable,
  provideTreetableAt,
  withTreetableLabels,
} from '@cngx/data-display/treetable';
import {
  type FilterFieldDef,
  type FilterGroup,
  CngxFilterBuilder,
  createEmptyFilterRoot,
} from '@cngx/forms/filter-builder';
import { CngxChartPanel, CngxChartPanelSubtitle, CngxChartPanelTitle } from '@cngx/ui/chart-panel';
import { CngxIncrementalItem, CngxIncrementalList } from '@cngx/ui/collection';
import {
  CngxStatCaption,
  CngxStatCard,
  CngxStatDelta,
  CngxStatLabel,
  CngxStatValue,
} from '@cngx/ui/stat-card';
import { CngxTimeline } from '@cngx/ui/timeline';

import { injectLabSheet } from '../inject-lab-sheet';
import { LabPages } from '../lab-pages';

interface LabEvent {
  readonly id: number;
  readonly at: Date;
  readonly summary: string;
  readonly status: 'done' | 'active' | 'upcoming' | 'rejected';
}

interface LabUnit {
  readonly name: string;
  readonly owner: string;
}

/**
 * Data page of the Material bridge fidelity harness: chart, chart-panel,
 * metric, stat-card, delta, trend, goal, timeline, treetable,
 * incremental-list and filter-builder, each under its bridge in the
 * `material-lab-data-theme` bundle. Material has no twin for them, so they
 * are here for the eye; their token reach is pinned in
 * `e2e/material-bridge-rendered.spec.ts`.
 *
 * filter-builder takes its form-field config from the `material-lab` parent
 * route. Route: `/#/material-lab/data`.
 */
@Component({
  selector: 'app-lab-data',
  providers: [
    provideTreetableAt(withTreetableLabels({ columnLabels: { name: 'Unit', owner: 'Owner' } })),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    LabPages,
    CngxAxis,
    CngxBar,
    CngxChart,
    CngxChartPanel,
    CngxChartPanelSubtitle,
    CngxChartPanelTitle,
    CngxDelta,
    CngxFilterBuilder,
    CngxGoal,
    CngxIncrementalItem,
    CngxIncrementalList,
    CngxLine,
    CngxMetric,
    CngxStatCaption,
    CngxStatCard,
    CngxStatDelta,
    CngxStatLabel,
    CngxStatValue,
    CngxTimeline,
    CngxTimelineItem,
    CngxTimelineItemTpl,
    CngxTreetable,
    CngxTrend,
  ],
  template: `
    <div class="lab mat-app-background mat-typography">
      <nav appLabPages></nav>

      <h2 class="lab-heading">cngx-only (no Material twin)</h2>

      <section class="lab-wide" data-pendant="chart">
        <h3>chart (line and bar)</h3>
        <div class="lab-pendant">
          <cngx-chart class="lab-chart" [data]="revenue" [height]="160" aria-label="Revenue line">
            <svg:g
              cngxAxis
              position="left"
              type="linear"
              [domain]="[0, 1200]"
              [grid]="true"
            ></svg:g>
            <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 7]"></svg:g>
            <svg:g cngxLine [data]="revenue"></svg:g>
          </cngx-chart>
          <cngx-chart class="lab-chart" [data]="revenue" [height]="160" aria-label="Revenue bars">
            <svg:g
              cngxAxis
              position="left"
              type="linear"
              [domain]="[0, 1200]"
              [grid]="true"
            ></svg:g>
            <svg:g cngxBar [data]="revenue"></svg:g>
          </cngx-chart>
        </div>
      </section>

      <section class="lab-wide" data-pendant="chart-panel">
        <h3>chart-panel</h3>
        <cngx-chart-panel class="lab-chart">
          <h4 cngxChartPanelTitle>Revenue</h4>
          <span cngxChartPanelSubtitle>Last eight quarters, k EUR</span>
          <cngx-chart [data]="revenue" [height]="140" aria-label="Revenue in panel">
            <svg:g
              cngxAxis
              position="left"
              type="linear"
              [domain]="[0, 1200]"
              [grid]="true"
            ></svg:g>
            <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 7]"></svg:g>
            <svg:g cngxLine [data]="revenue"></svg:g>
          </cngx-chart>
        </cngx-chart-panel>
      </section>

      <section class="lab-wide" data-pendant="metric">
        <h3>metric</h3>
        <div class="lab-pendant">
          <cngx-metric [value]="1.2" unit="M EUR" />
          <cngx-metric [value]="98.4" unit="%" />
        </div>
      </section>

      <section class="lab-wide" data-pendant="delta">
        <h3>delta (positive, negative, neutral)</h3>
        <div class="lab-pendant">
          <cngx-delta [value]="5.3" />
          <cngx-delta [value]="-2.1" />
          <cngx-delta [value]="0" />
        </div>
      </section>

      <section class="lab-wide" data-pendant="trend">
        <h3>trend (up, down, flat)</h3>
        <div class="lab-pendant">
          <cngx-trend [value]="5.3" />
          <cngx-trend [value]="-2.1" />
          <cngx-trend [value]="0" />
        </div>
      </section>

      <section class="lab-wide" data-pendant="goal">
        <h3>goal</h3>
        <div class="lab-pendant">
          <cngx-goal [value]="73" [max]="100" />
          <cngx-goal [value]="100" [max]="100" />
        </div>
      </section>

      <section class="lab-wide" data-pendant="stat-card">
        <h3>stat-card (success, stale, first-load error)</h3>
        <div class="lab-pendant">
          @for (card of statCards; track card.label) {
            <cngx-stat-card class="lab-stat" [state]="card.state" loadingTreatment="skeleton">
              <span cngxStatLabel>{{ card.label }}</span>
              <cngx-metric cngxStatValue [value]="1.2" unit="M EUR" />
              <cngx-delta cngxStatDelta [value]="5.3" />
              <span cngxStatCaption>vs. last quarter</span>
            </cngx-stat-card>
          }
        </div>
      </section>

      <section class="lab-wide" data-pendant="timeline">
        <h3>timeline (done, active, upcoming, rejected)</h3>
        <cngx-timeline
          [items]="events"
          [dateAccessor]="eventDate"
          [idAccessor]="eventId"
          groupBy="day"
        >
          <ng-template [cngxTimelineItem]="events" let-event let-first="first" let-last="last">
            <cngx-timeline-item
              [position]="first ? 'first' : last ? 'last' : 'middle'"
              [status]="event.status"
            >
              <p class="lab-timeline-text">{{ event.summary }}</p>
            </cngx-timeline-item>
          </ng-template>
        </cngx-timeline>
      </section>

      <section class="lab-wide" data-pendant="treetable">
        <h3>treetable (hover a row, click to select)</h3>
        <cngx-treetable
          [tree]="units"
          selectionMode="single"
          [options]="{ highlightRowOnHover: true }"
        />
      </section>

      <section class="lab-wide" data-pendant="incremental-list">
        <h3>incremental-list (card skin, then a failed load)</h3>
        <div class="lab-pendant lab-lists">
          <cngx-incremental-list
            skin="card"
            [state]="listState"
            [total]="names.length"
            [pageSize]="3"
          >
            <ng-template cngxIncrementalItem let-name>{{ name }}</ng-template>
          </cngx-incremental-list>
          <cngx-incremental-list
            skin="divided"
            [state]="failedState"
            [total]="names.length"
            [pageSize]="3"
          >
            <ng-template cngxIncrementalItem let-name>{{ name }}</ng-template>
          </cngx-incremental-list>
        </div>
      </section>

      <section class="lab-wide" data-pendant="filter-builder">
        <h3>filter-builder</h3>
        <cngx-filter-builder [fields]="fields" [(value)]="filter" />
      </section>
    </div>
  `,
})
export class LabData {
  protected readonly revenue = [420, 515, 468, 702, 831, 774, 995, 1180];

  protected readonly statCards = [
    { label: 'Revenue', state: createManualState<number>() },
    { label: 'Orders', state: createManualState<number>() },
    { label: 'Margin', state: createManualState<number>() },
  ] as const;

  protected readonly events: readonly LabEvent[] = [
    { id: 1, at: new Date(2026, 10, 20, 9), summary: 'Build passed', status: 'done' },
    { id: 2, at: new Date(2026, 10, 20, 11), summary: 'Deploy running', status: 'active' },
    { id: 3, at: new Date(2026, 10, 20, 14), summary: 'Smoke test', status: 'upcoming' },
    { id: 4, at: new Date(2026, 10, 19, 16), summary: 'Hotfix rejected', status: 'rejected' },
  ];
  protected readonly eventDate = (event: LabEvent): Date => event.at;
  protected readonly eventId = (event: LabEvent): number => event.id;

  protected readonly units: Node<LabUnit> = {
    value: { name: 'Platform', owner: 'Ada' },
    children: [
      { value: { name: 'Runtime', owner: 'Grace' } },
      {
        value: { name: 'Tooling', owner: 'Linus' },
        children: [{ value: { name: 'Lint', owner: 'Margaret' } }],
      },
    ],
  };

  protected readonly names = ['Ada', 'Grace', 'Linus', 'Margaret', 'Barbara', 'Ken'];
  protected readonly listState = createManualState<string[]>();
  protected readonly failedState = createManualState<string[]>();

  protected readonly fields: FilterFieldDef[] = [
    { key: 'name', label: 'Name', editorType: 'string' },
    { key: 'owner', label: 'Owner', editorType: 'string' },
  ];
  protected readonly filter = signal<FilterGroup>(createEmptyFilterRoot());

  constructor() {
    injectLabSheet('material-lab-data-theme');

    const [success, stale, failed] = this.statCards;
    success.state.setSuccess(1.2);
    stale.state.setSuccess(1.2);
    stale.state.setError(new Error('Refresh failed'));
    failed.state.set('loading');
    failed.state.setError(new Error('Warehouse unreachable'));

    this.listState.setSuccess(this.names);
    this.failedState.set('loading');
    this.failedState.setError(new Error('Lab load failure'));
  }
}
