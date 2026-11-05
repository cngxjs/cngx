import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionSelect: focus-trap behaviour via withFocusTrapBehavior',
  subtitle:
    "<code>provideActionSelectConfigAt(withFocusTrapBehavior('always'))</code> traps keyboard focus inside the action panel for the subtree, so Tab cycles through the options and the action button instead of leaving the panel. <code>'dirty'</code> traps only once the input has unsaved text; <code>'never'</code> never traps. A per-instance input still wins.",
  description:
    'Open the panel and press Tab repeatedly: focus stays inside until you close the panel. The trap keeps a quick-create flow self-contained for keyboard and screen-reader users.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  framework: 'template-only',
  apiComponents: ['CngxActionSelect', 'CngxSelectAction'],
  references: [
    { label: 'APG: Combobox pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/combobox/' },
  ],
  moduleImports: [
    "import { CngxActionSelect, CngxSelectAction, provideActionSelectConfigAt, withFocusTrapBehavior, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxActionSelect', 'CngxSelectAction'],
  viewProviders: ["...provideActionSelectConfigAt(withFocusTrapBehavior('always'))"],
  setup: `protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'qa', label: 'QA' },
    { value: 'docs', label: 'Docs' },
  ];
  protected readonly tag = signal<string | undefined>(undefined);
  protected readonly createTag: CngxSelectCreateAction<string> = (_term, draft) => draft.label.trim();`,
  templateChromeBefore: `<p class="demo-hint">Open the panel and Tab through it: focus stays trapped inside until you close it.</p>`,
  template: `<cngx-action-select
  [label]="'Tag'"
  [options]="tags"
  [quickCreateAction]="createTag"
  [(value)]="tag"
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
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ tag() ?? '-' }}</span></div>
  </div>`,
};
