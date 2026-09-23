import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAutosize: basic autosize',
  subtitle: 'Type multiple lines - the textarea grows. Delete lines - it shrinks. The <code>height</code> signal reflects the current computed height.',
  description: 'Auto-resize textarea based on content. Signal-first alternative to cdkTextareaAutosize.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxAutosize',
  ],
  moduleImports: [
    'import { CngxRadioGroup, CngxRadio } from \'@cngx/common/interactive\';',
    'import type { CngxFieldSkin } from \'@cngx/forms/field\';',
    'import { CngxAutosize, CngxInput } from \'@cngx/forms/input\';',
  ],
  imports: ['CngxAutosize', 'CngxInput', 'CngxRadioGroup', 'CngxRadio'],
  setup: `protected readonly skin = signal<CngxFieldSkin>('outline');`,
  template: `  <div class="demo-form">
    <div class="demo-field">
      <label class="demo-label" for="autosize-notes">Auto-growing textarea</label>
      <textarea id="autosize-notes" cngxInput [skin]="skin()" cngxAutosize #auto="cngxAutosize"
        placeholder="Type multiple lines..." class="demo-input" style="width:100%"></textarea>
      
    </div>
  </div>`,
  templateChrome: `<div class="status-row">
        <span class="status-badge">Height: {{ auto.height() }}px</span>
      </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row" style="margin-top:8px">
      <cngx-radio-group [(value)]="skin" name="field-skin" label="Field skin">
        <cngx-radio value="outline">Outline</cngx-radio>
        <cngx-radio value="fill">Fill</cngx-radio>
        <cngx-radio value="bare">Bare</cngx-radio>
      </cngx-radio-group>
    </div>
  </div>`,
};
