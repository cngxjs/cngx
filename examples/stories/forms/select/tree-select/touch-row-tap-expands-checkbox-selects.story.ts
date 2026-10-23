import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: touch row tap expands, checkbox selects',
  subtitle:
    'Under the touch floor (<code>--cngx-target-min</code> above 0) a finger or pen tap on a parent row expands or collapses it, and a tap on its checkbox selects. Rows grow to 44px and every child stays inline-end of its parent. A mouse, the keyboard and a screen reader keep selecting on row activation.',
  description:
    'The tree reads the same touch floor as every other select: <code>(any-pointer: coarse)</code>, <code>[cngxTouchTarget]</code> or <code>data-touch</code>. A row expands only for the <code>click</code> that ends a <code>pointerdown</code> with <code>pointerType</code> <code>touch</code> or <code>pen</code> on that row. VoiceOver and TalkBack activate the focused treeitem with a click that has no pointer events, so a double tap still selects, as <code>aria-checked</code> on a treeitem promises; they expand through <code>aria-expanded</code> (TalkBack actions, ArrowRight / ArrowLeft). On a phone the panel opens as a sheet with the selected count in the header and the footer as the bottom Clear bar. On a desktop, pick <strong>on</strong> and switch the browser to touch emulation to feel the row tap; a mouse click on <strong>on</strong> still selects.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxTreeSelect', 'CngxTouchTarget'],
  moduleImports: [
    "import { CngxTouchTarget } from '@cngx/core';",
    "import { CngxTreeSelect } from '@cngx/forms/select';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: ['CngxTreeSelect', 'CngxTouchTarget'],
  setup: `protected readonly nodes: CngxTreeNode<string>[] = [
    {
      value: 'docs',
      label: 'Documents',
      children: [
        {
          value: 'contracts',
          label: 'Contracts',
          children: [
            { value: 'nda', label: 'NDA' },
            { value: 'msa', label: 'MSA' },
          ],
        },
        { value: 'invoices', label: 'Invoices' },
      ],
    },
    {
      value: 'media',
      label: 'Media',
      children: [
        { value: 'photos', label: 'Photos' },
        { value: 'videos', label: 'Videos' },
      ],
    },
  ];
  protected readonly values = signal<string[]>([]);
  protected readonly nodeId = (value: string) => value;
  protected readonly touch = signal<'auto' | 'on' | 'off'>('on');`,
  template: `  <div [cngxTouchTarget]="touch() === 'auto' ? undefined : touch()">
    <cngx-tree-select
      [label]="'Folders'"
      [nodes]="nodes"
      [(values)]="values"
      [nodeIdFn]="nodeId"
      [cascadeChildren]="true"
      placeholder="Pick folders"
    />
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="radio" name="tree-touch" value="auto"
        [checked]="touch() === 'auto'" (change)="touch.set('auto')" />
      auto (environment)
    </label>
    <label>
      <input type="radio" name="tree-touch" value="on"
        [checked]="touch() === 'on'" (change)="touch.set('on')" />
      on (44px floor)
    </label>
    <label>
      <input type="radio" name="tree-touch" value="off"
        [checked]="touch() === 'off'" (change)="touch.set('off')" />
      off (dense)
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().join(', ') || 'none' }}</span>
    </div>
  </div>`,
};
