# @cngx/doctor

A deterministic project-wiring scanner for apps that consume `@cngx/*`. It
catches the mistakes ESLint's per-file scope cannot see - the ones that need a
whole-project view - and exits non-zero when an error-severity finding trips, so
a consumer CI job can gate on it directly.

## Usage

```
npx @cngx/doctor [projectDir] [--json]
```

`projectDir` defaults to the current directory. Default output is human-readable;
`--json` emits the machine contract. The exit code follows lint semantics: `0`
when clean or when only warn-severity findings exist (they are still reported in
the output), non-zero when any error-severity finding exists - wire it straight
into a CI step:

```yaml
- run: npx @cngx/doctor
```

Each finding is an object:

```json
{
  "id": "toaster-without-withtoasts",
  "message": "why it is wrong",
  "fixHint": "how to fix it",
  "severity": "error",
  "file": "src/app.ts"
}
```

`file` is present only when the finding points at a specific source; `--json`
emits the array of these objects.

## Checks

- **`toaster-without-withtoasts`** - a `CngxToaster` / `CngxAlerter` / `CngxBanner`
  (or the `*On` bridges) is used but the matching
  `provideFeedback(withToasts()/withAlerts()/withBanners())` root opt-in is
  missing, so the feedback surface has no host to render into.
- **`track-b-css-not-imported`** - a cngx directive whose visual theming lives in
  the Track-B stylesheet is imported, but no app style entry imports
  `@cngx/themes/cngx.css`, so it renders unstyled.
- **`floating-fallback-missing`** - `@floating-ui/dom` is installed but
  `provideFloatingFallback()` is never called, so browsers without CSS Anchor
  Positioning get no positioning fallback.

## Charter

The doctor owns exactly one class of defect: **silent wiring failures**. A wiring
mistake it catches produces no throw and logs nothing - the app just renders
wrong or does nothing, with no signal to the developer. The doctor makes that
silence loud.

It deliberately does not cover throw-based errors. When a required provider is
genuinely missing at runtime, Angular's dependency injector already throws and
Angular's `ErrorHandler` already surfaces it; that path is loud on its own and is
out of scope here. The check set stays small and silent-wiring-only on purpose -
adding checks outside that charter is a separate decision, not a drop-in.
