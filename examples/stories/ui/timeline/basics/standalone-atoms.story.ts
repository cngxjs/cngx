import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Timeline atoms without the organism',
  subtitle:
    'A row is <code>&lt;cngx-timeline-item&gt;</code> and nothing else. Drop it into your own layout, or go one level down and place the marker and the rail yourself.',
  description:
    'The marker and the connector are terminal units: they resolve their own tokens, carry their own status colours and lay out with no timeline above them. That is why a row dropped into a card or a detail pane renders complete instead of collapsing, and why the organism is a convenience over the atoms rather than a prerequisite for them. The item molecule places the two in its raster; the bottom row here shows what that raster is made of by hand-placing them.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: ['CngxTimelineItem', 'CngxTimelineMarker', 'CngxTimelineConnector'],
  moduleImports: [
    "import { CngxTimelineConnector, CngxTimelineContent, CngxTimelineItem, CngxTimelineMarker, CngxTimelineMarkerContent, CngxTimelineTime } from '@cngx/common/timeline';",
    "import { CngxTime } from '@cngx/common/display';",
  ],
  imports: [
    'CngxTimelineItem',
    'CngxTimelineMarker',
    'CngxTimelineConnector',
    'CngxTimelineContent',
    'CngxTimelineMarkerContent',
    'CngxTimelineTime',
    'CngxTime',
  ],
  setup: `protected readonly at = new Date('2026-07-21T09:31:00');`,
  template: `<!-- A row on its own: no <cngx-timeline> anywhere above it. -->
  <cngx-timeline-item status="done" position="only">
    <span cngxTimelineMarkerContent>&#10003;</span>
    <cngx-time cngxTimelineTime [date]="at" />
    <div cngxTimelineContent>
      <p style="margin:0 0 4px;font-weight:600">Release 4.2 published</p>
      <p style="margin:0">The row brings its own raster, rail and status colour.</p>
    </div>
  </cngx-timeline-item>

  <!-- One level down: the two atoms, placed by hand. -->
  <div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px;margin-top:24px">
    <cngx-timeline-marker status="active" [busy]="true" />
    <p style="margin:0">active and busy - the dot pulses without moving anything</p>

    <cngx-timeline-connector status="active" position="middle" style="justify-self:center" />
    <p style="margin:0">the rail is its own element, so a custom layout can place it anywhere</p>

    <cngx-timeline-marker status="upcoming" />
    <p style="margin:0">upcoming is hollow and dashed, so it survives a colour-blind reader</p>
  </div>`,
};
