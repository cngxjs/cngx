import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCardAccent: Severity accent',
  subtitle:
    '<code>cngxCardAccent</code> takes one of <code>danger</code>, <code>warning</code>, <code>success</code>, <code>info</code>, <code>neutral</code>. Tint, border and icon follow the alert severity recipe; <code>neutral</code> is no status and stays a plain card.',
  description:
    'Top row: the accent alone, driven only by the attribute. Bottom row: the same cards with <code>&lt;cngx-card-accent-icon&gt;</code> in the title, which adds a distinct glyph and a screen-reader label per severity so colour is not the only cue. Pick one look per dashboard.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxCardAccent', 'CngxCardAccentIcon'],
  moduleImports: [
    "import { CngxCard, CngxCardHeader, CngxCardTitle, CngxCardBody, CngxCardAccent, CngxCardAccentIcon } from '@cngx/common/card';",
  ],
  imports: [
    'CngxCard',
    'CngxCardHeader',
    'CngxCardTitle',
    'CngxCardBody',
    'CngxCardAccent',
    'CngxCardAccentIcon',
  ],
  template: `  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
    <cngx-card cngxCardAccent="danger">
      <header cngxCardHeader><h3 cngxCardTitle>Danger</h3></header>
      <div cngxCardBody>Critical alert</div>
    </cngx-card>
    <cngx-card cngxCardAccent="warning">
      <header cngxCardHeader><h3 cngxCardTitle>Warning</h3></header>
      <div cngxCardBody>Needs attention</div>
    </cngx-card>
    <cngx-card cngxCardAccent="success">
      <header cngxCardHeader><h3 cngxCardTitle>Success</h3></header>
      <div cngxCardBody>All clear</div>
    </cngx-card>
    <cngx-card cngxCardAccent="info">
      <header cngxCardHeader><h3 cngxCardTitle>Info</h3></header>
      <div cngxCardBody>For your information</div>
    </cngx-card>
    <cngx-card cngxCardAccent="neutral">
      <header cngxCardHeader><h3 cngxCardTitle>Neutral</h3></header>
      <div cngxCardBody>Default state</div>
    </cngx-card>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:16px">
    <cngx-card cngxCardAccent="danger">
      <header cngxCardHeader><h3 cngxCardTitle><cngx-card-accent-icon />Danger</h3></header>
      <div cngxCardBody>Critical alert</div>
    </cngx-card>
    <cngx-card cngxCardAccent="warning">
      <header cngxCardHeader><h3 cngxCardTitle><cngx-card-accent-icon />Warning</h3></header>
      <div cngxCardBody>Needs attention</div>
    </cngx-card>
    <cngx-card cngxCardAccent="success">
      <header cngxCardHeader><h3 cngxCardTitle><cngx-card-accent-icon />Success</h3></header>
      <div cngxCardBody>All clear</div>
    </cngx-card>
    <cngx-card cngxCardAccent="info">
      <header cngxCardHeader><h3 cngxCardTitle><cngx-card-accent-icon />Info</h3></header>
      <div cngxCardBody>For your information</div>
    </cngx-card>
    <cngx-card cngxCardAccent="neutral">
      <header cngxCardHeader><h3 cngxCardTitle>Neutral</h3></header>
      <div cngxCardBody>Default state</div>
    </cngx-card>
  </div>`,
};
