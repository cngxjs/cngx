import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopover: Select inside a popover',
  subtitle:
    'A <code>cngx-select</code> opened inside a <code>cngxPopover</code> leaves the containing popover open - a nested popover never evicts its ancestor.',
  description:
    'Exclusivity governs sibling popovers only. The select\'s panel is itself a <code>CngxPopover</code>, but because it is DOM-nested inside the outer surface, opening it skips the ancestor during exclusive eviction. No <code>[exclusive]</code> binding is needed on either side.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxPopover', 'CngxPopoverTrigger'],
  moduleImports: [
    "import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';",
    "import { CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxPopover', 'CngxPopoverTrigger', 'CngxSelect'],
  setup: `protected readonly assignee = signal<string | undefined>(undefined);
  protected readonly people: CngxSelectOptionDef<string>[] = [
    { value: 'ada', label: 'Ada Lovelace' },
    { value: 'grace', label: 'Grace Hopper' },
    { value: 'edsger', label: 'Edsger Dijkstra' },
  ];`,
  template: `  <button type="button" class="chip" [cngxPopoverTrigger]="taskPop" (click)="taskPop.toggle()">
    Edit task
  </button>
  <div cngxPopover #taskPop="cngxPopover" placement="bottom-start" class="demo-popover-surface"
       style="min-inline-size:16rem">
    <p style="margin:0 0 8px">Assign this task without losing the panel.</p>
    <cngx-select [label]="'Assignee'" [options]="people" [(value)]="assignee"
                 [placeholder]="'Pick a person'" />
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">panel state</span>
      <span class="event-value">{{ taskPop.state() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">assignee</span>
      <span class="event-value">{{ assignee() ?? 'none' }}</span>
    </div>
  </div>`,
};
