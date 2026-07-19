# Changelog

All notable changes to the cngx libraries. Each entry corresponds to one
squash-merged pull request. Non-library scopes (examples, examples-gen, docs,
ci, build, chore) and non-consumer-facing types are omitted by design.
See CONTRIBUTING.md for the workflow.

## 0.1.0-rc.4 (2026-07-19)


### Features

- **common:** add CngxHoverIntent and injectMediaQuery reactive-helper atoms ([#223](https://github.com/cngxjs/cngx/issues/223)) ([b6d5ce2](https://github.com/cngxjs/cngx/commit/b6d5ce25c28e47e54cbb6d46d0c356fac277638f))
- **common,ui:** add slider, accordion, and breadcrumb primitive families ([#214](https://github.com/cngxjs/cngx/issues/214)) ([43881be](https://github.com/cngxjs/cngx/commit/43881bea33b1799734d93880c1a1f0f5ad706fcd))
- **common/data:** add the stat-display dashboard atom family ([#228](https://github.com/cngxjs/cngx/issues/228)) ([05aa1e6](https://github.com/cngxjs/cngx/commit/05aa1e6a1fc83fadbabf3374f52c8df3132f232b))
- **common/layout,ui/sidenav:** query-param URL sync kernel and deep-linkable sidenav ([#227](https://github.com/cngxjs/cngx/issues/227)) ([de6d315](https://github.com/cngxjs/cngx/commit/de6d3153df3c3e757535bbdf751181b397e7a6c1))
- **core/theming:** library-wide [data-density] density system with Material convergence ([#221](https://github.com/cngxjs/cngx/issues/221)) ([ff28265](https://github.com/cngxjs/cngx/commit/ff28265653b7f57c5ab062a2e43cc7393f485379))
- **forms:** input a11y hardening and field/input consistency cleanup ([#209](https://github.com/cngxjs/cngx/issues/209)) ([6869249](https://github.com/cngxjs/cngx/commit/68692498e9680aa9f87e72ec5e7045bba739a089))
- **forms/input:** keyboard a11y, multi-drop accumulation and maxFiles for CngxFileDrop ([#210](https://github.com/cngxjs/cngx/issues/210)) ([1d7bdac](https://github.com/cngxjs/cngx/commit/1d7bdacf434f35aae3b7920084525715a723314a))
- **forms/input:** enterprise input expansion - a11y, restriction, affixes, currency, data-handling ([#212](https://github.com/cngxjs/cngx/issues/212)) ([b80ee09](https://github.com/cngxjs/cngx/commit/b80ee0944bbdbaca061b03912742b8585dfbbb24))
- **forms/input:** rating, intl phone, mask presets and phone-metadata strategy ([#213](https://github.com/cngxjs/cngx/issues/213)) ([32e11ec](https://github.com/cngxjs/cngx/commit/32e11ecc0443d49d2146d612390268af8da175ee))
- **forms/select:** material-theme playgrounds and bridge fidelity pass ([#202](https://github.com/cngxjs/cngx/issues/202)) ([79ce792](https://github.com/cngxjs/cngx/commit/79ce79255f9d3537effa5e05e62d80797dca9ffc))
- **ui:** accordion skins and variants, and the data-grid-accordion entry ([#216](https://github.com/cngxjs/cngx/issues/216)) ([5629443](https://github.com/cngxjs/cngx/commit/5629443b77cdd87e730d18dc5b48f6cbe2e2853c))
- **ui/breadcrumb:** 15 skins, a per-crumb icon slot, and refined dropdowns ([#218](https://github.com/cngxjs/cngx/issues/218)) ([b8f4f20](https://github.com/cngxjs/cngx/commit/b8f4f201d44b63898ddbce79c45857e07333e9e4))
- **ui/breadcrumb:** width-responsive collapse on CngxBreadcrumbBar ([#219](https://github.com/cngxjs/cngx/issues/219)) ([c236f23](https://github.com/cngxjs/cngx/commit/c236f23124e084fcfa13f935a9fc3219a0c8d15c))
- **ui/collection:** add the CngxIncrementalList append-style collection organism ([#231](https://github.com/cngxjs/cngx/issues/231)) ([31d7373](https://github.com/cngxjs/cngx/commit/31d7373897a43a198647486beef3cd87512887a8))
- **ui/mat-accordion:** add [cngxMatAccordion] Material instrumentation bridge ([#217](https://github.com/cngxjs/cngx/issues/217)) ([e16955e](https://github.com/cngxjs/cngx/commit/e16955ebf667a3b8a883243a44091cd67564ab6d))
- **ui/paginator:** playgrounds, isolated part docs, and bridge/interaction fixes ([#199](https://github.com/cngxjs/cngx/issues/199)) ([49874d1](https://github.com/cngxjs/cngx/commit/49874d19a3ea1b4af440ae3168dfde17cb201893))
- **ui/paginator:** config-cascade default for page-size options ([#207](https://github.com/cngxjs/cngx/issues/207)) ([bce7b88](https://github.com/cngxjs/cngx/commit/bce7b88561aceb1c4e136173d77568234fbd7690))
- **ui/sidenav:** overlay focus management and stability hardening ([#222](https://github.com/cngxjs/cngx/issues/222)) ([3db279f](https://github.com/cngxjs/cngx/commit/3db279fbb2d5e8f446821d0cc27d2eae15ca29d0))
- **ui/sidenav:** debounce mini expand-on-hover via CngxHoverIntent ([#224](https://github.com/cngxjs/cngx/issues/224)) ([2a41025](https://github.com/cngxjs/cngx/commit/2a41025fadeaae4f09a11856397374ec0bb8ea8e))
- **ui/sidenav:** configuration cascade and tunable mini hover dwell ([#225](https://github.com/cngxjs/cngx/issues/225)) ([478f4a4](https://github.com/cngxjs/cngx/commit/478f4a44688d5294611f99809042efc2af34a6ee))

### Bug Fixes

- **common:** close the field-sync over-reach ([#98](https://github.com/cngxjs/cngx/issues/98)) and the roving auto-select race ([#135](https://github.com/cngxjs/cngx/issues/135)) ([#204](https://github.com/cngxjs/cngx/issues/204)) ([3577cd2](https://github.com/cngxjs/cngx/commit/3577cd288987a981f22c9405ca83696980b95945))
- **common/data:** expose CngxMetric accessible name via role=img ([#229](https://github.com/cngxjs/cngx/issues/229)) ([d3c5930](https://github.com/cngxjs/cngx/commit/d3c593068d575eaa4287e1b060ad2a6aea428360))

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

