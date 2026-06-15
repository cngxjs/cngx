import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';

import { CngxTab, type CngxTabCloseEvent, CngxTabContent } from '@cngx/common/tabs';
import { CngxTabGroup } from '@cngx/ui/tabs';

/**
 * Dismissable + addable tabs (APG deletable-tabs pattern), Material-themed.
 *
 * `[closable]` adds a close button to each tab (Delete on a focused tab also
 * closes it); `[addable]` adds an add-tab button. The library moves the
 * active tab to a surviving neighbour and restores focus - the consumer owns
 * the data: `(tabClose)` removes from the signal array, `(tabAdd)` appends.
 * The pinned **Home** tab sets `[closable]="false"`, so it never shows a
 * close button. Tabs are derived from a `signal` array - Ableitung statt
 * Verwaltung.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTabGroup, CngxTab, CngxTabContent],
  styleUrl: './dynamic-tabs.component.scss',
  template: `
    <cngx-tab-group
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
    </cngx-tab-group>

    <p class="status">Open documents: {{ docs().length }}</p>
  `,
})
export class DynamicTabsExample {
  protected readonly active = signal(0);
  protected readonly docs = signal([
    { id: 'doc-1', label: 'Document 1' },
    { id: 'doc-2', label: 'Document 2' },
  ]);
  private seq = 2;

  protected onClose(event: CngxTabCloseEvent): void {
    this.docs.update((list) => list.filter((doc) => doc.id !== event.id));
  }

  protected onAdd(): void {
    this.seq += 1;
    const id = 'doc-' + this.seq;
    this.docs.update((list) => [...list, { id, label: 'Document ' + this.seq }]);
    // Home sits at index 0; the new document is the last tab.
    this.active.set(this.docs().length);
  }

  constructor() {
    const doc = inject(DOCUMENT);
    doc.body.classList.add('mat-typography', 'mat-app-background');
    // Roboto via a runtime <link> - the StackBlitz scaffold only wires the
    // font when Material auto-detect fires, which a cngx-only template never
    // triggers. A <link> beats a CSS @import that can land below other rules.
    const font = doc.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap';
    doc.head.appendChild(font);
  }
}
