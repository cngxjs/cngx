# CNGX UI Component Libraries

[![Docs](https://img.shields.io/badge/docs-reference-blue)](https://cngxjs.github.io/cngx/)
[![Demo](https://img.shields.io/badge/demo-showcase-orange)](https://cngxjs.github.io/cngx/demo/)

A collection of Angular component libraries built with Angular CLI and ng-packagr.

## Project Structure

This workspace contains multiple independent Angular libraries:

- **@cngx/ui** - Core UI components
- **@cngx/data-display** - Data display components (tables, lists, etc.)
- **@cngx/forms** - Form components and utilities
- **@cngx/grid** - Grid and data grid components
- **@cngx/layout** - Layout components and utilities
- **demo** - Demo application showcasing all libraries

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
npm install
```

## Development

### Building Libraries

Build all libraries:

```bash
npm run build
```

Build individual libraries:

```bash
npm run build:ui
npm run build:data-display
npm run build:forms
npm run build:grid
npm run build:layout
```

### Running the Demo App

Start the development server:

```bash
npm start
```

The demo app will be available at `http://localhost:4200`

### Testing

Run tests with Vitest:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Linting

Lint all projects:

```bash
npm run lint
```

Lint specific project:

```bash
ng lint ui
ng lint demo
```

## Library Structure

Each library follows the standard Angular library structure:

```
projects/<library-name>/
├── src/
│   ├── index.ts          # Public API
│   └── lib/              # Library code
├── ng-package.json       # ng-packagr configuration
├── package.json          # Package metadata
└── tsconfig.lib.json     # TypeScript configuration
```

## Adding Secondary Entry Points

Each library can have its own secondary entry points. To add one:

1. Create a new directory in the library folder
2. Add `ng-package.json`, `package.json`, and `src/index.ts`
3. Update the main library's build configuration

## CI/CD

The project uses GitHub Actions for continuous integration. On each push or pull request, the workflow:

1. Installs dependencies
2. Runs linting
3. Builds all libraries
4. Builds the demo app
5. Runs tests

## Local Package Registry

For local testing, you can use Verdaccio:

```bash
npx verdaccio --config .verdaccio/config.yml
```

## Tech Stack

- **Angular** 20.3.0
- **TypeScript** 5.9.2
- **Testing**: Vitest with @analogjs/vitest-angular
- **Build**: ng-packagr
- **Linting**: ESLint with typescript-eslint and angular-eslint

## GitHub Labels

This project uses a structured labeling system for issues and pull requests. To set up the recommended labels:

### Category: Type of Change

| Label Name       | Color     | Description                                                                     |
| :--------------- | :-------- | :------------------------------------------------------------------------------ |
| `type: feature`  | `#007bff` | A new feature or a user-facing enhancement.                                     |
| `type: bug`      | `#d73a4a` | A bug fix that corrects incorrect behavior.                                     |
| `type: chore`    | `#cfd3d7` | Changes to the build process, tooling, or repository administration.            |
| `type: docs`     | `#6f42c1` | Changes to the documentation (website, READMEs, comments).                      |
| `type: refactor` | `#28a745` | A code change that neither fixes a bug nor adds a feature (e.g., code cleanup). |
| `type: revert`   | `#fbca04` | Reverts a previous change.                                                      |

### Category: Scope

| Label Name            | Color     | Description                                                   |
| :-------------------- | :-------- | :------------------------------------------------------------ |
| `scope: build`        | `#ffc107` | Affects the build system, CI/CD, or dependency management.    |
| `scope: ui`           | `#1d76db` | Changes affecting the `@cngx/ui` package.                     |
| `scope: data-display` | `#0e8a16` | Changes affecting the `@cngx/data-display` package.           |
| `scope: forms`        | `#d93f0b` | Changes affecting the `@cngx/forms` package.                  |
| `scope: grid`         | `#9c27b0` | Changes affecting the `@cngx/grid` package.                   |
| `scope: layout`       | `#ff9800` | Changes affecting the `@cngx/layout` package.                 |
| `scope: docs`         | `#5319e7` | Affects the documentation website or cross-cutting documents. |

### Category: Status

| Label Name             | Color     | Description                                                      |
| :--------------------- | :-------- | :--------------------------------------------------------------- |
| `status: in progress`  | `#f9d0c4` | Work is actively being done on this topic.                       |
| `status: needs review` | `#00e5ff` | Ready for review by the maintainers.                             |
| `status: blocked`      | `#000000` | Blocked by another issue, a question, or an external dependency. |

### Category: Miscellaneous

| Label Name         | Color     | Description                                                                              |
| :----------------- | :-------- | :--------------------------------------------------------------------------------------- |
| `good first issue` | `#7057ff` | A good issue for new contributors to get started with the project.                       |
| `help wanted`      | `#33aa3f` | The maintainers are asking the community for help with this topic.                       |
| `breaking change`  | `#b60205` | The change introduces a breaking change to the API and will require a new major version. |

To create these labels, go to your repository's **Issues → Labels** tab and add them manually.

## License

MIT
