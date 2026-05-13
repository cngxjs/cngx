import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

import { CngxMatTabs } from '@cngx/ui/mat-tabs';

/**
 * Smart overflow under viewport constraint.
 *
 * Adds `cngxMatTabs` to a vanilla `<mat-tab-group>`. The directive
 * programmatically mounts a `<cngx-tab-overflow>` "More" button as a
 * flex sibling of `.mat-mdc-tab-label-container` inside `.mat-mdc-tab-header`.
 * An `IntersectionObserver` rooted on the tab strip re-derives the hidden
 * set whenever the container width changes. Clicking the More button opens
 * a popover with all clipped tabs; selecting one routes through
 * `presenter.selectById(...)` so the cngx commit-action lifecycle stays
 * coherent. Resize the preview pane to watch the button engage and
 * disengage as the strip width crosses the overflow threshold.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, CngxMatTabs],
  template: `
    <p style="margin: 0 0 12px; opacity: 0.8; font-size: 0.875rem">
      Ten tabs inside a 520px container. <code>cngxMatTabs</code> auto-mounts
      a "More" popover for the clipped tabs. Resize the preview to see the
      threshold flip.
    </p>
    <div style="max-width: 520px; border: 1px dashed #ccc; padding: 8px">
      <mat-tab-group
        cngxMatTabs
        [(activeIndex)]="active"
        aria-label="Overflow showcase"
      >
        <mat-tab label="Profile">Profile</mat-tab>
        <mat-tab label="Account">Account</mat-tab>
        <mat-tab label="Notifications">Notifications</mat-tab>
        <mat-tab label="Privacy">Privacy</mat-tab>
        <mat-tab label="Billing">Billing</mat-tab>
        <mat-tab label="Connections">Connections</mat-tab>
        <mat-tab label="Devices">Devices</mat-tab>
        <mat-tab label="Sessions">Sessions</mat-tab>
        <mat-tab label="Audit">Audit</mat-tab>
        <mat-tab label="Advanced">Advanced</mat-tab>
      </mat-tab-group>
    </div>
    <p style="margin-top: 12px">Active: {{ active() }}</p>
  `,
})
export class OverflowShowcaseExample {
  protected readonly active = signal(0);
}
