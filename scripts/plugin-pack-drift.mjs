// The pack's maintenance guard. pack-manifest.json's `sources[]` records, per
// generated artifact, the COMMITTED source it was distilled from and that
// source's content hash at generation time. This recomputes each source hash
// against the file on disk now and fails when any has moved or vanished - the
// shipped artifact is then stale and its generator must be re-run.
//
// Only committed sources belong in `sources[]`: recipes, whose sources are the
// example stories. The theming reference is distilled from documentation.json,
// a gitignored build artifact, so it has no committed source to re-hash on a
// fresh checkout; its provenance lives under `manifest.theming` and is not
// drift-checked here. It is refreshed at release time via plugin:release.
//
// Re-hashing recorded sources alone misses a recipe that was never recorded,
// a folder whose representative moved, a folder that stopped qualifying and a
// renderer change. computeCoverage closes that gap: it recomputes the recipe
// set and every recipe body from the stories with the generator's own
// selection and renderer, and compares them with the manifest and the
// committed files.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { collectStoryEntries, expectedRecipes } from './plugin-recipes.mjs';
import { computeSourceHash } from './plugin-token-reference.mjs';

const PLUGIN_ROOT = 'packages/plugin';
const MANIFEST = 'packages/plugin/pack/pack-manifest.json';
const RECIPE_PREFIX = 'pack/recipes/';

// readSource returns the source bytes, or null when the source no longer
// exists. Injected so the check is testable without touching disk.
export function computeDrift(manifest, readSource) {
  const drifted = [];
  for (const entry of manifest.sources ?? []) {
    const bytes = readSource(entry.source);
    if (bytes === null) {
      drifted.push({ artifact: entry.artifact, source: entry.source, reason: 'source missing' });
      continue;
    }
    const actual = computeSourceHash(bytes);
    if (actual !== entry.contentHash) {
      drifted.push({ artifact: entry.artifact, source: entry.source, reason: 'hash changed' });
    }
  }
  return drifted;
}

// expected is the `{ artifact, source, body }` list the recipe generator would
// write now. readArtifact returns a committed artifact's text, or null when
// the file does not exist. Only `pack/recipes/` entries take part; the theming
// reference has no story behind it.
export function computeCoverage(manifest, expected, readArtifact) {
  const recorded = new Map(
    (manifest.sources ?? [])
      .filter((entry) => entry.artifact.startsWith(RECIPE_PREFIX))
      .map((entry) => [entry.artifact, entry]),
  );
  const findings = [];
  for (const recipe of expected) {
    const entry = recorded.get(recipe.artifact);
    const reason = coverageReason(entry, recipe, readArtifact);
    if (reason) {
      findings.push({ artifact: recipe.artifact, source: recipe.source, reason });
    }
  }
  const expectedArtifacts = new Set(expected.map((recipe) => recipe.artifact));
  for (const entry of recorded.values()) {
    if (!expectedArtifacts.has(entry.artifact)) {
      findings.push({
        artifact: entry.artifact,
        source: entry.source,
        reason: 'recipe no longer selected',
      });
    }
  }
  return findings;
}

function coverageReason(entry, recipe, readArtifact) {
  if (!entry) {
    return 'recipe not recorded';
  }
  if (entry.source !== recipe.source) {
    return 'source changed';
  }
  const body = readArtifact(recipe.artifact);
  if (body === null) {
    return 'recipe file missing';
  }
  return body === recipe.body ? null : 'recipe body stale';
}

function readSourceFile(path) {
  const abs = resolve(path);
  return existsSync(abs) ? readFileSync(abs) : null;
}

function readArtifactFile(artifact) {
  const abs = resolve(PLUGIN_ROOT, artifact);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}

function main() {
  const manifest = JSON.parse(readFileSync(resolve(MANIFEST), 'utf8'));
  const unparseable = [];
  const entries = collectStoryEntries((path, err) => {
    unparseable.push({ artifact: '-', source: path, reason: `story unparseable: ${err.message}` });
  });
  const drifted = [
    ...unparseable,
    ...computeCoverage(manifest, expectedRecipes(entries), readArtifactFile),
    ...computeDrift(manifest, readSourceFile),
  ];
  const total = (manifest.sources ?? []).length;

  if (drifted.length === 0) {
    process.stdout.write(`plugin:drift - pack is in sync (${total} sources)\n`);
    return;
  }

  process.stdout.write(`plugin:drift - ${drifted.length} of ${total} artifact(s) stale:\n`);
  for (const entry of drifted) {
    process.stdout.write(`  ${entry.artifact} <- ${entry.source} (${entry.reason})\n`);
  }
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
