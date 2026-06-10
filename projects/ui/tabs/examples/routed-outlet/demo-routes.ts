import { ChangeDetectionStrategy, Component, Injectable, signal } from '@angular/core';
import { type CanDeactivateFn, type Routes } from '@angular/router';

/**
 * Shared dirty-state for the routed demo. The profile page writes it,
 * the host reads it to light the tab's `[error]` marker, and the
 * `CanDeactivate` guard reads it to block the leave. One signal, three
 * consumers - Ableitung statt Verwaltung.
 */
@Injectable({ providedIn: 'root' })
export class DemoFormState {
  readonly unsaved = signal(false);
}

@Component({
  selector: 'demo-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 style="margin-top: 0">Overview</h2>
    <p>
      Each tab is an Angular child route rendered into the
      <code>&lt;router-outlet&gt;</code>. Switching tabs navigates; the
      profile route guards its own exit.
    </p>
  `,
})
export class OverviewPage {}

@Component({
  selector: 'demo-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 style="margin-top: 0">Profile</h2>
    <label style="display: flex; gap: 8px; align-items: center">
      <input
        type="checkbox"
        [checked]="state.unsaved()"
        (change)="state.unsaved.set($any($event.target).checked)"
      />
      I have unsaved changes
    </label>
    <p style="opacity: 0.75; margin-bottom: 0">
      While this is checked, the <code>CanDeactivate</code> guard refuses
      to leave - the tab switch is cancelled, the active tab stays, and
      the rejection decoration fires.
    </p>
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
  template: `
    <h2 style="margin-top: 0">Settings</h2>
    <p>Nothing to guard here - this tab leaves freely.</p>
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
