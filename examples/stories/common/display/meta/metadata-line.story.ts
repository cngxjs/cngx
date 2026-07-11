import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Meta list: Metadata line',
  subtitle:
    'A <code>&lt;cngx-meta-list&gt;</code> lays out <code>&lt;cngx-meta&gt;</code> pairs as one wrapping, muted line - a bold term followed by its value - so a detail zone reads its key/value context without hand-rolled flex + <code>&lt;b&gt;</code> markup.',
  description:
    'Each <code>&lt;cngx-meta term="..."&gt;</code> renders the term bold before its projected value; omit <code>term</code> for a value-only item. Spacing and colour ride the <code>--cngx-meta-list-*</code> custom properties. It is presentational by design - reach for a definition list when you need real term/description semantics.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: ['CngxMetaList', 'CngxMeta'],
  imports: ['CngxMetaList', 'CngxMeta'],
  template: `  <cngx-meta-list>
    <cngx-meta term="trace">9f31c0d4</cngx-meta>
    <cngx-meta term="tenant">north</cngx-meta>
    <cngx-meta term="pod">auth-7d9f4</cngx-meta>
    <cngx-meta term="count">47x in 5m</cngx-meta>
    <cngx-meta>no-term value</cngx-meta>
  </cngx-meta-list>`,
};
