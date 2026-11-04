import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionSelect: default action placement via withActionPopoverPlacement',
  subtitle:
    "<code>provideActionSelectConfigAt(withActionPopoverPlacement('top'))</code> sets the panel placement for the action organisms in the subtree, so this action select opens its panel above the trigger. The flat variants use <code>withPopoverPlacement</code>; a per-instance input still wins.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxActionSelect', 'CngxSelectAction'],
  moduleImports: [
    "import { CngxActionSelect, CngxSelectAction, provideActionSelectConfigAt, withActionPopoverPlacement, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxActionSelect', 'CngxSelectAction'],
  viewProviders: ["...provideActionSelectConfigAt(withActionPopoverPlacement('top'))"],
  setup: `protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'qa', label: 'QA' },
    { value: 'docs', label: 'Docs' },
  ];
  protected readonly tag = signal<string | undefined>(undefined);
  protected readonly createTag: CngxSelectCreateAction<string> = (_term, draft) => draft.label.trim();
  protected readonly open = signal(false);`,
  templateChromeBefore: `<p class="demo-hint">Scoped config places the action panel above the trigger. Open it to see it flip upward.</p>`,
  template: `<cngx-action-select
  [label]="'Tag'"
  [options]="tags"
  [quickCreateAction]="createTag"
  [(value)]="tag"
  (openedChange)="open.set($event)"
  placeholder="Choose or type a tag"
>
  <ng-template cngxSelectAction let-term let-commit="commit" let-pending="isPending">
    <button type="button" class="demo-action-slot-button" [disabled]="!term || pending" (click)="commit()">
      @if (term) {
        Create tag "{{ term }}"
      } @else {
        Type to create a tag
      }
    </button>
  </ng-template>
</cngx-action-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Panel</span><span class="event-value">{{ open() ? 'open (above the trigger)' : 'closed' }}</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ tag() ?? '-' }}</span></div>
  </div>`,
};
