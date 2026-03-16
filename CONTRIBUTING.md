# Contributing to CNGX

Thank you for your interest in contributing to the CNGX UI Component Libraries!

## Development Setup

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

```bash
npm install
```

## Project Structure

The workspace is a monorepo containing multiple libraries and a demo application:

| Path                    | Package              | Description                                |
| ----------------------- | -------------------- | ------------------------------------------ |
| `projects/utils`        | `@cngx/utils`        | Utility functions and RxJS helpers         |
| `projects/core`         | `@cngx/core`         | Core tokens, types, and abstract classes   |
| `projects/forms`        | `@cngx/forms`        | Form controls and validators               |
| `projects/ui`           | `@cngx/ui`           | Core UI components (Overlay, Layout, etc.) |
| `projects/common`       | `@cngx/common`       | Common shared utilities                    |
| `projects/data-display` | `@cngx/data-display` | Data visualization (TreeTable, etc.)       |
| `projects/dev-app`      | -                    | Local development application (showcase)   |

## Common Commands

### Development Server

Start the demo application locally:

```bash
npm start
```

Runs on `http://localhost:4200`.

### Documentation

Generate and serve API documentation:

```bash
npm run docs        # Generate docs to /docs folder
npm run docs:serve  # Serve docs at http://localhost:8080
```

### Building

Build all libraries in dependency order:

```bash
npm run build:libs
```

Build specific libraries:

```bash
npm run build:utils
npm run build:core
# ... etc
```

### Testing & Linting

```bash
npm test            # Run all tests
npm run lint       # Lint all files
```

## Release Workflow

### Commit Messages

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**. This is required for our automated changelog generation.

Format: `<type>(<scope>): <subject>`

Examples:

- `feat(ui): add new overlay component`
- `fix(forms): resolve validation error in datepicker`
- `docs: update readme`
- `chore: update dependencies`

### Changelog

To generate the changelog based on the git history:

```bash
npm run changelog
```

### Publishing

We use custom scripts to handle versioning and publishing:

```bash
npm run publish:patch  # Bump patch version & publish
npm run publish:minor  # Bump minor & publish
npm run publish:dry    # Dry run to preview changes
```

This script handles:

- Updating versions in all `package.json` files
- creating git tags
- Publishing to the registry

## Pull Requests

Please use the provided Pull Request Template when submitting changes. Ensure your PR:

1. Follows the commit convention.
2. Includes tests for new features/bugfixes.
3. Updates documentation/demo if visible changes are made.
