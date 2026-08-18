---
description: Scan this app's cngx footprint and persist a .cngx/profile.json that the cngx plugin's session hook reads.
argument-hint: "[--force]"
---

# cngx-init

Create or refresh `.cngx/profile.json` in this app's root. The cngx plugin's
SessionStart hook already reads the installed `@cngx/*` versions every session;
this profile persists the two things the hook cannot infer from `package.json`
alone, so the grounding is richer.

## Steps

1. Read this app's `package.json` and collect every `@cngx/*` dependency it
   actually imports.
2. Look for the stylesheet that defines the app's `--cngx-*` custom properties
   (the brand-token entry point, e.g. a `styles.scss` `@use` target or a global
   CSS file). If there is no single obvious source, leave it out.
3. Write `.cngx/profile.json` with exactly this shape:

```json
{
  "libs": ["@cngx/forms", "@cngx/ui"],
  "brandTokens": "src/styles/brand-tokens.css"
}
```

- `libs`: the `@cngx/*` packages this app uses, as an array of strings.
- `brandTokens`: optional path (relative to the app root) to the stylesheet that
  sets the app's `--cngx-*` tokens. Omit the field when there is no single
  source.

## Rules

- Do not overwrite an existing `.cngx/profile.json` unless the user passed
  `--force`; otherwise report the current contents and stop.
- Write only `.cngx/profile.json`. Touch no other file.
- Base every value on this app's own `package.json` and stylesheets. Never guess
  a version or a path.
