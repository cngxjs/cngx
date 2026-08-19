---
name: cngx-doctor
description: How to act on a cngx doctor finding - read the machine finding contract the scan emits and apply the fix it names. Use when a doctor finding surfaces from the guard hook after you edit a @cngx/*-importing file, or when you run the doctor by hand and it reports a project-wiring problem.
---

# Acting on a cngx doctor finding

The doctor is a whole-project wiring scan that catches the mistakes a per-file
linter cannot see - the ones that need a view of the whole app. It runs
automatically through the `PostToolUse` guard hook after you edit a
`@cngx/*`-importing `.ts`/`.html` file, and surfaces any finding as feedback. You
can also run it by hand from the installed plugin root:

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cngx-doctor.mjs" [projectDir] --json
```

Each finding is a machine object: `{ id, message, fixHint, severity, file? }`.
This skill is how you turn one into a fix. It re-describes no check and re-runs no
analysis of its own - the finding already carries everything you act on.

## The loop

**1. Read the finding.** `message` states what is wrong, `id` names the check,
`severity` says how load-bearing it is, and `file` (when present) points at where.
Take the finding as delivered; do not re-derive what the check means, and do not
re-implement its logic in your head. `id` plus `fixHint` are the source of record,
and they track the CLI - a second copy of the reasoning would just drift against
it.

**2. Apply the `fixHint`.** It names the exact wiring the project is missing - a
root provider opt-in, a theme-stylesheet import, a fallback call. Make that one
change. Wire it at `file` when the finding is file-local, or at the app's
bootstrap providers / global style entry when the finding is a project-level gap
that no single file owns.

**3. Confirm the symbol before you wire it.** The `fixHint` names a provider or a
symbol; confirm its real shape with the MCP tools (`get_api`, `get_di_tokens`)
before you add it - a remembered provider signature is a guess. The
discover-confirm-compose loop itself is `cngx-wire`'s job; route there for the
composition rather than reasoning it out here.

**4. Re-run to confirm it clears.**

```
node "${CLAUDE_PLUGIN_ROOT}/bin/cngx-doctor.mjs" [projectDir] --json
```

The exit code is `0` when clean and non-zero while any finding remains. The
finding you fixed should be gone. If it persists, the wiring did not land where
the scan looks for it - re-read `message` and `fixHint` rather than forcing a
second approach.

## Severity

An `error` finding is a load-bearing wiring gap: the feature will not render or
behave correctly until it is fixed - clear these before you move on. A `warn`
finding is advisory; triage it. The guard hook surfaces both, and a clean edit
produces no output at all.

## Invoke from the plugin root, not node_modules

Always call the CLI through `${CLAUDE_PLUGIN_ROOT}/bin/cngx-doctor.mjs`. That path
resolves to the installed plugin regardless of the consumer's package layout; a
hardcoded `node_modules` path is brittle and wrong once the standalone
`@cngx/doctor` package ships.

## Never guess

Confirm every `@cngx/*` provider or symbol a `fixHint` names against the MCP tools
or the published docs (`https://cngxjs.github.io/cngx/llms.txt` index,
`llms-full.txt` full text) before you wire it. A guessed provider is a defect, not
a shortcut.
