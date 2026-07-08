import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion panel: Lazy fetch per panel',
  subtitle:
    'Each panel is its own async boundary. Opening a section starts a fetch, the panel shows a skeleton via <code>*cngxAccordionItemBusy</code>, then resolves to content or an error with a retry button via <code>*cngxAccordionItemError</code>.',
  description:
    'Drive each item&apos;s <code>[state]</code> from a per-panel manual async state. There is no open output on the item, so the fetch is kicked from the group&apos;s <code>(openIdsChange)</code>: when a panel id first enters the open set and its state is still idle, the fetch runs. The busy, error, and content slots are chosen by the state machine, not by the accordion. The third panel always fails so the error + retry path is visible.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemSubtitle',
    'CngxAccordionItemBusy',
    'CngxAccordionItemError',
    'CngxAccordionItemContent',
  ],
  moduleImports: [
    "import { createManualState, type ManualAsyncState } from '@cngx/common/data';",
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `  protected readonly overviewState = createManualState<string>();
  protected readonly metricsState = createManualState<string>();
  protected readonly auditState = createManualState<string>();

  private fetch(state: ManualAsyncState<string>, payload: string, fail: boolean): void {
    if (state.status() === 'loading' || state.status() === 'success') {
      return;
    }
    state.set('loading');
    setTimeout(() => {
      if (fail) {
        state.setError(new Error('Request failed'));
      } else {
        state.setSuccess(payload);
      }
    }, 900);
  }

  protected onOpenChange(open: ReadonlySet<string>): void {
    if (open.has('overview')) {
      this.fetch(this.overviewState, 'Traffic is up 12% week over week across all regions.', false);
    }
    if (open.has('metrics')) {
      this.fetch(this.metricsState, 'p95 latency 180ms, error rate 0.2%, 4 active alerts.', false);
    }
    if (open.has('audit')) {
      this.fetch(this.auditState, '', true);
    }
  }

  protected retry(state: ManualAsyncState<string>, payload: string, fail: boolean): void {
    state.reset();
    this.fetch(state, payload, fail);
  }`,
  template: `  <cngx-accordion-group
    [multi]="true"
    [headingLevel]="3"
    (openIdsChange)="onOpenChange($event)"
    style="max-width:520px"
  >
    <cngx-accordion-item panelId="overview" [state]="overviewState">
      <span cngxAccordionItemTitle>Overview</span>
      <span cngxAccordionItemSubtitle>Loaded on first open.</span>
      <ng-template cngxAccordionItemBusy>
        <p>Loading overview…</p>
      </ng-template>
      <ng-template cngxAccordionItemContent>
        <p>{{ overviewState.data() }}</p>
      </ng-template>
    </cngx-accordion-item>

    <cngx-accordion-item panelId="metrics" [state]="metricsState">
      <span cngxAccordionItemTitle>Live metrics</span>
      <span cngxAccordionItemSubtitle>Fetched independently.</span>
      <ng-template cngxAccordionItemBusy>
        <p>Loading metrics…</p>
      </ng-template>
      <ng-template cngxAccordionItemContent>
        <p>{{ metricsState.data() }}</p>
      </ng-template>
    </cngx-accordion-item>

    <cngx-accordion-item panelId="audit" [state]="auditState">
      <span cngxAccordionItemTitle>Audit log</span>
      <span cngxAccordionItemSubtitle>This endpoint fails on purpose.</span>
      <ng-template cngxAccordionItemBusy>
        <p>Loading audit log…</p>
      </ng-template>
      <ng-template cngxAccordionItemError>
        <p>The audit log could not be loaded.</p>
        <button type="button" (click)="retry(auditState, '', true)">Retry</button>
      </ng-template>
      <ng-template cngxAccordionItemContent>
        <p>{{ auditState.data() }}</p>
      </ng-template>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
