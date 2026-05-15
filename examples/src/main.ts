import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Dark-mode coordination.
//
// Compodocx persists its dark-mode toggle to
// `localStorage['compodocx_darkmode-state']` ('true'/'false') and applies
// `<html class="dark">` on read. Because the examples app and compodocx
// share the same origin (cngxjs.github.io/cngx/{,examples}), both
// documents see the same localStorage, and `storage` events fire in
// the iframe whenever the parent doc mutates the key.
//
// Read the persisted state on boot, fall back to prefers-color-scheme
// when compodocx has never been toggled, and re-apply on:
// - `storage` event (user toggled compodocx in parent or another tab)
// - `prefers-color-scheme` change (only while no persisted state exists)
const COMPODOCX_DARK_KEY = 'compodocx_darkmode-state';
const COMPODOC_DARK_KEY = 'compodoc_darkmode-state';

function applyDark(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
  document.body?.classList.toggle('dark', dark);
}

function readPersistedDark(): boolean | null {
  try {
    const v =
      localStorage.getItem(COMPODOCX_DARK_KEY) ??
      localStorage.getItem(COMPODOC_DARK_KEY);
    if (v === 'true') return true;
    if (v === 'false') return false;
  } catch {
    // localStorage may be unavailable in restrictive contexts; treat as no preference.
  }
  return null;
}

function resolveDark(): boolean {
  const persisted = readPersistedDark();
  if (persisted !== null) return persisted;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

applyDark(resolveDark());

window.addEventListener('storage', (event) => {
  if (event.key !== COMPODOCX_DARK_KEY && event.key !== COMPODOC_DARK_KEY) return;
  applyDark(resolveDark());
});

const mql = window.matchMedia('(prefers-color-scheme: dark)');
mql.addEventListener('change', () => {
  // Only follow the OS when compodocx has not pinned an explicit preference.
  if (readPersistedDark() === null) applyDark(mql.matches);
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
