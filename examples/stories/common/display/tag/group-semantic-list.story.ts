import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTagGroup: semantic list',
  subtitle: 'Set <code>[semanticList]="true"</code> and <code>label="…"</code> to expose a real <code>role="list"</code> with reactive <code>role="listitem"</code> on every projected tag. AT reads "Filters, list, 5 items".',
  description: 'The cascade reads <code>CNGX_TAG_GROUP.semanticList()</code> on the tag side, so the role propagates whether the group is the component or any other host that implements the token.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxTagGroup', 'CngxTag'],
  moduleImports: ["import { CngxTag, CngxTagGroup } from '@cngx/common/display';"],
  imports: ['CngxTag', 'CngxTagGroup'],
  references: [
    {
      label: 'WAI-ARIA APG: list pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/list/',
    },
    {
      label: 'WCAG 2.2 SC 1.3.1 Info and Relationships',
      href: 'https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html',
    },
  ],
  template: `
  <cngx-tag-group [semanticList]="true" label="Filters">
    <span cngxTag color="info">Frontend</span>
    <span cngxTag color="info">Backend</span>
    <span cngxTag color="success">Cleared</span>
    <span cngxTag color="warning">Pending</span>
    <span cngxTag color="error">Failed</span>
  </cngx-tag-group>`,
};
