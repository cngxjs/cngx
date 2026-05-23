import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxHighlight: Multiple paragraphs',
  subtitle:
    'Highlight works across nested elements - it walks every TEXT_NODE via createTreeWalker, not just the host text.',
  description:
    'Applies a fixed search term across three paragraphs to show that the directive descends into nested elements via createTreeWalker and counts every match (case-insensitive by default).',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxHighlight'],
  moduleImports: ["import { CngxHighlight } from '@cngx/common/layout';"],
  imports: ['CngxHighlight'],
  template: `  <div [cngxHighlight]="'angular'" #hl2="cngxHighlight"
       class="demo-highlight-passage"
       style="max-width:500px">
    <p><strong>Angular</strong> is a platform for building web applications.</p>
    <p>The Angular CLI makes it easy to create and maintain Angular apps.</p>
    <p>Use Angular with TypeScript for type safety.</p>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Matches for "angular"</span>
      <span class="event-value">{{ hl2.matchCount() }}</span>
    </div>
  </div>`,
};
