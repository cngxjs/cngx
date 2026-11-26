# Changelog

All notable changes to the cngx libraries. Each entry corresponds to one
squash-merged pull request. Non-library scopes (examples, examples-gen, docs,
ci, build, chore) and non-consumer-facing types are omitted by design.
See CONTRIBUTING.md for the workflow.

## 0.3.0 (2026-11-26)


### Features

- **cli:** add the cngx cli over the shared query core ([#677](https://github.com/cngxjs/cngx/issues/677)) ([0dd4cc4](https://github.com/cngxjs/cngx/commit/0dd4cc40dd0b5e126f45811e9e5648c930352e2e))
- **cli:** pin answers to the installed cngx release, cache snapshots on disk, take several names and run cngx doctor ([#700](https://github.com/cngxjs/cngx/issues/700)) ([4020c63](https://github.com/cngxjs/cngx/commit/4020c634b1e2f546ed555d4dda8d3fbe174bb7ec))
- **common:** give dialogs and the drawer surface modal hotkey scopes ([#752](https://github.com/cngxjs/cngx/issues/752)) ([67d7757](https://github.com/cngxjs/cngx/commit/67d775731f99c34d59f6270b471f69b0f850d751))
- **common,core,themes:** move dropdown menu focus into the menu and lift solid button contrast to AA ([#716](https://github.com/cngxjs/cngx/issues/716)) ([1cf9e4e](https://github.com/cngxjs/cngx/commit/1cf9e4eee09caff8e70de4458831a4de3e2150b2))
- **common,forms,ui,themes:** move the close and action buttons onto the cngx button core ([#674](https://github.com/cngxjs/cngx/issues/674)) ([df98cf8](https://github.com/cngxjs/cngx/commit/df98cf83fb3dcb9c51a129e07bd2f6c84202d981))
- **common/button:** add @cngx/common/button with CngxButton and CngxIconButton ([#660](https://github.com/cngxjs/cngx/issues/660)) ([dd738fc](https://github.com/cngxjs/cngx/commit/dd738fc526778e589800fa8f32bf88b1ec30bc9d))
- **common/button:** add CngxButtonGroup with addon and separator segments ([#663](https://github.com/cngxjs/cngx/issues/663)) ([e7319d7](https://github.com/cngxjs/cngx/commit/e7319d772d11ae67172f50f3334f994e9dad8106))
- **common/button:** build every button host on CngxButtonBrain and a run-state seam ([#741](https://github.com/cngxjs/cngx/issues/741)) ([e6c299b](https://github.com/cngxjs/cngx/commit/e6c299b0e3eaa177c1a841e324dd2784dcea7683))
- **common/card:** paint the severity accent with the feedback recipe and add a status icon ([#882](https://github.com/cngxjs/cngx/issues/882)) ([345dd7a](https://github.com/cngxjs/cngx/commit/345dd7aeda493ae99905877e77ea8834b57894ee))
- **common/display:** snap icon boxes to whole pixels and add the 12-grid micro tier ([#704](https://github.com/cngxjs/cngx/issues/704)) ([9518200](https://github.com/cngxjs/cngx/commit/9518200d91dacb3d2ee08818dfd407d218d61434))
- **common/display:** add the 16-grid small icon tier mechanics and sign-off sheet ([#726](https://github.com/cngxjs/cngx/issues/726)) ([a676c03](https://github.com/cngxjs/cngx/commit/a676c033fbb60f6a6268fcb0765b3c4a3191ed74))
- **common/display:** 16-grid small icon tier and band consumers on the 16px box ([#732](https://github.com/cngxjs/cngx/issues/732)) ([73a7b04](https://github.com/cngxjs/cngx/commit/73a7b0409520ff1a9b9afe30942d82f00ed49c98))
- **common/interactive:** emit settled per cngxAsyncClick run and hand actions an abort signal ([#729](https://github.com/cngxjs/cngx/issues/729)) ([02f626e](https://github.com/cngxjs/cngx/commit/02f626e5cba97446d9834c2a366cb7b32b80ae49))
- **common/interactive:** add the hotkey registry and run CngxKeyboardShortcut on it ([#749](https://github.com/cngxjs/cngx/issues/749)) ([d5504b3](https://github.com/cngxjs/cngx/commit/d5504b36387a47c68564ca1790968b57155d899f))
- **common/interactive:** run the action button and popover action on a shared action status brain ([#760](https://github.com/cngxjs/cngx/issues/760)) ([94e065b](https://github.com/cngxjs/cngx/commit/94e065b54651859e221112c4197d6e6d6100947e))
- **common/interactive:** forward the copy outputs and resetDelay from CngxCopyBlock ([#935](https://github.com/cngxjs/cngx/issues/935)) ([0fc1607](https://github.com/cngxjs/cngx/commit/0fc1607775be1d13cf35ff43e017c271cf44abef))
- **common/layout:** add the sidebar, panel trigger and modal drawer surface ([#742](https://github.com/cngxjs/cngx/issues/742)) ([5242889](https://github.com/cngxjs/cngx/commit/52428896fb7f8869105a6feed77aaa9f6d1a21b0))
- **common/layout:** ship the sidebar and drawer base skins and run the rail helpers on the nav atoms ([#812](https://github.com/cngxjs/cngx/issues/812)) ([842d1e9](https://github.com/cngxjs/cngx/commit/842d1e95ebd8f87d855f94a75275c4503bc8f33b))
- **common/menu-button:** add CngxMenuButton as a button type that opens a menu ([#683](https://github.com/cngxjs/cngx/issues/683)) ([a639a91](https://github.com/cngxjs/cngx/commit/a639a917696ef6809bad7f56d5774cb71be80535))
- **common/menu-button:** add CngxIconMenuButton and CngxSplitButton ([#684](https://github.com/cngxjs/cngx/issues/684)) ([768a167](https://github.com/cngxjs/cngx/commit/768a1674059f42d59ea569d81d447df18693bff6))
- **common/popover:** rebuild the popover footer actions on CngxButtonBrain ([#748](https://github.com/cngxjs/cngx/issues/748)) ([0c76c5e](https://github.com/cngxjs/cngx/commit/0c76c5e21ab20372c6432c67b531191e718d92c5))
- **core/schematics:** move the mcp pin in editor configs cngx wrote ([#730](https://github.com/cngxjs/cngx/issues/730)) ([4be0b30](https://github.com/cngxjs/cngx/commit/4be0b303b68b2506ebcbfdad2d02a1eb9d58b871))
- **core/schematics:** place the ngmodule outlets on @angular/build 22.3 and later ([#929](https://github.com/cngxjs/cngx/issues/929)) ([61bd402](https://github.com/cngxjs/cngx/commit/61bd402c73663f13cf25daccb1c7a0d8466b0a03))
- **core/theming:** derive the primary and danger text and strong rungs via relative colour syntax ([#725](https://github.com/cngxjs/cngx/issues/725)) ([134d912](https://github.com/cngxjs/cngx/commit/134d912e002d13d64ff93e466803e1b409d2e159))
- **forms/controls:** warn in dev mode when a bridged atom is also bound by a parent value ([#890](https://github.com/cngxjs/cngx/issues/890)) ([b49e012](https://github.com/cngxjs/cngx/commit/b49e012a167b7323a9dabe6345e96f39c115ca8f))
- **forms/field:** warn in dev mode when a field control is also bound by hand ([#886](https://github.com/cngxjs/cngx/issues/886)) ([ec7d707](https://github.com/cngxjs/cngx/commit/ec7d707cac9a1c62b53daa601296ba1a2f41043c))
- **forms/select:** summarize the reorderable multi-select trigger and sort its values in the panel on touch ([#648](https://github.com/cngxjs/cngx/issues/648)) ([d8e2f18](https://github.com/cngxjs/cngx/commit/d8e2f18b6e083ab63d800a9b7f78634769a0ff70))
- **forms/select:** make the tree-select readable and usable on desktop and touch ([#658](https://github.com/cngxjs/cngx/issues/658)) ([423f742](https://github.com/cngxjs/cngx/commit/423f7422655b85e243b039372091255ca8c5b7f6))
- **forms/select:** fit as many chips as the strip holds and fold the rest into the +N badge ([#685](https://github.com/cngxjs/cngx/issues/685)) ([dee41fa](https://github.com/cngxjs/cngx/commit/dee41fa65c50da879494a85c4ca2125eeb93632e))
- **forms/select:** drop the selected-row fill in multi-value panels and keep the cursor on top ([#686](https://github.com/cngxjs/cngx/issues/686)) ([67f18e5](https://github.com/cngxjs/cngx/commit/67f18e5475365e4a58324f711c11aff9f738bb5c))
- **forms/select:** add the select-prefixed commit controller names and deprecate the old ones ([#925](https://github.com/cngxjs/cngx/issues/925)) ([89343a9](https://github.com/cngxjs/cngx/commit/89343a976389a459f01844d14b1c1a1077baba83))
- **mcp:** read schema-6 snapshots next to schema 2 ([#669](https://github.com/cngxjs/cngx/issues/669)) ([dcf170f](https://github.com/cngxjs/cngx/commit/dcf170fc20c944d07ef8ed79581493017d9e5f96))
- **mcp,cli:** explain a CNGX error code ([#736](https://github.com/cngxjs/cngx/issues/736)) ([a06a912](https://github.com/cngxjs/cngx/commit/a06a9128d5a1d4b890fce1e890d75d2643894d99))
- **mcp,cli:** explain a code for a requested cngx release ([#740](https://github.com/cngxjs/cngx/issues/740)) ([a2abbd6](https://github.com/cngxjs/cngx/commit/a2abbd6ab857d25e646e06035e81044561c532e3))
- **scripts:** publish @cngx/mcp and @cngx/cli in lockstep with the libraries ([#727](https://github.com/cngxjs/cngx/issues/727)) ([ab2d19a](https://github.com/cngxjs/cngx/commit/ab2d19a8257056e07c281cd9c9c55d27fc4d7802))
- **themes:** give the cngx button family the Material 3 bridge ([#679](https://github.com/cngxjs/cngx/issues/679)) ([6926f29](https://github.com/cngxjs/cngx/commit/6926f2980f9aa2fccae985422b9bef5aa0d9ff3c))
- **themes/material:** bridge the menu buttons, the split button and the menu dropdown to Material 3 ([#688](https://github.com/cngxjs/cngx/issues/688)) ([6a18fa2](https://github.com/cngxjs/cngx/commit/6a18fa259ad60c108eaca0043659eea9eac4b1a8))
- **themes/material:** map the M3 list item and navigation rail onto the sidenav and nav rail ([#824](https://github.com/cngxjs/cngx/issues/824)) ([d2b2c8a](https://github.com/cngxjs/cngx/commit/d2b2c8a8703f1fd0ba11794f9887d544675278f3))
- **ui/feedback:** draw the toast on the overlay surface with an alert-style action ([#739](https://github.com/cngxjs/cngx/issues/739)) ([474a853](https://github.com/cngxjs/cngx/commit/474a853c0dd50c9d978f6bad8738c9bb269d6051))
- **ui/feedback:** show the toast timer and hold queued toasts until shown ([#744](https://github.com/cngxjs/cngx/issues/744)) ([684718f](https://github.com/cngxjs/cngx/commit/684718fc57063099c3422b37ec8589bf03bccf8d))
- **ui/nav-rail:** add the navigation rail on nav atoms that carry their own row skin ([#788](https://github.com/cngxjs/cngx/issues/788)) ([179f4de](https://github.com/cngxjs/cngx/commit/179f4de57114d92669773f2203b3d2b2517ac65c))
- **ui/sidenav:** keep the rail a crop of the sidenav and animate between rail, peek and expanded ([#797](https://github.com/cngxjs/cngx/issues/797)) ([c51a8a6](https://github.com/cngxjs/cngx/commit/c51a8a68060514dd25b91dc8aad9241600e66aa5))
- **utils:** draw every default glyph from one framework-agnostic icon set ([#690](https://github.com/cngxjs/cngx/issues/690)) ([1fae42d](https://github.com/cngxjs/cngx/commit/1fae42d15b8b12b76fb98357a4a116989a11e347))
- **utils:** draw 12-grid micro glyphs for 17 default icons ([#709](https://github.com/cngxjs/cngx/issues/709)) ([97b5ab0](https://github.com/cngxjs/cngx/commit/97b5ab0a9565302d1af4680e8b5cdb75080da221))
- **utils:** link diagnostics to the docs of the installed version ([#764](https://github.com/cngxjs/cngx/issues/764)) ([f6a7456](https://github.com/cngxjs/cngx/commit/f6a7456bcf57ec4c1c5990bff9f9c7ab934c6183))
- **utils,forms:** finish the 12-grid micro icon set and add a reorder move glyph slot ([#721](https://github.com/cngxjs/cngx/issues/721)) ([3082069](https://github.com/cngxjs/cngx/commit/308206919c2d7331cfc46d94c9aed225692ed93b))

### Bug Fixes

- **cli,doctor:** close the pre-release block of the cli review ([#718](https://github.com/cngxjs/cngx/issues/718)) ([8e71206](https://github.com/cngxjs/cngx/commit/8e7120673a933b04ec8d44e5af7214531459829f))
- **common:** name the tab group and the stepper through their i18n label only ([#775](https://github.com/cngxjs/cngx/issues/775)) ([6789aa1](https://github.com/cngxjs/cngx/commit/6789aa1b243eaa03c592cb2cb11e5c50f155af3f))
- **common:** derive card, avatar, chip and tag tokens from the theme and drop dead fallbacks ([#881](https://github.com/cngxjs/cngx/issues/881)) ([4849fa6](https://github.com/cngxjs/cngx/commit/4849fa6b279dab5040ae1f8d170623e4afad1c65))
- **common:** derive interactive, badge and divider tokens from the theme and drop dead fallbacks ([#885](https://github.com/cngxjs/cngx/issues/885)) ([cc3dc5a](https://github.com/cngxjs/cngx/commit/cc3dc5ab652a0112662312f2720536c5f263baf8))
- **common:** harden the keyboard model of hotkeys, active descendant, roving tabindex and activation key ([#909](https://github.com/cngxjs/cngx/issues/909)) ([022e013](https://github.com/cngxjs/cngx/commit/022e013422a34eacce818cf6640503d70647f7a8))
- **common:** restore focus only when lost, harden live regions and bind CngxExpandable two-way ([#912](https://github.com/cngxjs/cngx/issues/912)) ([92a25e9](https://github.com/cngxjs/cngx/commit/92a25e9489fc6161748a126ccc1eae002cfedc93))
- **common:** read the popover Escape gate at keydown time ([#921](https://github.com/cngxjs/cngx/issues/921)) ([249368e](https://github.com/cngxjs/cngx/commit/249368e1a22a445d3054dbc7bc8206c040ec6fd5))
- **common,core:** close four silent paths in direction, audio pitch, command sources and scroll edges ([#647](https://github.com/cngxjs/cngx/issues/647)) ([6b98b99](https://github.com/cngxjs/cngx/commit/6b98b99fddb00d4941d6ac9a69207a49fd48e3ed))
- **common,forms,ui:** derive option, chip and row tints from the primary colour ([#847](https://github.com/cngxjs/cngx/issues/847)) ([ccbc84e](https://github.com/cngxjs/cngx/commit/ccbc84e78797a67860df67b94e93511dcada7b1d))
- **common,forms,ui:** fix inset divider height, select shadow, filter-builder fallback, toast type ([#902](https://github.com/cngxjs/cngx/issues/902)) ([4d83f6b](https://github.com/cngxjs/cngx/commit/4d83f6bed4f8dfe9829aa80b6e0b99acecb3df73))
- **common,forms,ui,themes:** land the internal glyphs on the 12px micro box ([#713](https://github.com/cngxjs/cngx/issues/713)) ([51320ed](https://github.com/cngxjs/cngx/commit/51320ed7b52161b193106e2ceb9d1d79bc89ad22))
- **common,ui:** keep the button label in the accessible name while busy ([#702](https://github.com/cngxjs/cngx/issues/702)) ([e7015b8](https://github.com/cngxjs/cngx/commit/e7015b8d78fe6c297682be0fcdff82411a52dbe3))
- **common,ui:** close the loading-gate review of [#712](https://github.com/cngxjs/cngx/issues/712) ([#731](https://github.com/cngxjs/cngx/issues/731)) ([c5020dc](https://github.com/cngxjs/cngx/commit/c5020dca7663975454b8a34c2f51216ac6640d9a))
- **common,ui:** skin the accordion by class and document the skin and story ownership rules ([#854](https://github.com/cngxjs/cngx/issues/854)) ([6f4167a](https://github.com/cngxjs/cngx/commit/6f4167a2a9081dacdaeeaf69f44f396b8142930d))
- **common,ui:** close the button review 3 runtime nits and test gaps ([#903](https://github.com/cngxjs/cngx/issues/903)) ([ee8b2b6](https://github.com/cngxjs/cngx/commit/ee8b2b61141dc83fb5404a86e9e10296302fe80a))
- **common,ui,examples:** keep a sheet's inert claim through a popover close fade and leave footer focus where the user put it ([#867](https://github.com/cngxjs/cngx/issues/867)) ([2054153](https://github.com/cngxjs/cngx/commit/20541537a9a92ded9849e52d7d92fc4efde10e15))
- **common,ui,examples:** make the sidenav a navigation landmark and layer its Escape and announcement ([#874](https://github.com/cngxjs/cngx/issues/874)) ([8de7dfb](https://github.com/cngxjs/cngx/commit/8de7dfb982f7418d3a28584b39184a610ffda8cb))
- **common,ui,forms:** gate the async-click busy visual and the recycler skeleton behind the loading config ([#712](https://github.com/cngxjs/cngx/issues/712)) ([8ddb8bd](https://github.com/cngxjs/cngx/commit/8ddb8bdda45c6f78e127572b78b835a7322b43e9))
- **common,ui,themes:** speak settles during the popover close fade, move the last on-* readers to strong pairs ([#848](https://github.com/cngxjs/cngx/issues/848)) ([8d6baa9](https://github.com/cngxjs/cngx/commit/8d6baa9ee99fc0ec28f818a9d884d2dcb0784a29))
- **common,ui,themes:** let primary tokens follow the brand primary instead of Ember ([#857](https://github.com/cngxjs/cngx/issues/857)) ([c3eef7b](https://github.com/cngxjs/cngx/commit/c3eef7bceb0984d50b570df2827107523df5076e))
- **common,ui,themes:** keep select and paginator styles independent of the listbox skin load order ([#869](https://github.com/cngxjs/cngx/issues/869)) ([e11f5c9](https://github.com/cngxjs/cngx/commit/e11f5c9534390de8d50028734f5c59ea520ed23c))
- **common/button:** floor touch targets, paint states under forced colors and flip clipped menus ([#774](https://github.com/cngxjs/cngx/issues/774)) ([bee0ab6](https://github.com/cngxjs/cngx/commit/bee0ab61751a9a6aaa0e37308a6b1176cb8d5c95))
- **common/button:** close the button family behaviour gaps from the re-review ([#811](https://github.com/cngxjs/cngx/issues/811)) ([c9ff389](https://github.com/cngxjs/cngx/commit/c9ff389267c21b3fef27c5d6a171952b755da7e8))
- **common/button:** meet secondary and toggle contrast, keep sheet announcements and footer focus ([#839](https://github.com/cngxjs/cngx/issues/839)) ([0214ac5](https://github.com/cngxjs/cngx/commit/0214ac5c760fb223d0f4e1a4f59000f3c7137a54))
- **common/button:** make the secondary fill visible against the page and keep neutral solid above it ([#846](https://github.com/cngxjs/cngx/issues/846)) ([8c44b3b](https://github.com/cngxjs/cngx/commit/8c44b3bff11a8fbf7c5b1f8c5df983cb79f998e2))
- **common/button,themes/material:** keep the neutral tone on a link button ([#696](https://github.com/cngxjs/cngx/issues/696)) ([39b97c0](https://github.com/cngxjs/cngx/commit/39b97c0774d3e16d381cf616992df9a353c2af97))
- **common/chart:** draw markers, strokes, gutters and forced-colors steps from what is bound ([#649](https://github.com/cngxjs/cngx/issues/649)) ([3674cf9](https://github.com/cngxjs/cngx/commit/3674cf9c038b4b1fcdead7d8b54145024ed507a7))
- **common/data:** derive the resource bridge state per request and harden CngxAsync ([#927](https://github.com/cngxjs/cngx/issues/927)) ([89cdcdb](https://github.com/cngxjs/cngx/commit/89cdcdbc1e2e521199d86198b5f85afc09dee1be))
- **common/data:** settle async-state actions once and honour cancellation and destroy ([#932](https://github.com/cngxjs/cngx/issues/932)) ([1404276](https://github.com/cngxjs/cngx/commit/14042764cbaffe146a547a148963ed9096e947a6))
- **common/dialog:** start a drag from non-interactive content inside the handle ([#941](https://github.com/cngxjs/cngx/issues/941)) ([e14e423](https://github.com/cngxjs/cngx/commit/e14e4235ae68abe5646df92f7901398ca081e4da))
- **common/display:** apply the cngx-icon size presets and keep an explicit svg fill ([#664](https://github.com/cngxjs/cngx/issues/664)) ([a1a0991](https://github.com/cngxjs/cngx/commit/a1a099114fb22ba53f1446f998b9f1239df5647f))
- **common/interactive:** clip the ripple wave, not its host ([#666](https://github.com/cngxjs/cngx/issues/666)) ([6180f9d](https://github.com/cngxjs/cngx/commit/6180f9d6f01b3a116ef537d73a1969eda2ea5603))
- **common/interactive:** keep disabled menu and listbox triggers from opening on the keyboard ([#681](https://github.com/cngxjs/cngx/issues/681)) ([1794f0a](https://github.com/cngxjs/cngx/commit/1794f0ae6e381b1ec5de0bd49d723ec968f6a0fc))
- **common/interactive:** start the checkbox group's arrow-key axis on its vertical layout ([#767](https://github.com/cngxjs/cngx/issues/767)) ([6583fa1](https://github.com/cngxjs/cngx/commit/6583fa18defefc717564883d053efeda7bea6b9f))
- **common/interactive:** keep disabled button toggles focusable and clear the arrow-select flag on toggles and radios ([#798](https://github.com/cngxjs/cngx/issues/798)) ([9e52cff](https://github.com/cngxjs/cngx/commit/9e52cff6129295efd0392058a5b9f4156801aa90))
- **common/interactive:** keep nav rows at their height in a column too short for them ([#802](https://github.com/cngxjs/cngx/issues/802)) ([81a3896](https://github.com/cngxjs/cngx/commit/81a38969319ebe54307d72d7cf09f9ca4f684279))
- **common/interactive:** drop the popover panel strip from the menu skin ([#823](https://github.com/cngxjs/cngx/issues/823)) ([3e2f91d](https://github.com/cngxjs/cngx/commit/3e2f91d7319eab5053ce0326b5bc6aeeaf2f82dc))
- **common/interactive:** paint async states at zero specificity and drop the button exclusion ([#834](https://github.com/cngxjs/cngx/issues/834)) ([1987299](https://github.com/cngxjs/cngx/commit/1987299dbdab18144d64d345af677dfbdaa0ce2c))
- **common/interactive:** let the toggle on-track follow the primary colour ([#851](https://github.com/cngxjs/cngx/issues/851)) ([e211d96](https://github.com/cngxjs/cngx/commit/e211d9616def5998ff7579f15916d5c61322c591))
- **common/interactive:** let the toggle track and thumb tokens inherit from the host ([#866](https://github.com/cngxjs/cngx/issues/866)) ([17bb912](https://github.com/cngxjs/cngx/commit/17bb912c8801204e9b0e93bdc91a5c6bcafc7b5a))
- **common/interactive:** speak the settle text of a host removed by its own settle and fix button doc drift ([#889](https://github.com/cngxjs/cngx/issues/889)) ([9d674ff](https://github.com/cngxjs/cngx/commit/9d674ffab70c50a131785269aa6fd3b5b55a90bd))
- **common/interactive:** speak only on text transitions and pass the routed component to the guard ([#910](https://github.com/cngxjs/cngx/issues/910)) ([6f54b27](https://github.com/cngxjs/cngx/commit/6f54b27f9a421ad754525a8486d39fb6788bbeff))
- **common/interactive:** harden the gesture, ripple and pointer atoms and the tooltip motion class ([#911](https://github.com/cngxjs/cngx/issues/911)) ([4af72ec](https://github.com/cngxjs/cngx/commit/4af72ec7f2475f6a95d5abf843f87b43218c20bf))
- **common/interactive:** keep async status focusable and bridge async tokens on the theme host ([#924](https://github.com/cngxjs/cngx/issues/924)) ([d694bf5](https://github.com/cngxjs/cngx/commit/d694bf5a82fc23bae1843fa5f9abd5139b6e4a96))
- **common/interactive:** gate, announce and register the error atoms consistently ([#926](https://github.com/cngxjs/cngx/issues/926)) ([2789682](https://github.com/cngxjs/cngx/commit/2789682efd167a2b46bb69f6a63c9263ff27d698))
- **common/interactive:** report, show and announce a failed copy in the copy units ([#930](https://github.com/cngxjs/cngx/issues/930)) ([9a41203](https://github.com/cngxjs/cngx/commit/9a4120307e283e1ee5a95748e388358cad6261e2))
- **common/interactive:** let an ancestor set every copy block token ([#936](https://github.com/cngxjs/cngx/issues/936)) ([efddb83](https://github.com/cngxjs/cngx/commit/efddb83777392642db6a047b811e8278a5c6c45e))
- **common/layout:** swallow the trailing click of a gesture that dismissed a page-modal surface ([#759](https://github.com/cngxjs/cngx/issues/759)) ([5373fcd](https://github.com/cngxjs/cngx/commit/5373fcdf157a61537480337f83b8a3ac7f3a1f1c))
- **common/layout:** read the synced query-param key once inputs are bound ([#768](https://github.com/cngxjs/cngx/issues/768)) ([009b39f](https://github.com/cngxjs/cngx/commit/009b39f26b6a739cf7f841a7f8c78b31617a6195))
- **common/layout:** keep a visible drawer backdrop live and correct the drawer stories ([#827](https://github.com/cngxjs/cngx/issues/827)) ([87c9603](https://github.com/cngxjs/cngx/commit/87c96031643022a19d9f0a607bdcb4dda735aad4))
- **common/popover:** stop a bare popover host from clipping the shadow of its content ([#694](https://github.com/cngxjs/cngx/issues/694)) ([74d61c4](https://github.com/cngxjs/cngx/commit/74d61c408648d77f6451612bea1118debc89d0e3))
- **common/popover:** restore trigger focus only when focus is lost ([#695](https://github.com/cngxjs/cngx/issues/695)) ([37f9683](https://github.com/cngxjs/cngx/commit/37f9683a7c5920396251cf8e32f480be2ae3789b))
- **common/popover:** return focus from the popover panel and claim composer hints per owner ([#745](https://github.com/cngxjs/cngx/issues/745)) ([f8670b9](https://github.com/cngxjs/cngx/commit/f8670b9cbe2d8232e3a18b79346d350f37cf2101))
- **common/popover:** restore trigger focus when the popover closes before change detection runs ([#751](https://github.com/cngxjs/cngx/issues/751)) ([4dac188](https://github.com/cngxjs/cngx/commit/4dac1887f62c0c524826d24d09b5db611c9c2cbe))
- **common/popover:** reset bare popover chrome at zero specificity instead of excluding consumers ([#822](https://github.com/cngxjs/cngx/issues/822)) ([0361b4c](https://github.com/cngxjs/cngx/commit/0361b4c1501981568ba787a5905e09d538981846))
- **common/popover:** lay out and cap the anchored sheet host like the modal presentations ([#877](https://github.com/cngxjs/cngx/issues/877)) ([b8415ca](https://github.com/cngxjs/cngx/commit/b8415ca39d7e5e200a8170e97657eed09544b314))
- **common/popover:** keep focus on the trigger through the close fade and a sheet backdrop tap ([#880](https://github.com/cngxjs/cngx/issues/880)) ([d34b52c](https://github.com/cngxjs/cngx/commit/d34b52c5c47ab75525f23de03371a8c2acd24303))
- **common/popover:** write the anchor placement styles before showPopover() ([#922](https://github.com/cngxjs/cngx/issues/922)) ([f83f5cc](https://github.com/cngxjs/cngx/commit/f83f5ccad322b2a6d668b7669645c290bc58f5ef))
- **common/tabs:** name the tab group from the tabs i18n label unless an aria label is configured ([#771](https://github.com/cngxjs/cngx/issues/771)) ([1dcadf1](https://github.com/cngxjs/cngx/commit/1dcadf17b36b12d745732e64951336ca5b992820))
- **core:** harden key combo matching and add combo helpers ([#747](https://github.com/cngxjs/cngx/issues/747)) ([b4b34bf](https://github.com/cngxjs/cngx/commit/b4b34bfbb309b4b981f2f5902e3c89c44ebf04ca))
- **core:** harden storage, the keyed registry and the preference axes ([#793](https://github.com/cngxjs/cngx/issues/793)) ([1da289c](https://github.com/cngxjs/cngx/commit/1da289c8d022bf824c5469ebcb11f6ab1af4a9e2))
- **core:** handle the reviewed edge cases in selection, transition, pack merge, typeahead folding and the announcement recorder ([#818](https://github.com/cngxjs/cngx/issues/818)) ([2c46b3c](https://github.com/cngxjs/cngx/commit/2c46b3cd504d66441527f3c75773ea3e417da34b))
- **core:** translate the german breadcrumb labels and describe what the core package ships ([#840](https://github.com/cngxjs/cngx/issues/840)) ([9af63f6](https://github.com/cngxjs/cngx/commit/9af63f61123c87607803c85d6d0f921d709d80ee))
- **core/schematics:** close the ng add findings of the second independent review ([#652](https://github.com/cngxjs/cngx/issues/652)) ([3977177](https://github.com/cngxjs/cngx/commit/39771772a69b2429a348dcf19118cc33a9ef5d31))
- **core/schematics:** close the dry-run, stylesheet and manifest gaps and correct the core docs ([#795](https://github.com/cngxjs/cngx/issues/795)) ([54e6cb1](https://github.com/cngxjs/cngx/commit/54e6cb1c7e3314dff80116bd7a16b26ee43c1802))
- **core/schematics:** keep line endings, read git from the workspace root and harden ng add input handling ([#837](https://github.com/cngxjs/cngx/issues/837)) ([99279a2](https://github.com/cngxjs/cngx/commit/99279a2ddb3dbbb53ce304afe99011af1bbe4ff3))
- **core/schematics,themes/material:** set rtl on <html>, rename only project sources, map muted text ([#809](https://github.com/cngxjs/cngx/issues/809)) ([0402069](https://github.com/cngxjs/cngx/commit/040206990e2f0cbd9560701c361497f84b95ef68))
- **core/theming:** keep reduced motion, contrast and the material bridge honest ([#790](https://github.com/cngxjs/cngx/issues/790)) ([6fe1891](https://github.com/cngxjs/cngx/commit/6fe1891bde11fed424c3901bbc9bb6673805c7b1))
- **core/theming:** cover the root, delays and pulse tokens under reduced motion and add the touch-target axis to the a11y preferences ([#821](https://github.com/cngxjs/cngx/issues/821)) ([2c4b6c1](https://github.com/cngxjs/cngx/commit/2c4b6c1971a284cf63a096b2f711736f9c9ce242))
- **core/theming:** add status text rungs and harden bare controls and more contrast ([#845](https://github.com/cngxjs/cngx/issues/845)) ([4d0e206](https://github.com/cngxjs/cngx/commit/4d0e2067bdf80ca3b9540c3fe8a270b9eef4e5e9))
- **core/theming:** give small targets a 24px hit area on a fine pointer ([#853](https://github.com/cngxjs/cngx/issues/853)) ([4f9ba6f](https://github.com/cngxjs/cngx/commit/4f9ba6f597c361a27998557dbdf785cecb021a49))
- **forms:** keep error text off error-state containers and Escape off dirty action panels ([#863](https://github.com/cngxjs/cngx/issues/863)) ([9ee5b36](https://github.com/cngxjs/cngx/commit/9ee5b3615d8bc816fc3b2ee669cb8719b181012e))
- **forms:** derive the commit error hint and file-drop tokens from the theme and drop dead fallbacks ([#891](https://github.com/cngxjs/cngx/issues/891)) ([6d8e012](https://github.com/cngxjs/cngx/commit/6d8e012274f03f51a3f993c69f480a9aa02d4e49))
- **forms,common,themes:** close the select review residue ([#653](https://github.com/cngxjs/cngx/issues/653)) ([6671dda](https://github.com/cngxjs/cngx/commit/6671ddaec56c9548bc2bcf0d044111749e5ea2e8))
- **forms,themes:** colour the select checkmark and declare the primary-following token defaults ([#879](https://github.com/cngxjs/cngx/issues/879)) ([1a411e6](https://github.com/cngxjs/cngx/commit/1a411e6d3d5867e6831a57f9b011cca6a8fd2d75))
- **forms/controls:** stop forwarding a parent value binding to Reactive Forms as a user change ([#887](https://github.com/cngxjs/cngx/issues/887)) ([c1fa430](https://github.com/cngxjs/cngx/commit/c1fa4301b4b2d0699071108ae153825cd75a7c5b))
- **forms/field:** reach every control from the summary, gate the hint and reason ids and warn on duplicate field ids ([#805](https://github.com/cngxjs/cngx/issues/805)) ([54680ff](https://github.com/cngxjs/cngx/commit/54680ff14e82b17b3d50705a422470d32c75b0fb))
- **forms/field:** name and describe the control the field discovered and keep the error regions stable ([#806](https://github.com/cngxjs/cngx/issues/806)) ([223ee62](https://github.com/cngxjs/cngx/commit/223ee62f06aeda7aa70ad827f6db8cac70973a75))
- **forms/field:** paint errors and markers in the scheme danger text, lift affixes to the touch floor and drop the dead demos ([#816](https://github.com/cngxjs/cngx/issues/816)) ([65046c8](https://github.com/cngxjs/cngx/commit/65046c8d37c2964fc09a7c474947a16a39e30270))
- **forms/field:** sync the value of the atom the field discovered ([#828](https://github.com/cngxjs/cngx/issues/828)) ([462675c](https://github.com/cngxjs/cngx/commit/462675cde53a344cbe93b13b4c5b10f7aba15737))
- **forms/field:** keep field error and disabled paint in every state and match token fallbacks to their defaults ([#831](https://github.com/cngxjs/cngx/issues/831)) ([81a69f9](https://github.com/cngxjs/cngx/commit/81a69f929fed475fa8761b34983ef082b08f3355))
- **forms/field:** tint the M2 fill field like its Material twin, add a field ring colour token ([#842](https://github.com/cngxjs/cngx/issues/842)) ([318c0e9](https://github.com/cngxjs/cngx/commit/318c0e96990be6c08555bb24fdda08903be90ac5))
- **forms/field:** keep the fill autofill shadow from flashing the primary colour on focus changes ([#844](https://github.com/cngxjs/cngx/issues/844)) ([c1fd40d](https://github.com/cngxjs/cngx/commit/c1fd40dc28898988a0fe5c35c11d23f6fa436605))
- **forms/field:** keep the fill surface and danger line on an invalid autofilled field ([#850](https://github.com/cngxjs/cngx/issues/850)) ([c0e6a65](https://github.com/cngxjs/cngx/commit/c0e6a658da2999a809998d72fa8c7c9198962de6))
- **forms/filter-builder:** disable every control and block writes while the field is disabled ([#898](https://github.com/cngxjs/cngx/issues/898)) ([9f1b555](https://github.com/cngxjs/cngx/commit/9f1b55557b09f2e506856765f6dc29ba9874fcdf))
- **forms/input:** warn when a cngxInput sits in a Signal Forms field without a [formField] binding ([#838](https://github.com/cngxjs/cngx/issues/838)) ([669e192](https://github.com/cngxjs/cngx/commit/669e1926aef2420341dc50628fe058c2a76089cd))
- **forms/select:** show the placeholder at the inline start of an empty trigger on every select ([#651](https://github.com/cngxjs/cngx/issues/651)) ([eaac3f6](https://github.com/cngxjs/cngx/commit/eaac3f64e0f5a50fdd8592938b3c608e650f1b86))
- **forms/select:** close eight select review code findings ([#667](https://github.com/cngxjs/cngx/issues/667)) ([36df9dc](https://github.com/cngxjs/cngx/commit/36df9dc67dff87779471a968d1c71fca5a3eb0a3))
- **forms/select:** match the trigger corner radius to form inputs ([#692](https://github.com/cngxjs/cngx/issues/692)) ([90e81fe](https://github.com/cngxjs/cngx/commit/90e81fee8a9b97cc12601b6b2f96be30c862589e))
- **forms/select:** route every select commit through one commit ledger ([#706](https://github.com/cngxjs/cngx/issues/706)) ([2c2d554](https://github.com/cngxjs/cngx/commit/2c2d5549891fee403f6ad808d9c6356b44663014))
- **forms/select:** floor the select clear button to a 24px hit area on a fine pointer ([#720](https://github.com/cngxjs/cngx/issues/720)) ([4458f98](https://github.com/cngxjs/cngx/commit/4458f98f67578197201719ea7a91cad22a058050))
- **forms/select:** select review 2 strand B - theming, docs, stories and test infrastructure ([#728](https://github.com/cngxjs/cngx/issues/728)) ([0bec124](https://github.com/cngxjs/cngx/commit/0bec1248a51d47426c87b92a153161908ea2abdd))
- **forms/select:** select review 2 strand A - behaviour and a11y ([#734](https://github.com/cngxjs/cngx/issues/734)) ([4021578](https://github.com/cngxjs/cngx/commit/4021578781e2328809a66bd7b1796de10f3e4cef))
- **forms/select:** decide focus gestures from the event and pin the select suites ([#756](https://github.com/cngxjs/cngx/issues/756)) ([fb07a5e](https://github.com/cngxjs/cngx/commit/fb07a5e553904f6163555fb54e2216141066b636))
- **forms/select:** settle deferred keys, measure option rows and show option labels in the input ([#769](https://github.com/cngxjs/cngx/issues/769)) ([418eeaf](https://github.com/cngxjs/cngx/commit/418eeaf4a76ea369b7e9e90e7797df58e7673b6f))
- **forms/select:** keep deferred Enter single, drop shell content-visibility and hold the last option label ([#770](https://github.com/cngxjs/cngx/issues/770)) ([5e5b995](https://github.com/cngxjs/cngx/commit/5e5b995227f92341a8745e97c23f7377fc17ed22))
- **forms/select:** close the a11y and disabled-pick gaps of projected slots and custom strategies ([#779](https://github.com/cngxjs/cngx/issues/779)) ([ec7a62d](https://github.com/cngxjs/cngx/commit/ec7a62d95029051f195eb81a19a71f762e1589a0))
- **forms/select:** stop a per-row min-block-size from re-estimating the virtual row height ([#782](https://github.com/cngxjs/cngx/issues/782)) ([b6766ad](https://github.com/cngxjs/cngx/commit/b6766ad1cae981d7c77af82d22efeb82415eb039))
- **mcp:** fail build:mcp when the bundled snapshot does not load ([#672](https://github.com/cngxjs/cngx/issues/672)) ([004c544](https://github.com/cngxjs/cngx/commit/004c5447d8de69d4439f465136069b3013b96411))
- **mcp:** harden the cli and mcp query core ([#698](https://github.com/cngxjs/cngx/issues/698)) ([86de6d8](https://github.com/cngxjs/cngx/commit/86de6d8120c6a6122f563d1299fb62657a2335a2))
- **mcp,cli:** point example urls of a fetched release at its own examples ([#773](https://github.com/cngxjs/cngx/issues/773)) ([2158d1b](https://github.com/cngxjs/cngx/commit/2158d1b2037212de2803d30e23d62d2075c6ad91))
- **select-family:** close the a11y and theming residue of the select family ([#710](https://github.com/cngxjs/cngx/issues/710)) ([9d4d149](https://github.com/cngxjs/cngx/commit/9d4d1497a34440a688f5455d2aecaf67df0b998e))
- **select-family:** close the docs, tests and config residue of the select family ([#715](https://github.com/cngxjs/cngx/issues/715)) ([e2ff0e1](https://github.com/cngxjs/cngx/commit/e2ff0e19103d65ecac3195399d7fe91df0fed40d))
- **themes/material:** bring the form field onto the mat-form-field metrics and colours ([#871](https://github.com/cngxjs/cngx/issues/871)) ([4383eac](https://github.com/cngxjs/cngx/commit/4383eac524dab6368ad834c21e9d2cc1152c553b))
- **themes/material:** size the field affixes and the value start like mat-form-field ([#875](https://github.com/cngxjs/cngx/issues/875)) ([3f28ff6](https://github.com/cngxjs/cngx/commit/3f28ff6fa3719516fea4688b1689f6abc52273a7))
- **themes/material:** paint the M2 text rung in the plain foreground text ([#878](https://github.com/cngxjs/cngx/issues/878)) ([1f5d800](https://github.com/cngxjs/cngx/commit/1f5d8004710a64505999859328ff0135450c1004))
- **themes/material:** match card, checkbox, button-toggle and divider corners and spacing to Material ([#900](https://github.com/cngxjs/cngx/issues/900)) ([102d415](https://github.com/cngxjs/cngx/commit/102d415af55f5f11ecdcbc1095cc17c47e270ef6))
- **themes/material:** set the button scheme knobs from the Material theme type ([#901](https://github.com/cngxjs/cngx/issues/901)) ([391b3be](https://github.com/cngxjs/cngx/commit/391b3be0b91dc18d3564b11f040abc608c14f93a))
- **themes/material:** lift the M2 light secondary danger label to 4.5:1 on hover and press ([#905](https://github.com/cngxjs/cngx/issues/905)) ([0dea509](https://github.com/cngxjs/cngx/commit/0dea509a1f52a03a56c6304188cfd03841c52a34))
- **themes/material:** land five M3 bridges on the elements that paint them ([#920](https://github.com/cngxjs/cngx/issues/920)) ([1e8adc7](https://github.com/cngxjs/cngx/commit/1e8adc7d1302a9a61c4ff26a1db40577a8f93738))
- **themes/material:** bring badge, chip, button toggle and card onto their M3 twins ([#923](https://github.com/cngxjs/cngx/issues/923)) ([acd78f2](https://github.com/cngxjs/cngx/commit/acd78f2eea3136563c839fbaae767a04a439e967))
- **themes/material:** bring the context menu and popover sheet onto their M3 overlay twins ([#928](https://github.com/cngxjs/cngx/issues/928)) ([c4eb9ee](https://github.com/cngxjs/cngx/commit/c4eb9ee4f3dbf1c37cd8c98a8f2f6e0644e98eae))
- **themes/material:** align the overlay bridges with mat-menu and mat-bottom-sheet follow-ups ([#931](https://github.com/cngxjs/cngx/issues/931)) ([ce29ec1](https://github.com/cngxjs/cngx/commit/ce29ec13f0372b962d79d625c55de480d159e152))
- **ui,data-display:** derive ui tokens from the theme and drop dead fallbacks on registered properties ([#897](https://github.com/cngxjs/cngx/issues/897)) ([18189c8](https://github.com/cngxjs/cngx/commit/18189c8e2a2654b9757d04a12e006adb02da981c))
- **ui,examples:** close the [#848](https://github.com/cngxjs/cngx/issues/848) smoke findings in accordion, stepper, paginator and the demos ([#855](https://github.com/cngxjs/cngx/issues/855)) ([5e2f19f](https://github.com/cngxjs/cngx/commit/5e2f19f50282d307670c5d85805c5f783ad41754))
- **ui,themes,examples:** scope sidenav ring and labels to the rail, fix M2 dark rows, merge labels ([#892](https://github.com/cngxjs/cngx/issues/892)) ([6324270](https://github.com/cngxjs/cngx/commit/632427053efcfdd18909878395a75a2b8734a316))
- **ui/command-palette:** size the palette itself under the dialog skin ([#865](https://github.com/cngxjs/cngx/issues/865)) ([cd43604](https://github.com/cngxjs/cngx/commit/cd43604805179c8dd115c92b01376398fff34810))
- **ui/feedback:** keep every undo toast and give action toasts time to be reached ([#676](https://github.com/cngxjs/cngx/issues/676)) ([81c2941](https://github.com/cngxjs/cngx/commit/81c2941b89c7f317e19a8f4881e9fb04f185f45c))
- **ui/feedback:** let the loading surfaces follow data-motion full under reduced motion ([#826](https://github.com/cngxjs/cngx/issues/826)) ([2cc37b6](https://github.com/cngxjs/cngx/commit/2cc37b6b08d630d845602f227a9f5deaab86a323))
- **ui/paginator:** drop the own coarse-pointer button size so data-touch opt-out applies ([#852](https://github.com/cngxjs/cngx/issues/852)) ([97cc957](https://github.com/cngxjs/cngx/commit/97cc95703e0bab1604ef051ffcf892df5360a7a7))
- **ui/paginator:** opt-in ripple, scheme-island colours and rounded bar focus rings ([#856](https://github.com/cngxjs/cngx/issues/856)) ([6d843b3](https://github.com/cngxjs/cngx/commit/6d843b390ba0972e564089d2aa52ea5dee66a45c))
- **ui/sidenav:** close the overlay toggle, nav-group focus and overlay role defects ([#724](https://github.com/cngxjs/cngx/issues/724)) ([0b4dc5f](https://github.com/cngxjs/cngx/commit/0b4dc5f2c1c9523ac4195a6024c7ce0cf86a7489))
- **ui/sidenav:** keep an auto rail from sliding in on load ([#808](https://github.com/cngxjs/cngx/issues/808)) ([6155367](https://github.com/cngxjs/cngx/commit/61553677e750b5dcb2a2bfebf8d575f3fac704dc))
- **ui/sidenav:** keep the layout hidden until its settled width class has been painted ([#810](https://github.com/cngxjs/cngx/issues/810)) ([c1a23ad](https://github.com/cngxjs/cngx/commit/c1a23ad72e2045e8e1447730564dc854084addce))
- **ui/sidenav:** resolve the rail tokens on the rail and read the M2 ink from the theme ([#861](https://github.com/cngxjs/cngx/issues/861)) ([8a82ec0](https://github.com/cngxjs/cngx/commit/8a82ec0417d369497ecf6e5067373cb9d520a579))
- **ui/sidenav:** one source for the overlay open state, surface and router-sync param ([#868](https://github.com/cngxjs/cngx/issues/868)) ([160c2ef](https://github.com/cngxjs/cngx/commit/160c2efa7ec41c64507ea84699ba9f519c1d6a0b))
- **ui/sidenav:** keep overlay state to a layout's own rails and drop opened on a docked rail ([#888](https://github.com/cngxjs/cngx/issues/888)) ([eaad60a](https://github.com/cngxjs/cngx/commit/eaad60a0f545a3a91c2b06fc6b80f250e7d5071c))
- **ui/skeleton:** mark shimmer bones with the cngx-skeleton__bone element of the host block ([#829](https://github.com/cngxjs/cngx/issues/829)) ([e28bfe7](https://github.com/cngxjs/cngx/commit/e28bfe7031f78f1deb9337f26f181d32617417c0))
- **ui/stepper:** break the indicator and group-chip font-size cycles ([#737](https://github.com/cngxjs/cngx/issues/737)) ([02adf36](https://github.com/cngxjs/cngx/commit/02adf3614c4fe740e8a4b02f7243ecc945803db1))
- **ui/stepper:** let the pending connector follow the step active colour ([#862](https://github.com/cngxjs/cngx/issues/862)) ([fdc0d14](https://github.com/cngxjs/cngx/commit/fdc0d1415946828a2c3c8dffe1e0de671949f18d))

### BREAKING CHANGES

- **common,core:** close four silent paths in direction, audio pitch, command sources and scroll edges ([#647](https://github.com/cngxjs/cngx/issues/647))
- **forms/select:** summarize the reorderable multi-select trigger and sort its values in the panel on touch ([#648](https://github.com/cngxjs/cngx/issues/648))
- **forms,common,themes:** close the select review residue ([#653](https://github.com/cngxjs/cngx/issues/653))
- **forms/select:** make the tree-select readable and usable on desktop and touch ([#658](https://github.com/cngxjs/cngx/issues/658))
- **common,forms,ui,themes:** move the close and action buttons onto the cngx button core ([#674](https://github.com/cngxjs/cngx/issues/674))
- **forms:** delete the remaining select review leftovers and the CngxAffixRow alias ([#678](https://github.com/cngxjs/cngx/issues/678))
- **themes:** give the cngx button family the Material 3 bridge ([#679](https://github.com/cngxjs/cngx/issues/679))
- **themes/material:** `--cngx-breadcrumb-overflow-trigger-width` and
`--cngx-breadcrumb-overflow-trigger-height` are removed. The overflow
trigger is now the xs icon-button square instead of the fixed 32x26 box.

- To change the trigger size, set `--cngx-icon-button-size` on
`.cngx-breadcrumb__overflow-trigger` from an unlayered app rule.
- The colour and radius tokens are unchanged.

Visible change (not breaking): with the Material bridge included,
neutral `outline` and `ghost` buttons across the app now render primary
labels, matching `mat-stroked-button` and `mat-button`. An app that
wants the previous on-surface label can set `--cngx-button-tone-text` on
those buttons.

The removed tokens set a box that no longer exists: the trigger is sized
by the icon-button contract, so there is no value a codemod could carry
over.
- **utils:** draw every default glyph from one framework-agnostic icon set ([#690](https://github.com/cngxjs/cngx/issues/690))
- **mcp:** harden the cli and mcp query core ([#698](https://github.com/cngxjs/cngx/issues/698))
- **forms/select:** route every select commit through one commit ledger ([#706](https://github.com/cngxjs/cngx/issues/706))
- **select-family:** close the a11y and theming residue of the select family ([#710](https://github.com/cngxjs/cngx/issues/710))
- **common,ui,forms:** gate the async-click busy visual and the recycler skeleton behind the loading config ([#712](https://github.com/cngxjs/cngx/issues/712))
- **common,core,themes:** move dropdown menu focus into the menu and lift solid button contrast to AA ([#716](https://github.com/cngxjs/cngx/issues/716))
- **select-family:** close the docs, tests and config residue of the select family ([#715](https://github.com/cngxjs/cngx/issues/715))
- **cli,doctor:** close the pre-release block of the cli review ([#718](https://github.com/cngxjs/cngx/issues/718))
- **ui/sidenav:** close the overlay toggle, nav-group focus and overlay role defects ([#724](https://github.com/cngxjs/cngx/issues/724))
- **core/theming:** derive the primary and danger text and strong rungs via relative colour syntax ([#725](https://github.com/cngxjs/cngx/issues/725))
- **common/interactive:** emit settled per cngxAsyncClick run and hand actions an abort signal ([#729](https://github.com/cngxjs/cngx/issues/729))
- **ui/feedback:** draw the toast on the overlay surface with an alert-style action ([#739](https://github.com/cngxjs/cngx/issues/739))
- **common/button:** injectButtonCore, provideButtonDescribedBy,
CngxButtonCore,
CngxButtonCoreDefaults, CngxButtonCoreInputs and hasAccessibleName are
no
longer exported; build a custom host on CngxButtonBrain. Host-class
inputs
(variant, tone, size, disabled, disabledReason, describedBy, type) and
blocked
moved to CngxButtonBrain.
- **common/layout:** an open `over` CngxDrawerPanel is a page modal dialog
by default (`role="dialog"`, `aria-modal`, focus trap, inert page,
scroll lock); set `modality="contained"` or `modality="none"` for the
old non-blocking panel. `DrawerMode` drops `side`. CngxDrawerPanel no
longer forwards the focus-trap `enabled` and `autoFocus` inputs; the
modality drives the trap. `CngxDrawerPanel.drawerRef()` is typed
`CngxDrawerHost` instead of `CngxDrawer`.
- **ui/feedback:** toasts beyond the outlet's maxVisible no longer
auto-dismiss
while hidden; their timer is held until they are shown, unless every
visible
toast is persistent.
- **common/popover:** CngxPopover.setHaspopup and CngxPopover.setControls are
replaced by claimHaspopup / releaseHaspopup and claimControls /
releaseControls. Composers claim with an owner (usually `this`) and
release that owner's claim on destroy; the last live claim wins and a
release keeps a co-composer's claim. Replace setHaspopup(v) with
claimHaspopup(this, v) and setControls(s) with claimControls(this, s),
plus releaseHaspopup(this) / releaseControls(this) on destroy.
- **core:** harden key combo matching and add combo helpers ([#747](https://github.com/cngxjs/cngx/issues/747))
- **common/popover:** cngx-popover-action is replaced by
button[cngxPopoverAction] (confirm,
[action] required) and button[cngxPopoverDismiss] (dismiss). The role
and variant inputs
and PopoverActionVariant are removed; variant and tone come from the
button family
(primary -> solid + tone primary, danger -> solid + tone danger, ghost
-> ghost,
secondary -> the outline default). Size is pinned sm. The panel accent
no longer tints
footer actions. The eight --cngx-popover-action-* tokens are removed.
CNGX1035 is retired.

### Other information

- `examples/e2e/common/popover/link-list.e2e-spec.ts:39` (Escape from a
link returns focus to the button) fails intermittently on `main` as
well; it is not touched here and gets its own fix.
- **common/interactive:** add the hotkey registry and run CngxKeyboardShortcut on it ([#749](https://github.com/cngxjs/cngx/issues/749))
- **forms/select:** select review 2 strand A - behaviour and a11y ([#734](https://github.com/cngxjs/cngx/issues/734))
- **ui/sidenav:** |Before|After|
|-|-|
|`mode="mini"`|`mode="side"` + `[(collapsed)]`, peek via
`expandOnHover`|
|`mode="push"`|`mode="side"` + `collapsedAs="hidden"` + `[(collapsed)]`|
|`--cngx-sidenav-layout-wide`|`--cngx-sidenav-width-class` rule block
(48rem / 64rem)|
|`auto` side-to-over switch auto-opens the overlay|every width-class
change starts closed|
|sidenav `id` input|id comes from the sidebar (`cngx-sidebar-N`)|
|every overlay modal|`modality` input, `'page'` by default|
|`withSidenavShortcut` on every rail|start rail only; end rails need an
explicit `[shortcut]`|
|two rails on one combo both toggle|one binding wins (`CNGX1077`)|
|resize ARIA trio omitted for non-px bounds|always rendered, non-px
bounds clamp to 120 / 600 px|

`CngxSidenavLayout` no longer locks the html scroll or listens on
`document`; a consumer that relied on either gets the surface's scoped
lock and dismissal instead.
- **common/interactive:** |Before|After|
|-|-|
|`#btn="cngxActionButton"` then `btn.succeededLabel()`,
`btn.externalState()`, `btn.toastSuccess()` and the other status / toast
inputs|template bindings unchanged (forwarded host-directive inputs);
programmatic reads go through `inject(CNGX_ACTION_STATUS)` or
`CngxActionToast`|
|`CngxActionButton.hostState` / `hostInteraction`|removed; `status`,
`busyVisible`, `state` stay on the class|
|`CngxPopoverAction.succeededAnnouncement` / `failedAnnouncement` /
`autoAnnounce` / `closeOnSuccessDelay` / `hostInteraction` on the
class|bindings unchanged; read through `CNGX_ACTION_STATUS` /
`CngxPopoverCloseOnSuccess`|
|`toastSuccessDuration` default 3000 ms (`cngxActionButton`,
`[cngxToastOn]`)|unset; the toaster resolves it (`withToasts({
defaultDuration })`, else 5000 ms). Bind `[toastSuccessDuration]="3000"`
for the old timing. Error toasts stay persistent|
|popover closes after its own success, also while `[externalState]` is
bound|closes on `CNGX_ACTION_STATUS.outcome`: an external `success` edge
closes, an own run under `[externalState]` does not|
|a projected `cngxSucceeded` is not spoken|the rendered result cell is
the settle announcement|
- **common/tabs:** name the tab group from the tabs i18n label unless an aria label is configured ([#771](https://github.com/cngxjs/cngx/issues/771))
- **common:** name the tab group and the stepper through their i18n label only ([#775](https://github.com/cngxjs/cngx/issues/775))
- **common/button:** |Before|After|
|-|-|
|`CngxContextMenuTriggerPopoverRef` (`@cngx/common/interactive`) needs
`show`, `hide`, `isVisible`, `elementRef`, `setAnchorElement`, `id`|also
needs `claimPositionTryFallbacks(owner, value)` and
`releasePositionTryFallbacks(owner)`. `CngxPopover` implements both;
only a custom popover ref passed to the context-menu core has to add
them|
- **ui/nav-rail:** add the navigation rail on nav atoms that carry their own row skin ([#788](https://github.com/cngxjs/cngx/issues/788))
- **common,ui:** skin the accordion by class and document the skin and story ownership rules ([#854](https://github.com/cngxjs/cngx/issues/854))
- **themes/material:** stop bridging Angular Material M2 themes ([#914](https://github.com/cngxjs/cngx/issues/914))
- **common/interactive:** gate, announce and register the error atoms consistently ([#926](https://github.com/cngxjs/cngx/issues/926))
- **common/interactive:** report, show and announce a failed copy in the copy units ([#930](https://github.com/cngxjs/cngx/issues/930))

## 0.1.0-rc.9 (2026-10-22)


### Features

- **common:** throw coded runtime errors in tabs, stepper, chart, interactive and data ([#594](https://github.com/cngxjs/cngx/issues/594)) ([7f36a28](https://github.com/cngxjs/cngx/commit/7f36a28ea5e58808f2cbbb42be653ed636fab540))
- **common,forms,ui:** throw coded errors for misplaced parts and prefix every diagnostic message ([#603](https://github.com/cngxjs/cngx/issues/603)) ([8ff3978](https://github.com/cngxjs/cngx/commit/8ff3978ac7a528dad6a093671f0995abb2334414))
- **common,ui:** report a refused step change as refused, not as a failure ([#619](https://github.com/cngxjs/cngx/issues/619)) ([cbe2989](https://github.com/cngxjs/cngx/commit/cbe29890d618f2ec14bf4ab34b434cde0fb7c638))
- **common,ui:** report a refused tab switch as refused, not as a failure ([#622](https://github.com/cngxjs/cngx/issues/622)) ([31b6a0b](https://github.com/cngxjs/cngx/commit/31b6a0bf8f1e2d260cb4171656c7b188debe9e1e))
- **common/popover:** open popovers as a modal bottom sheet on phones ([#608](https://github.com/cngxjs/cngx/issues/608)) ([aa560d9](https://github.com/cngxjs/cngx/commit/aa560d9da8fe62d9bde494aee1addd70253cba3a))
- **core:** add dev-mode descriptors, cascade provenance and a prod-strip guard ([#545](https://github.com/cngxjs/cngx/issues/545)) ([91d6ea0](https://github.com/cngxjs/cngx/commit/91d6ea094a8864cea79622e22ca43aeda3f71e94))
- **core:** add an announcement recorder for live regions ([#547](https://github.com/cngxjs/cngx/issues/547)) ([0745592](https://github.com/cngxjs/cngx/commit/07455925f18bf0133ca69fa763d32350f81867c1))
- **core,common,forms,ui,data-display,interop,themes:** accept angular 21.1 through 22 as a peer ([#633](https://github.com/cngxjs/cngx/issues/633)) ([cf76dd1](https://github.com/cngxjs/cngx/commit/cf76dd1f2d30cd098515d50afaab244a24e274bc))
- **core/schematics:** add the schematics build and ng-add spike ([#543](https://github.com/cngxjs/cngx/issues/543)) ([d8dd7b9](https://github.com/cngxjs/cngx/commit/d8dd7b9c843c5d9aa2d0e919245ade22fbae564f))
- **core/schematics:** add the schematics engine and its test harness ([#546](https://github.com/cngxjs/cngx/issues/546)) ([3982fae](https://github.com/cngxjs/cngx/commit/3982fae10d716c618417d9a47522076c2fead996))
- **core/schematics:** add the terminal renderer, prompt flow and single-stage ng-add ([#551](https://github.com/cngxjs/cngx/issues/551)) ([1d91026](https://github.com/cngxjs/cngx/commit/1d91026cdf21e2a32d9e39bc8c0eb67938b5113a))
- **core/schematics:** add the ng-add onboarding and install manifest ([#559](https://github.com/cngxjs/cngx/issues/559)) ([c57f535](https://github.com/cngxjs/cngx/commit/c57f535156745a91d97baf2239f6c201ddfd6609))
- **core/schematics:** add the ai tooling step and the mcp helper readme ([#564](https://github.com/cngxjs/cngx/issues/564)) ([e47efcd](https://github.com/cngxjs/cngx/commit/e47efcdfb8aef2ec55e57d84eb7bb2ed1cbb0770))
- **core/schematics:** add ng update migrations and gate breaking prs on them ([#568](https://github.com/cngxjs/cngx/issues/568)) ([49b80fd](https://github.com/cngxjs/cngx/commit/49b80fd30c7e3ad0576f45ee1889fffeba5dd26c))
- **core/schematics:** replace the untouched welcome app with a cngx starter on the full preset ([#628](https://github.com/cngxjs/cngx/issues/628)) ([52709ab](https://github.com/cngxjs/cngx/commit/52709aba1f35f8b4b27b2ac1c65b4c56a101f492))
- **core/schematics:** recognise the angular cli 22 scaffold in ng add ([#636](https://github.com/cngxjs/cngx/issues/636)) ([c6ba339](https://github.com/cngxjs/cngx/commit/c6ba339e7b12682f1390bd4b69057856e0dcf841))
- **core/schematics:** place the feedback outlets in ng new ngmodule apps ([#637](https://github.com/cngxjs/cngx/issues/637)) ([4f09961](https://github.com/cngxjs/cngx/commit/4f0996131adad43b70e8362b3d3cc89eea74cee7))
- **core/schematics,scripts:** re-check the install on every release through version-keyed refresh migrations ([#589](https://github.com/cngxjs/cngx/issues/589)) ([a8e06e7](https://github.com/cngxjs/cngx/commit/a8e06e7b6dae67b1621f5844ccc277147d48c29d))
- **core/testing:** add the testing entry with provideCngxTesting ([#560](https://github.com/cngxjs/cngx/issues/560)) ([6433a66](https://github.com/cngxjs/cngx/commit/6433a661858f4af785d386c740998add23cab40c))
- **core/testing:** add the async-state test kit ([#562](https://github.com/cngxjs/cngx/issues/562)) ([c1561fc](https://github.com/cngxjs/cngx/commit/c1561fcd8f498fc32be19edfd8259e7cd8b46142))
- **core/testing:** add announcement capture and the heard judgement ([#565](https://github.com/cngxjs/cngx/issues/565)) ([d241add](https://github.com/cngxjs/cngx/commit/d241add25d59d9a866989abae442575cb593ce9e))
- **core/testing:** add optional Vitest matchers for heard announcements ([#569](https://github.com/cngxjs/cngx/issues/569)) ([4e4ce05](https://github.com/cngxjs/cngx/commit/4e4ce050fc3d910fe93b27f2b53f5e45c8d3cd75))
- **core/theming:** add a derived brand accent color and a brand gradient token ([#624](https://github.com/cngxjs/cngx/issues/624)) ([97db42d](https://github.com/cngxjs/cngx/commit/97db42d49cba357c3c4df7f7ec15c9858ae849d2))
- **forms,ui:** throw coded runtime errors in forms and ui and close the raw-throw baseline ([#595](https://github.com/cngxjs/cngx/issues/595)) ([3243598](https://github.com/cngxjs/cngx/commit/324359826ff5e9f88743f54a2aba4318e055ca6f))
- **forms/select:** open every select as a modal sheet on phones ([#613](https://github.com/cngxjs/cngx/issues/613)) ([5c1334f](https://github.com/cngxjs/cngx/commit/5c1334f9d60f60a647b2a582193937dbaea7820a))
- **forms/select:** summarize the multi-value select triggers in one line under the touch floor ([#643](https://github.com/cngxjs/cngx/issues/643)) ([0cb2035](https://github.com/cngxjs/cngx/commit/0cb20359adae8f407d2fc4c5451fb7148b249036))
- **forms/select:** summarize the combobox and action multi-select selection under the touch floor ([#646](https://github.com/cngxjs/cngx/issues/646)) ([92d0324](https://github.com/cngxjs/cngx/commit/92d0324c2cab9a5436d40b2805b55ad2d6e064d5))
- **scripts:** generate a drift-guarded manifest of input-over-bundle copy cascades ([#552](https://github.com/cngxjs/cngx/issues/552)) ([4c5a3bd](https://github.com/cngxjs/cngx/commit/4c5a3bd47521a05dd77444b2a574414ee3a04938))
- **utils:** add coded dev diagnostics and guard them out of production ([#575](https://github.com/cngxjs/cngx/issues/575)) ([b8015f2](https://github.com/cngxjs/cngx/commit/b8015f2f8170dc8e4aef154762d9725f4ee3102d))
- **utils,common:** add CngxRuntimeError, code the chip-group misuse check and guard raw throws ([#593](https://github.com/cngxjs/cngx/issues/593)) ([c4d9888](https://github.com/cngxjs/cngx/commit/c4d98885724030573f572fb1de17bd71306f9e0f))

### Bug Fixes

- **common:** emit coded dev diagnostics in layout, popover, stepper, tabs and timeline and stop the router-absent warnings in production ([#588](https://github.com/cngxjs/cngx/issues/588)) ([3adff7c](https://github.com/cngxjs/cngx/commit/3adff7c6a1ddcd12659bc8dd1afca73802892d37))
- **common:** make every error code fire when its page says, and tighten the dev-diagnostic guards ([#601](https://github.com/cngxjs/cngx/issues/601)) ([421c3a4](https://github.com/cngxjs/cngx/commit/421c3a4f4401f8a426c635e420eda00527a45aed))
- **common,forms,ui:** throw coded errors for the remaining misplaced parts and align messages with their pages ([#605](https://github.com/cngxjs/cngx/issues/605)) ([54ef362](https://github.com/cngxjs/cngx/commit/54ef362cc43188153dd2a05df64593695274f0bc))
- **common,forms,ui:** reach the router-setup and opener checks and code the last misplaced parts ([#610](https://github.com/cngxjs/cngx/issues/610)) ([4ce2a86](https://github.com/cngxjs/cngx/commit/4ce2a86faacc08cca5232406c9fcfa7ef3ad437e))
- **common,scripts:** leave nothing behind when a dialog fails to open and close the error-code guard gaps ([#614](https://github.com/cngxjs/cngx/issues/614)) ([a4d7625](https://github.com/cngxjs/cngx/commit/a4d76255d847c70f61021a2bc456f52a891c1969))
- **common,ui:** name, announce and render the ui organisms the way their docs say ([#640](https://github.com/cngxjs/cngx/issues/640)) ([b907689](https://github.com/cngxjs/cngx/commit/b9076891fa77c84117ca3f575894460579c58b90))
- **common/chart:** report a misplaced axis as CNGX1048 instead of NG0201 ([#597](https://github.com/cngxjs/cngx/issues/597)) ([05f436e](https://github.com/cngxjs/cngx/commit/05f436eff62acb450c1e2408c3e42a0b5545fdc8))
- **common/command:** merge command sources across injector scopes ([#571](https://github.com/cngxjs/cngx/issues/571)) ([24a6f35](https://github.com/cngxjs/cngx/commit/24a6f35ab42ba82ac6cdbfaed787cb6628ac6b72))
- **common/interactive:** keep focus on the listbox owner when an option is pressed with the mouse ([#541](https://github.com/cngxjs/cngx/issues/541)) ([a936499](https://github.com/cngxjs/cngx/commit/a936499e8d1f218a8d42245be16d1607f06a6166))
- **common/popover:** accept floating ui's computePosition in the fallback ([#563](https://github.com/cngxjs/cngx/issues/563)) ([a5708b6](https://github.com/cngxjs/cngx/commit/a5708b6dcd5455be3db24a52c569129f1fcb9cce))
- **common/stepper:** prefix a custom error reason in the summary line with the step label ([#591](https://github.com/cngxjs/cngx/issues/591)) ([812e0a4](https://github.com/cngxjs/cngx/commit/812e0a4a8f1991d00c9a0cba0b25ed32e9b0cd08))
- **core:** separate block text and record busy flips in the announcement recorder ([#557](https://github.com/cngxjs/cngx/issues/557)) ([006f741](https://github.com/cngxjs/cngx/commit/006f7414abe8bf0574756dd328f1a93a199eb7bd))
- **core:** warn when provideCngxI18n runs below the root injector ([#579](https://github.com/cngxjs/cngx/issues/579)) ([bbdb725](https://github.com/cngxjs/cngx/commit/bbdb725c7550bf40e72b0ce454ab5b4e7074e94a))
- **core/schematics:** keep tailwind preflight below the cngx layers on an existing app ([#574](https://github.com/cngxjs/cngx/issues/574)) ([bbee930](https://github.com/cngxjs/cngx/commit/bbee930b4c59bf267377aa41b2eaa7341c2d9ae1))
- **core/schematics:** keep re-runs, multi-line eslint imports and the runtime switch correct ([#586](https://github.com/cngxjs/cngx/issues/586)) ([8fdeacb](https://github.com/cngxjs/cngx/commit/8fdeacbc8de8d6a1319561dea96e09f11e36df96))
- **core/schematics:** restore the ai tooling question and align the onboarding output with the install guide ([#592](https://github.com/cngxjs/cngx/issues/592)) ([f1e326b](https://github.com/cngxjs/cngx/commit/f1e326b492ae5353ca5256659c208108cce12124))
- **core/schematics:** accept list and boolean ng add flags on a first install ([#598](https://github.com/cngxjs/cngx/issues/598)) ([e19c41f](https://github.com/cngxjs/cngx/commit/e19c41ffe5a4dbc8a8e80a7030b3698430626aab))
- **core/schematics:** write dense tables into the generated helper readme ([#602](https://github.com/cngxjs/cngx/issues/602)) ([7a71990](https://github.com/cngxjs/cngx/commit/7a7199018cc5aebc5e2c823bb162c1eb655059d9))
- **core/schematics:** make ng add output compile and stay idempotent on every app shape ([#604](https://github.com/cngxjs/cngx/issues/604)) ([c6ea37a](https://github.com/cngxjs/cngx/commit/c6ea37abc0899678eb31805a43bbf3e8a81fb492))
- **core/schematics:** keep the install record per project and the package group on every lib ([#606](https://github.com/cngxjs/cngx/issues/606)) ([a701edd](https://github.com/cngxjs/cngx/commit/a701edd0432a709696bcf3b6852c353b2cef47d9))
- **core/schematics:** make the ng add terminal output readable ([#612](https://github.com/cngxjs/cngx/issues/612)) ([ed8e222](https://github.com/cngxjs/cngx/commit/ed8e222131e681b5fa26ebf267da1cd95cdad411))
- **core/schematics:** close the final review findings and drop the unused plan text helper ([#616](https://github.com/cngxjs/cngx/issues/616)) ([976e38d](https://github.com/cngxjs/cngx/commit/976e38da636fd788e21fc2283680627a235a9878))
- **core/schematics:** place the toast and banner outlets when feedback is provided ([#621](https://github.com/cngxjs/cngx/issues/621)) ([08d1a70](https://github.com/cngxjs/cngx/commit/08d1a70b97738b8ebdcd5d077ca2c4eb8eea904f))
- **core/schematics:** make ng add ready for Angular 22 toolchains and apps ([#630](https://github.com/cngxjs/cngx/issues/630)) ([3989fa6](https://github.com/cngxjs/cngx/commit/3989fa6b664f08e64b6894209a8c34bea1fb2499))
- **core/schematics:** close the findings of the real ng update smoke ([#644](https://github.com/cngxjs/cngx/issues/644)) ([2c6a85f](https://github.com/cngxjs/cngx/commit/2c6a85fd95e82fce71b819b8e1711c02746966a8))
- **core/schematics,scripts:** wire the lint rules only on a compatible eslint stack and guard the release pins ([#580](https://github.com/cngxjs/cngx/issues/580)) ([0ceaf98](https://github.com/cngxjs/cngx/commit/0ceaf98df9b860ceb2d2a732ec9b460b914d59a1))
- **core/schematics,scripts:** guard the migrations and run a real ng add and ng update in ci ([#607](https://github.com/cngxjs/cngx/issues/607)) ([3157c86](https://github.com/cngxjs/cngx/commit/3157c861542cf784d6b744fb4986eb6ebbc771e1))
- **core/schematics,scripts:** close the re-review findings ([#611](https://github.com/cngxjs/cngx/issues/611)) ([cb29918](https://github.com/cngxjs/cngx/commit/cb29918cba52a8c4e6d9cd2c48f3636a1c535bb3))
- **doctor:** run the scan when npx starts the cli through its bin symlink ([#638](https://github.com/cngxjs/cngx/issues/638)) ([8d83065](https://github.com/cngxjs/cngx/commit/8d830651ee2d74a75ef81f58a221ed5f8776c956))
- **forms:** give numeric, formatted and phone inputs a reactive forms value channel ([#540](https://github.com/cngxjs/cngx/issues/540)) ([1df314e](https://github.com/cngxjs/cngx/commit/1df314e1e2271487a8bd77dc9eb2761e8d4c191a))
- **forms:** let the select shell search term model emit its own change and type field ref bounds for Signal Forms 22 ([#572](https://github.com/cngxjs/cngx/issues/572)) ([18573bc](https://github.com/cngxjs/cngx/commit/18573bc9494ce9eb01ab78e128ec73471a16173d))
- **forms:** close the forms accepted-debt entries that swallow a slot, a value or a misuse ([#618](https://github.com/cngxjs/cngx/issues/618)) ([1a65c84](https://github.com/cngxjs/cngx/commit/1a65c84eaa217f29abd46360d5cfc9e08bc1a924))
- **forms:** derive tree-select ARIA, state and commit retry from the shared select core ([#620](https://github.com/cngxjs/cngx/issues/620)) ([acb3ce1](https://github.com/cngxjs/cngx/commit/acb3ce172ae2ace51a326b1a36b6b1e1c480c722))
- **forms/input:** commit the numeric input value on every keystroke ([#544](https://github.com/cngxjs/cngx/issues/544)) ([a7cd9d1](https://github.com/cngxjs/cngx/commit/a7cd9d1f164292763ea1b346044b5ce94d74d1e9))
- **forms/select:** mark select fields touched only when focus leaves them ([#542](https://github.com/cngxjs/cngx/issues/542)) ([90f7f77](https://github.com/cngxjs/cngx/commit/90f7f772b2a017edf3d8f8e876423b309a06bf1b))
- **forms/select:** document the real chip drag-handle cascade, drop the dead glyph ([#576](https://github.com/cngxjs/cngx/issues/576)) ([b0b0846](https://github.com/cngxjs/cngx/commit/b0b0846604c8c44df1ffb23abe4dba97efbb0c29))
- **forms/select:** name a tree-select node by its label, not its expand control ([#645](https://github.com/cngxjs/cngx/issues/645)) ([af9b1f5](https://github.com/cngxjs/cngx/commit/af9b1f5e1702afab1b0c8e386f10c53ce226ddcf))
- **plugin:** keep the recipe pack in sync with the stories and render it at code panel indent ([#553](https://github.com/cngxjs/cngx/issues/553)) ([d980b96](https://github.com/cngxjs/cngx/commit/d980b96fee38d5d9b8adeacdfa946633ac314c3e))
- **scripts:** exempt the select behaviour harness from the raw-error guard ([#625](https://github.com/cngxjs/cngx/issues/625)) ([534f759](https://github.com/cngxjs/cngx/commit/534f759c4840166d4a11e50f4a04f82368fffb1e))
- **select-family:** fix keyboard chip removal, active-option exposure, sync commit actions and the unpainted invalid state ([#617](https://github.com/cngxjs/cngx/issues/617)) ([d29004a](https://github.com/cngxjs/cngx/commit/d29004ad875a9f8974fadcdb5db1a706b0d77a1a))
- **select-family:** close, announce and name the selects correctly ([#623](https://github.com/cngxjs/cngx/issues/623)) ([e05a1d8](https://github.com/cngxjs/cngx/commit/e05a1d85bb9e6ba3107f496c9cf2d6a462d09f5b))
- **select-family:** fix what the device test found on phones and make the trigger tokens cascade ([#629](https://github.com/cngxjs/cngx/issues/629)) ([a3612df](https://github.com/cngxjs/cngx/commit/a3612df872201682bf468073d1b9b5af6a3cdec0))
- **select-family:** let the select trigger layout tokens cascade and give every clear button a touch target ([#634](https://github.com/cngxjs/cngx/issues/634)) ([80b63bb](https://github.com/cngxjs/cngx/commit/80b63bbf947bb54c397a0773c7d38470890c7e37))
- **themes/material:** add a theme entry point for the mat.theme map api ([#555](https://github.com/cngxjs/cngx/issues/555)) ([8c77465](https://github.com/cngxjs/cngx/commit/8c77465b8bd18efd1e812bcaf851be7746b5a3a4))
- **ui:** emit coded dev diagnostics in ui and stop the production router-absent warnings ([#581](https://github.com/cngxjs/cngx/issues/581)) ([4659821](https://github.com/cngxjs/cngx/commit/46598211c498a2d57670c93f4c7c98931a9079bb))
- **ui,common,forms,examples:** add 30 P2 example stories and fix the seven defects they surfaced ([#566](https://github.com/cngxjs/cngx/issues/566)) ([e406f99](https://github.com/cngxjs/cngx/commit/e406f99a2529ba205c3cfa7d313498553f966a6f))
- **ui,examples:** surface Material tab direct errors, unhide the has-errors badge and add the P1 example stories ([#561](https://github.com/cngxjs/cngx/issues/561)) ([dc29cf7](https://github.com/cngxjs/cngx/commit/dc29cf77246d3863dc9de8694444fb6b3b96e876))
- **ui,forms:** stop the sidenav overlay focus scroll, fix autosize border clipping and make the sidenav stories testable ([#558](https://github.com/cngxjs/cngx/issues/558)) ([174b2af](https://github.com/cngxjs/cngx/commit/174b2afb8d41d1788df4c0aa36dc07905103244f))
- **ui,forms,data-display,utils:** declare the peers the shipped code imports and verify the packages in a consumer app ([#573](https://github.com/cngxjs/cngx/issues/573)) ([a42003e](https://github.com/cngxjs/cngx/commit/a42003edf8cfba18324d20f61779ca45373d8b51))
- **ui/feedback:** announce alert dismissal through the shared live announcer ([#549](https://github.com/cngxjs/cngx/issues/549)) ([0ff2a50](https://github.com/cngxjs/cngx/commit/0ff2a5072d7cd346f7fc5889cbadef59976040a8))

### BREAKING CHANGES

- **forms:** give numeric, formatted and phone inputs a reactive forms value channel ([#540](https://github.com/cngxjs/cngx/issues/540))
- **forms/input:** commit the numeric input value on every keystroke ([#544](https://github.com/cngxjs/cngx/issues/544))
- **forms/select:** open every select as a modal sheet on phones ([#613](https://github.com/cngxjs/cngx/issues/613))
- **common,ui:** report a refused step change as refused, not as a failure ([#619](https://github.com/cngxjs/cngx/issues/619))
- **forms:** derive tree-select ARIA, state and commit retry from the shared select core ([#620](https://github.com/cngxjs/cngx/issues/620))
- **common,ui:** report a refused tab switch as refused, not as a failure ([#622](https://github.com/cngxjs/cngx/issues/622))
- **select-family:** close, announce and name the selects correctly ([#623](https://github.com/cngxjs/cngx/issues/623))
- **core,common,forms,ui,data-display,interop,themes:** accept angular 21.1 through 22 as a peer ([#633](https://github.com/cngxjs/cngx/issues/633))
- **common,ui:** name, announce and render the ui organisms the way their docs say ([#640](https://github.com/cngxjs/cngx/issues/640))
- **forms/select:** summarize the multi-value select triggers in one line under the touch floor ([#643](https://github.com/cngxjs/cngx/issues/643))
- **forms/select:** name a tree-select node by its label, not its expand control ([#645](https://github.com/cngxjs/cngx/issues/645))
- **forms/select:** summarize the combobox and action multi-select selection under the touch floor ([#646](https://github.com/cngxjs/cngx/issues/646))

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

