---
name: cngx-theme
description: How to theme a consumer app that uses cngx - import the theme so directive styling actually renders, and set brand colours and sizes by overriding the --cngx-* custom properties rather than hard-coding values a token already owns. Use when theming a cngx app, setting brand colours, or when a cngx directive renders unstyled.
---

# Theming a cngx consumer app

cngx ships its own theme. Your job as a consumer is to load it and set your brand
on top of it - not to author tokens, and not to hard-code a colour or size that a
component already exposes as a `--cngx-*` custom property. This skill is that
procedure. It names no individual token on purpose: the full list drifts, so you
read it from the token reference this plugin ships.

## 1. Load the theme

Import the single bundle once, at your app's global style entry:

```css
@import '@cngx/themes/cngx.css';
```

That pulls in the whole cascade-layer setup - the design tokens, the reset, and
the per-component styling - in one line. If you need finer control over what
loads, the bundle can be assembled by hand from its parts (the core theming layers
plus the `@cngx/<lib>/theming/components/*.css` partials for the directives you
actually use); reach for that only when the single import is too coarse.

## 2. Know which styling needs the import

There are two kinds of cngx styling, and only one is automatic:

- **Component CSS (Track A)** ships with the component and loads through its own
  `styleUrl`. It renders whether or not you import the bundle.
- **Directive CSS (Track B)** lives in the theme stylesheet, not on a component.
  A cngx *directive* renders unstyled until the bundle (or its matching
  `@cngx/<lib>/theming/components/*.css` partial) is imported.

That gap is exactly what the doctor's `track-b-css-not-imported` finding reports.
When a cngx directive looks unstyled, this is almost always why - import the
bundle. See `cngx-doctor` for acting on that finding.

## 3. Set your brand by overriding tokens

cngx exposes its colours, spacing, radii, and typography as `--cngx-*` custom
properties, each with a sensible default. Theme by overriding the ones you care
about in your own stylesheet, scoped to `:root` or a subtree:

```css
:root {
  /* override the brand-relevant --cngx-* properties here */
}
```

Do not hard-code a colour, size, or radius that a component already reads from a
token: override the token and every component that consumes it follows. For the
component you are theming, query `get_theme_tokens` - it returns that component's
`--cngx-*` properties, defaults, and theme overview from the live snapshot, and
it takes an optional `version` to ground against the release your app actually
runs. For a config-level theming hook (`provide*`/`with*`), `get_config` names
it. The full cross-component list ships as `pack/theming-tokens.md` - the offline
browse view when you need everything at once. This skill deliberately lists no
token; the tools are the source of record.

## Never guess a token

Do not invent a `--cngx-*` name from memory - confirm it with `get_theme_tokens`
for the component at hand, or against `pack/theming-tokens.md` / the published
docs (`https://cngxjs.github.io/cngx/llms.txt` index, `llms-full.txt` full text)
when you are browsing wider. A guessed token name silently does nothing. For
composing the components you are theming, hand off to `cngx-wire`; this skill is
the theme layer, not the composition.
