# Changelog

All notable changes to the cngx libraries. Each entry corresponds to one
squash-merged pull request. Non-library scopes (examples, examples-gen, docs,
ci, build, chore) and non-consumer-facing types are omitted by design.
See CONTRIBUTING.md for the workflow.

## Unreleased


### Features

- **common/display:** add CngxSegmentedProgress indicator ([1e44368](https://github.com/cngxjs/cngx/commit/1e4436861d2c4e1406b16bcf5681c82ec0904bdf))
- **common/display:** add [valueTextFormat] override to CngxSegmentedProgress ([fdb49b5](https://github.com/cngxjs/cngx/commit/fdb49b52383c0d94a48b2b7b0208a050306fe4a5))
- **common/interactive:** add auto-announce to CngxErrorAggregator ([8315e14](https://github.com/cngxjs/cngx/commit/8315e140b8233670132d44fcf10eb7457fc5bb32))
- **common/interactive:** generalize CngxSwipe directive + reusable SwipeDirection / SwipeAxis types ([b5b966f](https://github.com/cngxjs/cngx/commit/b5b966ff313a7e7830b4ef4c32626c07e0178e0d))
- **common/interactive:** add CngxAsyncStatus reflector directive ([9416b2a](https://github.com/cngxjs/cngx/commit/9416b2a465e9529299051a8ed2f580abac5c79ec))
- **common/interactive:** warn on CngxAsyncStatus co-placed with CngxAsyncClick ([be18516](https://github.com/cngxjs/cngx/commit/be18516f5264052e6aa0b1f9ae9c707f03ce2113))
- **common/interactive/menu:** add dismiss-handler factory and config-cascade knobs ([86ecb38](https://github.com/cngxjs/cngx/commit/86ecb384444824f58ecd7ad186c316cf09a9e06a))
- **common/interactive/menu:** wire dismiss-binding into triggers and transfer focus on context-menu open ([e6b4207](https://github.com/cngxjs/cngx/commit/e6b420795376b3567726a84b7969ec7b888577ba))
- **common/stepper:** add withStepperSkin and CNGX_STEPPER_SKIN config cascade ([3608216](https://github.com/cngxjs/cngx/commit/3608216df78e0ac348f6b10f3764d2e5f57e2c8a))
- **common/stepper:** emit dev-mode warning when leaf step count exceeds 6 without a CngxStepGroup ([265f613](https://github.com/cngxjs/cngx/commit/265f61341908ef10e009530e95b37240e5295e59))
- **common/stepper:** mobile auto-collapse via withStepperMobileCollapse config ([4508840](https://github.com/cngxjs/cngx/commit/45088406a832e198358b233083d0866a56235444))
- **common/stepper:** withStepperMobileBreakpoint config feature ([0f6e31c](https://github.com/cngxjs/cngx/commit/0f6e31cb0c143e7f4d9055e1bbcf789e39022773))
- **common/stepper:** introduce CngxDotStepperDot slot directive and withDotStepperDotTemplate cascade ([50d4794](https://github.com/cngxjs/cngx/commit/50d4794c882fe52ab46258f2c75aceac18de61bd))
- **common/stepper:** CngxStepperCount atom DRYs the Step N of M caption ([f1e840a](https://github.com/cngxjs/cngx/commit/f1e840a5be508f0106d885672447e9f4562de5a4))
- **common/stepper:** CngxStepperCount accepts external [host] reference ([e7854ab](https://github.com/cngxjs/cngx/commit/e7854ab8c308fedc5f1477da95c452152932a071))
- **common/stepper:** add connectors flag + withStepperConnectors ([fbea0f3](https://github.com/cngxjs/cngx/commit/fbea0f3ade55f540bc39621ca0fb6f3ed8764286))
- **common/stepper:** add mobileSwipe config + withStepperMobileSwipe feature ([1eb5b78](https://github.com/cngxjs/cngx/commit/1eb5b78417c0c88f5a34bce8be862d86bfd76aea))
- **common/stepper:** expose bounds + nav-label computeds on the presenter ([d7d5182](https://github.com/cngxjs/cngx/commit/d7d5182a89ee88b0dae838664666e9d3add76a07))
- **common/stepper:** add bounds + label members to the CngxStepperHost contract ([855eb78](https://github.com/cngxjs/cngx/commit/855eb78821577b033ce0344e7845dffdbf51629c))
- **common/stepper:** add CngxStepperPrevious + CngxStepperNext nav directives ([2bf633c](https://github.com/cngxjs/cngx/commit/2bf633cd8bfcb4e1a66ec574200ae3fc84fb6249))
- **common/stepper:** add CngxStepperComplete finish directive ([41483d2](https://github.com/cngxjs/cngx/commit/41483d22c1b8cb7f836a7b3fc954444143c82f1f))
- **common/stepper:** add createStepperHostProxy helper for input-bound host re-provision ([1ac3f06](https://github.com/cngxjs/cngx/commit/1ac3f06d63aa498d105f8654aa301003b794ded1))
- **forms/field:** add CNGX_VALUE_TRANSFORMER token ([f09acf5](https://github.com/cngxjs/cngx/commit/f09acf5f10c2c3450dc6ce69fd9b36f5a086cf8b))
- **forms/input:** default to tabular-nums on cngx-numeric-input host ([ea2051d](https://github.com/cngxjs/cngx/commit/ea2051ddf3e3cbca0d09a2aebbce2c061aff671c))
- **forms/input:** drop CVA from CngxInputFormat ([0e21b86](https://github.com/cngxjs/cngx/commit/0e21b86c0ea8a8d2aaa31a74ad0baffc35eff0d6))
- **forms/input:** drop CVA from CngxNumericInput ([686d230](https://github.com/cngxjs/cngx/commit/686d230bf5ad01a9ddbc30307734ab39ad2fd224))
- **forms/input:** drop CVA from CngxInputMask ([d664d52](https://github.com/cngxjs/cngx/commit/d664d52364806fb337ee1739a06a3ea8e837771d))
- **stepper:** [mobileIndicatorPosition] + withStepperMobileIndicatorPosition feature ([fda3d07](https://github.com/cngxjs/cngx/commit/fda3d07ba1b7152ca945c1a2ef0b008a15276ee6))
- **themes/material:** bridge chips + breadcrumb skin tokens to Material ([dfc9964](https://github.com/cngxjs/cngx/commit/dfc99648c03555475ed78b8c8d40100156678178))
- **themes/material/stepper:** extend Material color mixin to cover new skin custom properties ([27b8383](https://github.com/cngxjs/cngx/commit/27b8383f495c3f417d2f8f2f0bc8a9ff5a45580e))
- **themes/material/stepper:** extend Material color mixin to cover new variant custom properties ([26693c0](https://github.com/cngxjs/cngx/commit/26693c0dae926fd1b5bc0290d27aaf7798e32b42))
- **ui/mat-stepper:** render the footer slot in the Material twin ([85d65e7](https://github.com/cngxjs/cngx/commit/85d65e7a2bc2ee50c1a028dbed438dfd384d1f1b))
- **ui/stepper:** consume CngxStepperSkin and render [data-skin] on the host ([d01a48b](https://github.com/cngxjs/cngx/commit/d01a48b4d60ceeb6842b9bc5da6c9e0c319227a1))
- **ui/stepper:** linear-minimal skin ([4209321](https://github.com/cngxjs/cngx/commit/42093218f5cbcfaf88be4951919a83dc5aa65aa6))
- **ui/stepper:** stripe-status-rich skin ([ea649dc](https://github.com/cngxjs/cngx/commit/ea649dc582a27a740f9d195353c46a9585e2e8a4))
- **ui/stepper:** path-chevron skin ([40d30f0](https://github.com/cngxjs/cngx/commit/40d30f0c23e5f9aaf7bf8f32b69361727a8047e7))
- **ui/stepper:** pill-segment skin and skin-overview demo ([0fcadf7](https://github.com/cngxjs/cngx/commit/0fcadf79d6fad3629ea9fbd12f1ef96d20ac66db))
- **ui/stepper:** introduce CngxProgressBarStepper variant composing CngxProgress ([7a163f3](https://github.com/cngxjs/cngx/commit/7a163f3e8281d86daf607f8acb581df92347c4ce))
- **ui/stepper:** introduce CngxDotStepper variant ([ade040c](https://github.com/cngxjs/cngx/commit/ade040c13912adb0eaa241b553e812c9d1645855))
- **ui/stepper:** introduce CngxTextStepper variant ([93df470](https://github.com/cngxjs/cngx/commit/93df47064677ddd5a8ef78e3d5b91a0876919c26))
- **ui/stepper:** consume the dot-stepper slot cascade in CngxDotStepper ([6ddaa87](https://github.com/cngxjs/cngx/commit/6ddaa87d610bef218d7cda6f6ec7a7bcfe7eecef))
- **ui/stepper:** center mobile-collapse dots + add [showStepCount] caption ([f6e1155](https://github.com/cngxjs/cngx/commit/f6e11557409fb69eaab93b8854a3064c13119566))
- **ui/stepper:** dot-stepper dots announce label via role='img', wire CngxSwipe in carousel demo ([5606606](https://github.com/cngxjs/cngx/commit/56066063028c30a03dc47308a89e4ac60a89cc58))
- **ui/stepper:** connectors input + classic-scoped rail CSS ([9e0b2f3](https://github.com/cngxjs/cngx/commit/9e0b2f33ef344b5c6a58113230a92dc997b5d07b))
- **ui/stepper:** pivot [connectors] to stacked wizard-rail layout ([c39b8d2](https://github.com/cngxjs/cngx/commit/c39b8d26347e4c436fcff40c3de06421ae5a9f95))
- **ui/stepper:** vertical connectors scope + AsyncState-aware rail colors ([db4d6c7](https://github.com/cngxjs/cngx/commit/db4d6c716af0d4298f6c89e494f910b19837be93))
- **ui/stepper:** swipe navigation on mobile-collapse panels ([1a7c720](https://github.com/cngxjs/cngx/commit/1a7c7204cbe5cd760c6d40c684b93e09428dafde))
- **ui/stepper:** wire CngxStepperSwipeNav onto cngx-dot-stepper dot row ([ea954c7](https://github.com/cngxjs/cngx/commit/ea954c732143d1593fa527220613b15adbaf58c1))
- **ui/stepper:** add CngxStepperFooter molecule with start/center/end regions ([699ee8e](https://github.com/cngxjs/cngx/commit/699ee8e4471ad0e8f6abfec716fada3c225818f8))
- **ui/stepper:** render an optional footer ng-content slot in every display mode ([cabfb2f](https://github.com/cngxjs/cngx/commit/cabfb2f6be6f34aa94062cdef5ffd1356dd82eba))
- **ui/stepper:** add 'chips' skin ([5b3d451](https://github.com/cngxjs/cngx/commit/5b3d451762bba7e4c504da7d4acab4e4c21aaf91))
- **ui/stepper:** add 'breadcrumb' skin ([a659783](https://github.com/cngxjs/cngx/commit/a659783b17afe3f305bdb106389b299826794857))
- **utils:** add setEqual, arrayEqual, clamp pure utilities ([7608f3f](https://github.com/cngxjs/cngx/commit/7608f3f5f393e1558fc4828d533269e06b74f48e))

### Bug Fixes

- **common:** bracket-access dataset prop, revert at(-1) regression ([4a90a84](https://github.com/cngxjs/cngx/commit/4a90a8477312899a8958528b369e180c6bb45fa4))
- **common/data:** add equal fn to smart-data-source filtered/processed and hoist default searchFn ([a97cf12](https://github.com/cngxjs/cngx/commit/a97cf1228250f43ce278bfcceeaa18e3fe6c29d3))
- **common/i18n:** restore em-dashes in tabs and stepper live-region strings ([6400a7d](https://github.com/cngxjs/cngx/commit/6400a7d1ae7bf0e6387356f0a9883e65b058ef6b))
- **common/interactive:** swipe directive blocks text-selection + captures pointer ([ba91b91](https://github.com/cngxjs/cngx/commit/ba91b9101fe424b1e6d4cb33d1a770ddd535a7dd))
- **common/interactive:** remove wheel accumulator - scope was mouse drag only ([240bcdb](https://github.com/cngxjs/cngx/commit/240bcdbea7dc2342f5afad20a31cf35e718b0b71))
- **common/interactive:** swipe resets on pointercancel + scopes user-select to in-flight gesture ([e6c9bcc](https://github.com/cngxjs/cngx/commit/e6c9bcc6e8eea9dad04bb66e6de45fc934eef443))
- **common/interactive/checkbox:** host CngxRovingItem and yield tabindex to roving parent ([ab4f56a](https://github.com/cngxjs/cngx/commit/ab4f56a09584ef5e78329208564ec61692326bc2))
- **common/interactive/checkbox:** always emit aria-describedby id ([1f67875](https://github.com/cngxjs/cngx/commit/1f67875d13978a97a3d2dd5d796fa461d11168be))
- **common/interactive/checkbox:** gate aria-errormessage on aria-invalid ([b581950](https://github.com/cngxjs/cngx/commit/b581950bbb0fc575bad634e03cfef2c402f8c3a2))
- **common/interactive/checkbox-group:** gate aria-errormessage on aria-invalid ([a79bedd](https://github.com/cngxjs/cngx/commit/a79bedd7946e28af124122a8ebbebf0446b9e022))
- **common/stepper:** centralise mobile-breakpoint default and rebind progress-bar [label] ([719be31](https://github.com/cngxjs/cngx/commit/719be3169035f7bad8db87ead9c51bbecfc67606))
- **common/stepper:** nav controls reflect disabled via aria-disabled only ([53f61ad](https://github.com/cngxjs/cngx/commit/53f61addfa2a010f3bfa10bce7ccfa0c70d20e99))
- **common/stepper:** warn on CngxStepperPrevious co-placed with CngxAsyncClick ([23ae30b](https://github.com/cngxjs/cngx/commit/23ae30be38049ceb9c12cafd96ff18b8d1d4319c))
- **data-display:** add equal fns to treetable Set/array/object computeds ([82e978e](https://github.com/cngxjs/cngx/commit/82e978ecd02fc05c14a912f0661c8d72de447a04))
- **forms/input:** wrap numeric-input DOM writes and event dispatch in untracked ([0be5a52](https://github.com/cngxjs/cngx/commit/0be5a528381197fdfbe3eb56e8c1871efcdcf3e8))
- **forms/input:** add Clipboard API feature-detect and close copy-value resetTimer race ([59a5c47](https://github.com/cngxjs/cngx/commit/59a5c47842d2afbd700151b608df6d097a4dedc4))
- **forms/input:** harden CngxInputMask effect hygiene ([01e0aba](https://github.com/cngxjs/cngx/commit/01e0aba112128113b1f2e4add2f3ff702e2495e0))
- **ui/feedback:** activate flex-shrink on close-button host across alert, banner, toast ([813e4ae](https://github.com/cngxjs/cngx/commit/813e4aecc162c88384fe791b0c6c78907e1619a9))
- **ui/stepper:** drop currentColor fallback from the active-fill consuming rule ([f65d76a](https://github.com/cngxjs/cngx/commit/f65d76a0931222623720398d6803f36a0d8c4577))
- **ui/stepper:** align default skin active state with the cngx ember primary ([98acdd9](https://github.com/cngxjs/cngx/commit/98acdd93abce4461399f0b15836bdff31b8a17cf))
- **ui/stepper:** replace var() chains in skin-token initial-values with concrete defaults ([2a4f940](https://github.com/cngxjs/cngx/commit/2a4f940415bcbd2d945a0bc6443c154dfcb05040))
- **ui/stepper:** force inset focus ring on path-chevron via stronger selector ([9e1f21b](https://github.com/cngxjs/cngx/commit/9e1f21b4c894f21c1f31088d80c47dfdaf8e33c3))
- **ui/stepper:** force outline removal on path-chevron focus with !important ([3f28db9](https://github.com/cngxjs/cngx/commit/3f28db91980e41d5c13f1bb835549c29e8920f35))
- **ui/stepper:** unlayered focus override for path-chevron clip-path ([e07cc4e](https://github.com/cngxjs/cngx/commit/e07cc4ea2016d0eb6cd152b5ac227c6f090b3e84))
- **ui/stepper:** inline mobile-collapse against outer presenter so keyboard nav and error-state survive ([273d625](https://github.com/cngxjs/cngx/commit/273d625b7335ff0452403540841c0cfaaea2863a))
- **ui/stepper:** make CngxDotStepper host focusable via tabindex=0 ([7849835](https://github.com/cngxjs/cngx/commit/7849835603a40bd752201c6f241da6dd6ba9522b))
- **ui/stepper:** a11y polish - drop progress-bar [label], drop nested role=group on mobile-dots, dedupe breakpoint fallback ([e80c2cc](https://github.com/cngxjs/cngx/commit/e80c2cc31db84dc984add9ad9e3fab2f261c6b3f))
- **ui/stepper:** pill-segment dark mode uses opaque elevated surface ([ae30e41](https://github.com/cngxjs/cngx/commit/ae30e417ec1013d55f76b29a7c4927e9b1c173ec))
- **ui/stepper:** pill-segment dark mode honors data-color-scheme toggle ([3850c92](https://github.com/cngxjs/cngx/commit/3850c92d4731bd856a232a9323e41872c3de3de7))
- **ui/stepper:** pill-segment tokens inherit from host to descendants ([de664ca](https://github.com/cngxjs/cngx/commit/de664ca5e500e3da69845ff37336d10b6204cb2b))
- **ui/stepper:** make completed and active states legible across skins ([9cf7583](https://github.com/cngxjs/cngx/commit/9cf758345a13c4f4baca3316ed23cab9c4f5565b))
- **ui/stepper:** active pill wins over completed background when both apply ([3ca6e67](https://github.com/cngxjs/cngx/commit/3ca6e675f63eb5018a7dea983bc5912848c6517f))
- **ui/stepper:** dot-stepper custom slot strips chrome per-dot, not globally ([98fe99a](https://github.com/cngxjs/cngx/commit/98fe99a605c04e52c70c697489a329e59c3e82db))
- **ui/stepper:** suppress default success checkmark when consumer slot is used ([5d2b12d](https://github.com/cngxjs/cngx/commit/5d2b12da1b0db73bb59abe2aa6804952b1a0920d))
- **ui/stepper:** consumer busy spinner slot drops the library spin chrome ([34e9a5e](https://github.com/cngxjs/cngx/commit/34e9a5eab4c363c0a14f5351432461c197e52153))
- **ui/stepper:** dot-stepper falls back to semantic state colors ([bbf8e80](https://github.com/cngxjs/cngx/commit/bbf8e80a26942e11520476096880514acbf4fe8a))
- **ui/stepper:** arrow-key strip navigation works for view-template buttons ([64cd64f](https://github.com/cngxjs/cngx/commit/64cd64f8ab1a2bc2574027935d68b2e29aa44813))
- **ui/stepper:** arrow nav focuses the new active step button, not the prior one ([801ca4e](https://github.com/cngxjs/cngx/commit/801ca4e6635a5c544ae1dd97b9eaae3b420b5440))
- **ui/stepper:** WAI-ARIA roving tabindex - active step is the only tab stop ([ce6ade8](https://github.com/cngxjs/cngx/commit/ce6ade8f9385ea6c0baa12b073176e35c41d59ba))
- **ui/stepper:** dot-stepper focus ring uses cngx primary and shrinks to content ([ecae820](https://github.com/cngxjs/cngx/commit/ecae8201c61419d3206178620b2650b0d3f3cb40))
- **ui/stepper:** progress-bar fill uses cngx primary, not the page text color ([4e1ec1f](https://github.com/cngxjs/cngx/commit/4e1ec1f8d306db4dad100923e3e6e325c80c62b6))
- **ui/stepper:** symmetric inset between connector rail and disc edges ([46d6850](https://github.com/cngxjs/cngx/commit/46d68506edbb64796decb920bd0f7b55c775fad8))
- **ui/stepper:** zero strip gap inside connectors scope so disc spacing is symmetric ([1efb687](https://github.com/cngxjs/cngx/commit/1efb6873eb6d697c9fc60f679a654b13255bc5c4))
- **ui/stepper:** overlay busy-spinner + rejection icon on disc, align rejection color with rail ([2483e4e](https://github.com/cngxjs/cngx/commit/2483e4e03c7850d28c7f79b3a593a4896a6245f0))
- **ui/stepper:** drop busy-spinner overlay in wizard scope + suppress stale rejection on success ([aa583e7](https://github.com/cngxjs/cngx/commit/aa583e7be529b677ab03a6972853579c31099d4f))
- **ui/stepper:** hide busy-spinner in wizard scope, indicator color suffices ([f9da68f](https://github.com/cngxjs/cngx/commit/f9da68f3b56f058e1f33add9f64b46d6bf3b3015))
- **ui/stepper:** drop rejection outline, redden the label instead ([51edf2c](https://github.com/cngxjs/cngx/commit/51edf2c8aef0024db82ef8108068eada03934fcd))
- **ui/stepper:** white glyph + subtle pulse on pending target indicator ([c3d436e](https://github.com/cngxjs/cngx/commit/c3d436ee1ca321242c084c797a5cd94d046699b3))
- **ui/stepper:** silence embedded cngx-stepper-count live region in mobile-collapse + progress-bar ([71d7d95](https://github.com/cngxjs/cngx/commit/71d7d956fd6ba3fdf8290647d5d3fb31b6eddf07))
- **ui/stepper:** restore progress-bar SR announcer + narrow CngxStepperCount.host contract ([2091c7f](https://github.com/cngxjs/cngx/commit/2091c7fd16370c9a887b80f06102a1cfc545b730))
- **ui/stepper:** silence progress-bar count live region (progressbar role announces) + document cross-entry @internal exports ([f3cebd9](https://github.com/cngxjs/cngx/commit/f3cebd939efd1b7405de45f814b5f76a2cef9566))
- **ui/stepper:** unblock dot-stepper back-nav in linear mode + restore method-form clearLastFailed + pin rebuildTree-safety invariant ([6990f25](https://github.com/cngxjs/cngx/commit/6990f25c2a8c2f8304cf3ce9503c5d49f9c44f2e))

### Performance Improvements

- **common/stepper:** memoize slot-context builders by node + split content/label alias + tighten clearLastFailed visibility ([bfa47e8](https://github.com/cngxjs/cngx/commit/bfa47e89c65ad3bd7500c5c0d5506818e6f93fe9))

### BREAKING CHANGES

- **data-display:** `selectionChanged` output removed; consumers migrate
to `(selectedIdsChange)` which emits `ReadonlySet<string>` via the
model's implicit output. `[(expandedIds)]` and `[(selectedIds)]` now
bind through `ModelSignal` instead of `input()`+`output()` pairs.
The `SelectionModel`-backed internal state is gone; selection cardinality
is enforced inline against `selectionMode`. Note: Angular's `model()`
does not accept `{ equal }` - structural equality discipline lives on
the downstream computeds (visibleNodes, isAllSelected, isIndeterminate)
that consume these models.
- **forms/input:** drop CVA from CngxInputFormat
- **forms/input:** drop CVA from CngxNumericInput
- **forms/input:** drop CVA from CngxInputMask
