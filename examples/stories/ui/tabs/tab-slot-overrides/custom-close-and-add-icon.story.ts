import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: custom close and add icon',
  subtitle:
    'Project <code>*cngxTabCloseIcon</code> and <code>*cngxTabAddIcon</code> into a <code>closable</code> / <code>addable</code> tab group to replace the built-in glyphs on the close and add-tab buttons. Untick "Use custom slot templates" to compare with the default glyphs.',
  description:
    'Both slots paint only the glyph: the library-owned buttons keep their <code>aria-label</code> (<code>Close "{label}"</code> and <code>Add tab</code> by default), so the custom markup stays <code>aria-hidden</code>. The close-icon template receives <code>{ tab }</code> so the glyph can vary per tab - here a tab marked unsaved shows a dot instead of a cross. The add-icon context is <code>void</code>. Resolution order is instance slot, then <code>CNGX_TABS_CONFIG.templates.closeIcon</code> / <code>addIcon</code>, then the built-in glyph.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: ['CngxTabGroup', 'CngxTabCloseIcon', 'CngxTabAddIcon', 'CngxTab'],
  moduleImports: [
    "import { CngxTab, CngxTabAddIcon, CngxTabCloseIcon, CngxTabContent, type CngxTabCloseEvent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabCloseIcon', 'CngxTabAddIcon'],
  setup: `protected readonly active = signal(0);
  protected readonly customSlots = signal(true);
  protected readonly unsaved = new Set(['draft-2']);
  protected readonly drafts = signal([
    { id: 'draft-1', label: 'Draft 1' },
    { id: 'draft-2', label: 'Draft 2' },
  ]);
  private seq = 2;

  protected onClose(event: CngxTabCloseEvent): void {
    this.drafts.update((list) => list.filter((d) => d.id !== event.id));
  }

  protected onAdd(): void {
    this.seq += 1;
    this.drafts.update((list) => [...list, { id: 'draft-' + this.seq, label: 'Draft ' + this.seq }]);
    this.active.set(this.drafts().length - 1);
  }`,
  template: `  <cngx-tab-group
    skin="contained"
    [closable]="true"
    [addable]="true"
    [(activeIndex)]="active"
    aria-label="Drafts"
    (tabClose)="onClose($event)"
    (tabAdd)="onAdd()"
  >
    @if (customSlots()) {
      <ng-template cngxTabCloseIcon let-tab="tab">
        @if (unsaved.has(tab.id)) {
          <span aria-hidden="true" class="demo-tab-glyph demo-tab-glyph--unsaved"></span>
        } @else {
          <span aria-hidden="true" class="demo-tab-glyph">✕</span>
        }
      </ng-template>
      <ng-template cngxTabAddIcon>
        <span aria-hidden="true" class="demo-tab-glyph demo-tab-glyph--add">+ New</span>
      </ng-template>
    }
    @for (draft of drafts(); track draft.id) {
      <div cngxTab [id]="draft.id" [label]="draft.label">
        <ng-template cngxTabContent>
          <p>{{ draft.label }}{{ unsaved.has(draft.id) ? ' has unsaved changes.' : ' is saved.' }}</p>
        </ng-template>
      </div>
    }
  </cngx-tab-group>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input
        type="checkbox"
        [checked]="customSlots()"
        (change)="customSlots.set($any($event.target).checked)"
      />
      Use custom slot templates
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row"><span class="event-label">Open drafts</span><span class="event-value">{{ drafts().length }}</span></div>
  </div>`,
};
