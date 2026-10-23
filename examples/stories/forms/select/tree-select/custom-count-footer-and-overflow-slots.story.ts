import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: custom count, footer and overflow slots',
  subtitle:
    'Four slots restyle the counts the tree shows: <code>*cngxTreeSelectNodeCount</code> on each parent row, <code>*cngxTreeSelectFooter</code> below the tree, <code>*cngxSelectSheetCount</code> after the mobile sheet title and <code>*cngxSelectChipOverflow</code> for the <code>+N</code> chip. Switch to "Built-in" to compare with the defaults, and to "sheet" to see the header count and the footer as the bottom bar.',
  description:
    'The node-count template gets <code>{ $implicit: text, text, selected, total, node }</code> and renders for every parent, zero included, so it can show <code>0/3</code>; the built-in count appears only once a descendant is selected. It renders inside an <code>aria-hidden</code> wrapper the host keeps, since <code>aria-checked</code> already carries the state. The footer template gets <code>{ $implicit: count, count, countText, clear, clearLabel, empty }</code>; <code>clear()</code> runs the commit-aware clear, so the announcement, <code>(cleared)</code> and <code>(selectionChange)</code> stay on the host. A custom clear control owns its disabled state, here <code>aria-disabled</code> while nothing is selected. The sheet-count template gets <code>{ $implicit: text }</code>, the overflow template <code>{ count, label, hidden }</code>; the host keeps the hidden values readable for screen readers either way. App-wide defaults go in <code>CNGX_SELECT_CONFIG.templates</code> under <code>treeNodeCount</code>, <code>treeFooter</code> and <code>sheetCount</code>.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  framework: 'template-only',
  apiComponents: [
    'CngxTreeSelect',
    'CngxTreeSelectNodeCount',
    'CngxTreeSelectFooter',
    'CngxSelectSheetCount',
    'CngxSelectChipOverflow',
  ],
  moduleImports: [
    "import { CngxSelectChipOverflow, CngxSelectSheetCount, CngxTreeSelect, CngxTreeSelectFooter, CngxTreeSelectNodeCount } from '@cngx/forms/select';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: [
    'CngxTreeSelect',
    'CngxTreeSelectNodeCount',
    'CngxTreeSelectFooter',
    'CngxSelectSheetCount',
    'CngxSelectChipOverflow',
  ],
  setup: `protected readonly nodes: CngxTreeNode<string>[] = [
    {
      value: 'design',
      label: 'Design',
      children: [
        { value: 'figma', label: 'Figma' },
        { value: 'tokens', label: 'Tokens' },
        { value: 'icons', label: 'Icons' },
      ],
    },
    {
      value: 'engineering',
      label: 'Engineering',
      children: [
        { value: 'web', label: 'Web' },
        { value: 'ios', label: 'iOS' },
        { value: 'android', label: 'Android' },
      ],
    },
    {
      value: 'support',
      label: 'Support',
      children: [
        { value: 'tier1', label: 'Tier 1' },
        { value: 'tier2', label: 'Tier 2' },
      ],
    },
  ];
  protected readonly values = signal<string[]>(['figma', 'tokens', 'web', 'ios', 'android', 'tier1']);
  protected readonly nodeId = (value: string) => value;`,
  setupChrome: `protected readonly custom = signal(true);
  protected readonly presentation = signal<'anchored' | 'sheet'>('anchored');`,
  template: `  <cngx-tree-select
    [label]="'Teams'"
    [nodes]="nodes"
    [(values)]="values"
    [nodeIdFn]="nodeId"
    [maxVisibleChips]="2"
    [initiallyExpanded]="'all'"
    [presentation]="presentation()"
    placeholder="Pick teams"
  >
    @if (custom()) {
      <ng-template cngxTreeSelectNodeCount let-selected="selected" let-total="total">
        <span class="demo-tree-count" [class.demo-tree-count--full]="selected === total">
          {{ selected }} of {{ total }}
        </span>
      </ng-template>
      <ng-template
        cngxTreeSelectFooter
        let-count
        let-clear="clear"
        let-empty="empty"
      >
        <div class="demo-tree-footer">
          <span>{{ count === 1 ? '1 team' : count + ' teams' }} picked</span>
          <button
            type="button"
            class="demo-tree-footer__clear"
            [attr.aria-disabled]="empty || null"
            (click)="clear()"
          >
            Start over
          </button>
        </div>
      </ng-template>
      <ng-template cngxSelectSheetCount let-text>
        <span class="demo-tree-sheet-count">{{ text }}</span>
      </ng-template>
      <ng-template cngxSelectChipOverflow let-count="count">
        <span class="demo-tree-overflow">and {{ count }} more</span>
      </ng-template>
    }
  </cngx-tree-select>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="radio" name="tree-count-slots" value="custom"
        [checked]="custom()" (change)="custom.set(true)" />
      Custom slots
    </label>
    <label>
      <input type="radio" name="tree-count-slots" value="builtin"
        [checked]="!custom()" (change)="custom.set(false)" />
      Built-in
    </label>
  </div>
  <div class="button-row" style="margin-top:8px">
    <label>
      <input type="radio" name="tree-count-presentation" value="anchored"
        [checked]="presentation() === 'anchored'" (change)="presentation.set('anchored')" />
      anchored
    </label>
    <label>
      <input type="radio" name="tree-count-presentation" value="sheet"
        [checked]="presentation() === 'sheet'" (change)="presentation.set('sheet')" />
      sheet
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().join(', ') || 'none' }}</span>
    </div>
  </div>`,
};
