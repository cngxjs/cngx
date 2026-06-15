import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';

import { CngxTab, CngxTabContent } from '@cngx/common/tabs';
import { CngxTabGroup, CngxTabOverflow } from '@cngx/ui/tabs';

/**
 * `CngxTabOverflow` under a live width constraint, Material-themed.
 *
 * Drag the frame's resize handle (bottom-right corner): an
 * `IntersectionObserver` rooted on the tab strip re-derives the hidden set
 * as the width crosses each tab's threshold, and the clipped tabs collapse
 * into the "More" popover - itself painted as a Material `mat-menu` by the
 * `@cngx/themes/material/tabs-theme` bridge. Picking a hidden tab delegates
 * back to the panel host, so keyboard and pointer paths converge. The whole
 * thing is the runnable counterpart to the static overflow stories - the
 * resize gesture is the point.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTabGroup, CngxTabOverflow, CngxTab, CngxTabContent],
  styleUrl: './overflow-resize.component.scss',
  template: `
    <p class="hint">
      Drag the bottom-right handle to resize. Tabs that no longer fit collapse
      into the "More" menu.
    </p>
    <div class="frame">
      <cngx-tab-group [(activeIndex)]="active" aria-label="Workspace sections">
        @for (tab of tabs; track tab) {
          <div cngxTab [label]="tab">
            <ng-template cngxTabContent><p>{{ tab }} content.</p></ng-template>
          </div>
        }
        <cngx-tab-overflow></cngx-tab-overflow>
      </cngx-tab-group>
    </div>
  `,
})
export class OverflowResizeExample {
  protected readonly active = signal(0);
  protected readonly tabs = [
    'Profile',
    'Account',
    'Notifications',
    'Privacy',
    'Sessions',
    'Tokens',
    'Billing',
    'Danger zone',
  ];

  constructor() {
    const doc = inject(DOCUMENT);
    doc.body.classList.add('mat-typography', 'mat-app-background');
    // The StackBlitz scaffold only wires the Roboto <link> when Material
    // auto-detect fires (a <mat-*> selector), which a cngx-only template never
    // triggers - so load it at runtime. A <link> is robust where a CSS @import
    // in a component stylesheet can land below other rules and be ignored.
    const font = doc.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap';
    doc.head.appendChild(font);
  }
}
