import { ChangeDetectionStrategy, Component, Injectable, signal } from '@angular/core';
import { type CanDeactivateFn, type Routes } from '@angular/router';

/**
 * Shared dirty-state for the native router-nav demo. The profile page
 * writes it, the host reads it to light the link's `[error]` marker, and
 * the `CanDeactivate` guard reads it to block the leave. One signal,
 * three consumers - Ableitung statt Verwaltung.
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
      Each <code>&lt;a cngxTabLink&gt;</code> is a real
      <code>routerLink</code>. The router runs <code>CanDeactivate</code>
      natively, so middle-click, open-in-new-tab, and the hover URL all
      work; cngx layers the active marker and error glyph on top.
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
      While this is checked, the link's <code>aria-invalid</code> + error
      glyph light up and the native <code>CanDeactivate</code> guard
      refuses to leave - the active link stays on Profile.
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
    <p>Nothing to guard here - this link leaves freely.</p>
  `,
})
export class SettingsPage {}

/** Reads the leaving component's own gate. */
export const blockWhenUnsaved: CanDeactivateFn<ProfilePage> = (page) => page.canDeactivate();

/** Link id === route segment, so route-sync's default `(h) => [h.id]` works. */
export const ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: OverviewPage },
  { path: 'profile', component: ProfilePage, canDeactivate: [blockWhenUnsaved] },
  { path: 'settings', component: SettingsPage },
];
