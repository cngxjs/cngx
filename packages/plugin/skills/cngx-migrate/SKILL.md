---
name: cngx-migrate
description: How to upgrade a consumer app from one cngx release to another - pull the machine API delta between the two versions, cross-reference the release's MIGRATION.md, confirm each changed symbol's new shape, and produce an ordered plan of concrete consumer-app edits. Use when a task says "upgrade to cngx vN", "bump cngx from vX to vY", "what breaks between these cngx versions", or "migrate our app to the new cngx". This is version-upgrade, not Material adoption - moving an app OFF Angular Material is cngx-from-material's job.
---

# Upgrading a cngx version

An app already on cngx moves from `vX` to `vY`. Some symbols were removed, some
renamed, some kept their name but changed shape. The upgrade is mechanical only
once you know exactly which symbols moved and how - so this skill leads with the
machine delta and never with a remembered API. It produces an ordered edit plan; it
hands the actual editing to `cngx:upgrader`, which applies it file-by-file with the
consumer's own validation between steps.

This is the version-upgrade path. Moving an app off Angular Material onto cngx is a
different job with a different map - route that to `cngx-from-material`. Do not
restate its symbol table here.

## 1. Resolve `from` and `to`

`from` is the cngx version the app is pinned to today (read it from the app's
`package.json` `@cngx/*` range). `to` is the target. When the task names only a
target ("upgrade to cngx vN"), `to` is that version and `from` is the pinned one.
Both are plain versions without the leading `v`.

## 2. Pull the delta from `migrate_usage`

Call `migrate_usage({ from, to })`. It returns the structured API delta between the
two release snapshots: per category (components/directives, inputs, outputs, slots,
DI tokens) the lists of `removed`, `renamed`, and `signatureChanged` entries, with a
`meta` recording the versions each side resolved to. `to` defaults to the bundled
snapshot version when omitted.

This is the WHAT. Do not diff the releases by hand or from memory - the tool is the
only trustworthy source of what actually moved. If it returns a typed failure
(`{ ok: false, reason }`: `gh-missing` / `network` / `asset-missing`), the non-bundled
snapshot could not be fetched; surface the reason and stop rather than guessing a
delta.

## 3. Cross-reference the release's MIGRATION.md

A cngx release that carries breaking changes ships a `MIGRATION.md`. When one exists
for the target, read it: it carries the intent behind a change the raw delta only
shows structurally (why a symbol was split, what the replacement composition is).
The delta tells you a symbol moved; the MIGRATION.md often tells you what to move it
to. Where the two disagree, the delta is ground truth for shape and the MIGRATION.md
is guidance for intent.

## 4. Confirm every changed symbol before proposing an edit

A rename is never a blind find-replace, and a signature change is never a guess. For
each entry in the delta:

- **renamed** - confirm the new symbol's real shape with `get_api` (inputs, outputs,
  two-way signals), `get_slots` (template slots), and `get_di_tokens` (factory and
  config tokens) before you rewrite a single reference. A renamed component often
  changed more than its name.
- **signatureChanged** - read the new signature from `get_api` / `get_slots` /
  `get_di_tokens` and map each old usage to the new one explicitly. A changed input
  type or a changed slot context can invalidate the call site even when the name is
  stable.
- **removed** - find the replacement composition (via the MIGRATION.md and
  `find_component`), not a mechanical deletion. A removed symbol usually has a
  successor; deleting the usage without replacing the behaviour is a regression.

The delta names the symbol; the MCP tools name its API. Never carry an API shape
from memory across an upgrade.

## 5. Produce the ordered edit plan

Turn the confirmed changes into an ordered list of concrete consumer-app edits,
grouped by file. Each entry names the file, the exact old usage, and the confirmed
new usage. Order the files so a shared symbol's definition or import lands before its
call sites. The plan is the artifact this skill produces; it is what `cngx:upgrader`
consumes.

## 6. Hand execution to `cngx:upgrader`

This skill plans; it does not edit. Hand the ordered edit plan to `cngx:upgrader`,
the executor that applies it one file at a time, runs the consumer's own
build/test/lint between steps, and halts on the first failing step. Producing the
plan and applying it are deliberately separate: one reasons over the whole delta,
the other executes in isolation with a validation gate.

## Never guess

Ground every `@cngx/*` symbol against the MCP tools or the published docs
(`https://cngxjs.github.io/cngx/llms.txt` index, `llms-full.txt` full text) before
you use it in an edit. A remembered input, slot, or token is a guess; a guessed API
is a defect, not a shortcut. The whole point of the delta plus the confirmation step
is that an upgrade never relies on memory.
