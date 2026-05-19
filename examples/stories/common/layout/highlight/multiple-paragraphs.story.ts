import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multiple Paragraphs',
  subtitle: 'Highlight works across nested elements — it walks all text nodes recursively.',
  description: 'Search-text highlighting via <mark> elements. Safe text-node walking, no innerHTML.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxHighlight',
  ],
  moduleImports: [
    'import { CngxHighlight } from \'@cngx/common/layout\';',
  ],
  imports: ['CngxHighlight'],
  template: `
  <div [cngxHighlight]="'angular'" #hl2="cngxHighlight"
       style="max-width:500px;font-size:0.9375rem">
    <p style="margin:0 0 8px"><strong>Angular</strong> is a platform for building web applications.</p>
    <p style="margin:0 0 8px">The Angular CLI makes it easy to create and maintain Angular apps.</p>
    <p style="margin:0">Use Angular with TypeScript for type safety.</p>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Matches for "angular"</span>
      <span class="event-value">{{ hl2.matchCount() }}</span>
    </div>
  </div>`,
};
