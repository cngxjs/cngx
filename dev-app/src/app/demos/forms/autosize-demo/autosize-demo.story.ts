import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Autosize Textarea',
  navLabel: 'Autosize',
  navCategory: 'input',
  description:
    'Auto-resize textarea based on content. Signal-first alternative to cdkTextareaAutosize.',
  apiComponents: ['CngxAutosize'],
  overview:
    '<p><code>CngxAutosize</code> automatically adjusts textarea height to fit content. ' +
    'Supports <code>minRows</code> / <code>maxRows</code> constraints and exposes a <code>height</code> signal.</p>',
  moduleImports: [
    "import { CngxAutosize } from '@cngx/forms/input';",
  ],
  sections: [
    {
      title: 'Basic Autosize',
      subtitle:
        'Type multiple lines — the textarea grows. Delete lines — it shrinks. ' +
        'The <code>height</code> signal reflects the current computed height.',
      imports: ['CngxAutosize'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Auto-growing textarea</label>
      <textarea cngxAutosize #auto="cngxAutosize" placeholder="Type multiple lines..."
        class="demo-input" style="width:100%"></textarea>
      <div class="status-row">
        <span class="status-badge">Height: {{ auto.height() }}px</span>
      </div>
    </div>
  </div>`,
    },
    {
      title: 'Min / Max Rows',
      subtitle:
        '<code>[minRows]</code> sets the minimum height. <code>[maxRows]</code> caps growth and shows a scrollbar.',
      imports: ['CngxAutosize'],
      template: `
  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Min 3 rows, max 8 rows</label>
      <textarea cngxAutosize [minRows]="3" [maxRows]="8" #bounded="cngxAutosize"
        placeholder="Starts at 3 rows, scrollbar appears after 8..."
        class="demo-input" style="width:100%"></textarea>
      <div class="status-row">
        <span class="status-badge">Height: {{ bounded.height() }}px</span>
      </div>
    </div>
  </div>`,
    },
  ],
};
