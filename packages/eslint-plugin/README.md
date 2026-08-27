# @cngx/eslint-plugin

ESLint rules that encode the cngx signal and effect idioms, plus the cngx wiring
contracts, as deterministic per-file lint rules for consumer Angular apps. No
LLM, no runtime dependency on `@cngx/*` - static analysis only.

## Install

```bash
npm i -D @cngx/eslint-plugin
```

Requires ESLint 9+ (flat config). The template rule
(`menu-trigger-needs-popover-anchor`) additionally needs
`@angular-eslint/template-parser`, which every Angular project that lints
templates already has; it is declared as a peer dependency.

## Usage

CommonJS:

```js
// eslint.config.js
const cngx = require('@cngx/eslint-plugin');

module.exports = [...cngx.configs.recommended];
```

ESM:

```js
// eslint.config.mjs
import cngx from '@cngx/eslint-plugin';

export default [...cngx.configs.recommended];
```

`configs.recommended` contributes two config blocks: the TypeScript rules (they
apply wherever your own parser runs) and a `**/*.html` block that lints Angular
templates with `@angular-eslint/template-parser`. `configs.all` is the same, plus
the advisory `untracked-in-effect` rule at `warn`.

## Rules

|Rule|Flags|Category|`recommended`|`all`|
|-|-|-|-|-|
|`no-effect-in-ngoninit`|`effect()` called inside `ngOnInit` (throws NG0203)|signal-hygiene|error|error|
|`no-behaviorsubject-local-state`|`new BehaviorSubject()`/`new Subject()` field for local state on a `@Component`/`@Directive`|signal-hygiene|error|error|
|`model-for-two-way`|an `input(x)` + `output(xChange)` pair that should be a single `model()`|wiring|error|error|
|`no-required-on-bridge-input`|`input.required()` on a class injecting a named bridge fallback token (`CNGX_STATEFUL` by default; extend via the `tokens` option)|wiring|error|error|
|`menu-trigger-needs-popover-anchor`|an element with `cngxMenuTrigger` but no `cngxPopoverTrigger` on the same element (template)|wiring|error|error|
|`untracked-in-effect`|a `this`-rooted call inside `effect()` not wrapped in `untracked()`|opt-in|off|warn|

`untracked-in-effect` is advisory: a signal read and a service call are
statically indistinguishable, so it ships in `all` at `warn` rather than
`recommended`. It skips the `CngxAsyncContainer` exception, a
`cngx-allow-effect-writes` marker, and single-level reads of declared signal
fields.

Enable a single rule directly:

```js
export default [
  {
    plugins: { cngx: require('@cngx/eslint-plugin') },
    rules: { 'cngx/no-effect-in-ngoninit': 'error' },
  },
];
```

## Metadata seam

Every rule's id, category, AST surface, message catalogue and recommended
severity live in a dependency-free module, importable without the ESLint
runtime:

```js
const { RULE_METADATA } = require('@cngx/eslint-plugin/metadata');
```
