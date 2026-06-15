import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { CngxTab, CngxTabContent, type CngxTabsCommitAction } from '@cngx/common/tabs';
import { CngxTabGroup } from '@cngx/ui/tabs';

/**
 * Tabs as an async navigation guard - `[commitAction]` gates each switch.
 *
 * The action returns an `Observable<boolean>` that resolves after a delay.
 * **Optimistic** flips the panel immediately and rolls back if the action
 * rejects; **pessimistic** blocks the switch until it resolves. Toggle the
 * mode and "simulate error" to exercise all four quadrants:
 *
 * - while a commit is pending the target tab shows the busy spinner
 *   (`aria-busy`),
 * - a rejection lights the rejection decoration and announces the rollback,
 * - optimistic rolls the active tab back; pessimistic never moved it.
 *
 * No explicit state machine and no `[state]` binding - the presenter's commit
 * lifecycle drives every visual. Themed via the Material tabs-theme bridge.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTabGroup, CngxTab, CngxTabContent],
  styleUrl: './async-commit.component.scss',
  template: `
    <div class="controls">
      <div class="seg" role="group" aria-label="Commit mode">
        <button type="button" [class.seg--on]="mode() === 'optimistic'" (click)="mode.set('optimistic')">
          optimistic
        </button>
        <button type="button" [class.seg--on]="mode() === 'pessimistic'" (click)="mode.set('pessimistic')">
          pessimistic
        </button>
      </div>
      <label class="flag">
        <input type="checkbox" [checked]="shouldFail()" (change)="shouldFail.set($any($event.target).checked)" />
        simulate error
      </label>
    </div>

    <cngx-tab-group
      [(activeIndex)]="active"
      [commitAction]="commitAction"
      [commitMode]="mode()"
      aria-label="Async tab navigation"
    >
      <div cngxTab [label]="'Profile'">
        <ng-template cngxTabContent><p>Profile content.</p></ng-template>
      </div>
      <div cngxTab [label]="'Account'">
        <ng-template cngxTabContent><p>Account content.</p></ng-template>
      </div>
      <div cngxTab [label]="'Notifications'">
        <ng-template cngxTabContent><p>Notification preferences.</p></ng-template>
      </div>
    </cngx-tab-group>

    <p class="status">Active tab: {{ active() }} - mode: {{ mode() }}</p>
  `,
})
export class AsyncCommitExample {
  protected readonly active = signal(0);
  protected readonly mode = signal<'optimistic' | 'pessimistic'>('optimistic');
  protected readonly shouldFail = signal(false);

  /** Resolves `true` after 600ms, or errors when "simulate error" is on. */
  protected readonly commitAction: CngxTabsCommitAction = (from, to) =>
    new Observable<boolean>((subscriber) => {
      const fail = this.shouldFail();
      const handle = setTimeout(() => {
        if (fail) {
          subscriber.error(new Error('Server refused tab ' + from + ' -> ' + to));
        } else {
          subscriber.next(true);
          subscriber.complete();
        }
      }, 600);
      return () => clearTimeout(handle);
    });

  constructor() {
    inject(DOCUMENT).body.classList.add('mat-typography', 'mat-app-background');
  }
}
