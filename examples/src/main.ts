import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Dark-mode coordination.
//
// Compodocx persists its dark-mode toggle to
// `localStorage['compodocx_darkmode-state']` ('true'/'false'). Because the
// examples app and compodocx share the same origin, the iframe sees the
// same localStorage and `storage` events fire whenever the parent doc
// mutates the key.
//
// We expose the user's explicit preference to the cngx foundation via
// `<html data-color-scheme="dark|light">`. Absence of the attribute means
// "no explicit preference" — the foundation then follows the OS via its
// `@media (prefers-color-scheme: dark)` block, so no JS listener for the
// media query is needed here.
const COMPODOCX_DARK_KEY = 'compodocx_darkmode-state';
const COMPODOC_DARK_KEY = 'compodoc_darkmode-state';

type ColorScheme = 'dark' | 'light' | null;

function applyColorScheme(mode: ColorScheme): void {
  const el = document.documentElement;
  if (mode === null) el.removeAttribute('data-color-scheme');
  else el.setAttribute('data-color-scheme', mode);
}

function readPersistedColorScheme(): ColorScheme {
  try {
    const v =
      localStorage.getItem(COMPODOCX_DARK_KEY) ??
      localStorage.getItem(COMPODOC_DARK_KEY);
    if (v === 'true') return 'dark';
    if (v === 'false') return 'light';
  } catch {
    // localStorage may be unavailable in restrictive contexts; treat as no preference.
  }
  return null;
}

applyColorScheme(readPersistedColorScheme());

window.addEventListener('storage', (event) => {
  if (event.key !== COMPODOCX_DARK_KEY && event.key !== COMPODOC_DARK_KEY) return;
  applyColorScheme(readPersistedColorScheme());
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
