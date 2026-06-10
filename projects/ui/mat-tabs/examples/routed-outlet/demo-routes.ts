import { ChangeDetectionStrategy, Component, Injectable, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { type CanDeactivateFn, type Routes } from '@angular/router';

/**
 * Shared dirty-state for the routed Material demo. The profile page
 * writes it; the `CanDeactivate` guard reads it to block the leave. One
 * signal, no manual sync.
 */
@Injectable({ providedIn: 'root' })
export class DemoFormState {
  readonly unsaved = signal(false);
}

@Component({
  selector: 'demo-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        Each <code>&lt;mat-tab&gt;</code> is an Angular child route rendered
        into the <code>&lt;router-outlet&gt;</code>. The bridge gates the
        switch through the router; the profile route guards its exit.
      </mat-card-content>
    </mat-card>
  `,
})
export class OverviewPage {}

@Component({
  selector: 'demo-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatCheckboxModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        <mat-checkbox
          [checked]="state.unsaved()"
          (change)="state.unsaved.set($event.checked)"
        >
          I have unsaved changes
        </mat-checkbox>
        <p style="opacity: 0.75; margin-bottom: 0">
          While this is checked, the <code>CanDeactivate</code> guard
          refuses to leave - <code>selectedIndex</code> and the active tab
          both stay put, and the rejection decoration fires on the header.
        </p>
      </mat-card-content>
    </mat-card>
  `,
})
export class ProfilePage {
  constructor(readonly state: DemoFormState) {}

  /** Guard hook - block the leave while there are unsaved changes. */
  canDeactivate(): boolean {
    return !this.state.unsaved();
  }
}

@Component({
  selector: 'demo-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        Nothing to guard here - this tab leaves freely.
      </mat-card-content>
    </mat-card>
  `,
})
export class SettingsPage {}

/** Reads the leaving component's own gate. */
export const blockWhenUnsaved: CanDeactivateFn<ProfilePage> = (page) =>
  page.canDeactivate();

/** Tab id === route segment, so the default `(h) => [h.id]` mapping works. */
export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: OverviewPage },
  { path: 'profile', component: ProfilePage, canDeactivate: [blockWhenUnsaved] },
  { path: 'settings', component: SettingsPage },
];
