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
  if (mode === null) {
    delete el.dataset['colorScheme'];
  } else el.dataset['colorScheme'] = mode;
}

function readPersistedColorScheme(): ColorScheme {
  try {
    const v = localStorage.getItem(COMPODOCX_DARK_KEY) ?? localStorage.getItem(COMPODOC_DARK_KEY);
    if (v === 'true') {
      return 'dark';
    }
    if (v === 'false') {
      return 'light';
    }
  } catch {
    // localStorage may be unavailable in restrictive contexts; treat as no preference.
  }
  return null;
}

// Resolve the effective scheme: a persisted preference always wins;
// when nothing is persisted, fall back to the OS preference. This
// mirrors compodocx's inline init script so the examples app picks up
// OS-dark even when running standalone without a user toggle.
function resolveEffectiveScheme(persisted: ColorScheme): 'dark' | 'light' {
  if (persisted !== null) {
    return persisted;
  }
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncFromState(): void {
  applyColorScheme(resolveEffectiveScheme(readPersistedColorScheme()));
}

syncFromState();

globalThis.addEventListener('storage', (event) => {
  if (event.key !== COMPODOCX_DARK_KEY && event.key !== COMPODOC_DARK_KEY) {
    return;
  }
  syncFromState();
});

// OS-preference change: only re-sync when no persisted preference is
// in play (otherwise the user-pinned value still wins).
globalThis.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (readPersistedColorScheme() === null) {
    syncFromState();
  }
});

// Density coordination.
//
// The cngx foundation re-scales its spacing T-shirt scale whenever
// `<html data-density>` is set to `compact` or `spacious` (`comfortable`
// is the base rung, so it needs no attribute). We persist an explicit
// preference to `localStorage['cngx_density']` and reflect it onto the
// document element, mirroring the color-scheme coordination above. There
// is no OS-level density signal, so a cleared key just means the
// comfortable base. Compodocx has no density control, so no parent sync
// is needed; the `storage` listener only keeps multiple tabs aligned.
const CNGX_DENSITY_KEY = 'cngx_density';

type DensityPref = 'compact' | 'spacious' | null;

function applyDensity(pref: DensityPref): void {
  const el = document.documentElement;
  if (pref === null) {
    delete el.dataset['density'];
  } else el.dataset['density'] = pref;
}

function readPersistedDensity(): DensityPref {
  try {
    const v = localStorage.getItem(CNGX_DENSITY_KEY);
    if (v === 'compact' || v === 'spacious') {
      return v;
    }
  } catch {
    // localStorage may be unavailable in restrictive contexts; treat as comfortable.
  }
  return null;
}

function syncDensityFromState(): void {
  applyDensity(readPersistedDensity());
}

syncDensityFromState();

globalThis.addEventListener('storage', (event) => {
  if (event.key !== CNGX_DENSITY_KEY) {
    return;
  }
  syncDensityFromState();
});

// Floating dark-mode debug toggle. Bottom-right of the viewport,
// cycles auto → dark → light → auto by writing the same localStorage
// key compodocx uses. Useful when running the examples app standalone
// (no compodocx parent toggle available) or when you need to flip
// modes mid-debug without rummaging through the application tab.
function installColorSchemeToggle(): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'cngx-ex-color-scheme-toggle';
  btn.setAttribute('aria-label', 'Cycle color scheme: auto / dark / light');
  document.body.appendChild(btn);

  function setPersistedColorScheme(mode: ColorScheme): void {
    try {
      if (mode === null) {
        localStorage.removeItem(COMPODOCX_DARK_KEY);
        localStorage.removeItem(COMPODOC_DARK_KEY);
      } else {
        localStorage.setItem(COMPODOCX_DARK_KEY, mode === 'dark' ? 'true' : 'false');
      }
    } catch {
      // localStorage may be unavailable; the toggle still updates the DOM.
    }
  }

  function render(): void {
    const mode = readPersistedColorScheme();
    // Apache-style bracket marker: matches the `[ICO]` / `[+]` / `[-]`
    // / `[ ]` aesthetic of the home directory listing.
    btn.textContent = mode === 'dark' ? '[D]' : mode === 'light' ? '[L]' : '[A]';
    btn.title = `Color scheme: ${mode ?? 'auto (OS preference)'} — click to cycle`;
  }

  btn.addEventListener('click', () => {
    const current = readPersistedColorScheme();
    // auto (null) → dark → light → auto
    const next: ColorScheme = current === null ? 'dark' : current === 'dark' ? 'light' : null;
    setPersistedColorScheme(next);
    // Auto means "follow OS"; delegate to syncFromState so the resolved
    // value (dark or light) is what actually paints. Explicit dark / light
    // bypass the OS query.
    if (next === null) {
      syncFromState();
    } else {
      applyColorScheme(next);
    }
    render();
  });

  render();
}

// Floating density debug toggle. Sits just above the color-scheme toggle
// (bottom-right), cycles comfortable → compact → spacious → comfortable by
// writing the `cngx_density` localStorage key. Standalone-only, same
// rationale as the color-scheme toggle: inside the compodocx iframe it
// would overlap demo content, and compodocx exposes no density control.
function installDensityToggle(): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'cngx-ex-density-toggle';
  btn.setAttribute('aria-label', 'Cycle density: comfortable / compact / spacious');
  document.body.appendChild(btn);

  function setPersistedDensity(pref: DensityPref): void {
    try {
      if (pref === null) {
        localStorage.removeItem(CNGX_DENSITY_KEY);
      } else {
        localStorage.setItem(CNGX_DENSITY_KEY, pref);
      }
    } catch {
      // localStorage may be unavailable; the toggle still updates the DOM.
    }
  }

  function render(): void {
    const pref = readPersistedDensity();
    // Apache-style bracket marker, matching the color-scheme toggle:
    // [-] tighter (compact), [+] looser (spacious), [=] the comfortable base.
    btn.textContent = pref === 'compact' ? '[-]' : pref === 'spacious' ? '[+]' : '[=]';
    btn.title = `Density: ${pref ?? 'comfortable (base)'} — click to cycle`;
  }

  btn.addEventListener('click', () => {
    const current = readPersistedDensity();
    // comfortable (null) → compact → spacious → comfortable
    const next: DensityPref =
      current === null ? 'compact' : current === 'compact' ? 'spacious' : null;
    setPersistedDensity(next);
    applyDensity(next);
    render();
  });

  render();
}

// Only install the floating toggles when the examples app runs standalone.
// Inside the compodocx iframe the parent already exposes its own dark-mode
// toggle, and the floating buttons would overlap demo content.
function isEmbeddedInIframe(): boolean {
  try {
    return globalThis.self !== globalThis.top;
  } catch {
    // Cross-origin access throws; cross-origin embedding implies an iframe.
    return true;
  }
}

bootstrapApplication(App, appConfig)
  .then(() => {
    if (!isEmbeddedInIframe()) {
      installColorSchemeToggle();
      installDensityToggle();
    }
  })
  .catch((err) => console.error(err));
