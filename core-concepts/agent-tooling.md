<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Agent Tooling

<aside class="cc-tldr">

cngx ships an MCP server and a plugin of skills and agents so an LLM coding agent works cngx from a drift-free source of truth, not from memory.

</aside>

cngx publishes more than libraries. It ships a tooling surface for LLM coding
agents working in consumer apps, so an agent reaches for the real API instead of
guessing one. The surface has three layers, and the division of labor is the whole
design:

- The **MCP server** answers *what* exists - the live API shape and the delta
  between two releases.
- The **skills** teach *how* to use it - the composition patterns, wired to the
  MCP so they never carry an API shape that can drift.
- The **agents** *do* the work under a locked persona and a restricted tool set -
  read-only review by default, one audited executor for edits.

A mechanical layer sits under all three: the `@cngx/eslint-plugin` per-file rules
and the `@cngx/doctor` project-wiring scan give a deterministic verdict the agents
cite rather than re-derive.

---

## The MCP server

`@cngx/mcp` is a stdio [Model Context Protocol](https://modelcontextprotocol.io)
server over a `documentation.json` snapshot of the cngx public API, bundled into
the package at build time. It answers `get_api CngxSelect` with a few hundred bytes
of typed API instead of a multi-megabyte docs dump, and it runs standalone with no
cngx repository present:

```bash
npx @cngx/mcp
```

It is read-only over source. Six of its tools are pure and offline; the seventh,
`migrate_usage`, is the one tool that reaches the network, and it does so
fail-safe.

|Tool|Input|Returns|
|-|-|-|
|`find_component`|`{ query }`|Components and directives whose name, selector, or category matches the fragment: name, kind, selector, category, file.|
|`get_api`|`{ name }`|One component or directive's API: inputs, outputs, signal flag, host bindings, public methods, description. Resolves by class name or selector.|
|`get_slots`|`{ name }`|The projected template slots, each a slot directive selector name plus its one-line doc.|
|`get_theme_tokens`|`{ name }`|The theming tokens (the CSS custom properties a component exposes) and its theme overview.|
|`get_di_tokens`|`{ query? }`|The top-level DI injection tokens, optionally filtered by a name fragment.|
|`get_story_example`|`{ name }`|The runnable example URLs (public documentation links) and a StackBlitz URL when one exists.|
|`migrate_usage`|`{ from, to? }`|A structured API delta between two cngx releases: removed, renamed, and signature-changed components, inputs, outputs, slots, and DI tokens. `to` defaults to the bundled snapshot version.|

Each answer grounds against one pinned cngx release; the server reports that
version and the snapshot timestamp in its connect-time instructions. Confirm the
consuming app runs a matching release before relying on an answer.

### Cross-version deltas

`migrate_usage` is the version-upgrade answer. It resolves each version to a
snapshot - the bundled one when the version matches it, otherwise fetched from the
release assets via `gh release download` - and diffs the two into a categorized
delta. Rename inference is conservative: it only pairs a removed symbol with an
added one where a structural fingerprint supports it (a top-level entry's category
plus its input and output names, or a slot's description). A leaf member keyed only
by a bare type reports the removal rather than guessing a rename.

The fetch never throws across the tool boundary. A missing `gh`, no network, or an
absent asset returns a typed error result instead:

|Reason|Meaning|
|-|-|
|`gh-missing`|The `gh` CLI is not installed or not on PATH.|
|`network`|The download failed for a network reason.|
|`asset-missing`|The release or its `documentation.json` asset does not exist.|

---

## The skills

Skills are auto-discovered how-to guides. Each one teaches a composition pattern
and routes every concrete symbol to the MCP tools or the published docs, so a skill
body never carries an API shape that could drift. They group by what the consumer
is doing.

|Skill|Use it to|
|-|-|
|`cngx`|The index: the three design principles and the grounding the plugin bundles.|
|`cngx-wire`|Build a screen or feature: discover the component, confirm its API, compose it over configuring it.|
|`cngx-forms`|Wire a form: the Signal-Forms-first field pattern, the select-family decision tree, the Reactive-Forms adapter, and error surfaces.|
|`cngx-data`|Wire a sortable, filterable, paginated collection: compose the orthogonal data directives through one `computed()` chain.|
|`cngx-async`|Wire loading, error, and success state: the async state machine, projecting a branch, and bridging transitions to toasts, alerts, and banners.|
|`cngx-a11y`|Keep a screen accessible: preserve the ARIA cngx derives in the reactive graph, and wire the `@cngx/common/a11y` atoms.|
|`cngx-theme`|Theme an app: import the theme bundle so directive styling renders, then set brand tokens via the `--cngx-*` custom properties.|
|`cngx-from-material`|Migrate an Angular Material screen: the `mat-*` to cngx symbol mapping and the idiom shifts the move requires.|
|`cngx-migrate`|Upgrade an app across cngx versions: pull the machine API delta from `migrate_usage`, confirm each changed symbol, and produce an ordered edit plan.|
|`cngx-doctor`|Act on a doctor finding: read the machine finding contract and apply the fix it names.|

`cngx-from-material` and `cngx-migrate` are two different migrations and must not be
confused. `cngx-from-material` moves an app *off Angular Material onto cngx*.
`cngx-migrate` moves an app *already on cngx from one version to the next*.

---

## The agents

Agents are auto-discovered workers a skill cannot be. A skill body can only ask an
agent not to edit; an agent's `tools` allow-list decides it mechanically. That
mechanical guarantee is the reason the review agents exist as agents rather than as
skills: a read-only review cannot mutate the code it reviews.

|Agent|Class|Does|
|-|-|-|
|`cngx:reviewer`|read-only|A Pillar-grounded review of a cngx change. Reviews holistically, cites the mechanical rule ids where they apply, routes that verdict to the linter and the doctor. Edits nothing.|
|`cngx:a11y-auditor`|read-only|An accessibility sweep of a screen. Finds where the consumer has silenced a guarantee the contract already ships (a described-by target removed, a disabled control that no longer says why, focus not restored after an overlay closes). Edits nothing.|
|`cngx:upgrader`|executor|Executes a version upgrade. Applies the ordered plan `cngx-migrate` produces one file at a time, runs the consumer's own build, test, and lint between steps, and halts on the first failure. The one edit-capable agent.|

### Read-only by default

The tool guard models two classes. Read-only is the default: an unclassified agent
is held to a whitelist of read tools (`Read`, `Grep`, `Glob`, and the read-only MCP
queries), so an agent that declares a write tool without being classified fails the
guard. Only a named executor - a decision reviewed when the name is added to the
guard - may additionally declare the edit and shell tools. A per-class whitelist is
stricter than dropping the guard, and it keeps read-only the property every unknown
future agent inherits.

`cngx:upgrader` is that one classified executor. It earns edit rights because it
runs in an isolated context with a validation gate between every step: it confirms
each new API via the MCP before writing, applies only the planned edit, validates,
and stops on the first red step rather than pushing past a failure. Producing the
plan and applying it stay separate on purpose - one reasons over the whole delta,
the other executes under the gate.

---

## The mechanical layer

The agents do not invent a mechanical verdict; they route to one. Two deterministic
tools own it:

- **`@cngx/eslint-plugin`** carries the per-file rules - the ones a single file's
  scope can decide, such as an `effect()` created in `ngOnInit`, a service call in
  an `effect()` left outside `untracked()`, or a two-way binding wired as an
  `input()` plus `output()` pair instead of a `model()`.
- **`@cngx/doctor`** carries the project-wiring checks - the ones that need a
  whole-project view: `toaster-without-withtoasts` (a feedback surface used without
  its root opt-in), `track-b-css-not-imported` (a directive whose theming stylesheet
  no app entry imports), and `floating-fallback-missing` (`@floating-ui/dom`
  installed but never provided). The doctor runs automatically through a guard hook,
  so a mistake is caught as the code is written.

An agent that meets a finding either tool already owns cites its id and defers the
verdict to that tool, so the three never contradict.

---

## How the layers compose

The three surfaces are one story. Take a version upgrade end to end:

1. `migrate_usage` returns the machine delta between the two releases - the *what*.
2. `cngx-migrate` reads that delta, cross-references the release notes, confirms
   every renamed or signature-changed symbol against `get_api`, `get_slots`, and
   `get_di_tokens`, and produces an ordered edit plan - the *how*.
3. `cngx:upgrader` applies that plan file by file, validating between steps and
   halting on the first failure - the *do*.

A rename is never a blind find and replace, an API shape is never carried from
memory, and an edit never lands past a red check. The same discipline runs through
every layer: ground the symbol against the live source of record, or it is a guess,
and a guessed API is a defect rather than a shortcut.

See [The CNGX Way](the-cngx-way.md) for the library architecture these tools
document, and [The Three Pillars](three-pillars.md) for the bar the review agents
hold a change to.
