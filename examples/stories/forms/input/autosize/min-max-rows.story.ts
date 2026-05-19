import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Min / Max Rows',
  subtitle: '<code>[minRows]</code> sets the minimum height. <code>[maxRows]</code> caps growth and shows a scrollbar.',
  description: 'Auto-resize textarea based on content. Signal-first alternative to cdkTextareaAutosize.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxAutosize',
  ],
  moduleImports: [
    'import { CngxAutosize } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxAutosize'],
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label">Min 3 rows, max 8 rows</label>
      <textarea cngxAutosize [minRows]="3" [maxRows]="8" #bounded="cngxAutosize"
        placeholder="Starts at 3 rows, scrollbar appears after 8..."
        class="demo-input" style="width:100%"></textarea>
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Height: {{ bounded.height() }}px</span>
      </div>`,
};
