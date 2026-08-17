# @cngx/eslint-plugin

ESLint rules that encode the cngx signal and effect idioms, plus the cngx wiring
contracts, as deterministic per-file lint rules for consumer Angular apps. No
LLM, no runtime dependency on `@cngx/*` - static analysis only.

## Install

```bash
npm i -D @cngx/eslint-plugin
```

Requires ESLint 9+ (flat config).

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

`configs.recommended` enables the error-level rules. `configs.all` additionally
enables the advisory `untracked-in-effect` rule at `warn`.

## Metadata seam

Every rule's id, message catalogue, category and recommended severity live in a
dependency-free module, importable without the ESLint runtime:

```js
const { RULE_METADATA } = require('@cngx/eslint-plugin/metadata');
```

## Status

Initial scaffold. Rules land incrementally; the changelog tracks the current
rule set.
