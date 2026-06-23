# Changelog

All notable changes to the cngx libraries. Each entry corresponds to one
squash-merged pull request. Non-library scopes (examples, examples-gen, docs,
ci, build, chore) and non-consumer-facing types are omitted by design.
See CONTRIBUTING.md for the workflow.

## 0.1.0-rc.3 (2026-06-23)


### Features

- **ui/mat-paginator:** cngxMatPaginator instrumentation bridge ([#185](https://github.com/cngxjs/cngx/issues/185)) ([41d2c9d](https://github.com/cngxjs/cngx/commit/41d2c9d088a09a970d18b9a15d74e23243eb710a))
- **ui/paginator:** declarative paginator shell, nav + pages segments, numbered skin ([#186](https://github.com/cngxjs/cngx/issues/186)) ([fe40d95](https://github.com/cngxjs/cngx/commit/fe40d95d0379689f4ee91ae8e5c74d4fe04d3a45))
- **ui/paginator:** skins, density, motion, RTL, and responsive collapse ([#187](https://github.com/cngxjs/cngx/issues/187)) ([494d6ea](https://github.com/cngxjs/cngx/commit/494d6ea94adf0a0f0e15a7d2cc05bbecb42b8076))
- **ui/paginator:** range, go-to, page-size and page-of-pages data segments ([#188](https://github.com/cngxjs/cngx/issues/188)) ([40d547a](https://github.com/cngxjs/cngx/commit/40d547afe93a15da6554a003c7fc3103afb6fd3c))
- **ui/paginator:** dots segment and dots skin ([#189](https://github.com/cngxjs/cngx/issues/189)) ([9352364](https://github.com/cngxjs/cngx/commit/9352364361c9fc641cedc7f6a7d9f5ab58068c91))
- **ui/paginator:** async loading wiring + live-region a11y ([#190](https://github.com/cngxjs/cngx/issues/190)) ([b09dc36](https://github.com/cngxjs/cngx/commit/b09dc36606fc84f6ed01fa3365b5a4498098161c))
- **ui/paginator:** finalize paginator - review follow-ups, stories, docs, e2e ([#191](https://github.com/cngxjs/cngx/issues/191)) ([a9ddb31](https://github.com/cngxjs/cngx/commit/a9ddb31bb9d72bf33d80c6ed30f65c4fdbe4e956))
- **ui/paginator:** configurable page-row truncation ([#192](https://github.com/cngxjs/cngx/issues/192)) ([61fc6c1](https://github.com/cngxjs/cngx/commit/61fc6c149bccc8dc76dc8fcca18bb204462073a1))
- **ui/paginator:** consumer-overridable loading slot ([#193](https://github.com/cngxjs/cngx/issues/193)) ([5916047](https://github.com/cngxjs/cngx/commit/5916047a7b54bcd4af7d19a30ae2bc902c31f998))
- **ui/paginator:** load-more mode over the paginate brain ([#194](https://github.com/cngxjs/cngx/issues/194)) ([bce05b3](https://github.com/cngxjs/cngx/commit/bce05b3663c39be6604207f9a2491cd1e101e7cb))
- **ui/paginator:** infinite-scroll sentinel segment ([#195](https://github.com/cngxjs/cngx/issues/195)) ([d8c85ce](https://github.com/cngxjs/cngx/commit/d8c85cee59bd3905c7ba5ad0100e8c103a0021f8))
- **ui/paginator:** alphabetical range pagination mode ([#196](https://github.com/cngxjs/cngx/issues/196)) ([829b933](https://github.com/cngxjs/cngx/commit/829b933a9011ffb79a8878ffdd6fa5ebbe304f8a))
- **ui/paginator:** material bridge, reset/announce/routing features, drop deprecated wrapper ([#197](https://github.com/cngxjs/cngx/issues/197)) ([adb33fa](https://github.com/cngxjs/cngx/commit/adb33fa7bc2182e8904a0f31a43e75b903049d4f))
- **ui/paginator:** prototype-fidelity styling, status + rail segments, responsive collapse ([#198](https://github.com/cngxjs/cngx/issues/198)) ([c334944](https://github.com/cngxjs/cngx/commit/c334944a547c0f79e13ccbb01f7ec0300d1b4c9e))

### Bug Fixes

- **common:** close barrel-export gaps and drop a dead duplicate across common/forms/themes/ui ([#184](https://github.com/cngxjs/cngx/issues/184)) ([f39c974](https://github.com/cngxjs/cngx/commit/f39c97460acd8e3d750ddb4981e9a85aeac44a91))

### BREAKING CHANGES

- **ui/mat-paginator:** cngxMatPaginator instrumentation bridge ([#185](https://github.com/cngxjs/cngx/issues/185))

## 0.1.0-rc.2 (2026-06-16)


### Features

- **ui/stepper:** continuous density and collapsible step groups ([#180](https://github.com/cngxjs/cngx/issues/180)) ([5216769](https://github.com/cngxjs/cngx/commit/52167698472ba1326da0ff38935110395aadf741))
- **ui/tabs:** add CngxTabNav + CngxTabLink for native routerLink tab bars ([#178](https://github.com/cngxjs/cngx/issues/178)) ([58a978b](https://github.com/cngxjs/cngx/commit/58a978b5e7f02a388f88b970d7cb5e4b5bb9de76))

### Bug Fixes

- **themes/material:** theme the tabs family in light and dark mode ([#181](https://github.com/cngxjs/cngx/issues/181)) ([9203a32](https://github.com/cngxjs/cngx/commit/9203a324f06a5dde0a9fd18c4632770e525f6364))

## 0.1.0-rc.1 (2026-06-10)


### Features

- **ui/stepper:** communicate step error state across every skin and variant ([#174](https://github.com/cngxjs/cngx/issues/174)) ([74c2d4e](https://github.com/cngxjs/cngx/commit/74c2d4e20ca5f48bd191149c295b94b89229cf9b))
- **ui/stepper:** header-navigation policy and per-step error messages ([#175](https://github.com/cngxjs/cngx/issues/175)) ([ba3ad67](https://github.com/cngxjs/cngx/commit/ba3ad675858605ef579db496f887487e6c5d68dd))
- **ui/tabs:** cngx tab system with skins, error aggregation, routed outlets, and Material bridges ([#176](https://github.com/cngxjs/cngx/issues/176)) ([7ece677](https://github.com/cngxjs/cngx/commit/7ece6779f08cc32ba0a955bf67c2b8ad9699d4cd))

### Bug Fixes

- **common/interactive:** lock swipe to pinned axis and own touch-action ([#172](https://github.com/cngxjs/cngx/issues/172)) ([5750d81](https://github.com/cngxjs/cngx/commit/5750d8179dd08bbd6ef7e543c8d4fc748788cec1))

### BREAKING CHANGES

- **ui/stepper:** header-navigation policy and per-step error messages ([#175](https://github.com/cngxjs/cngx/issues/175))

## 0.1.0-rc.0 (2026-06-04)

