import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionSelect: live-input fallback via withLiveInputFallback',
  subtitle:
    '<code>provideActionSelectConfigAt(withLiveInputFallback(false))</code> turns off the raw-input fallback for the subtree, so the action slot and <code>searchTermChange</code> follow the debounced term only instead of mirroring each keystroke. Leave it on (default) unless the consumer owns debouncing; a per-instance input still wins.',
  description:
    'Type into the panel and watch the search log: with the fallback off the term updates on the debounce cadence rather than on every key.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxActionSelect', 'CngxSelectAction'],
  moduleImports: [
    "import { CngxActionSelect, CngxSelectAction, provideActionSelectConfigAt, withLiveInputFallback, type CngxSelectCreateAction, type CngxSelectOptionDef } from '@cngx/forms/select';",
  ],
  imports: ['CngxActionSelect', 'CngxSelectAction'],
  viewProviders: ['...provideActionSelectConfigAt(withLiveInputFallback(false))'],
  setup: `protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'qa', label: 'QA' },
    { value: 'docs', label: 'Docs' },
  ];
  protected readonly tag = signal<string | undefined>(undefined);
  protected readonly createTag: CngxSelectCreateAction<string> = (_term, draft) => draft.label.trim();`,
  setupChrome: `protected readonly searchLog = signal<string[]>([]);
  protected handleSearch(term: string): void {
    this.searchLog.update((l) => [...l.slice(-4), term || '(empty)']);
  }`,
  template: `<cngx-action-select
  [label]="'Tag'"
  [options]="tags"
  [quickCreateAction]="createTag"
  [(value)]="tag"
  (searchTermChange)="handleSearch($event)"
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
    <div class="event-row"><span class="event-label">Search log</span><span class="event-value">{{ searchLog().join(' -> ') || '-' }}</span></div>
    <div class="event-row"><span class="event-label">Value</span><span class="event-value">{{ tag() ?? '-' }}</span></div>
  </div>`,
};
