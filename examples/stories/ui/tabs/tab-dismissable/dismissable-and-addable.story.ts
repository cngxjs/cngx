import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: dismissable + addable tabs',
  subtitle:
    'Set <code>closable</code> for a close button on each tab (Delete on a focused tab also closes it) and <code>addable</code> for an add-tab button. The library moves the active tab to a surviving neighbour and restores focus; the consumer owns the data - <code>(tabClose)</code> removes, <code>(tabAdd)</code> appends. The pinned <strong>Home</strong> tab sets <code>[closable]="false"</code> so it never shows a close button.',
  description:
    'Dismissable/addable tabs (APG deletable-tabs pattern). Tabs are derived from a <code>signal</code> array (Ableitung statt Verwaltung): closing emits <code>(tabClose)="{ id, index }"</code> and the consumer filters its list; adding emits <code>(tabAdd)</code> and the consumer appends. The presenter pre-moves <code>activeIndex</code> onto the neighbour so the right tab stays active after removal, and focus lands on the new active tab (or the add button when the strip empties). The close button carries an i18n <code>aria-label</code> and is out of the tab order; Delete is advertised via <code>aria-keyshortcuts</code>.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  moduleImports: [
    "import { CngxTab, CngxTabContent, type CngxTabCloseEvent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['CngxTabGroup', 'CngxTab', 'CngxTabContent'],
  setup: `protected readonly active = signal(0);
  protected readonly docs = signal([
    { id: 'doc-1', label: 'Document 1' },
    { id: 'doc-2', label: 'Document 2' },
  ]);
  private seq = 2;

  protected onClose(event: CngxTabCloseEvent): void {
    this.docs.update((list) => list.filter((d) => d.id !== event.id));
  }

  protected onAdd(): void {
    this.seq += 1;
    const id = 'doc-' + this.seq;
    this.docs.update((list) => [...list, { id, label: 'Document ' + this.seq }]);
    // Home sits at index 0; the new document is the last tab.
    this.active.set(this.docs().length);
  }`,
  template: `  <cngx-tab-group
    skin="contained"
    [closable]="true"
    [addable]="true"
    [(activeIndex)]="active"
    aria-label="Open documents"
    (tabClose)="onClose($event)"
    (tabAdd)="onAdd()"
  >
    <div cngxTab [label]="'Home'" [closable]="false">
      <ng-template cngxTabContent><p>Pinned home tab - no close button.</p></ng-template>
    </div>
    @for (doc of docs(); track doc.id) {
      <div cngxTab [id]="doc.id" [label]="doc.label">
        <ng-template cngxTabContent><p>{{ doc.label }} content.</p></ng-template>
      </div>
    }
  </cngx-tab-group>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px;gap:8px">
    <div class="event-row"><span class="event-label">Open documents</span><span class="event-value">{{ docs().length }}</span></div>
  </div>`,
};
