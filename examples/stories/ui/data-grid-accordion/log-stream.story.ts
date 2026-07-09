import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Log stream',
  subtitle:
    'The <code>[skin]="\'log-stream\'"</code> skin renders a mono log console - timestamp, level, and message columns with the row severity doubled as a 3px left edge. Expand a row to read its stacktrace.',
  description:
    'Severity rides the typed <code>[severity]</code> input (error / warning / info), which the skin paints as the edge; the level badge is a <code>&lt;cngx-tag&gt;</code>, not hand-written CSS. The message cell is marked <code>primary</code> so a screen reader names the row by its message. The detail zone carries a key/value line and a scrollable <code>pre</code> stacktrace on a recessed surface; the footer is a flex status bar. On narrow screens the grid scrolls sideways with the timestamp intact instead of dropping it.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: ['CngxDataGridAccordion', 'CngxDataGridRow', 'CngxDgCell'],
  imports: [
    'CngxDataGridAccordion',
    'CngxDataGridRow',
    'CngxDataGridHeader',
    'CngxDataGridFooter',
    'CngxDgCell',
    'CngxTag',
    'CngxMetaList',
    'CngxMeta',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <div style="max-width:680px">
    <cngx-data-grid-accordion
      [skin]="'log-stream'"
      columns="10ch 8ch 1fr"
      [multi]="true"
      [headingLevel]="3"
    >
      <cngx-data-grid-header>
        <span cngxDgCell>Time</span>
        <span cngxDgCell>Level</span>
        <span cngxDgCell>Message</span>
      </cngx-data-grid-header>

      <cngx-data-grid-row panelId="log-1" [severity]="'error'">
        <span cngxDgCell>14:02:11</span>
        <span cngxDgCell>
          <cngx-tag color="error" variant="subtle" size="sm">ERROR</cngx-tag>
        </span>
        <span cngxDgCell primary>TimeoutError: SAML response exceeded 8000ms (idp=entra-prod)</span>
        <cngx-meta-list style="margin-block-end:0.55rem">
          <cngx-meta term="trace">9f31c0d4</cngx-meta>
          <cngx-meta term="tenant">north</cngx-meta>
          <cngx-meta term="pod">auth-7d9f4</cngx-meta>
          <cngx-meta term="count">47x in 5m</cngx-meta>
        </cngx-meta-list>
        <pre>TimeoutError: SAML response exceeded 8000ms
    at SamlClient.assert (saml/client.ts:214:19)
    at AuthFlow.callback (auth/flow.ts:88:31)
    at async Router.handle (http/router.ts:52:9)
  caused by: socket hang up (ECONNRESET)</pre>
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="log-2" [severity]="'warning'">
        <span cngxDgCell>14:01:58</span>
        <span cngxDgCell>
          <cngx-tag color="warning" variant="subtle" size="sm">WARN</cngx-tag>
        </span>
        <span cngxDgCell primary>Retry 2/3 for export job exp-5521, chunk 14 of 22</span>
        <cngx-meta-list style="margin-block-end:0.55rem">
          <cngx-meta term="trace">2b77e1aa</cngx-meta>
          <cngx-meta term="job">exp-5521</cngx-meta>
          <cngx-meta term="worker">exports-2</cngx-meta>
        </cngx-meta-list>
        <pre>WARN retry: chunk 14 failed with 503 from storage backend
    backoff: 4s, attempt 2 of 3
    payload: 48.2 MB, rows 50000</pre>
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="log-3" [severity]="'info'">
        <span cngxDgCell>14:01:40</span>
        <span cngxDgCell>
          <cngx-tag color="info" variant="subtle" size="sm">INFO</cngx-tag>
        </span>
        <span cngxDgCell primary>Deployment v0.9.1 rolled out to production (canary 100%)</span>
        <cngx-meta-list style="margin-block-end:0.55rem">
          <cngx-meta term="release">v0.9.1</cngx-meta>
          <cngx-meta term="duration">2m 14s</cngx-meta>
          <cngx-meta term="triggered by">ci/main</cngx-meta>
        </cngx-meta-list>
        <pre>INFO rollout complete: 12/12 pods healthy
    canary window: 15m, error budget unchanged
    previous: v0.9.0 (kept for instant rollback)</pre>
      </cngx-data-grid-row>

      <cngx-data-grid-footer>
        <span cngxDgCell>347 lines &middot; last 15 min</span>
        <cngx-tag color="success" variant="subtle" size="sm">Stream connected</cngx-tag>
      </cngx-data-grid-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
