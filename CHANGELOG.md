# Changelog

All notable changes to the cngx libraries. Each entry corresponds to one
squash-merged pull request. Non-library scopes (examples, examples-gen, docs,
ci, build, chore) and non-consumer-facing types are omitted by design.
See CONTRIBUTING.md for the workflow.

## Unreleased


### Features

- **common:** honour dir=rtl across keyboard-navigation strategies ([#317](https://github.com/cngxjs/cngx/issues/317)) ([8c8ad5d](https://github.com/cngxjs/cngx/commit/8c8ad5d3207ca731ded9c4fa0ad507b37dc232ba))
- **common:** isolate numeric render surfaces library-wide as bidi runs under dir=rtl ([#320](https://github.com/cngxjs/cngx/issues/320)) ([6d43dd8](https://github.com/cngxjs/cngx/commit/6d43dd8c98ff142fd94163886923fdc37cf60b15))
- **common/chart:** realtime buffer, auto-switching Canvas renderer, and live a11y ([#245](https://github.com/cngxjs/cngx/issues/245)) ([687787c](https://github.com/cngxjs/cngx/commit/687787c5706b82ad144d6cdb68cfa319061e1a01))
- **common/chart:** add the *cngxChartOverlay slot ([#262](https://github.com/cngxjs/cngx/issues/262)) ([2a37528](https://github.com/cngxjs/cngx/commit/2a37528b11060879764f3d18e01618fcfad8d536))
- **common/data:** async suspense boundary (CngxAsyncBoundary + createAggregateAsyncState) ([#295](https://github.com/cngxjs/cngx/issues/295)) ([9cfaa7d](https://github.com/cngxjs/cngx/commit/9cfaa7d30a98def317861a608e5389983ebc60da))
- **common/display:** relocate CngxStatus and add a dot-only glyph toggle ([#292](https://github.com/cngxjs/cngx/issues/292)) ([b4804e7](https://github.com/cngxjs/cngx/commit/b4804e7fb1ef0db4b6554722a8d549d8f3c63da7))
- **common/popover:** honour dir=rtl in popover and tooltip anchor placement ([#319](https://github.com/cngxjs/cngx/issues/319)) ([259c1e3](https://github.com/cngxjs/cngx/commit/259c1e3581c8b3b7bf013b91a1ef65394b9b011b))
- **core:** latency-aware loading primitives and registry-sourced spinner-vs-skeleton selection ([#246](https://github.com/cngxjs/cngx/issues/246)) ([add323d](https://github.com/cngxjs/cngx/commit/add323df03da9d9da60f94039788c8231d0a51cf))
- **core:** add RTL direction primitive (CNGX_DIRECTION, injectDirection, provideDirection, CngxDir) ([#313](https://github.com/cngxjs/cngx/issues/313)) ([652b5fa](https://github.com/cngxjs/cngx/commit/652b5fa5ac09240a06dbb1ddb99822616038bd89))
- **core:** add provideDirectionAt for element-injector direction scope ([#323](https://github.com/cngxjs/cngx/issues/323)) ([7e04e03](https://github.com/cngxjs/cngx/commit/7e04e03e5365691e978291d5615537a949af485c))
- **core,common:** touch-target hit-area floor as an orthogonal token family ([#266](https://github.com/cngxjs/cngx/issues/266)) ([948c21f](https://github.com/cngxjs/cngx/commit/948c21f2f988b6d59548c8880cce15e529b6e360))
- **core,forms,common,ui:** floor the third-tier tap targets and enforce touch-target coverage ([#268](https://github.com/cngxjs/cngx/issues/268)) ([eb6cd49](https://github.com/cngxjs/cngx/commit/eb6cd497bbaaefeedb8f5731e04e9b24a3f50ed5))
- **core,forms,common,ui,data-display:** complete the touch-target floor across the interactive surface ([#267](https://github.com/cngxjs/cngx/issues/267)) ([772f4d1](https://github.com/cngxjs/cngx/commit/772f4d1b36d445a2a6a7c0707a175963ea1564f6))
- **core,ui:** guard rem-only font-size and unpin mat-tabs/paginator text ([#284](https://github.com/cngxjs/cngx/issues/284)) ([7468ae4](https://github.com/cngxjs/cngx/commit/7468ae4c3e168e755500a14a7b4a79eb2d17d5cf))
- **core/theming:** global text-scale axis (provideTextScale, injectTextScale) ([#285](https://github.com/cngxjs/cngx/issues/285)) ([9b25373](https://github.com/cngxjs/cngx/commit/9b25373d0db9b00b93155ccf1b29fd33f8c402f5))
- **core/theming:** reduced-motion axis (provideMotion / injectMotion / CngxMotionScope) + safety net ([#286](https://github.com/cngxjs/cngx/issues/286)) ([fd3c41d](https://github.com/cngxjs/cngx/commit/fd3c41d9d909e7c4dbd24a4425b991ff25a4b424))
- **core/theming:** contrast axis (provideContrast / injectContrast / CngxContrast) + more-contrast token overrides ([#287](https://github.com/cngxjs/cngx/issues/287)) ([7cc761d](https://github.com/cngxjs/cngx/commit/7cc761dce103c20a9813eefade5f08f5d5e926e1))
- **core/theming:** forced-colors / Windows High Contrast Mode survival hardening ([#288](https://github.com/cngxjs/cngx/issues/288)) ([37b4835](https://github.com/cngxjs/cngx/commit/37b4835ce4ad11cf8d86a795de27f34580d9dee2))
- **core/theming:** accessibility preferences aggregator + persistence ([#290](https://github.com/cngxjs/cngx/issues/290)) ([b251daa](https://github.com/cngxjs/cngx/commit/b251daadf900b08f0a6fc0bf3ca46e0479795658))
- **data-display,forms/select,ui:** mirror residual directional glyphs under dir=rtl ([#321](https://github.com/cngxjs/cngx/issues/321)) ([944cbe9](https://github.com/cngxjs/cngx/commit/944cbe94698179ef1a7ac9113d59c87f21c682ca))
- **data-display,ui:** honour dir=rtl in treetable and dot-stepper keyboard nav ([#322](https://github.com/cngxjs/cngx/issues/322)) ([eacb062](https://github.com/cngxjs/cngx/commit/eacb062fa547f460486782720631455074d6a35a))
- **doctor:** extract the project-wiring scanner as the standalone @cngx/doctor package ([#311](https://github.com/cngxjs/cngx/issues/311)) ([75740ee](https://github.com/cngxjs/cngx/commit/75740ee25b8d886f763838450a3d06fa1f56a9e5))
- **eslint-plugin:** implement the six lint rules with CI and docs ([#302](https://github.com/cngxjs/cngx/issues/302)) ([2e951d0](https://github.com/cngxjs/cngx/commit/2e951d0a9681156205ca5c533e43f93c37e743fb))
- **forms/input:** isolate numeric and code render surfaces as bidi runs under dir=rtl ([#316](https://github.com/cngxjs/cngx/issues/316)) ([0b1abda](https://github.com/cngxjs/cngx/commit/0b1abdafc98e494768816748b10c50952ba9e89d))
- **mcp:** add @cngx/mcp model context protocol server ([#303](https://github.com/cngxjs/cngx/issues/303)) ([88e48aa](https://github.com/cngxjs/cngx/commit/88e48aad1ec097d4496004f811f853c24a752ef5))
- **mcp:** add the get_config configuration-cascade query tool ([#325](https://github.com/cngxjs/cngx/issues/325)) ([88ee701](https://github.com/cngxjs/cngx/commit/88ee701711bc46e3f4ca8af1c7724d029751a2d6))
- **mcp:** add the list_components browse tool ([#326](https://github.com/cngxjs/cngx/issues/326)) ([8b86143](https://github.com/cngxjs/cngx/commit/8b86143a18552c7e00dde2a60b5ce648b98fb54b))
- **mcp:** add the list_components browse tool ([#327](https://github.com/cngxjs/cngx/issues/327)) ([993383a](https://github.com/cngxjs/cngx/commit/993383a0a423ef0952020a3fc75e3ae48bfe4535))
- **mcp:** add resources and prompts surfaces ([#328](https://github.com/cngxjs/cngx/issues/328)) ([97594a6](https://github.com/cngxjs/cngx/commit/97594a6e9ac0026d491257616ffed1ac6239cb1a))
- **mcp:** version-parameterized queries on the entry-shape tools ([#329](https://github.com/cngxjs/cngx/issues/329)) ([19d86ee](https://github.com/cngxjs/cngx/commit/19d86eea20db5db5f2d4d7cbc0594f4aaf760041))
- **plugin:** add the cngx consumer plugin ([#304](https://github.com/cngxjs/cngx/issues/304)) ([36c0403](https://github.com/cngxjs/cngx/commit/36c0403b9782354451c918687afc97b5efa02e89))
- **plugin:** add the three core consumer skills (cngx-wire, cngx-async, cngx-forms) ([#306](https://github.com/cngxjs/cngx/issues/306)) ([267c2ee](https://github.com/cngxjs/cngx/commit/267c2eeffc0dc5332b65963613e58023b55d976d))
- **plugin:** add the @cngx/doctor project-wiring CLI and PostToolUse guard hook ([#307](https://github.com/cngxjs/cngx/issues/307)) ([fca0e69](https://github.com/cngxjs/cngx/commit/fca0e69ca9be395377492e6c1eab325817e478b5))
- **plugin:** add the five remaining consumer skills ([#308](https://github.com/cngxjs/cngx/issues/308)) ([7c7d323](https://github.com/cngxjs/cngx/commit/7c7d323226c9e6d8510e9d8d92bc812e499cdaf1))
- **plugin:** consumer review, a11y, and migration tooling (agents, cngx-migrate, migrate_usage) ([#309](https://github.com/cngxjs/cngx/issues/309)) ([c8787c2](https://github.com/cngxjs/cngx/commit/c8787c283434316b9fdec7898a974c500570d7cd))
- **ui:** stat-card and chart-panel dashboard organisms ([#248](https://github.com/cngxjs/cngx/issues/248)) ([1e90ae3](https://github.com/cngxjs/cngx/commit/1e90ae38695486e7bfc4950ebd36c6d7fa0ef883))
- **ui:** honour dir=rtl in shipped CSS via logical properties ([#314](https://github.com/cngxjs/cngx/issues/314)) ([099a93a](https://github.com/cngxjs/cngx/commit/099a93ae07cbc4241d8a6b450b339221361afe27))
- **ui:** mirror RTL directional glyphs in breadcrumb, stepper, accordion ([#315](https://github.com/cngxjs/cngx/issues/315)) ([d81b8ba](https://github.com/cngxjs/cngx/commit/d81b8bab0149d987d4068500d5a865aabc1a0fd7))
- **ui/a11y:** placeable accessibility preferences card (CngxA11yPanel) ([#291](https://github.com/cngxjs/cngx/issues/291)) ([da7775a](https://github.com/cngxjs/cngx/commit/da7775a0af5b7f81de91035234bc4fe6561daeaf))
- **ui/command-palette:** command palette preset over a headless @cngx/common/command registry ([#296](https://github.com/cngxjs/cngx/issues/296)) ([370c19d](https://github.com/cngxjs/cngx/commit/370c19df2f34e4db056044f84b3ea3d882935daf))
- **ui/context-menu:** declarative context-menu organism over the headless menu brains ([#297](https://github.com/cngxjs/cngx/issues/297)) ([4116192](https://github.com/cngxjs/cngx/commit/4116192a57b583171388fcb369e30ffa75913e39))
- **ui/context-menu:** submenu activation, rich-icon projection, and inline-end flanking ([#299](https://github.com/cngxjs/cngx/issues/299)) ([dd45b41](https://github.com/cngxjs/cngx/commit/dd45b411b6e37d591ae73a9bcae606eaca90d545))
- **ui/data-grid-accordion:** scroll ownership, bounded-height mode, and flow-content summary cells ([#263](https://github.com/cngxjs/cngx/issues/263)) ([0f80311](https://github.com/cngxjs/cngx/commit/0f803119c55fb36bec5319eb05d0e1edcee4fe15))
- **ui/stat-card:** demo coverage and the UX fixes it exposed ([#249](https://github.com/cngxjs/cngx/issues/249)) ([c0d183a](https://github.com/cngxjs/cngx/commit/c0d183a12d86f3d57acdc616c1d1c14974a87a39))
- **ui/timeline:** add the timeline family ([#251](https://github.com/cngxjs/cngx/issues/251)) ([3d48f64](https://github.com/cngxjs/cngx/commit/3d48f64ca629139dfa42243a7b711d40abe46db0))
- **ui/timeline:** placement, rail style, orientation and the opposite slot ([#252](https://github.com/cngxjs/cngx/issues/252)) ([f6d52b1](https://github.com/cngxjs/cngx/commit/f6d52b107029998aa9bc72ecc3f8c08e8e8e75a0))
- **ui/toc:** table-of-contents rail with router sync and heading auto-discovery ([#312](https://github.com/cngxjs/cngx/issues/312)) ([6369fb0](https://github.com/cngxjs/cngx/commit/6369fb097069aa58d65b1fe4b36d57da79526488))

### Bug Fixes

- **common:** render undrawn inputs and draw single-datum chart marks ([#254](https://github.com/cngxjs/cngx/issues/254)) ([2905681](https://github.com/cngxjs/cngx/commit/2905681bd2dad9570fe331e9b11623201f6eb4b3))
- **common:** correct false ARIA state communication in card, button-toggle, and key combos ([#255](https://github.com/cngxjs/cngx/issues/255)) ([74ce946](https://github.com/cngxjs/cngx/commit/74ce9462b35d04cdc915974b2c776969483311ca))
- **common,ui:** containment-aware popover eviction, options-passed data-source atoms, and longhand page bindings ([#257](https://github.com/cngxjs/cngx/issues/257)) ([268df52](https://github.com/cngxjs/cngx/commit/268df52800388ca063bb77472ca365ba83bda2d4))
- **common/chart:** reserve axis room inside the chart box ([#258](https://github.com/cngxjs/cngx/issues/258)) ([2720510](https://github.com/cngxjs/cngx/commit/2720510b3b14e189aaf24b4d88ae10808e6445e2))
- **common/data:** make CngxStatus dot-size and gap tokens inheritable ([#250](https://github.com/cngxjs/cngx/issues/250)) ([002e5f7](https://github.com/cngxjs/cngx/commit/002e5f780f2bb21b54e0b2f4d6a88d310b22ce06))
- **common/interactive:** gate CngxToggle/CngxRadio disabled-reason describedby on the disabled state ([#265](https://github.com/cngxjs/cngx/issues/265)) ([4a36279](https://github.com/cngxjs/cngx/commit/4a36279e1330e7bc94cc65ccde39283384a4a6c0))
- **common/interactive:** attach context-menu dismiss listeners eagerly on open ([#278](https://github.com/cngxjs/cngx/issues/278)) ([5fc7d80](https://github.com/cngxjs/cngx/commit/5fc7d80d2a390973f2081b3a9d3f93454b4f7a27))
- **common/stepper:** deep-linking honors bound step ids and lands on first paint ([#264](https://github.com/cngxjs/cngx/issues/264)) ([40f2b4b](https://github.com/cngxjs/cngx/commit/40f2b4bae3e618095f077140d3c7fb01c1f374fc))
- **common/tabs:** prefix matching for section navs and pre-render URL seeding ([#256](https://github.com/cngxjs/cngx/issues/256)) ([a06d1de](https://github.com/cngxjs/cngx/commit/a06d1dedf6cf2decea50d34fa21efe9058fde1b4))
- **common/timeline:** register item inline-size @property with a valid absolute initial-value ([#272](https://github.com/cngxjs/cngx/issues/272)) ([0410222](https://github.com/cngxjs/cngx/commit/0410222541d59d4402fae33cd21ffc64d6904629))
- **plugin:** scope the pack drift-check to committed sources and run it in CI ([#305](https://github.com/cngxjs/cngx/issues/305)) ([9ca0c37](https://github.com/cngxjs/cngx/commit/9ca0c3733aa9ebb0756fc05f2b39e8b57849faa9))

### BREAKING CHANGES

- **common/chart:** reserve axis room inside the chart box ([#258](https://github.com/cngxjs/cngx/issues/258))

## 0.1.0-rc.6 (2026-07-23)


### Bug Fixes

- **common:** register @property length tokens dropped for invalid initial-value ([#240](https://github.com/cngxjs/cngx/issues/240)) ([e467bcf](https://github.com/cngxjs/cngx/commit/e467bcf3d401d653b4b043de4aadf3acf5ed688a))
- **common/interactive:** centre the cngx-toggle thumb in its track ([#239](https://github.com/cngxjs/cngx/issues/239)) ([c80a999](https://github.com/cngxjs/cngx/commit/c80a999010ca5f2ec48a7f1d9a402f18e9987000))

### BREAKING CHANGES

- **ui:** density coverage wave 4 - spacing derived from the scale + regression guard ([#242](https://github.com/cngxjs/cngx/issues/242))
- **ui:** density coverage wave 5 - derive remaining paginator/stepper/tabs/select spacing + guard refinement ([#243](https://github.com/cngxjs/cngx/issues/243))

## 0.1.0-rc.5 (2026-07-22)


### Features

- **common/audio:** add the audio feedback system ([#232](https://github.com/cngxjs/cngx/issues/232)) ([9f110b8](https://github.com/cngxjs/cngx/commit/9f110b8f92c93e70df8dc4e7c532c0655fd1f103))
- **interop:** add @cngx/interop store bridges and opt-in async observability ([#235](https://github.com/cngxjs/cngx/issues/235)) ([ac7ec0e](https://github.com/cngxjs/cngx/commit/ac7ec0ebb64446fef9be3398703841998b583b05))
- **ui/tabs:** paint all five skins on cngx-tab-nav ([#237](https://github.com/cngxjs/cngx/issues/237)) ([1b15aee](https://github.com/cngxjs/cngx/commit/1b15aee6b9952ccc8cc444e7ad8f008077d0fb67))

### Bug Fixes

- **common:** resolve recycler late-mount, sparkline SR-only clip, and toggle accessible name ([#236](https://github.com/cngxjs/cngx/issues/236)) ([a3aa58c](https://github.com/cngxjs/cngx/commit/a3aa58c20ee69e2bbfd611871f6f6e520aec1a40))
- **ui/tabs:** derive the cngx-tab-nav base tokens and density-anchor the family tab padding ([#238](https://github.com/cngxjs/cngx/issues/238)) ([2c7cae5](https://github.com/cngxjs/cngx/commit/2c7cae554a8b3b010d151ae3af142cd1e177b440))

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

