import { ChangeDetectionStrategy, Component, Injectable, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { type CanDeactivateFn, type Routes } from '@angular/router';

/**
 * Shared dirty-state for the native router-nav demo. The profile page
 * writes it; the host reads it to light the link's `[errorAggregator]`
 * badge, and the `CanDeactivate` guard reads it to block the leave.
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
        Each <code>&lt;a mat-tab-link&gt;</code> is a real
        <code>routerLink</code>. Material gates the leave natively through
        the link's <code>CanDeactivate</code> guard; cngx layers the error
        and announcement decorations on top.
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
          While this is checked, the link's <code>[error]</code> badge
          lights up and the native <code>CanDeactivate</code> guard refuses
          to leave - the active link stays put.
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
        Nothing to guard here - this link leaves freely.
      </mat-card-content>
    </mat-card>
  `,
})
export class SettingsPage {}

/** Reads the leaving component's own gate. */
export const blockWhenUnsaved: CanDeactivateFn<ProfilePage> = (page) =>
  page.canDeactivate();

/** Link id === route segment, so route-sync's default `(h) => [h.id]` works. */
export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: OverviewPage },
  { path: 'profile', component: ProfilePage, canDeactivate: [blockWhenUnsaved] },
  { path: 'settings', component: SettingsPage },
];
