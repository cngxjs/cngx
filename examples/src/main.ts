import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Listen for compodocx's iframe-theme broadcasts so the embedded examples
// stay in sync with the parent doc's manual toggle. compodocx sends:
//   postMessage({ type: 'cdx-iframe-theme', dark: boolean }, '*')
// when same-origin it ALSO toggles `<html class="dark">` directly, but the
// listener covers the cross-origin case.
window.addEventListener('message', (event: MessageEvent) => {
  const data = event.data as { type?: string; dark?: boolean } | null;
  if (data?.type !== 'cdx-iframe-theme') return;
  document.documentElement.classList.toggle('dark', !!data.dark);
  document.body?.classList.toggle('dark', !!data.dark);
});

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
