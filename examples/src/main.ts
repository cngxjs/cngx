import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Dark-mode coordination.
//
// All CSS keys off `html.dark` (compodocx's class-based convention). The
// trigger depends on where we're running:
//
// - Inside the compodocx iframe (window.parent !== window): the parent doc
//   owns the theme. It either toggles our `<html class="dark">` directly
//   (same-origin) or posts `{ type: 'cdx-iframe-theme', dark: boolean }`
//   for the cross-origin case. We listen for the postMessage but
//   intentionally do NOT respect `prefers-color-scheme` — that would
//   desync the iframe whenever the user manually flipped the parent doc
//   while the OS disagreed.
//
// - Standalone (top window): no parent to coordinate with, so we fall
//   back to the OS preference and react to live changes.
const isStandalone = window.parent === window;

function applyDark(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
  document.body?.classList.toggle('dark', dark);
}

if (isStandalone) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  applyDark(mql.matches);
  mql.addEventListener('change', (e) => applyDark(e.matches));
}

window.addEventListener('message', (event: MessageEvent) => {
  const data = event.data as { type?: string; dark?: boolean } | null;
  if (data?.type !== 'cdx-iframe-theme') return;
  applyDark(!!data.dark);
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
