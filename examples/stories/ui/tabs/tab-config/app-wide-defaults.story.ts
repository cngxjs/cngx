import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTabGroup: App-wide defaults',
  subtitle:
    "One <code>provideCngxTabsAt(...)</code> moves six tab-group defaults at once: <code>withTabsSkin('contained')</code>, <code>withTabsClosable(true)</code>, <code>withTabsAddable(true)</code>, <code>withTabsIconLayout('top')</code>, <code>withTabsRovingLoop(false)</code> and <code>withTabsPanelMode('lazy-destroy')</code>. Both groups below share the same markup; only the second one sits under the scoped config.",
  description:
    "The first group reads the library defaults: the line skin, icons before the label, no close or add buttons, arrow keys that wrap from the last tab to the first, and eager panels that keep their content. The second group paints the contained skin, stacks each icon above its label, renders a close button per tab plus an add-tab button, stops at either end of the strip, and destroys a panel's content when you leave it. To see the last two, focus a tab and press Arrow Right past the end, or type into a note, switch tabs and come back. A <code>provideCngxTabsAt</code> call in <code>viewProviders</code> would scope every group in this view, so the demo builds the scope with <code>Injector.create</code> and hands it to <code>ngTemplateOutlet</code>. The consumer still owns the data: <code>(tabClose)</code> removes a tab, <code>(tabAdd)</code> appends one.",
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants', 'behavior'],
  references: [
    { label: 'WAI-ARIA APG - Tabs', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
  ],
  apiComponents: ['CngxTabGroup', 'CngxTab', 'CngxTabIcon'],
  moduleImports: [
    "import { NgTemplateOutlet } from '@angular/common';",
    "import { CngxTab, CngxTabContent, CngxTabIcon, provideCngxTabsAt, withTabsAddable, withTabsClosable, withTabsIconLayout, withTabsPanelMode, withTabsRovingLoop, withTabsSkin, type CngxTabCloseEvent } from '@cngx/common/tabs';",
    "import { CngxTabGroup } from '@cngx/ui/tabs';",
  ],
  imports: ['NgTemplateOutlet', 'CngxTabGroup', 'CngxTab', 'CngxTabContent', 'CngxTabIcon'],
  setup: `private readonly injector = inject(Injector);

  protected readonly tabsScope = Injector.create({
    parent: this.injector,
    providers: provideCngxTabsAt(
      withTabsSkin('contained'),
      withTabsClosable(true),
      withTabsAddable(true),
      withTabsIconLayout('top'),
      withTabsRovingLoop(false),
      withTabsPanelMode('lazy-destroy'),
    ),
  });

  protected readonly names = ['Notes with library defaults', 'Notes with scoped config'];
  protected readonly active = [signal(0), signal(0)];
  protected readonly notes = [
    signal([
      { id: 'a-1', label: 'Inbox' },
      { id: 'a-2', label: 'Drafts' },
      { id: 'a-3', label: 'Ideas' },
    ]),
    signal([
      { id: 'b-1', label: 'Inbox' },
      { id: 'b-2', label: 'Drafts' },
      { id: 'b-3', label: 'Ideas' },
    ]),
  ];
  private seq = 3;

  protected onClose(side: number, event: CngxTabCloseEvent): void {
    this.notes[side].update((list) => list.filter((n) => n.id !== event.id));
  }

  protected onAdd(side: number): void {
    this.seq += 1;
    this.notes[side].update((list) => [...list, { id: side + '-' + this.seq, label: 'Note ' + this.seq }]);
    this.active[side].set(this.notes[side]().length - 1);
  }`,
  template: `  <ng-template #notebook let-side>
    <cngx-tab-group
      [aria-label]="names[side]"
      [activeIndex]="active[side]()"
      (activeIndexChange)="active[side].set($event)"
      (tabClose)="onClose(side, $event)"
      (tabAdd)="onAdd(side)"
    >
      <ng-template cngxTabIcon let-active="active">
        <svg viewBox="0 0 16 16" width="18" height="18" [attr.fill]="active ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="2" width="10" height="12" rx="1.5" />
        </svg>
      </ng-template>
      @for (note of notes[side](); track note.id) {
        <div cngxTab [id]="note.id" [label]="note.label">
          <ng-template cngxTabContent>
            <label class="demo-config-compare-field">
              {{ note.label }} note
              <input type="text" placeholder="Type, switch tabs, come back" />
            </label>
          </ng-template>
        </div>
      }
    </cngx-tab-group>
  </ng-template>

  <div class="demo-config-compare">
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Library defaults</h3>
      <ng-container *ngTemplateOutlet="notebook; context: { $implicit: 0 }" />
    </div>
    <div class="demo-config-compare-pane">
      <h3 class="demo-config-compare-heading">Scoped config</h3>
      <ng-container *ngTemplateOutlet="notebook; context: { $implicit: 1 }; injector: tabsScope" />
    </div>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Defaults: active tab</span><span class="event-value">index {{ active[0]() }}, {{ notes[0]().length }} tabs</span></div>
    <div class="event-row"><span class="event-label">Scoped: active tab</span><span class="event-value">index {{ active[1]() }}, {{ notes[1]().length }} tabs</span></div>
  </div>`,
};
