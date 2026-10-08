# Changelog

All notable changes to the cngx libraries. Each entry corresponds to one
squash-merged pull request. Non-library scopes (examples, examples-gen, docs,
ci, build, chore) and non-consumer-facing types are omitted by design.
See CONTRIBUTING.md for the workflow.

## 0.1.0-rc.8 (2026-10-08)


### Features

- **common:** display+card completion pass + core announcement/formatter utils ([#375](https://github.com/cngxjs/cngx/issues/375)) ([a8f6baf](https://github.com/cngxjs/cngx/commit/a8f6bafc690c4fd6df29173f4c0eedad85e918a9))
- **common:** make stepper and tabs copy follow a runtime language signal ([#492](https://github.com/cngxjs/cngx/issues/492)) ([da5a43a](https://github.com/cngxjs/cngx/commit/da5a43ad518ed7dd27387633f2e1a9b9ae14aec7))
- **common:** make the remaining common copy follow a runtime language signal ([#498](https://github.com/cngxjs/cngx/issues/498)) ([8066632](https://github.com/cngxjs/cngx/commit/80666326189b570e1ac0881fb20775080c871282))
- **common,forms:** complete the config-cascade triads and guard family parity ([#456](https://github.com/cngxjs/cngx/issues/456)) ([cdbe2ee](https://github.com/cngxjs/cngx/commit/cdbe2eed902614836c17f364ca53b98e9b22663a))
- **common,ui,forms:** let translators own the sentence order of stepper, tabs, timeline and select copy ([#515](https://github.com/cngxjs/cngx/issues/515)) ([b2f0256](https://github.com/cngxjs/cngx/commit/b2f02561c59742089c4701ae11f6dfa9e815504c))
- **common/a11y:** export AriaLivePoliteness and true up the a11y docs ([#406](https://github.com/cngxjs/cngx/issues/406)) ([e4805a6](https://github.com/cngxjs/cngx/commit/e4805a6d4cbb61b0753b82369cbe94f7ce1b05e9))
- **common/data:** fast-fling placeholders for virtualized recyclers ([#450](https://github.com/cngxjs/cngx/issues/450)) ([e6f7d2a](https://github.com/cngxjs/cngx/commit/e6f7d2ae1ebe659e5cfa6a6b58588d6812739eee))
- **common/data:** add the CngxRecyclerRow data-availability slot directive ([#451](https://github.com/cngxjs/cngx/issues/451)) ([c181055](https://github.com/cngxjs/cngx/commit/c181055c1c897d15b948a544791604b997085c81))
- **common/interactive:** nav-config token bindings + error-registry de-stage ([#374](https://github.com/cngxjs/cngx/issues/374)) ([9f4a9dd](https://github.com/cngxjs/cngx/commit/9f4a9dd2c8b120a47f338f48fb1db1219b9d94fa))
- **common/popover:** add the cngxPopoverAnchor atom to anchor a popover to an element other than its trigger ([#526](https://github.com/cngxjs/cngx/issues/526)) ([c29ddc9](https://github.com/cngxjs/cngx/commit/c29ddc968107d9f66f662f40aa9b1cb6d319a655))
- **core:** add createKeyedRegistry and createSlotRegistry with destroy-safe unregister ([#455](https://github.com/cngxjs/cngx/issues/455)) ([c800ef9](https://github.com/cngxjs/cngx/commit/c800ef94826bdadcdfc062974e620bb51f46d682))
- **core:** add createNestedOverrideMerge and a reactive-i18n coverage guard ([#485](https://github.com/cngxjs/cngx/issues/485)) ([1e290b1](https://github.com/cngxjs/cngx/commit/1e290b100dc83aeb60e62c4fbd27857fde9d1c32))
- **core,common:** drive cngx copy from one language pack per language ([#523](https://github.com/cngxjs/cngx/issues/523)) ([7aba5a7](https://github.com/cngxjs/cngx/commit/7aba5a7d7335fefab7eb58696064e1949d4d4b2c))
- **core,common,ui:** route common copy and number formatting through reactive-ready i18n surfaces ([#474](https://github.com/cngxjs/cngx/issues/474)) ([e4abe1e](https://github.com/cngxjs/cngx/commit/e4abe1ee3f28c64ed59bec6d177a515243a1f64c))
- **core,common,ui,forms:** make every user-facing string overridable ([#462](https://github.com/cngxjs/cngx/issues/462)) ([e271c2b](https://github.com/cngxjs/cngx/commit/e271c2b9cc6627e21c3e39bed24dbfb0fb74a1e2))
- **core,forms,data-display:** close the i18n residue and pin CNGX_LOCALE as the only locale source ([#476](https://github.com/cngxjs/cngx/issues/476)) ([395b3b5](https://github.com/cngxjs/cngx/commit/395b3b5e7536e04c78c4ac77f49d317f4ebaee09))
- **core,forms,themes:** add outline, fill and bare form-field skins ([#464](https://github.com/cngxjs/cngx/issues/464)) ([ff040de](https://github.com/cngxjs/cngx/commit/ff040dea0bd4c9b00e1a72f060658f83eb2d6791))
- **core,forms,themes:** give every field skin one box model ([#471](https://github.com/cngxjs/cngx/issues/471)) ([f923381](https://github.com/cngxjs/cngx/commit/f9233814f26e293e47fe537f0424724212559daa))
- **core/i18n:** ship the English and German language packs ([#537](https://github.com/cngxjs/cngx/issues/537)) ([9a7f65d](https://github.com/cngxjs/cngx/commit/9a7f65d2884234d3892dcca2eaf98cc4f2a8308d))
- **core/theming:** derive component @property duration tokens from the motion scale ([#396](https://github.com/cngxjs/cngx/issues/396)) ([5624907](https://github.com/cngxjs/cngx/commit/5624907bcb6c5323f66c0d7dcbd097469ed5f831))
- **core/theming:** add a primary text colour rung and map it in the Material bridge ([#516](https://github.com/cngxjs/cngx/issues/516)) ([880a175](https://github.com/cngxjs/cngx/commit/880a1759d21e9ff51527510a0431322fb9dfa022))
- **data-display:** add provideTreetableAt and the prefixed treetable type aliases ([#423](https://github.com/cngxjs/cngx/issues/423)) ([e0ac8df](https://github.com/cngxjs/cngx/commit/e0ac8df176c317cd59f32656ebdde18cca5537b6))
- **forms:** filter-builder system upgrade - row controller, open operators, editor host, pill rows ([#389](https://github.com/cngxjs/cngx/issues/389)) ([94ba2b5](https://github.com/cngxjs/cngx/commit/94ba2b5d86b6c52b083f092d6d6cf23dc7d2efcc))
- **forms:** discover the field control via CNGX_FORM_FIELD_CONTROL and wire field-label accnames ([#392](https://github.com/cngxjs/cngx/issues/392)) ([6120c2a](https://github.com/cngxjs/cngx/commit/6120c2aec5c228f17acf00047c175636a579d6f0))
- **forms:** let the container set the width of a bare field ([#490](https://github.com/cngxjs/cngx/issues/490)) ([dbaa791](https://github.com/cngxjs/cngx/commit/dbaa791662856627429e2d56c22c3f49dfdbea0c))
- **forms:** space a labelled field by its own label and hint gaps ([#491](https://github.com/cngxjs/cngx/issues/491)) ([81490ef](https://github.com/cngxjs/cngx/commit/81490efdbff30a3d415c592b4f64daf3100dcac5))
- **forms:** check the time range of time masks ([#534](https://github.com/cngxjs/cngx/issues/534)) ([7b960f6](https://github.com/cngxjs/cngx/commit/7b960f68b1af84f435a922642205b501791fe1bd))
- **forms,data-display:** make field, input, filter-builder and treetable copy follow a runtime language signal ([#504](https://github.com/cngxjs/cngx/issues/504)) ([389438a](https://github.com/cngxjs/cngx/commit/389438ae971f40b37442fa7fb92f3f37afa720e7))
- **forms,data-display:** drive the forms and treetable copy from one language pack ([#531](https://github.com/cngxjs/cngx/issues/531)) ([2e349c5](https://github.com/cngxjs/cngx/commit/2e349c5406c4e833d6e2360d805196132bc47311))
- **forms,themes:** add an inner static label and field text tokens ([#475](https://github.com/cngxjs/cngx/issues/475)) ([1aceedb](https://github.com/cngxjs/cngx/commit/1aceedb6daae98d9c0165b10413ed17a9323d45d))
- **forms/select:** config templates surface + interaction hardening ([#372](https://github.com/cngxjs/cngx/issues/372)) ([33b8f3d](https://github.com/cngxjs/cngx/commit/33b8f3d6daaa576f03810b31c62921e05fc188e8))
- **forms/select:** tree-select type-to-find, aria-checked cascade, cache hygiene ([#373](https://github.com/cngxjs/cngx/issues/373)) ([149802a](https://github.com/cngxjs/cngx/commit/149802a2d03c20d475d6b7f2366097f09caa8b3b))
- **forms/select:** make the select family copy follow a runtime language signal ([#500](https://github.com/cngxjs/cngx/issues/500)) ([4d65d2a](https://github.com/cngxjs/cngx/commit/4d65d2a19b2f2ac8e7c1bb39f4ca20f3ef2ba7fe))
- **forms/select:** place the selection indicator at the row end and keep cursor rows readable in forced colors ([#502](https://github.com/cngxjs/cngx/issues/502)) ([1910156](https://github.com/cngxjs/cngx/commit/1910156ebcdbf9fdbfce04875a9543452a254f56))
- **forms/select:** frame the select action region with a token-driven separator ([#529](https://github.com/cngxjs/cngx/issues/529)) ([504684e](https://github.com/cngxjs/cngx/commit/504684e4649f6893499ab9b2a2dd4e50c58b61b1))
- **themes:** four missing Material bridges + rendered-value assertion harness ([#388](https://github.com/cngxjs/cngx/issues/388)) ([855b81c](https://github.com/cngxjs/cngx/commit/855b81cf1d7faa7c10cac023e563cd580d1d497f))
- **ui:** export the documented types and DEFAULTS consts, close the entry docs gaps ([#409](https://github.com/cngxjs/cngx/issues/409)) ([3668c0e](https://github.com/cngxjs/cngx/commit/3668c0e33f6847be34c1fa0bfe997df9f6758d75))
- **ui:** make sidenav, paginator and breadcrumb responsive by default ([#460](https://github.com/cngxjs/cngx/issues/460)) ([785e425](https://github.com/cngxjs/cngx/commit/785e425b61db8c8669d3d68dbb6f1be1351a28d8))
- **ui:** make feedback, paginator, command-palette, dga, sidenav and speak copy follow a runtime language signal ([#509](https://github.com/cngxjs/cngx/issues/509)) ([5bc6ad1](https://github.com/cngxjs/cngx/commit/5bc6ad1071f1e7ce8379c0e05638203a5c710821))
- **ui:** make accordion, breadcrumb, chart-panel, collection, stat-card, toc and a11y-panel copy follow a runtime language signal ([#514](https://github.com/cngxjs/cngx/issues/514)) ([499266d](https://github.com/cngxjs/cngx/commit/499266df04e0b3e16dc97d2d3429a3906a0bab77))
- **ui:** drive the remaining ui copy from the language pack ([#535](https://github.com/cngxjs/cngx/issues/535)) ([fa60518](https://github.com/cngxjs/cngx/commit/fa605187f6f84ce6085becd04e8b79fdd9022626))
- **ui,common:** drive the ui feedback, stepper, tabs, grid, paginator and command-palette copy from the language pack ([#532](https://github.com/cngxjs/cngx/issues/532)) ([67d2855](https://github.com/cngxjs/cngx/commit/67d2855ebaab44f4ff49478e2f70ac6d7e9e2f37))
- **ui,common:** signal real scroll edges in the data-grid-accordion with a reusable CngxScrollEdges atom ([#533](https://github.com/cngxjs/cngx/issues/533)) ([bbfa1e3](https://github.com/cngxjs/cngx/commit/bbfa1e35432de304496509082e1c63c4c113e743))
- **ui,common,data-display:** move the legacy width detections onto the container contract ([#461](https://github.com/cngxjs/cngx/issues/461)) ([0ff150f](https://github.com/cngxjs/cngx/commit/0ff150f43843e5dc1f9feacbb1a15ea5ab3fdbef))
- **ui/stepper:** variant parity, mobile-collapse ids and always-mounted status regions ([#379](https://github.com/cngxjs/cngx/issues/379)) ([2ea70ab](https://github.com/cngxjs/cngx/commit/2ea70ab796707040a8be144a8e7c38e37b01825d))
- **utils:** add the walkTree early-exit channel and the flattenTree duplicate-id warning ([#420](https://github.com/cngxjs/cngx/issues/420)) ([51bb565](https://github.com/cngxjs/cngx/commit/51bb565b6a51279e483b93e79abbf78ede1cfcd0))
- **utils,core,common,ui:** route ui copy through reactive-ready i18n surfaces ([#472](https://github.com/cngxjs/cngx/issues/472)) ([0fdf4ca](https://github.com/cngxjs/cngx/commit/0fdf4ca882de244dcd819a54247e7ce9f3fb7e55))

### Bug Fixes

- **common:** paint disabled states by colour and keep state visible in forced colors ([#501](https://github.com/cngxjs/cngx/issues/501)) ([36dd85e](https://github.com/cngxjs/cngx/commit/36dd85e044475de9e10a7909692fde3b745ddeac))
- **common:** keep the menu cursor, segmented progress and tooltip indicator legible by colour and in forced colors ([#512](https://github.com/cngxjs/cngx/issues/512)) ([83867c4](https://github.com/cngxjs/cngx/commit/83867c426394780985e3faebe0a892f676c71648))
- **common,ui,forms:** keep background-only markers visible in forced colors ([#518](https://github.com/cngxjs/cngx/issues/518)) ([bfb81e8](https://github.com/cngxjs/cngx/commit/bfb81e8f4dd5b68f75d390f9010d505ff9109309))
- **common/audio:** track context state changes and warn once per unknown earcon ([#427](https://github.com/cngxjs/cngx/issues/427)) ([0eed040](https://github.com/cngxjs/cngx/commit/0eed0403d1e80ccddb9dca123ebf82c74018cbaf))
- **common/chart:** context export, time axis, gap handling, preset parity ([#367](https://github.com/cngxjs/cngx/issues/367)) ([ff0f7ea](https://github.com/cngxjs/cngx/commit/ff0f7ead53f4944962bad7bf45aeda3a2b3e3cca))
- **common/chart:** draw the SVG chart series in the user palette with the legend's pattern in forced colors ([#519](https://github.com/cngxjs/cngx/issues/519)) ([209b452](https://github.com/cngxjs/cngx/commit/209b452420d12b7f5b4a3d0a8dde7eea55c9e1c8))
- **common/chart:** let the area and band [opacity] input win over the opacity token default ([#520](https://github.com/cngxjs/cngx/issues/520)) ([d1f1b51](https://github.com/cngxjs/cngx/commit/d1f1b513e361fd3dd923dac5c223af8951985197))
- **common/chart:** paint the canvas backend in the forced-colors palette with the legend's per-series cycle ([#521](https://github.com/cngxjs/cngx/issues/521)) ([8d05fe5](https://github.com/cngxjs/cngx/commit/8d05fe5c79f42c0c1afd745ce5b10b9c27ca2f47))
- **common/data:** controlled sort end-to-end, deep-link-safe paginate routing, commit supersede order ([#353](https://github.com/cngxjs/cngx/issues/353)) ([c76249b](https://github.com/cngxjs/cngx/commit/c76249b029549b0be96df0e008c89b1d232265b7))
- **common/data:** async-state family convergence and identity-guarded registries ([#354](https://github.com/cngxjs/cngx/issues/354)) ([32dc884](https://github.com/cngxjs/cngx/commit/32dc8846ed618e5f8cc025d9a623f57cc4c0c8b0))
- **common/data:** stop virtual scroll from flashing blank strips on fast scroll ([#448](https://github.com/cngxjs/cngx/issues/448)) ([e417eaf](https://github.com/cngxjs/cngx/commit/e417eaf808167087a9c0f45eabf5e50cf68b02b5))
- **common/display:** give the chip remove button a 24px hit box on every pointer ([#477](https://github.com/cngxjs/cngx/issues/477)) ([a3b8752](https://github.com/cngxjs/cngx/commit/a3b8752c3dd48f2e04634ccf26c639e9ba7ae341))
- **common/interactive:** lifecycle races and focus/announce polish across interactive and a11y atoms ([#369](https://github.com/cngxjs/cngx/issues/369)) ([6594f07](https://github.com/cngxjs/cngx/commit/6594f078ccf05f5cb936a24d3c995b77b362c7c8))
- **common/layout:** drawer inert composition + focus restore, text and observer hardening ([#376](https://github.com/cngxjs/cngx/issues/376)) ([e42e1a8](https://github.com/cngxjs/cngx/commit/e42e1a8222f22e9a177c0c2b24093acc7092ca50))
- **common/layout:** soften the sticky-header never-scrolls dev warning to a 1px tolerance ([#457](https://github.com/cngxjs/cngx/issues/457)) ([0980e4b](https://github.com/cngxjs/cngx/commit/0980e4b68e41c3300768f76fd258b64fd2fbc350))
- **common/popover:** ship bare popover menus with a real surface ([#441](https://github.com/cngxjs/cngx/issues/441)) ([4e66ada](https://github.com/cngxjs/cngx/commit/4e66adabe6cce1dfdabde87254066086e19f1f88))
- **common/popover:** pin the panel close button to the panel corner ([#445](https://github.com/cngxjs/cngx/issues/445)) ([c9669b2](https://github.com/cngxjs/cngx/commit/c9669b2889389f68aa6b9eb75db05b4077a5d0d1))
- **common/popover:** release focus before the panel is hidden ([#446](https://github.com/cngxjs/cngx/issues/446)) ([b445067](https://github.com/cngxjs/cngx/commit/b445067945900ddc49bc92706c4552b293335490))
- **common/popover:** apply the popover offset on the placement's main axis only ([#528](https://github.com/cngxjs/cngx/issues/528)) ([523a7b9](https://github.com/cngxjs/cngx/commit/523a7b97bd17a7a1d1f100fa1615cfe0f37f9030))
- **common/stepper:** family pass - commit races, nav hygiene, registries, router-sync, i18n ([#358](https://github.com/cngxjs/cngx/issues/358)) ([c828cc6](https://github.com/cngxjs/cngx/commit/c828cc6588270e971cc2b450589aafdc08122f46))
- **common/tabs:** family pass - registry hygiene, router-commit correlation, config wiring, dismissal focus ([#359](https://github.com/cngxjs/cngx/issues/359)) ([1358a68](https://github.com/cngxjs/cngx/commit/1358a682cb48089804fc9212c3fb0141d4825e01))
- **common/tabs:** shift the rejection markers when a dismissed tab closes ([#425](https://github.com/cngxjs/cngx/issues/425)) ([b853d10](https://github.com/cngxjs/cngx/commit/b853d1099505489ddb2b02db477c4f611a43a3d8))
- **core:** transition delay-aware close + cancel handle, tracker mount seed, IME shortcut guard ([#368](https://github.com/cngxjs/cngx/issues/368)) ([9fd71ed](https://github.com/cngxjs/cngx/commit/9fd71edca3c9f004b9c62068b13b7efaf035b92f))
- **core:** evict an undefined key in the bounded memoize cache ([#484](https://github.com/cngxjs/cngx/issues/484)) ([b2a534b](https://github.com/cngxjs/cngx/commit/b2a534bf90bdafcbfda4657e9acf2f6217b11cae))
- **core,forms:** paint the disabled state on an outline control and outline box ([#480](https://github.com/cngxjs/cngx/issues/480)) ([4a02a5d](https://github.com/cngxjs/cngx/commit/4a02a5d6caca684967cda8cafc2ba8e72f4a2944))
- **core,forms,themes:** meet the field contrast recipes in both schemes ([#473](https://github.com/cngxjs/cngx/issues/473)) ([c1491fb](https://github.com/cngxjs/cngx/commit/c1491fb5e5c075c06873ba19ffec75d867a7a7cd))
- **core/theming:** quiet the bare description term by colour and define the highlight colour for dark ([#510](https://github.com/cngxjs/cngx/issues/510)) ([af68295](https://github.com/cngxjs/cngx/commit/af68295c94b360d650a59ffaa35a9ca4f575a327))
- **data-display:** treetable state surface + state hygiene ([#366](https://github.com/cngxjs/cngx/issues/366)) ([4a89d6a](https://github.com/cngxjs/cngx/commit/4a89d6a0acb5d0679dbba061575c55c7e0fd7914))
- **data-display/treetable:** draw the expand toggle of a selected row in the row ink under forced colors ([#511](https://github.com/cngxjs/cngx/issues/511)) ([402bb1a](https://github.com/cngxjs/cngx/commit/402bb1a2c87e4bceb1068f0d328a30c504fb55b7))
- **examples,forms/input,ui/tabs:** bind aria-label through the input alias on cngx hosts ([#466](https://github.com/cngxjs/cngx/issues/466)) ([ade62e4](https://github.com/cngxjs/cngx/commit/ade62e49d07e05bddbb91a6b79aeca5b9d5723da))
- **forms:** enlarge the select caret and default numeric inputs to monospace ([#440](https://github.com/cngxjs/cngx/issues/440)) ([1061345](https://github.com/cngxjs/cngx/commit/1061345b97cb0124aebb013fc1b939a8cb71a9f3))
- **forms:** align input and select control heights across density and touch ([#442](https://github.com/cngxjs/cngx/issues/442)) ([e6ccd72](https://github.com/cngxjs/cngx/commit/e6ccd7257fbcd5acbb64edd94d8cdbe0e5edd442))
- **forms:** close the form-field skin gaps on ARIA, trigger states and the bare look ([#468](https://github.com/cngxjs/cngx/issues/468)) ([87365e5](https://github.com/cngxjs/cngx/commit/87365e5491cb3b13a74ed942891e8f2325705fef))
- **forms:** keep an empty manual error container out of the field gap ([#495](https://github.com/cngxjs/cngx/issues/495)) ([bcf8c3a](https://github.com/cngxjs/cngx/commit/bcf8c3a9138364cbc21627323795d87a5bca21cf))
- **forms:** paint disabled states by colour and size selects like inputs ([#499](https://github.com/cngxjs/cngx/issues/499)) ([8f1e3e2](https://github.com/cngxjs/cngx/commit/8f1e3e281a7e062c3e8cc65b7f1770115a1ed138))
- **forms:** give masked inputs a reactive forms value channel ([#538](https://github.com/cngxjs/cngx/issues/538)) ([a420d3b](https://github.com/cngxjs/cngx/commit/a420d3be86842251e1817904189279c32c6f28b1))
- **forms/filter-builder:** shared incomplete definition, maxNestingDepth enforcement, focus restoration on remove ([#357](https://github.com/cngxjs/cngx/issues/357)) ([d66f6ef](https://github.com/cngxjs/cngx/commit/d66f6efc1c525ddbc39fe3c04f9fd7b9ae81aaaf))
- **forms/filter-builder:** drop the no-op skeletonCount knob, re-register pill width tokens ([#454](https://github.com/cngxjs/cngx/issues/454)) ([3a6c55d](https://github.com/cngxjs/cngx/commit/3a6c55d071e2f201b061ee4f460b45c56947c633))
- **forms/filter-builder:** read the danger text rung for the remove glyph ([#487](https://github.com/cngxjs/cngx/issues/487)) ([06f47da](https://github.com/cngxjs/cngx/commit/06f47da62786d69996121b14acad1246042e0cab))
- **forms/input:** input hardening - eager clear listener, IME composition reconcile, char-count fallback, dev guards ([#356](https://github.com/cngxjs/cngx/issues/356)) ([ada7672](https://github.com/cngxjs/cngx/commit/ada767264f90210b5ab1b29a2d4dbfec871afdbf))
- **forms/input:** paint disabled rating and phone input by colour ([#506](https://github.com/cngxjs/cngx/issues/506)) ([4059921](https://github.com/cngxjs/cngx/commit/4059921e0c42631ebdf2903771ce5eaed1693e0c))
- **forms/select:** commit-flow parity across the array and action composites ([#355](https://github.com/cngxjs/cngx/issues/355)) ([94087e1](https://github.com/cngxjs/cngx/commit/94087e1055917d7caaec51bcf1c92ce196f869b6))
- **forms/select:** size every select trigger to the text-control baseline ([#443](https://github.com/cngxjs/cngx/issues/443)) ([f8fe983](https://github.com/cngxjs/cngx/commit/f8fe983b09bd68e42f680be7f2e6d39aaa7f3718))
- **forms/select:** stabilize the virtualized select panel width ([#449](https://github.com/cngxjs/cngx/issues/449)) ([0c09e34](https://github.com/cngxjs/cngx/commit/0c09e348400cae3f2bd753d1fd4a906b182da8a7))
- **forms/select:** emit panel lifecycle and restore focus only on real open flips ([#479](https://github.com/cngxjs/cngx/issues/479)) ([e11eed1](https://github.com/cngxjs/cngx/commit/e11eed1eb06a78db1c05a0afdeed6fac41989f8d))
- **forms/select:** paint a disabled outline trigger by colour, not opacity ([#483](https://github.com/cngxjs/cngx/issues/483)) ([118213a](https://github.com/cngxjs/cngx/commit/118213a8697142cd991ba2db04a7e99aba1fcdf3))
- **forms/select:** size every select trigger as a border box ([#488](https://github.com/cngxjs/cngx/issues/488)) ([b72f136](https://github.com/cngxjs/cngx/commit/b72f1361290dcf8ed37d89ac5351e1ec259ad742))
- **forms/select:** centre the default caret on the trigger ([#489](https://github.com/cngxjs/cngx/issues/489)) ([fcefbec](https://github.com/cngxjs/cngx/commit/fcefbeccd6c62c03e6e274ad6c764cec3a49c216))
- **forms/select:** render a projected placeholder template on the select shell ([#522](https://github.com/cngxjs/cngx/issues/522)) ([8003d00](https://github.com/cngxjs/cngx/commit/8003d001cf0b51044f87b54513b3542bb4cc5394))
- **forms/select:** keep the templates.action default off the selects without an action area ([#525](https://github.com/cngxjs/cngx/issues/525)) ([3686810](https://github.com/cngxjs/cngx/commit/368681087b02a49b14c2d5fa73553e3d09a60f03))
- **forms/select:** anchor the input variants' panels to the field box instead of the inner input ([#527](https://github.com/cngxjs/cngx/issues/527)) ([1c2f9c1](https://github.com/cngxjs/cngx/commit/1c2f9c12e8e7150f081645975c21264ca5c9bbab))
- **interop:** fromQuery busy retries, success-latched first load, dataUpdatedAt to lastUpdated ([#370](https://github.com/cngxjs/cngx/issues/370)) ([288365b](https://github.com/cngxjs/cngx/commit/288365be3a0b893e5c9df3a16abb0d31a63e82b5))
- **scripts:** publish prereleases to latest until a stable release exists ([#536](https://github.com/cngxjs/cngx/issues/536)) ([0f9f7ce](https://github.com/cngxjs/cngx/commit/0f9f7cef626823b6ab79c060ef5b4d8258dec759))
- **testing:** kernel-derived async-state mock and live DOM matchers ([#380](https://github.com/cngxjs/cngx/issues/380)) ([8d617ea](https://github.com/cngxjs/cngx/commit/8d617eaa23220eb43a3af57db6392f9ae0b5ef09))
- **themes:** bridge placement pass, layering, placeholder imports, specifier ([#378](https://github.com/cngxjs/cngx/issues/378)) ([e2f8563](https://github.com/cngxjs/cngx/commit/e2f8563ac6f7b7dc0a7b4f4d9a202c8e66bc713e))
- **themes/material:** name-drift bridges rewritten against real token surfaces ([#377](https://github.com/cngxjs/cngx/issues/377)) ([a339cba](https://github.com/cngxjs/cngx/commit/a339cbaf836fe59e9a13f797b27b0ce2a5ff5212))
- **themes/material:** derive the M2 field error colour for 4.5:1 text contrast ([#486](https://github.com/cngxjs/cngx/issues/486)) ([decd3ef](https://github.com/cngxjs/cngx/commit/decd3efa09dc50bb4d92f85e54f7a7ea0f77f975))
- **themes/material:** derive every M2 warn text token for 4.5:1 contrast ([#493](https://github.com/cngxjs/cngx/issues/493)) ([3d0b135](https://github.com/cngxjs/cngx/commit/3d0b1359814b8b63f7308f3d663b34d44dbda5c3))
- **ui:** mat-bridges family pass - order-aware registration, accordion seeding, announcements, ownership filters ([#361](https://github.com/cngxjs/cngx/issues/361)) ([731a52d](https://github.com/cngxjs/cngx/commit/731a52d389e1fa43840c76875e0c8c74d93b4dc4))
- **ui:** paginator family pass - goto commit, emit dedup, dots a11y, focus restore, clamp echo ([#362](https://github.com/cngxjs/cngx/issues/362)) ([0207339](https://github.com/cngxjs/cngx/commit/02073398aebde3de4e1233d7b24056db0d850a7a))
- **ui:** command-palette + context-menu pass - panel ownership, mounted empty state, minted ids ([#363](https://github.com/cngxjs/cngx/issues/363)) ([70ad1fd](https://github.com/cngxjs/cngx/commit/70ad1fda42ac3cfcd85e0b88ff75680df0e0a4b7))
- **ui:** small-organisms pass - empty-state, collection, chart-panel, dga, stat-card, timeline ([#364](https://github.com/cngxjs/cngx/issues/364)) ([24e0191](https://github.com/cngxjs/cngx/commit/24e019121d00d3c6cdc334cfe0283d89013cd2ef))
- **ui:** nav-shells pass - toc query params, breadcrumb current/encoding, sidenav keyboard resize ([#365](https://github.com/cngxjs/cngx/issues/365)) ([39d4fd2](https://github.com/cngxjs/cngx/commit/39d4fd2293a69a3addf3e35f762ff4548234ff96))
- **ui:** re-register the dropped @property color tokens and restore their derivations ([#387](https://github.com/cngxjs/cngx/issues/387)) ([381b69d](https://github.com/cngxjs/cngx/commit/381b69db2dcd9b4a0ee3633c7e3bbc3551fec46e))
- **ui:** keep current breadcrumb, command row and step labels readable in forced colors ([#503](https://github.com/cngxjs/cngx/issues/503)) ([e42d625](https://github.com/cngxjs/cngx/commit/e42d625c8948fe61b55d24c925f470bb2932c931))
- **ui:** paint disabled and quiet states by colour, never opacity ([#507](https://github.com/cngxjs/cngx/issues/507)) ([53c041d](https://github.com/cngxjs/cngx/commit/53c041d1ae8373a18a82cc6f0c09a931e19cd674))
- **ui:** lift the alert, banner and stepper group chip labels to 4.5:1 and give busy chart-panel actions their own disabled state ([#513](https://github.com/cngxjs/cngx/issues/513)) ([d1c896a](https://github.com/cngxjs/cngx/commit/d1c896a3375e2a7409abbd28b4a74c3de86905f3))
- **ui:** derive the feedback severity colours from the core semantic colours and lift the toc and breadcrumb current markers to 4.5:1 ([#517](https://github.com/cngxjs/cngx/issues/517)) ([0198be4](https://github.com/cngxjs/cngx/commit/0198be45cc4ac8fe787f0b4c0bbcdde966c8a398))
- **ui/action-button:** fire the toast effect on transition edges only ([#411](https://github.com/cngxjs/cngx/issues/411)) ([b57e09c](https://github.com/cngxjs/cngx/commit/b57e09c3a62eb9df7d86e746d50ac7a7af4d193d))
- **ui/action-button:** derive status ARIA and announcement, add a disabled reason ([#428](https://github.com/cngxjs/cngx/issues/428)) ([d45e6f1](https://github.com/cngxjs/cngx/commit/d45e6f1d2cb7f0b48b5ba8e9a2de1068dd108e8a))
- **ui/collection,common/data,forms/select:** virtualized scrollports render and scroll stably ([#459](https://github.com/cngxjs/cngx/issues/459)) ([34aaa28](https://github.com/cngxjs/cngx/commit/34aaa28ccce342a5ab1bfa5bd2cb01a69c67f29e))
- **ui/feedback:** alert pipeline, toast contract, and pause math ([#360](https://github.com/cngxjs/cngx/issues/360)) ([4fdd0a7](https://github.com/cngxjs/cngx/commit/4fdd0a7634214838d50a970286289959f448526b))
- **ui/overlay:** give the overlay a lifecycle-safety envelope ([#429](https://github.com/cngxjs/cngx/issues/429)) ([bb0fbfc](https://github.com/cngxjs/cngx/commit/bb0fbfc10a01a3743e3e7c26c0b160ed0deaf8b0))
- **ui/paginator:** close the page dropdowns on select and restore focus to the trigger ([#444](https://github.com/cngxjs/cngx/issues/444)) ([4baf328](https://github.com/cngxjs/cngx/commit/4baf3280bae7e686552992c87687efa29a8bc035))
- **ui/paginator:** close the dropdown segments on re-pick of the current value ([#458](https://github.com/cngxjs/cngx/issues/458)) ([985433a](https://github.com/cngxjs/cngx/commit/985433a78bad67cb8dc1e5aa9df31e38963c740b))
- **ui/sidenav:** release focus before the overlay rail is hidden ([#447](https://github.com/cngxjs/cngx/issues/447)) ([39616eb](https://github.com/cngxjs/cngx/commit/39616ebf74c3fe4f312fc317dd77515ea30fa205))
- **ui/speak:** make the button labels overridable and gate it on speech support ([#426](https://github.com/cngxjs/cngx/issues/426)) ([f7b3104](https://github.com/cngxjs/cngx/commit/f7b31044e249c3091247a9f2055cabd058cf2b95))
- **utils:** version pre-release parsing, exponent-aware decimalPlaces, NaN-bound clamp contract ([#371](https://github.com/cngxjs/cngx/issues/371)) ([eeeebe7](https://github.com/cngxjs/cngx/commit/eeeebe7ee84f643c916c9a3b15f733f0e20b7f89))

### BREAKING CHANGES

- **core:** `onTransitionDone` now returns a `TransitionDoneHandle`
(`{ flush(): void; cancel(): void }`) instead of a bare function.
- **forms:** filter-builder system upgrade - row controller, open operators, editor host, pill rows ([#389](https://github.com/cngxjs/cngx/issues/389))
- **core:** collapse the preference axes onto a shared factory and exclude 'auto' from subtree inputs ([#393](https://github.com/cngxjs/cngx/issues/393))
- **common/popover:** convert the writable signal surface to setter methods ([#394](https://github.com/cngxjs/cngx/issues/394))
- **common/interactive:** chore sweep - read-only hovered, lifecycle fixes, create* aliases ([#395](https://github.com/cngxjs/cngx/issues/395))
- **forms/filter-builder:** drop the no-op skeletonCount knob, re-register pill width tokens ([#454](https://github.com/cngxjs/cngx/issues/454))
- **ui:** make sidenav, paginator and breadcrumb responsive by default ([#460](https://github.com/cngxjs/cngx/issues/460))
- **ui,common,data-display:** move the legacy width detections onto the container contract ([#461](https://github.com/cngxjs/cngx/issues/461))
- **common:** `CNGX_STEPPER_I18N` and `CNGX_TABS_I18N` are now
`InjectionToken<Signal<T>>`, and the `ariaLabels` / `fallbackLabels`
keys of `CngxStepperConfig` and `CngxTabsConfig` are typed `L |
Signal<L>`.

Migration (full list in `core-concepts/i18n-migration.md`):

|Before|After|
|-|-|

|`inject(CNGX_STEPPER_I18N).stepperLabel`|`inject(CNGX_STEPPER_I18N)().stepperLabel`,
read in a `computed()` or template|
|`injectTabsI18n().tabsLabel`|`injectTabsI18n()().tabsLabel`|
|`{ provide: CNGX_STEPPER_I18N, useValue: bundle
}`|`provideStepperI18n(withStepperI18nLabels(overrides))`, or `useValue`
with a Signal|
|Hand-written `CngxStepperI18nFeature` / `CngxTabsI18nFeature`:
`(bundle) => ({ ...bundle, x })`|`(bundle) =>
createOverrideMerge(bundle, { x })`|
|`config.ariaLabels?.stepperRegion` off `injectStepperConfig()` /
`injectTabsConfig()`|`coerceSignal(config.ariaLabels)()?.stepperRegion`|
|`i18n` option of `createStepperAnnouncementBuilders`,
`createStepperSlotContextBuilders`, `createStepperAccname`,
`createStepperGroupSummary`, `createTabGroupAnnouncements`,
`createTabDismissals` as a plain bundle|pass `inject*I18n()` (a Signal)|
|`createMatStepHandle(step, idSeed, bundle)`|`createMatStepHandle(step,
idSeed, injectStepperI18n())`|

The landmark name keeps its precedence: `ariaLabels.stepperRegion` /
`tabsRegion` (English defaults) win over the i18n `stepperLabel` /
`tabsLabel`, so localise the landmark through `with*AriaLabels` as well.

### Other information

- Reactive-i18n guard: every ratchet row for the stepper and tabs tokens
is closed (242 to 210 rows). The live-region manifest now enforces the
no-respeak spec of every stepper and tabs region, including five
error-line regions the guard found once the bundle became a Signal read.
- Every changed or removed type line in the `.d.ts` of `common/stepper`,
`common/tabs`, `ui/stepper`, `ui/tabs`, `ui/mat-stepper` and
`ui/mat-tabs` has a bullet in `core-concepts/i18n-migration.md`.
- Known limit: the guard follows copy within one class, so copy that
reaches a live region through a derived Signal of another unit (the
Material `Step <id>` label) is covered by specs only.
- Validated locally: `npm run lint`, `npm test`, `npm run test:scripts`,
`npm run build:libs`, `npm run build:examples`, `npm run docs:json`, and
the `examples/e2e/core/i18n` Playwright suite.
- **common:** `CNGX_CARD_I18N`, `CNGX_CHART_I18N` and
`CNGX_RECYCLER_I18N` are now `InjectionToken<Signal<T>>`; the `labels` /
`ariaLabels` keys of `CngxDialogDefaults`, `CngxMenuConfig` and
`CngxTimelineConfig` are typed `L | Signal<L>`; the common copy inputs
listed above read `undefined` when unbound; `createTimelineFallbackCopy`
returns a `Signal`.

Migration (full list in `core-concepts/i18n-migration.md`):

|Before|After|
|-|-|
|`inject(CNGX_CARD_I18N).selected`|`inject(CNGX_CARD_I18N)().selected`,
read in a `computed()` or template|

|`inject(CNGX_CHART_I18N).summary(x)`|`inject(CNGX_CHART_I18N)().summary(x)`|

|`inject(CNGX_RECYCLER_I18N).empty()`|`inject(CNGX_RECYCLER_I18N)().empty()`|
|`{ provide: CNGX_CARD_I18N, useValue: bundle
}`|`provideCardI18n(withCardI18nLabels(overrides))`, or `useValue` with
a Signal|

|`injectDialogConfig().labels.close`|`coerceSignal(injectDialogConfig().labels)().close`|

|`injectMenuConfig().ariaLabels.itemActivated`|`coerceSignal(injectMenuConfig().ariaLabels)().itemActivated`|
|`injectTimelineConfig().labels?.retry`|a field
`coerceSignal(injectTimelineConfig().labels ?? NO_LABELS)`, then
`labels().retry`|
|Hand-written menu / timeline feature spreading `cfg.ariaLabels` /
`config.labels`|`createOverrideMerge(...)` /
`createNestedOverrideMerge(..., 'status')`|
|`directive.succeededAnnouncement()` read programmatically|read
`directive.announcement()`; the input is `undefined` when unbound|

|`createTimelineFallbackCopy(config).retry`|`createTimelineFallbackCopy(config)().retry`|
|`CngxTimelineViewFactory` with plain `labels`|`labels` is a `Signal`;
read the announcement copy in `untracked(() => labels().loading)`|
- **forms:** paint disabled states by colour and size selects like inputs ([#499](https://github.com/cngxjs/cngx/issues/499))
- **forms/select:** the `ariaLabels`, `fallbackLabels` and `announcer` keys
of `CngxSelectConfig` and the `ariaLabel` key of
`CngxActionSelectConfig` / `CngxReorderableSelectConfig` are typed `L |
Signal<L>`; `injectSelectConfig()`, `injectActionSelectConfig()` and
`injectReorderableSelectConfig()` return those keys as Signals; the
`fallbackLabels` / `ariaLabels` members of every select component are
Signals; the select copy inputs listed above read `undefined` when
unbound.

Migration (full list in `core-concepts/i18n-migration.md`):

|Before|After|
|-|-|

|`injectSelectConfig().fallbackLabels.empty`|`injectSelectConfig().fallbackLabels().empty`,
read in a `computed()` or template|

|`injectSelectConfig().announcer.format`|`injectSelectConfig().announcer().format`|
|`inject(CNGX_SELECT_CONFIG).ariaLabels?.clearButton`|a field
`coerceSignal(config.ariaLabels ?? NO_ARIA_LABELS)`, then
`ariaLabels().clearButton`|

|`injectActionSelectConfig().ariaLabel`|`injectActionSelectConfig().ariaLabel()`|

|`injectReorderableSelectConfig().ariaLabel`|`injectReorderableSelectConfig().ariaLabel()`|
|`select.fallbackLabels.empty` on a component
instance|`select.fallbackLabels().empty`|
|`select.clearButtonAriaLabel()` read programmatically|read the rendered
`aria-label`; the input is `undefined` when unbound|

Behaviour changes:

- The `*cngxSelectAction` wrapper in every select panel is
`role="group"` with `aria-label` from `CngxActionSelectConfig.ariaLabel`
(default `'Inline action'`); screen readers announce the group name when
focus enters the action slot.
- A defaulted copy key that an override sets to `undefined` resolves to
its English default instead of `undefined` (`withFallbackLabels({ empty:
undefined })` renders `'No Options'`). Set `''` to clear a label.

### Other information

- Reactive-i18n guard: every ratchet row assigned to this step is closed
(167 to 141 rows), and each of the ten panel-shell live regions has its
own no-respeak test in the manifest.
- The guard now sees a copy type through an intersection (`Labels &
Required<...>`), so a stricter resolved type cannot hide a live region
from discovery.
- Every changed or removed type line in the `@cngx/forms/select` `.d.ts`
has a bullet in `core-concepts/i18n-migration.md`.
- Validated locally: `npm run lint`, `npm test`, `npm run test:scripts`,
`npm run build:libs`, `npm run build:examples`, `npm run docs:json`, the
`examples/e2e/core/i18n` Playwright suite, and `e2e/action-select` /
`e2e/action-multi-select` on Chromium and WebKit. Firefox could not
launch in the local sandbox; CI covers it.
- **common:** paint disabled states by colour and keep state visible in forced colors ([#501](https://github.com/cngxjs/cngx/issues/501))
- **forms/select:** place the selection indicator at the row end and keep cursor rows readable in forced colors ([#502](https://github.com/cngxjs/cngx/issues/502))
- **forms,data-display:** `CNGX_ERROR_MESSAGES` is
`InjectionToken<Signal<ErrorMessageMap>>`;
`FormFieldConfig.errorMessages` / `.constraintHints`,
`InputConfig.ariaLabels` / `.numericLocale`,
`CngxFilterBuilderConfig.i18n` and `TreetableConfig.labels` are typed `T
| Signal<T>` and hold a Signal once their `with*` feature ran;
`CngxFilterBuilderAnnouncerSources.i18n` is a Signal;
`CngxPhoneInput.countries` reads `undefined` when unbound.

Migration (full list in `core-concepts/i18n-migration.md`):

|Before|After|
|-|-|

|`inject(CNGX_ERROR_MESSAGES)[kind]`|`inject(CNGX_ERROR_MESSAGES)()[kind]`,
read in a `computed()`, template or handler|
|`{ provide: CNGX_ERROR_MESSAGES, useValue: map
}`|`provideErrorMessages(map)`, or
`provideFormFieldAt(withErrorMessages(map))` on a component|
|`injectFormFieldConfig().constraintHints?.lengthRange(...)`|a field
`coerceSignal(injectFormFieldConfig().constraintHints)`, then
`hints()?.lengthRange(...)`|
|`injectInputConfig().ariaLabels?.clear`|a field
`coerceSignal(injectInputConfig().ariaLabels ?? NO_LABELS)`, then
`labels().clear`|

|`injectInputConfig().numericLocale`|`coerceSignal(injectInputConfig().numericLocale)()`|
|`injectFilterBuilderConfig().i18n.addFilter`|a field
`coerceSignal(injectFilterBuilderConfig().i18n)`, then
`i18n().addFilter`|
|custom announcer factory reading
`sources.i18n.announcement`|`sources.i18n().announcement`, inside
`untracked` where it builds the region text|
|`inject(CNGX_TREETABLE_CONFIG).labels?.loading`|a field
`coerceSignal(config.labels ?? NO_LABELS)`, then `labels().loading`|
|`phone.countries()` read programmatically|read the picker's options;
the input is `undefined` when unbound|

Behaviour change (all libraries): a live region keeps its text on a
language switch even when a consumer formatter reads a language Signal
itself (for example `withErrorMessages({ required: () =>
translate('required') })`). The formatter is called untracked; the next
status change speaks the new language. Labels outside live regions
switch immediately.

### Other information

- Reactive-i18n guard: every ratchet row assigned to this step is closed
(141 to 99 rows), and the `cngx-field-errors`, `cngx-form-errors`,
password-strength and treetable live regions have their no-respeak tests
in the manifest. Each no-respeak test was checked to fail without
`untracked`.
- Every changed or removed type line in the `.d.ts` of the four touched
entries has a bullet in `core-concepts/i18n-migration.md`.
- Validated locally: `npm run lint`, `npm test`, `npm run test:scripts`,
`npm run build:libs`, `npm run build:examples`, `npm run docs:json` and
the `examples/e2e/core/i18n` Playwright suite (16/16, Chromium).
- **forms/input:** paint disabled rating and phone input by colour ([#506](https://github.com/cngxjs/cngx/issues/506))
- **ui:** paint disabled and quiet states by colour, never opacity ([#507](https://github.com/cngxjs/cngx/issues/507))
- **ui:** `CNGX_FEEDBACK_I18N` is
`InjectionToken<Signal<CngxFeedbackI18n>>` and `injectFeedbackI18n()`
returns a Signal; `CngxPaginatorConfig.ariaLabels` / `.announcements` /
`.formats` and the copy keys of `CngxCommandPaletteConfig` are typed `T
| Signal<T>` and hold a Signal once a Signal was passed to their
feature; the copy inputs listed above read `undefined` when unbound.

Migration (full list in `core-concepts/i18n-migration.md`):

|Before|After|
|-|-|

|`inject(CNGX_FEEDBACK_I18N).alertsRegionLabel`|`inject(CNGX_FEEDBACK_I18N)().alertsRegionLabel`,
read in a `computed()`, template or handler|
|`{ provide: CNGX_FEEDBACK_I18N, useValue: bundle
}`|`provideFeedbackI18n(overrides)`|

|`injectPaginatorConfig().ariaLabels.next`|`injectPaginatorAriaLabels()().next`
(likewise `injectPaginatorAnnouncements()`, `injectPaginatorFormats()`)|
|`injectCommandPaletteConfig().emptyLabel`|a field
`coerceSignal(injectCommandPaletteConfig().emptyLabel)`, then
`emptyLabel()`|
|`indicator.label()`, `sortHeader.notSortedLabel()`, ... read
programmatically|read the rendered text; the input is `undefined` when
unbound|

Behaviour change: a bound `cngxDgaCountSingular` / `cngxDgaCountPlural`
now always composes `<count> <noun>`, also when it equals the label
default; leave both unbound to use a custom `count` formatter.

### Other information

- Reactive-i18n guard: every ratchet row assigned to this step is closed
(99 to 43 rows), and all 12 live regions of this step have their
no-respeak tests in the manifest, now enforced.
- Every changed or removed public type line in the `.d.ts` of the seven
touched entries has a bullet in `core-concepts/i18n-migration.md`.
- Validated locally: `npm run lint`, `npm test`, `npm run test:scripts`,
`npm run build:libs`, `npm run build:examples`, `npm run docs:json` and
the `examples/e2e/core/i18n` Playwright suite (17/17, Chromium).
- **common:** keep the menu cursor, segmented progress and tooltip indicator legible by colour and in forced colors ([#512](https://github.com/cngxjs/cngx/issues/512))
- **ui:** lift the alert, banner and stepper group chip labels to 4.5:1 and give busy chart-panel actions their own disabled state ([#513](https://github.com/cngxjs/cngx/issues/513))
- **ui:** the copy keys of the seven configs above are typed `T |
Signal<T>` and hold a Signal once a Signal was passed to their feature
(`CngxAccordionConfig.disabledReason` / `.errorMessage`,
`CngxBreadcrumbConfig.ariaLabels`, `CngxChartPanelConfig.ariaLabels`,
`CngxIncrementalListConfig.ariaLabels`, `CngxStatCardConfig.ariaLabels`,
`CngxTocConfig.ariaLabels`, `CngxA11yPanelConfig.labels` / `.axes`); the
copy inputs listed above read `undefined` when unbound.

Migration (full list in `core-concepts/i18n-migration.md`):

|Before|After|
|-|-|

|`injectBreadcrumbConfig().ariaLabels?.bar`|`injectBreadcrumbAriaLabels()().bar`
(likewise chart-panel, incremental-list, stat-card, toc), read in a
`computed()`, template or handler|
|`injectA11yPanelConfig().labels.heading` /
`.axes`|`injectA11yPanelLabels()().heading` / `injectA11yPanelAxes()()`|
|`injectAccordionConfig().disabledReason`|a field
`coerceSignal(injectAccordionConfig().disabledReason)`, then `reason()`|
|`item.disabledReason()`, `card.errorText()`, ... read
programmatically|read the rendered text; the input is `undefined` when
unbound|

Behaviour change: the whole stat card can be a live region, so an
unbound stat-card copy input shows a new language with the tile's next
view or busy change, also while `[live]` is `'off'`.

### Other information

- Reactive-i18n guard: every remaining ratchet row is closed (43 to 0),
and the 4 live regions of this step have their no-respeak tests in the
manifest, now enforced.
- Every changed or removed public type line in the `.d.ts` of the seven
touched entries has a bullet in `core-concepts/i18n-migration.md`;
`@cngx/core/utils` only gains `createDefaultsFill`.
- Validated locally: `npm run lint`, `npm test`, `npm run test:scripts`,
`npm run build:libs`, `npm run build:examples`, `npm run docs:json` and
the `examples/e2e/core/i18n` Playwright suite (18/18, Chromium).
- **common,ui,forms:** the shipped i18n keys above change type, the deprecated
stepper keys and two internal exports are removed, and two optional
surfaces become required.

Migration (full list in `core-concepts/i18n-migration.md`):

|Before|After|
|-|-|
- **core,common:** drive cngx copy from one language pack per language ([#523](https://github.com/cngxjs/cngx/issues/523))
- **forms,data-display:** drive the forms and treetable copy from one language pack ([#531](https://github.com/cngxjs/cngx/issues/531))
- **ui,common:** drive the ui feedback, stepper, tabs, grid, paginator and command-palette copy from the language pack ([#532](https://github.com/cngxjs/cngx/issues/532))
- **ui:** drive the remaining ui copy from the language pack ([#535](https://github.com/cngxjs/cngx/issues/535))
- **forms:** check the time range of time masks ([#534](https://github.com/cngxjs/cngx/issues/534))
- **forms:** give masked inputs a reactive forms value channel ([#538](https://github.com/cngxjs/cngx/issues/538))
- **core/i18n:** ship the English and German language packs ([#537](https://github.com/cngxjs/cngx/issues/537))

## 0.1.0-rc.7 (2026-08-31)


### Features

- **common:** honour dir=rtl across keyboard-navigation strategies ([#317](https://github.com/cngxjs/cngx/issues/317)) ([8c8ad5d](https://github.com/cngxjs/cngx/commit/8c8ad5d3207ca731ded9c4fa0ad507b37dc232ba))
- **common:** isolate numeric render surfaces library-wide as bidi runs under dir=rtl ([#320](https://github.com/cngxjs/cngx/issues/320)) ([6d43dd8](https://github.com/cngxjs/cngx/commit/6d43dd8c98ff142fd94163886923fdc37cf60b15))
- **common/chart:** realtime buffer, auto-switching Canvas renderer, and live a11y ([#245](https://github.com/cngxjs/cngx/issues/245)) ([687787c](https://github.com/cngxjs/cngx/commit/687787c5706b82ad144d6cdb68cfa319061e1a01))
- **common/chart:** add the *cngxChartOverlay slot ([#262](https://github.com/cngxjs/cngx/issues/262)) ([2a37528](https://github.com/cngxjs/cngx/commit/2a37528b11060879764f3d18e01618fcfad8d536))
- **common/data:** async suspense boundary (CngxAsyncBoundary + createAggregateAsyncState) ([#295](https://github.com/cngxjs/cngx/issues/295)) ([9cfaa7d](https://github.com/cngxjs/cngx/commit/9cfaa7d30a98def317861a608e5389983ebc60da))
- **common/dialog:** programmatic dialog labelling via an aria registry ([#350](https://github.com/cngxjs/cngx/issues/350)) ([9541665](https://github.com/cngxjs/cngx/commit/95416655d41299844edacc1c755b9b6085a0546e))
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
- **eslint-plugin:** scope the bridge rule, ship the rule docs, and polish the doctor CLI ([#337](https://github.com/cngxjs/cngx/issues/337)) ([23050c8](https://github.com/cngxjs/cngx/commit/23050c8945bac4b182d4d00039f1c3f6e7bc316f))
- **forms/input:** isolate numeric and code render surfaces as bidi runs under dir=rtl ([#316](https://github.com/cngxjs/cngx/issues/316)) ([0b1abda](https://github.com/cngxjs/cngx/commit/0b1abdafc98e494768816748b10c50952ba9e89d))
- **mcp:** add @cngx/mcp model context protocol server ([#303](https://github.com/cngxjs/cngx/issues/303)) ([88e48aa](https://github.com/cngxjs/cngx/commit/88e48aad1ec097d4496004f811f853c24a752ef5))
- **mcp:** add the get_config configuration-cascade query tool ([#325](https://github.com/cngxjs/cngx/issues/325)) ([88ee701](https://github.com/cngxjs/cngx/commit/88ee701711bc46e3f4ca8af1c7724d029751a2d6))
- **mcp:** add the list_components browse tool ([#326](https://github.com/cngxjs/cngx/issues/326)) ([8b86143](https://github.com/cngxjs/cngx/commit/8b86143a18552c7e00dde2a60b5ce648b98fb54b))
- **mcp:** add the list_components browse tool ([#327](https://github.com/cngxjs/cngx/issues/327)) ([993383a](https://github.com/cngxjs/cngx/commit/993383a0a423ef0952020a3fc75e3ae48bfe4535))
- **mcp:** add resources and prompts surfaces ([#328](https://github.com/cngxjs/cngx/issues/328)) ([97594a6](https://github.com/cngxjs/cngx/commit/97594a6e9ac0026d491257616ffed1ac6239cb1a))
- **mcp:** version-parameterized queries on the entry-shape tools ([#329](https://github.com/cngxjs/cngx/issues/329)) ([19d86ee](https://github.com/cngxjs/cngx/commit/19d86eea20db5db5f2d4d7cbc0594f4aaf760041))
- **mcp:** accept an optional version on get_config ([#330](https://github.com/cngxjs/cngx/issues/330)) ([f0d76e9](https://github.com/cngxjs/cngx/commit/f0d76e9b2496cbd212ed402cf5c78f42658e8797))
- **mcp:** serve the llms.txt index as the cngx://llms resource ([#333](https://github.com/cngxjs/cngx/issues/333)) ([8ac739c](https://github.com/cngxjs/cngx/commit/8ac739cefc8a60391ee9588da27ae536fb964bfb))
- **mcp:** serve the compodocx llm-md dump as the cngx://llms-full resource ([#334](https://github.com/cngxjs/cngx/issues/334)) ([7e5b94b](https://github.com/cngxjs/cngx/commit/7e5b94b4099690a27cbff149b9f228e18dfeb6d9))
- **mcp:** cover injectable services and harden the version-scoped fetch ([#335](https://github.com/cngxjs/cngx/issues/335)) ([3ac1320](https://github.com/cngxjs/cngx/commit/3ac1320972624a4db9c6991681941051689d620a))
- **plugin:** add the cngx consumer plugin ([#304](https://github.com/cngxjs/cngx/issues/304)) ([36c0403](https://github.com/cngxjs/cngx/commit/36c0403b9782354451c918687afc97b5efa02e89))
- **plugin:** add the three core consumer skills (cngx-wire, cngx-async, cngx-forms) ([#306](https://github.com/cngxjs/cngx/issues/306)) ([267c2ee](https://github.com/cngxjs/cngx/commit/267c2eeffc0dc5332b65963613e58023b55d976d))
- **plugin:** add the @cngx/doctor project-wiring CLI and PostToolUse guard hook ([#307](https://github.com/cngxjs/cngx/issues/307)) ([fca0e69](https://github.com/cngxjs/cngx/commit/fca0e69ca9be395377492e6c1eab325817e478b5))
- **plugin:** add the five remaining consumer skills ([#308](https://github.com/cngxjs/cngx/issues/308)) ([7c7d323](https://github.com/cngxjs/cngx/commit/7c7d323226c9e6d8510e9d8d92bc812e499cdaf1))
- **plugin:** consumer review, a11y, and migration tooling (agents, cngx-migrate, migrate_usage) ([#309](https://github.com/cngxjs/cngx/issues/309)) ([c8787c2](https://github.com/cngxjs/cngx/commit/c8787c283434316b9fdec7898a974c500570d7cd))
- **plugin:** route the grounding surface to the full MCP and harden the doctor ([#336](https://github.com/cngxjs/cngx/issues/336)) ([3d68bd9](https://github.com/cngxjs/cngx/commit/3d68bd9184e7431e9137d8bd8d8665e7986c9282))
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
- **common/a11y:** active-descendant virtual-window resolution, APG typeahead cycle, stable highlighted emissions ([#344](https://github.com/cngxjs/cngx/issues/344)) ([25d53c9](https://github.com/cngxjs/cngx/commit/25d53c9405a05598516e8a6195c06fea5d48361d))
- **common/a11y:** keyboard hygiene for the roving and active-descendant nav strategies ([#345](https://github.com/cngxjs/cngx/issues/345)) ([d2d05b8](https://github.com/cngxjs/cngx/commit/d2d05b8b60f617a7324ba5841d8c124014f29215))
- **common/chart:** reserve axis room inside the chart box ([#258](https://github.com/cngxjs/cngx/issues/258)) ([2720510](https://github.com/cngxjs/cngx/commit/2720510b3b14e189aaf24b4d88ae10808e6445e2))
- **common/data:** make CngxStatus dot-size and gap tokens inheritable ([#250](https://github.com/cngxjs/cngx/issues/250)) ([002e5f7](https://github.com/cngxjs/cngx/commit/002e5f780f2bb21b54e0b2f4d6a88d310b22ce06))
- **common/dialog:** draggable guards, opener parity, backdrop origin, and a shared scroll lock ([#349](https://github.com/cngxjs/cngx/issues/349)) ([7270874](https://github.com/cngxjs/cngx/commit/72708746f15097b4d7ed1c5b13a994eeb1208b99))
- **common/interactive:** gate CngxToggle/CngxRadio disabled-reason describedby on the disabled state ([#265](https://github.com/cngxjs/cngx/issues/265)) ([4a36279](https://github.com/cngxjs/cngx/commit/4a36279e1330e7bc94cc65ccde39283384a4a6c0))
- **common/interactive:** attach context-menu dismiss listeners eagerly on open ([#278](https://github.com/cngxjs/cngx/issues/278)) ([5fc7d80](https://github.com/cngxjs/cngx/commit/5fc7d80d2a390973f2081b3a9d3f93454b4f7a27))
- **common/interactive:** route submenu hover through the menu focus stack ([#346](https://github.com/cngxjs/cngx/issues/346)) ([8943a66](https://github.com/cngxjs/cngx/commit/8943a661b0aaf74f1400ed5ea491aee6391e073b))
- **common/interactive:** describedby gating convergence for checkbox, chip, and the sliders ([#347](https://github.com/cngxjs/cngx/issues/347)) ([07f64e4](https://github.com/cngxjs/cngx/commit/07f64e4815301a6145c940e9bfdedb052ea40a2d))
- **common/popover:** light-dismiss finalize, ARIA gates, tooltip aria-hidden, and a shared floating fallback ([#348](https://github.com/cngxjs/cngx/issues/348)) ([eb0e410](https://github.com/cngxjs/cngx/commit/eb0e410dc72220a643a838ba6937e8d4570418d5))
- **common/stepper:** deep-linking honors bound step ids and lands on first paint ([#264](https://github.com/cngxjs/cngx/issues/264)) ([40f2b4b](https://github.com/cngxjs/cngx/commit/40f2b4bae3e618095f077140d3c7fb01c1f374fc))
- **common/tabs:** prefix matching for section navs and pre-render URL seeding ([#256](https://github.com/cngxjs/cngx/issues/256)) ([a06d1de](https://github.com/cngxjs/cngx/commit/a06d1dedf6cf2decea50d34fa21efe9058fde1b4))
- **common/tabs:** replace the em-dash in the SR live-region defaults with a hyphen ([#341](https://github.com/cngxjs/cngx/issues/341)) ([8d662b3](https://github.com/cngxjs/cngx/commit/8d662b3dcb2ac5ff66557ebdd04001885181f018))
- **common/timeline:** register item inline-size @property with a valid absolute initial-value ([#272](https://github.com/cngxjs/cngx/issues/272)) ([0410222](https://github.com/cngxjs/cngx/commit/0410222541d59d4402fae33cd21ffc64d6904629))
- **core/theming:** register system tokens inherits: true and revive the example brand theme ([#342](https://github.com/cngxjs/cngx/issues/342)) ([10fa314](https://github.com/cngxjs/cngx/commit/10fa3146898adbd6789631576cd1781180955eb0))
- **data-display:** treegrid roving focus model and APG row semantics ([#351](https://github.com/cngxjs/cngx/issues/351)) ([6afe575](https://github.com/cngxjs/cngx/commit/6afe575cf5b7c225315f86b5063536eee1912eab))
- **forms/field:** gate aria-describedby error id on showError and propagate field disabled into slider bridges ([#343](https://github.com/cngxjs/cngx/issues/343)) ([e3efb11](https://github.com/cngxjs/cngx/commit/e3efb11be3ee3906cbe47137335faa3fdfed05bd))
- **plugin:** scope the pack drift-check to committed sources and run it in CI ([#305](https://github.com/cngxjs/cngx/issues/305)) ([9ca0c37](https://github.com/cngxjs/cngx/commit/9ca0c3733aa9ebb0756fc05f2b39e8b57849faa9))
- **ui:** describedby gating, panel layering, and density-scale residue ([#352](https://github.com/cngxjs/cngx/issues/352)) ([381eb08](https://github.com/cngxjs/cngx/commit/381eb08b97da6353d0a2c9a00d3bc791a87ba6cd))

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

