import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic Autosize',
  subtitle: 'Type multiple lines — the textarea grows. Delete lines — it shrinks. The <code>height</code> signal reflects the current computed height.',
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
      <label class="demo-label">Auto-growing textarea</label>
      <textarea cngxAutosize #auto="cngxAutosize" placeholder="Type multiple lines..."
        class="demo-input" style="width:100%"></textarea>
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Height: {{ auto.height() }}px</span>
      </div>`,
};
