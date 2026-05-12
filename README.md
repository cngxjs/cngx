# cngx

[![Docs](https://img.shields.io/badge/docs-reference-blue)](https://cngxjs.github.io/cngx/)
[![Demo](https://img.shields.io/badge/demo-showcase-orange)](https://cngxjs.github.io/cngx/demo/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

The composition layer between Angular CDK and Angular Material — declarative, Signal-first, communicative by construction.

> **Zustand wird abgeleitet, nicht verwaltet — und Kommunikation ist Architektur, kein Nachgedanke.**
>
> State is derived, not managed — and communication is architecture, not an afterthought.

Built on Angular 21, Signal-native, no NgModules. Each library publishes as ng-packagr with `sideEffects: false` and 39 surgical secondary entries.

## Libraries

cngx is a strict five-level hierarchy. Lower levels know nothing about higher levels; imports flow upward only.

| Package | Level | What it hosts |
|-|-|-|
| `@cngx/utils` | 0 | Framework-agnostic TypeScript. Array, tree, and version primitives. No Angular runtime dependency. |
| `@cngx/core` | 1 | Angular-aware primitives that do not render. DI tokens, async state machine, selection controller, transition tracker. |
| `@cngx/common` | 2 | Atoms and molecules. Single-responsibility directives — a11y, interactive, popover, layout, dialog, card, display, chart, tabs, stepper, data. Never imports `@angular/material`. |
| `@cngx/forms` | 3 | Forms organisms — the select family (eight specialised dropdowns), field bridges, validators, typed control inputs. |
| `@cngx/data-display` | 3 | Data-display organisms — CDK treetable and its Material twin. |
| `@cngx/ui` | 4 | Organisms that require Material — sidenav, overlay, feedback shell (toasts, banners, alerts), action button, skeleton, layout, material wrappers. |

Each package ships several secondary entries — import surgically:

```typescript
import { CngxListbox } from '@cngx/common/interactive';
import { CngxSelect }  from '@cngx/forms/select';
import { CngxSidenav } from '@cngx/ui/sidenav';
```

Full entry list and per-library READMEs under `projects/`.

## Documentation

- **API and concepts** — [https://cngxjs.github.io/cngx/](https://cngxjs.github.io/cngx/) (compodocx-generated, includes the Core Concepts sidebar).
- **Live demos** — [https://cngxjs.github.io/cngx/demo/](https://cngxjs.github.io/cngx/demo/).

Run locally:

```bash
npm start            # dev-app on http://localhost:4200
npm run docs:serve   # API reference on http://localhost:8080
```

## Installation

Install the packages you need; cngx libraries declare their cross-package dependencies as peers so they will pull each other transitively at the right versions:

```bash
npm install @cngx/ui @angular/material @angular/cdk
```

`@cngx/ui` peer-depends on the layers below it (`@cngx/common`, `@cngx/forms` or `@cngx/data-display` where applicable). Install only what your code actually imports — tree-shaking does the rest.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, the build pipeline, demo conventions, and the release workflow. Architectural and coding conventions live in [CODING_STANDARDS.md](./CODING_STANDARDS.md).

## License

MIT.
